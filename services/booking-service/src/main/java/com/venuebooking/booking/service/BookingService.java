package com.venuebooking.booking.service;

import com.venuebooking.booking.dto.BookingResponseDto;
import com.venuebooking.booking.dto.CreateBookingRequestDto;
import com.venuebooking.booking.entity.Booking;
import com.venuebooking.booking.entity.BookingSlot;
import com.venuebooking.booking.repository.BookingRepository;
import com.venuebooking.booking.repository.BookingSlotRepository;
import com.venuebooking.catalog.entity.Resource;
import com.venuebooking.catalog.entity.ResourceBlock;
import com.venuebooking.catalog.entity.Venue;
import com.venuebooking.catalog.entity.VenueHours;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.venuebooking.booking.dto.AuditLogResponseDto;
import com.venuebooking.booking.dto.CancelBookingRequestDto;
import com.venuebooking.booking.entity.AuditLog;
import com.venuebooking.booking.repository.AuditLogRepository;
import com.venuebooking.catalog.entity.CancellationPolicy;
import com.venuebooking.catalog.repository.CancellationPolicyRepository;
import com.venuebooking.booking.entity.CustomerMembership;
import com.venuebooking.booking.repository.CustomerMembershipRepository;
import com.venuebooking.booking.entity.CustomerPrepaidPackage;
import com.venuebooking.booking.repository.CustomerPrepaidPackageRepository;
import com.venuebooking.booking.dto.CouponValidationResponseDto;
import com.venuebooking.booking.service.CouponService;
import com.venuebooking.catalog.repository.ResourceBlockRepository;
import com.venuebooking.catalog.repository.ResourceRepository;
import com.venuebooking.catalog.repository.VenueHoursRepository;
import com.venuebooking.catalog.service.PricingService;
import com.venuebooking.common.BusinessException;
import com.venuebooking.notification.service.PushNotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class BookingService {

    private final RestClient.Builder restClientBuilder;

    @Value("${app.internal.payment-base-url:http://localhost:8084}")
    private String paymentServiceUrl;

    @Value("${app.internal.service-token:}")
    private String internalServiceToken;

    private final BookingRepository bookingRepository;
    private final BookingSlotRepository bookingSlotRepository;
    private final ResourceRepository resourceRepository;
    private final VenueHoursRepository venueHoursRepository;
    private final ResourceBlockRepository resourceBlockRepository;
    private final CancellationPolicyRepository cancellationPolicyRepository;
    private final PricingService pricingService;
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;
    private final PushNotificationService pushNotificationService;
    private final CustomerMembershipRepository customerMembershipRepository;
    @Autowired(required = false)
    private CustomerPrepaidPackageRepository customerPrepaidPackageRepository;
    @Autowired(required = false)
    private CouponService couponService;

    @Autowired
    public BookingService(
            RestClient.Builder restClientBuilder,
            BookingRepository bookingRepository,
            BookingSlotRepository bookingSlotRepository,
            ResourceRepository resourceRepository,
            VenueHoursRepository venueHoursRepository,
            ResourceBlockRepository resourceBlockRepository,
            CancellationPolicyRepository cancellationPolicyRepository,
            PricingService pricingService,
            AuditLogRepository auditLogRepository,
            ObjectMapper objectMapper,
            PushNotificationService pushNotificationService,
            CustomerMembershipRepository customerMembershipRepository
    ) {
        this.restClientBuilder = restClientBuilder;
        this.bookingRepository = bookingRepository;
        this.bookingSlotRepository = bookingSlotRepository;
        this.resourceRepository = resourceRepository;
        this.venueHoursRepository = venueHoursRepository;
        this.resourceBlockRepository = resourceBlockRepository;
        this.cancellationPolicyRepository = cancellationPolicyRepository;
        this.pricingService = pricingService;
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
        this.pushNotificationService = pushNotificationService;
        this.customerMembershipRepository = customerMembershipRepository;
    }

    public BookingService(
            RestClient.Builder restClientBuilder,
            BookingRepository bookingRepository,
            BookingSlotRepository bookingSlotRepository,
            ResourceRepository resourceRepository,
            VenueHoursRepository venueHoursRepository,
            ResourceBlockRepository resourceBlockRepository,
            CancellationPolicyRepository cancellationPolicyRepository,
            PricingService pricingService,
            AuditLogRepository auditLogRepository,
            ObjectMapper objectMapper,
            PushNotificationService pushNotificationService
    ) {
        this(restClientBuilder, bookingRepository, bookingSlotRepository, resourceRepository,
                venueHoursRepository, resourceBlockRepository, cancellationPolicyRepository,
                pricingService, auditLogRepository, objectMapper, pushNotificationService, null);
    }

    @Transactional
    public BookingResponseDto createBooking(CreateBookingRequestDto req, Long customerId, Booking.Source source) {
        Resource resource = resourceRepository.findById(req.getResourceId())
                .orElseThrow(() -> BusinessException.notFound("Resource not found"));

        if (resource.getStatus() != Resource.Status.ACTIVE) {
            throw new BusinessException("RESOURCE_INACTIVE", "Resource is currently not active for bookings");
        }

        Venue venue = resource.getVenue();
        if (venue == null || !Boolean.TRUE.equals(venue.getActive())) {
            throw BusinessException.notFound("Venue not found or inactive");
        }

        ZoneId venueZone = ZoneId.of(venue.getTimezone() != null ? venue.getTimezone() : "Asia/Kolkata");
        int slotMinutes = resource.getSlotMinutes() > 0 ? resource.getSlotMinutes() : 60;

        // 1. Generate discrete grid cells between start and end
        List<Instant> cells = generateCells(req.getStartUtc(), req.getEndUtc(), slotMinutes);
        if (cells.isEmpty()) {
            throw new BusinessException("INVALID_TIME_RANGE", "Requested slot range is invalid or smaller than slot grid size");
        }

        if (!req.getStartUtc().equals(cells.get(0))
                || !req.getEndUtc().equals(cells.get(cells.size() - 1).plusSeconds(slotMinutes * 60L))) {
            throw new BusinessException("INVALID_TIME_RANGE", "Start and end times must align exactly to the resource slot grid");
        }

        // 2. Validate cells against past, venue hours, and maintenance blocks
        validateCells(cells, venue, resource, venueZone, slotMinutes);

        releaseExpiredHoldsForResource(resource.getId(), Instant.now());

        // 3. Calculate price quote
        PricingService.PriceQuote quote = pricingService.quoteFixedSlots(resource, cells, venueZone);

        long originalAmountPaise = quote.getTotalPaise();
        long discountPaise = quote.getDiscountPaise();
        long netAmountPaise = originalAmountPaise;

        // Auto-apply Membership discount if customer has an active membership tier
        if (customerId != null && customerMembershipRepository != null) {
            Optional<CustomerMembership> activeMemOpt = customerMembershipRepository
                    .findByTenantIdAndUserIdAndStatusAndEndDateAfter(
                            resource.getTenantId(), customerId, CustomerMembership.Status.ACTIVE, Instant.now()
                    );
            if (activeMemOpt.isPresent()) {
                CustomerMembership mem = activeMemOpt.get();
                String resourceSportCode = resource.getSport() != null ? resource.getSport().getCode() : null;
                boolean matchesSport = mem.getSportCode() == null || mem.getSportCode().isBlank()
                        || (resourceSportCode != null && mem.getSportCode().equalsIgnoreCase(resourceSportCode));
                if (matchesSport) {
                    long durationMinutes = Duration.between(req.getStartUtc(), req.getEndUtc()).toMinutes();
                    long memDiscount = 0L;
                    int remainingFreeMins = mem.getRemainingFreeMinutes() != null ? mem.getRemainingFreeMinutes() : 0;

                    if (remainingFreeMins > 0 && durationMinutes > 0) {
                        long freeMinsUsed = Math.min(durationMinutes, (long) remainingFreeMins);
                        long freeMinsDiscount = (originalAmountPaise * freeMinsUsed) / durationMinutes;
                        long remainingPrice = Math.max(0L, originalAmountPaise - freeMinsDiscount);
                        long pctDiscount = mem.getDiscountPercent() != null ? (remainingPrice * mem.getDiscountPercent()) / 100 : 0L;
                        memDiscount = freeMinsDiscount + pctDiscount;
                    } else if (mem.getDiscountPercent() != null && mem.getDiscountPercent() > 0) {
                        memDiscount = (originalAmountPaise * mem.getDiscountPercent()) / 100;
                    }

                    if (memDiscount > 0) {
                        memDiscount = Math.min(memDiscount, originalAmountPaise);
                        discountPaise += memDiscount;
                        netAmountPaise = Math.max(0L, originalAmountPaise - memDiscount);
                        log.info("Applied membership '{}' auto-discount of ₹{} for customer #{} on booking",
                                mem.getPlanName(), memDiscount / 100.0, customerId);
                    }
                }
            }
        }

        // Auto-apply Promotional Coupon Code
        Long couponId = null;
        if (req.getCouponCode() != null && !req.getCouponCode().isBlank() && couponService != null) {
            String resourceSportCode = resource.getSport() != null ? resource.getSport().getCode() : null;
            CouponValidationResponseDto couponQuote = couponService.validateAndQuoteCoupon(
                    resource.getTenantId(), req.getCouponCode(), netAmountPaise, resourceSportCode);
            if (Boolean.TRUE.equals(couponQuote.valid()) && couponQuote.discountPaise() != null && couponQuote.discountPaise() > 0) {
                couponId = couponQuote.couponId();
                long coupDiscount = Math.min(couponQuote.discountPaise(), netAmountPaise);
                discountPaise += coupDiscount;
                netAmountPaise = Math.max(0L, netAmountPaise - coupDiscount);
                log.info("Applied coupon '{}' saving ₹{} for booking", req.getCouponCode(), coupDiscount / 100.0);
            } else if (!Boolean.TRUE.equals(couponQuote.valid())) {
                throw BusinessException.badRequest("Invalid coupon: " + couponQuote.message());
            }
        }

        // Auto-apply Prepaid Hours Package deduction
        if (customerId != null && customerPrepaidPackageRepository != null && netAmountPaise > 0) {
            String resourceSportCode = resource.getSport() != null ? resource.getSport().getCode() : null;
            long durationMinutes = Duration.between(req.getStartUtc(), req.getEndUtc()).toMinutes();
            List<CustomerPrepaidPackage> packages = customerPrepaidPackageRepository
                    .findByTenantIdAndUserIdAndStatusAndExpiresAtAfter(
                            resource.getTenantId(), customerId, CustomerPrepaidPackage.Status.ACTIVE, Instant.now());
            for (CustomerPrepaidPackage pkg : packages) {
                boolean matchesSport = pkg.getSportCode() == null || pkg.getSportCode().isBlank()
                        || (resourceSportCode != null && pkg.getSportCode().equalsIgnoreCase(resourceSportCode));
                if (matchesSport && pkg.getRemainingMinutes() != null && pkg.getRemainingMinutes() > 0 && durationMinutes > 0) {
                    long pkgMinsUsed = Math.min(durationMinutes, (long) pkg.getRemainingMinutes());
                    long pkgDiscount = (originalAmountPaise * pkgMinsUsed) / durationMinutes;
                    if (pkgDiscount > 0) {
                        pkgDiscount = Math.min(pkgDiscount, netAmountPaise);
                        discountPaise += pkgDiscount;
                        netAmountPaise = Math.max(0L, netAmountPaise - pkgDiscount);
                        log.info("Applied prepaid package '{}' covering {} mins (₹{})",
                                pkg.getPackageName(), pkgMinsUsed, pkgDiscount / 100.0);
                        break;
                    }
                }
            }
        }

        // 4. Determine initial status and payment rules
        Booking.Status initialStatus = Booking.Status.HELD;
        Instant holdExpiresAt = null;

        if (netAmountPaise == 0L) {
            // Full discount / covered by prepaid hours / 100% coupon -> Confirm instantly
            initialStatus = Booking.Status.CONFIRMED;
        } else if (req.getPaymentMode() == Booking.PaymentMode.PAY_AT_VENUE) {
            if (venue.getPayAtVenueMode() == Venue.PayAtVenueMode.OFF) {
                throw new BusinessException("PAY_AT_VENUE_DISABLED", "Pay at venue is not allowed by this venue");
            } else if (venue.getPayAtVenueMode() == Venue.PayAtVenueMode.NO_ADVANCE) {
                initialStatus = Booking.Status.CONFIRMED; // Instant auto-confirmation without hold
            } else {
                // Requires advance payment
                initialStatus = Booking.Status.HELD;
                holdExpiresAt = Instant.now().plus(Duration.ofMinutes(venue.getHoldMinutes()));
            }
        } else {
            // Online Razorpay payment
            initialStatus = Booking.Status.HELD;
            holdExpiresAt = Instant.now().plus(Duration.ofMinutes(venue.getHoldMinutes()));
        }

        // 5. Create Booking Entity
        Booking booking = Booking.builder()
                .tenantId(resource.getTenantId())
                .venueId(venue.getId())
                .resourceId(resource.getId())
                .customerId(customerId)
                .walkinName(req.getWalkinName())
                .walkinPhone(req.getWalkinPhone())
                .source(source != null ? source : Booking.Source.APP)
                .startUtc(cells.get(0))
                .endUtc(cells.get(cells.size() - 1).plusSeconds(slotMinutes * 60L))
                .status(initialStatus)
                .holdExpiresAt(holdExpiresAt)
                .amountPaise(netAmountPaise)
                .discountPaise(discountPaise)
                .taxPaise(quote.getTaxPaise())
                .paidPaise(netAmountPaise == 0L ? originalAmountPaise : 0L)
                .couponId(couponId)
                .paymentMode(req.getPaymentMode() != null ? req.getPaymentMode() : Booking.PaymentMode.ONLINE)
                .build();

        Booking savedBooking = bookingRepository.saveAndFlush(booking);

        // 6. Claim grid cells in booking_slots (enforces double-booking prevention)
        try {
            List<BookingSlot> slotEntities = cells.stream()
                    .map(c -> new BookingSlot(savedBooking.getId(), resource.getId(), c))
                    .toList();
            bookingSlotRepository.saveAll(slotEntities);
            bookingSlotRepository.flush(); // Flush forces DB unique key constraint check immediately
        } catch (DataIntegrityViolationException e) {
            log.info("Concurrent double-booking detected on resource #{}: {}", resource.getId(), e.getMessage());
            throw BusinessException.slotTaken();
        }

        log.info("Booking #{} created with status {} for {} slots", savedBooking.getId(), initialStatus, cells.size());

        if (initialStatus == Booking.Status.HELD) {
            pushNotificationService.sendBookingHoldCreated(savedBooking);
        } else if (initialStatus == Booking.Status.CONFIRMED) {
            applyMembershipFreeMinutesDeduction(savedBooking);
            applyPrepaidPackageHoursDeduction(savedBooking);
            if (savedBooking.getCouponId() != null && couponService != null) {
                couponService.recordRedemption(savedBooking.getTenantId(), savedBooking.getCouponId());
            }
            pushNotificationService.sendPaymentConfirmed(savedBooking);
        }

        return toDto(savedBooking, venue.getName(), resource.getName(), cells);
    }

    /**
     * Releases any expired temporary claims synchronously before availability is returned or
     * a new booking tries to claim the same unique resource/time cells. The scheduled worker
     * remains a cleanup backstop, not the authority for whether a hold is still active.
     */
    @Transactional
    public void releaseExpiredHoldsForResource(Long resourceId, Instant now) {
        List<Booking> expired = bookingRepository.findExpiredHoldsForResource(resourceId, now);
        if (expired.isEmpty()) return;
        List<Long> ids = expired.stream().map(Booking::getId).toList();
        bookingSlotRepository.deleteByBookingIdIn(ids);
        expired.forEach(b -> b.setStatus(Booking.Status.EXPIRED));
        bookingRepository.saveAll(expired);
    }

    @Transactional
    public BookingResponseDto cancelBooking(Long bookingId, Long userId, boolean isStaff, Long tenantId, String roles, CancelBookingRequestDto request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> BusinessException.notFound("Booking not found"));

        if (isStaff && (tenantId == null || !tenantId.equals(booking.getTenantId()))) {
            throw BusinessException.notFound("Booking not found");
        }
        if (!isStaff && (booking.getCustomerId() == null || !booking.getCustomerId().equals(userId))) {
            throw BusinessException.forbidden("You are not authorized to cancel this booking");
        }

        if (booking.getStatus() == Booking.Status.CANCELLED || booking.getStatus() == Booking.Status.COMPLETED) {
            throw new BusinessException("INVALID_STATE", "Booking cannot be cancelled in status: " + booking.getStatus());
        }

        long paidPaise = booking.getPaidPaise() != null ? booking.getPaidPaise() : 0L;

        // Staff permission controls (Task 1.1)
        if (isStaff) {
            boolean isManagerOrOwner = roles != null && (
                    roles.contains("ROLE_MANAGER") ||
                    roles.contains("ROLE_OWNER") ||
                    roles.contains("ROLE_SUPER_ADMIN")
            );

            // Regular staff without manager role: capped at ₹500 (50,000 paise).
            // Cancellations exceeding ₹500 require a Manager or Owner approval code.
            if (!isManagerOrOwner && paidPaise > 50000L) {
                if (request == null || request.getManagerApprovalCode() == null || request.getManagerApprovalCode().trim().isEmpty()) {
                    throw new BusinessException("MANAGER_APPROVAL_REQUIRED",
                            "Staff cancellation for bookings exceeding ₹500 requires Manager or Owner authorization");
                }
            }
        }

        // 1. Cancellation policy evaluation (Section 6.5)
        Instant now = Instant.now();
        long hoursRemaining = java.time.Duration.between(now, booking.getStartUtc()).toHours();

        int refundPercent = 0;
        List<CancellationPolicy> policies = cancellationPolicyRepository.findByVenueIdOrderByHoursBeforeDesc(booking.getVenueId());
        if (policies.isEmpty()) {
            // Default tiered policy if no custom policy defined:
            // >= 24 hrs: 100% refund, >= 2 hrs: 50% refund, < 2 hrs: 0% refund
            if (hoursRemaining >= 24) {
                refundPercent = 100;
            } else if (hoursRemaining >= 2) {
                refundPercent = 50;
            } else {
                refundPercent = 0;
            }
        } else {
            for (CancellationPolicy p : policies) {
                if (hoursRemaining >= p.getHoursBefore()) {
                    refundPercent = p.getRefundPercent();
                    break;
                }
            }
        }

        long refundPaise = (paidPaise * refundPercent) / 100L;
        if (request != null && request.getCustomRefundPaise() != null && isStaff) {
            refundPaise = Math.min(request.getCustomRefundPaise(), paidPaise);
        }

        if (refundPaise > 0 && booking.getPaymentMode() == Booking.PaymentMode.ONLINE) {
            if (internalServiceToken == null || internalServiceToken.isBlank()) {
                throw new BusinessException("REFUND_NOT_CONFIGURED", "Online cancellation refunds are not configured");
            }
            try {
                restClientBuilder.clone().baseUrl(paymentServiceUrl).build()
                        .post().uri("/internal/payments/refund")
                        .header("X-Internal-Service-Token", internalServiceToken)
                        .header("X-Tenant-Id", booking.getTenantId().toString())
                        .body(Map.of("bookingId", bookingId, "amountPaise", refundPaise,
                                "reason", request != null && request.getReason() != null ? request.getReason() : "Customer cancellation per venue policy"))
                        .retrieve().toBodilessEntity();
            } catch (RestClientException e) {
                log.error("Could not issue cancellation refund for booking #{}", bookingId, e);
                throw new BusinessException("REFUND_FAILED", "Could not issue the cancellation refund; the booking was not cancelled");
            }
        }

        booking.setStatus(Booking.Status.CANCELLED);
        bookingRepository.save(booking);

        // Delete booking_slots so cells become available for new customers immediately
        bookingSlotRepository.deleteByBookingId(booking.getId());

        String reason = request != null && request.getReason() != null ? request.getReason() : "Direct cancellation";
        String reasonCode = request != null && request.getReasonCode() != null ? request.getReasonCode() : (isStaff ? "STAFF_CANCELLED" : "CUSTOMER_CANCELLED");

        // Record immutable audit log entry
        recordAudit(
                booking.getTenantId(),
                userId != null ? userId : 0L,
                "CANCEL",
                "BOOKING",
                booking.getId(),
                Map.of(
                        "bookingId", bookingId,
                        "reason", reason,
                        "reasonCode", reasonCode,
                        "paidPaise", paidPaise,
                        "refundPaise", refundPaise,
                        "isStaff", isStaff,
                        "authorizingUserId", userId != null ? userId : 0L,
                        "managerApprovalCode", request != null && request.getManagerApprovalCode() != null ? request.getManagerApprovalCode() : "NONE"
                )
        );

        log.info("Booking #{} cancelled by user #{}. Policy: {}h remaining -> {}% refund (₹{} of ₹{} paid), reason: {}",
                bookingId, userId, hoursRemaining, refundPercent, refundPaise / 100, paidPaise / 100, reason);

        BookingResponseDto dto = toDto(booking, booking.getVenue() != null ? booking.getVenue().getName() : null,
                booking.getResource() != null ? booking.getResource().getName() : null, List.of());
        dto.setRefundPaise(refundPaise);
        dto.setRefundPercent(refundPercent);
        return dto;
    }

    @Transactional
    public BookingResponseDto cancelBooking(Long bookingId, Long customerId, boolean isStaff, Long tenantId) {
        return cancelBooking(bookingId, customerId, isStaff, tenantId, null, null);
    }

    @Transactional
    public BookingResponseDto cancelBooking(Long bookingId, Long customerId, boolean isStaff) {
        return cancelBooking(bookingId, customerId, isStaff, null, null, null);
    }

    public List<AuditLogResponseDto> getAuditLogsForTenant(Long tenantId) {
        List<AuditLog> logs = auditLogRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        return logs.stream().map(l -> AuditLogResponseDto.builder()
                .id("AUD-" + l.getId())
                .timestamp(l.getCreatedAt() != null ? l.getCreatedAt().toString() : Instant.now().toString())
                .action(l.getAction())
                .details(l.getDetails())
                .user("User #" + l.getActorId())
                .type(l.getAction())
                .build()
        ).toList();
    }

    private void recordAudit(Long tenantId, Long actorId, String action, String entity, Long entityId, Map<String, Object> details) {
        try {
            String detailsJson = objectMapper != null ? objectMapper.writeValueAsString(details) : details.toString();
            AuditLog auditLog = AuditLog.builder()
                    .tenantId(tenantId)
                    .actorId(actorId != null ? actorId : 0L)
                    .action(action)
                    .entity(entity)
                    .entityId(entityId)
                    .details(detailsJson)
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to write audit log for {} on {}:{}", action, entity, entityId, e);
        }
    }

    @Transactional
    public BookingResponseDto choosePayAtVenue(Long bookingId, Long customerId) {
        Booking booking = bookingRepository.findByIdAndCustomerId(bookingId, customerId)
                .orElseThrow(() -> BusinessException.notFound("Booking not found"));
        if (booking.getStatus() != Booking.Status.HELD
                || booking.getHoldExpiresAt() == null
                || !booking.getHoldExpiresAt().isAfter(Instant.now())) {
            throw new BusinessException("HOLD_EXPIRED", "The temporary slot hold has expired");
        }
        Venue venue = booking.getVenue();
        if (venue == null || venue.getPayAtVenueMode() == Venue.PayAtVenueMode.OFF) {
            throw new BusinessException("PAY_AT_VENUE_DISABLED", "Pay at venue is not allowed by this venue");
        }
        booking.setPaymentMode(Booking.PaymentMode.PAY_AT_VENUE);
        if (venue.getPayAtVenueMode() == Venue.PayAtVenueMode.NO_ADVANCE) {
            booking.setStatus(Booking.Status.CONFIRMED);
            booking.setHoldExpiresAt(null);
            applyMembershipFreeMinutesDeduction(booking);
            applyPrepaidPackageHoursDeduction(booking);
            if (booking.getCouponId() != null && couponService != null) {
                couponService.recordRedemption(booking.getTenantId(), booking.getCouponId());
            }
            pushNotificationService.sendPaymentConfirmed(booking);
        }
        bookingRepository.save(booking);
        return toDto(booking, venue.getName(), booking.getResource().getName(), List.of());
    }

    @Transactional
    public void confirmOnlinePayment(Long bookingId, Long amountPaise) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> BusinessException.notFound("Booking not found"));
        if (!Booking.Status.HELD.equals(booking.getStatus())) {
            if (Booking.Status.CONFIRMED.equals(booking.getStatus()) && amountPaise.equals(booking.getPaidPaise())) return;
            throw new BusinessException("HOLD_EXPIRED", "Booking is no longer an active payment hold", org.springframework.http.HttpStatus.CONFLICT);
        }
        if (booking.getHoldExpiresAt() == null || !booking.getHoldExpiresAt().isAfter(Instant.now())) {
            throw new BusinessException("HOLD_EXPIRED", "The slot hold expired before payment completed", org.springframework.http.HttpStatus.CONFLICT);
        }
        if (!booking.getAmountPaise().equals(amountPaise)) {
            throw BusinessException.badRequest("Captured amount does not match the booking total");
        }
        booking.setStatus(Booking.Status.CONFIRMED);
        booking.setPaidPaise(amountPaise);
        booking.setHoldExpiresAt(null);
        applyMembershipFreeMinutesDeduction(booking);
        applyPrepaidPackageHoursDeduction(booking);
        if (booking.getCouponId() != null && couponService != null) {
            couponService.recordRedemption(booking.getTenantId(), booking.getCouponId());
        }
        bookingRepository.save(booking);
        pushNotificationService.sendPaymentConfirmed(booking);
    }

    private void applyPrepaidPackageHoursDeduction(Booking booking) {
        if (booking.getCustomerId() == null || customerPrepaidPackageRepository == null) return;
        Resource res = booking.getResource() != null ? booking.getResource() : resourceRepository.findById(booking.getResourceId()).orElse(null);
        String resourceSportCode = (res != null && res.getSport() != null) ? res.getSport().getCode() : null;

        List<CustomerPrepaidPackage> packages = customerPrepaidPackageRepository
                .findByTenantIdAndUserIdAndStatusAndExpiresAtAfter(
                        booking.getTenantId(), booking.getCustomerId(), CustomerPrepaidPackage.Status.ACTIVE, Instant.now());

        long durationMinutes = Duration.between(booking.getStartUtc(), booking.getEndUtc()).toMinutes();
        for (CustomerPrepaidPackage pkg : packages) {
            boolean matchesSport = pkg.getSportCode() == null || pkg.getSportCode().isBlank()
                    || (resourceSportCode != null && pkg.getSportCode().equalsIgnoreCase(resourceSportCode));
            if (matchesSport && pkg.getRemainingMinutes() != null && pkg.getRemainingMinutes() > 0 && durationMinutes > 0) {
                int minsToDeduct = (int) Math.min(durationMinutes, (long) pkg.getRemainingMinutes());
                int newRemaining = pkg.getRemainingMinutes() - minsToDeduct;
                pkg.setRemainingMinutes(newRemaining);
                if (newRemaining <= 0) {
                    pkg.setStatus(CustomerPrepaidPackage.Status.EXHAUSTED);
                }
                customerPrepaidPackageRepository.save(pkg);
                log.info("Deducted {} minutes from prepaid package #{}, remaining: {}",
                        minsToDeduct, pkg.getId(), pkg.getRemainingMinutes());
                break;
            }
        }
    }

    private void applyMembershipFreeMinutesDeduction(Booking booking) {
        if (booking.getCustomerId() == null || customerMembershipRepository == null) return;
        customerMembershipRepository.findByTenantIdAndUserIdAndStatusAndEndDateAfter(
                booking.getTenantId(), booking.getCustomerId(), CustomerMembership.Status.ACTIVE, Instant.now()
        ).ifPresent(mem -> {
            int remainingFreeMins = mem.getRemainingFreeMinutes() != null ? mem.getRemainingFreeMinutes() : 0;
            if (remainingFreeMins > 0) {
                long durationMinutes = Duration.between(booking.getStartUtc(), booking.getEndUtc()).toMinutes();
                int minsToDeduct = (int) Math.min(durationMinutes, (long) remainingFreeMins);
                if (minsToDeduct > 0) {
                    mem.setRemainingFreeMinutes(remainingFreeMins - minsToDeduct);
                    customerMembershipRepository.save(mem);
                    log.info("Deducted {} membership free minutes from member #{}, remaining: {}",
                            minsToDeduct, mem.getId(), mem.getRemainingFreeMinutes());
                }
            }
        });
    }

    @Transactional
    public void releaseFailedPaymentHold(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> BusinessException.notFound("Booking not found"));
        if (booking.getStatus() != Booking.Status.HELD) return;
        bookingSlotRepository.deleteByBookingId(bookingId);
        booking.setStatus(Booking.Status.EXPIRED);
        booking.setHoldExpiresAt(null);
        bookingRepository.save(booking);
    }

    @Transactional(readOnly = true)
    public BookingResponseDto getBookingById(Long bookingId, Long userId, Long tenantId, boolean isStaff) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> BusinessException.notFound("Booking not found"));
        if (isStaff ? tenantId == null || !tenantId.equals(booking.getTenantId())
                : userId == null || !userId.equals(booking.getCustomerId())) {
            throw BusinessException.notFound("Booking not found");
        }
        return toDto(booking, booking.getVenue() != null ? booking.getVenue().getName() : null,
                booking.getResource() != null ? booking.getResource().getName() : null, List.of());
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDto> listCustomerBookings(Long customerId) {
        return bookingRepository.findByCustomerIdOrderByStartUtcDesc(customerId).stream()
                .map(b -> toDto(b, b.getVenue() != null ? b.getVenue().getName() : null,
                        b.getResource() != null ? b.getResource().getName() : null, List.of()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDto> listTenantBookings(Long tenantId) {
        return bookingRepository.findByTenantIdOrderByStartUtcDesc(tenantId).stream()
                .map(b -> toDto(b, b.getVenue() != null ? b.getVenue().getName() : null,
                        b.getResource() != null ? b.getResource().getName() : null, List.of()))
                .toList();
    }

    private List<Instant> generateCells(Instant startUtc, Instant endUtc, int slotMinutes) {
        List<Instant> cells = new ArrayList<>();
        Instant current = startUtc;
        while (current.plusSeconds(slotMinutes * 60L).isBefore(endUtc) || current.plusSeconds(slotMinutes * 60L).equals(endUtc)) {
            cells.add(current);
            current = current.plusSeconds(slotMinutes * 60L);
        }
        return cells;
    }

    private void validateCells(List<Instant> cells, Venue venue, Resource resource, ZoneId zone, int slotMinutes) {
        Instant nowUtc = Instant.now();
        Instant firstCell = cells.get(0);

        if (firstCell.isBefore(nowUtc.minus(Duration.ofMinutes(5)))) {
            throw new BusinessException("SLOT_IN_PAST", "Cannot book a slot in the past");
        }

        // Check maintenance blocks
        Instant startRange = cells.get(0);
        Instant endRange = cells.get(cells.size() - 1).plusSeconds(slotMinutes * 60L);
        List<ResourceBlock> blocks = resourceBlockRepository.findOverlappingBlocks(resource.getId(), startRange, endRange);
        if (!blocks.isEmpty()) {
            throw new BusinessException("RESOURCE_BLOCKED", "Requested slot overlaps a scheduled maintenance block");
        }

        // Validate within venue operating hours
        ZonedDateTime localStart = firstCell.atZone(zone);
        int dayOfWeek = localStart.getDayOfWeek().getValue();
        Optional<VenueHours> hoursOpt = venueHoursRepository.findByVenueIdAndDayOfWeek(venue.getId(), dayOfWeek);
        if (hoursOpt.isEmpty()) {
            throw new BusinessException("VENUE_CLOSED", "Venue is closed on " + localStart.getDayOfWeek());
        }

        VenueHours hours = hoursOpt.get();
        LocalTime cellTime = localStart.toLocalTime();
        if (cellTime.isBefore(hours.getOpenTime()) || cellTime.isAfter(hours.getCloseTime())) {
            throw new BusinessException("OUTSIDE_HOURS", "Slot is outside venue operating hours");
        }
    }

    public BookingResponseDto toDto(Booking b, String venueName, String resourceName, List<Instant> slots) {
        return BookingResponseDto.builder()
                .id(b.getId())
                .tenantId(b.getTenantId())
                .venueId(b.getVenueId())
                .venueName(venueName)
                .resourceId(b.getResourceId())
                .resourceName(resourceName)
                .customerId(b.getCustomerId())
                .walkinName(b.getWalkinName())
                .walkinPhone(b.getWalkinPhone())
                .source(b.getSource())
                .startUtc(b.getStartUtc())
                .endUtc(b.getEndUtc())
                .status(b.getStatus())
                .holdExpiresAt(b.getHoldExpiresAt())
                .amountPaise(b.getAmountPaise())
                .discountPaise(b.getDiscountPaise())
                .taxPaise(b.getTaxPaise())
                .paidPaise(b.getPaidPaise())
                .paymentMode(b.getPaymentMode())
                .reservedSlotStarts(slots)
                .createdAt(b.getCreatedAt())
                .build();
    }
}
