package com.venuebooking.booking.service;

import com.venuebooking.booking.dto.*;
import com.venuebooking.booking.entity.Booking;
import com.venuebooking.booking.entity.BookingItem;
import com.venuebooking.booking.entity.BookingSlot;
import com.venuebooking.booking.entity.PlaySession;
import com.venuebooking.booking.repository.BookingItemRepository;
import com.venuebooking.booking.repository.BookingRepository;
import com.venuebooking.booking.repository.BookingSlotRepository;
import com.venuebooking.booking.repository.PlaySessionRepository;
import java.util.ArrayList;
import com.venuebooking.catalog.entity.PricingRule;
import com.venuebooking.catalog.entity.Resource;
import com.venuebooking.catalog.entity.Venue;
import com.venuebooking.catalog.repository.PricingRuleRepository;
import com.venuebooking.catalog.repository.ResourceRepository;
import com.venuebooking.catalog.service.PricingService;
import com.venuebooking.common.BusinessException;
import com.venuebooking.notification.service.PushNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class StaffDeskService {

    private final PlaySessionRepository playSessionRepository;
    private final BookingRepository bookingRepository;
    private final BookingSlotRepository bookingSlotRepository;
    private final ResourceRepository resourceRepository;
    private final PricingRuleRepository pricingRuleRepository;
    private final PricingService pricingService;
    private final BookingItemRepository bookingItemRepository;
    private final PushNotificationService pushNotificationService;

    @Transactional
    public PlaySessionResponseDto startSession(StartSessionRequestDto req, Long staffUserId) {
        Booking booking;

        if (req.getBookingId() != null) {
            booking = bookingRepository.findById(req.getBookingId())
                    .orElseThrow(() -> BusinessException.notFound("Booking not found"));

            if (booking.getStatus() == Booking.Status.CANCELLED || booking.getStatus() == Booking.Status.COMPLETED) {
                throw new BusinessException("INVALID_BOOKING_STATUS", "Booking is " + booking.getStatus() + " and cannot be started");
            }

            Optional<PlaySession> existingSession = playSessionRepository.findByBookingId(booking.getId());
            if (existingSession.isPresent()) {
                PlaySession s = existingSession.get();
                if (s.getEndedAt() == null) {
                    return toSessionDto(s);
                }
            }
        } else {
            // Instant walk-in session on a resource
            if (req.getResourceId() == null) {
                throw new BusinessException("RESOURCE_REQUIRED", "Resource ID is required for walk-in session");
            }

            Resource resource = resourceRepository.findById(req.getResourceId())
                    .orElseThrow(() -> BusinessException.notFound("Resource not found"));

            if (resource.getStatus() != Resource.Status.ACTIVE) {
                throw new BusinessException("RESOURCE_INACTIVE", "Resource is currently inactive");
            }

            Venue venue = resource.getVenue();
            Instant now = Instant.now();

            booking = Booking.builder()
                    .tenantId(resource.getTenantId())
                    .venueId(venue != null ? venue.getId() : (req.getVenueId() != null ? req.getVenueId() : 1L))
                    .resourceId(resource.getId())
                    .walkinName(req.getWalkinName() != null ? req.getWalkinName() : "Walk-in Guest")
                    .walkinPhone(req.getWalkinPhone())
                    .source(Booking.Source.WALKIN)
                    .startUtc(now)
                    .endUtc(now.plus(Duration.ofHours(1)))
                    .status(Booking.Status.IN_PROGRESS)
                    .amountPaise(0L)
                    .paidPaise(0L)
                    .paymentMode(Booking.PaymentMode.PAY_AT_VENUE)
                    .build();

            booking = bookingRepository.save(booking);
        }

        booking.setStatus(Booking.Status.IN_PROGRESS);
        bookingRepository.save(booking);

        PlaySession session = PlaySession.builder()
                .tenantId(booking.getTenantId())
                .bookingId(booking.getId())
                .startedAt(Instant.now())
                .startedBy(staffUserId)
                .build();

        PlaySession savedSession = playSessionRepository.save(session);
        log.info("Play session #{} started for booking #{} on resource #{}", savedSession.getId(), booking.getId(), booking.getResourceId());
        return toSessionDto(savedSession);
    }

    @Transactional
    public PlaySessionResponseDto stopSession(Long sessionId, StopSessionRequestDto req, Long staffUserId, Long tenantId) {
        PlaySession session = playSessionRepository.findById(sessionId)
                .orElseThrow(() -> BusinessException.notFound("Session not found"));

        if (tenantId != null && !tenantId.equals(session.getTenantId())) {
            throw BusinessException.notFound("Session not found");
        }

        if (session.getEndedAt() != null) {
            throw new BusinessException("SESSION_ALREADY_CLOSED", "Session was already closed at " + session.getEndedAt());
        }

        Instant endedAt = Instant.now();
        Booking booking = bookingRepository.findById(session.getBookingId())
                .orElseThrow(() -> BusinessException.notFound("Associated booking not found"));

        Resource resource = resourceRepository.findById(booking.getResourceId()).orElse(null);
        Venue venue = (resource != null && resource.getVenue() != null) ? resource.getVenue() : null;
        ZoneId zone = ZoneId.of(venue != null && venue.getTimezone() != null ? venue.getTimezone() : "Asia/Kolkata");

        // 1. Calculate duration and billed minutes
        int billedMinutes;
        if (req != null && req.getManualBilledMinutes() != null && req.getManualBilledMinutes() > 0) {
            billedMinutes = req.getManualBilledMinutes();
        } else {
            long rawMinutes = Math.max(1, Duration.between(session.getStartedAt(), endedAt).toMinutes());
            int rounding = 5; // Default 5-minute round-up for PlayStation/Snooker
            int minChargeMinutes = 15;

            if (resource != null) {
                List<PricingRule> rules = pricingRuleRepository.findByResourceIdOrderByPriorityDesc(resource.getId());
                if (!rules.isEmpty()) {
                    ZonedDateTime localStart = session.getStartedAt().atZone(zone);
                    PricingRule rule = pricingService.resolveBestRule(rules, localStart.toLocalDate(), localStart.toLocalTime());
                    if (rule.getRoundingMinutes() != null && rule.getRoundingMinutes() > 0) {
                        rounding = rule.getRoundingMinutes();
                    }
                    if (rule.getMinChargeMinutes() != null && rule.getMinChargeMinutes() > 0) {
                        minChargeMinutes = rule.getMinChargeMinutes();
                    }
                }
            }

            long roundedMinutes = (long) Math.ceil((double) rawMinutes / rounding) * rounding;
            billedMinutes = (int) Math.max(roundedMinutes, minChargeMinutes);
        }

        // 2. Calculate amount in paise
        long amountPaise = 0L;
        if (resource != null) {
            List<PricingRule> rules = pricingRuleRepository.findByResourceIdOrderByPriorityDesc(resource.getId());
            if (!rules.isEmpty()) {
                ZonedDateTime localStart = session.getStartedAt().atZone(zone);
                PricingRule rule = pricingService.resolveBestRule(rules, localStart.toLocalDate(), localStart.toLocalTime());
                if (rule.getPricePerHourPaise() != null) {
                    amountPaise = Math.round(((double) billedMinutes / 60.0) * rule.getPricePerHourPaise());
                } else if (rule.getPricePerSlotPaise() != null) {
                    amountPaise = rule.getPricePerSlotPaise();
                }
            } else {
                // Fallback default: Rs 200/hr = 20000 paise/hr
                amountPaise = Math.round(((double) billedMinutes / 60.0) * 20000);
            }
        }

        if (req != null && req.getDiscountPaise() != null && req.getDiscountPaise() > 0) {
            amountPaise = Math.max(0, amountPaise - req.getDiscountPaise());
        }

        // 3. Finalize session entity
        session.setEndedAt(endedAt);
        session.setBilledMinutes(billedMinutes);
        session.setAmountPaise(amountPaise);
        session.setEndedBy(staffUserId);
        playSessionRepository.save(session);

        // 4. Finalize booking entity
        booking.setEndUtc(endedAt);
        booking.setAmountPaise(amountPaise);
        booking.setStatus(Booking.Status.COMPLETED);

        if (req != null && req.getPaymentMethod() != null) {
            booking.setPaidPaise(amountPaise); // Marked as paid at counter
        }
        bookingRepository.save(booking);

        // Release any reserved slot cells
        bookingSlotRepository.deleteByBookingId(booking.getId());

        log.info("Play session #{} stopped. Billed minutes: {}, Amount: Rs {}", sessionId, billedMinutes, amountPaise / 100.0);
        return toSessionDto(session);
    }

    public PlaySessionResponseDto stopSession(Long sessionId, StopSessionRequestDto req, Long staffUserId) {
        return stopSession(sessionId, req, staffUserId, null);
    }

    @Transactional(readOnly = true)
    public List<PlaySessionResponseDto> getActiveSessions(Long venueId, Long tenantId) {
        List<PlaySession> sessions;
        if (venueId != null) {
            sessions = playSessionRepository.findActiveSessionsByVenueId(venueId);
        } else if (tenantId != null) {
            sessions = playSessionRepository.findActiveSessionsByTenantId(tenantId);
        } else {
            sessions = List.of();
        }

        return sessions.stream().map(this::toSessionDto).toList();
    }

    @Transactional
    public void markCheckin(Long bookingId, Long tenantId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> BusinessException.notFound("Booking not found"));

        if (tenantId != null && !tenantId.equals(booking.getTenantId())) {
            throw BusinessException.notFound("Booking not found");
        }

        if (booking.getStatus() == Booking.Status.HELD || booking.getStatus() == Booking.Status.CONFIRMED) {
            booking.setStatus(Booking.Status.CONFIRMED);
            bookingRepository.save(booking);
        }
    }

    public void markCheckin(Long bookingId) {
        markCheckin(bookingId, null);
    }

    @Transactional
    public void markNoShow(Long bookingId, Long staffUserId, Long tenantId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> BusinessException.notFound("Booking not found: " + bookingId));

        if (tenantId != null && !tenantId.equals(booking.getTenantId())) {
            throw BusinessException.notFound("Booking not found: " + bookingId);
        }

        if (booking.getStatus() == Booking.Status.COMPLETED ||
            booking.getStatus() == Booking.Status.IN_PROGRESS ||
            booking.getStatus() == Booking.Status.CANCELLED ||
            booking.getStatus() == Booking.Status.NO_SHOW) {
            throw new BusinessException("INVALID_STATUS", "Cannot mark as no-show when booking status is " + booking.getStatus());
        }

        // Release reserved slots so other players or walk-ins can book
        bookingSlotRepository.deleteByBookingIdIn(List.of(booking.getId()));

        booking.setStatus(Booking.Status.NO_SHOW);
        bookingRepository.save(booking);

        pushNotificationService.sendNoShowNotice(booking);

        log.info("Booking #{} manually marked as NO_SHOW by staff #{}. Reserved slots released.",
                bookingId, staffUserId != null ? staffUserId : 1L);
    }

    public void markNoShow(Long bookingId, Long staffUserId) {
        markNoShow(bookingId, staffUserId, null);
    }

    @Transactional
    public ExtendSessionResponseDto extendSession(Long sessionId, ExtendSessionRequestDto req, Long staffUserId, Long tenantId) {
        PlaySession session = playSessionRepository.findById(sessionId)
                .orElseThrow(() -> BusinessException.notFound("Play session not found"));

        if (tenantId != null && !tenantId.equals(session.getTenantId())) {
            throw BusinessException.notFound("Play session not found");
        }

        if (session.getEndedAt() != null) {
            throw new BusinessException("SESSION_ALREADY_CLOSED", "Cannot extend an ended session");
        }

        Booking booking = bookingRepository.findById(session.getBookingId())
                .orElseThrow(() -> BusinessException.notFound("Booking not found"));

        Resource currentResource = resourceRepository.findById(booking.getResourceId()).orElse(null);
        int extraMinutes = req != null && req.getExtraMinutes() > 0 ? req.getExtraMinutes() : 30;

        Instant currentEnd = (booking.getEndUtc() != null && booking.getEndUtc().isAfter(Instant.now()))
                ? booking.getEndUtc() : Instant.now();
        Instant newEnd = currentEnd.plus(Duration.ofMinutes(extraMinutes));

        // Check if next slot on current resource is occupied
        List<BookingSlot> conflictingSlots = bookingSlotRepository.findSlotsForResourceAndRange(
                booking.getResourceId(), currentEnd, newEnd
        ).stream().filter(bs -> !bs.getBookingId().equals(booking.getId())).toList();

        if (!conflictingSlots.isEmpty()) {
            // Conflict detected! Check alternative resources of the same sport
            List<ResourceAlternativeDto> alternatives = new ArrayList<>();
            if (currentResource != null && booking.getVenueId() != null) {
                List<Resource> sameSportResources = resourceRepository.findByVenueId(booking.getVenueId()).stream()
                        .filter(r -> r.getStatus() == Resource.Status.ACTIVE)
                        .filter(r -> r.getSportId().equals(currentResource.getSportId()))
                        .filter(r -> !r.getId().equals(booking.getResourceId()))
                        .toList();

                for (Resource alt : sameSportResources) {
                    List<BookingSlot> altSlots = bookingSlotRepository.findSlotsForResourceAndRange(alt.getId(), currentEnd, newEnd);
                    if (altSlots.isEmpty()) {
                        String sportName = alt.getSport() != null ? alt.getSport().getNameEn() : "Sport";
                        alternatives.add(ResourceAlternativeDto.builder()
                                .resourceId(alt.getId())
                                .resourceName(alt.getName())
                                .sportName(sportName)
                                .build());
                    }
                }
            }

            String conflictMsg = alternatives.isEmpty()
                    ? "Conflict: Current table is booked in upcoming slot, and all other tables are full."
                    : "Conflict: Current table is booked next. Move to an available table to continue playing.";

            return ExtendSessionResponseDto.builder()
                    .success(false)
                    .conflict(true)
                    .message(conflictMsg)
                    .sessionId(sessionId)
                    .currentResourceId(booking.getResourceId())
                    .newEndUtc(currentEnd)
                    .alternativeResources(alternatives)
                    .build();
        }

        // In-place extension: No conflict!
        booking.setEndUtc(newEnd);
        bookingRepository.save(booking);

        pushNotificationService.sendSessionExtended(booking, extraMinutes);

        log.info("Play session #{} extended by {} mins until {}", sessionId, extraMinutes, newEnd);
        return ExtendSessionResponseDto.builder()
                .success(true)
                .conflict(false)
                .message("Session successfully extended by " + extraMinutes + " minutes")
                .sessionId(sessionId)
                .currentResourceId(booking.getResourceId())
                .newEndUtc(newEnd)
                .alternativeResources(List.of())
                .build();
    }

    @Transactional
    public PlaySessionResponseDto swapSessionResource(Long sessionId, SwapResourceRequestDto req, Long staffUserId) {
        PlaySession session = playSessionRepository.findById(sessionId)
                .orElseThrow(() -> BusinessException.notFound("Play session not found"));

        if (session.getEndedAt() != null) {
            throw new BusinessException("SESSION_ALREADY_CLOSED", "Cannot swap table on an ended session");
        }

        Booking booking = bookingRepository.findById(session.getBookingId())
                .orElseThrow(() -> BusinessException.notFound("Booking not found"));

        Resource targetResource = resourceRepository.findById(req.getTargetResourceId())
                .orElseThrow(() -> BusinessException.notFound("Target resource not found"));

        if (targetResource.getStatus() != Resource.Status.ACTIVE) {
            throw new BusinessException("RESOURCE_INACTIVE", "Target resource is currently inactive");
        }

        Instant currentEnd = (booking.getEndUtc() != null && booking.getEndUtc().isAfter(Instant.now()))
                ? booking.getEndUtc() : Instant.now().plus(Duration.ofMinutes(30));

        // Verify target resource has no conflicting slots during remaining time
        List<BookingSlot> targetSlots = bookingSlotRepository.findSlotsForResourceAndRange(
                targetResource.getId(), Instant.now(), currentEnd
        ).stream().filter(bs -> !bs.getBookingId().equals(booking.getId())).toList();

        if (!targetSlots.isEmpty()) {
            throw new BusinessException("TARGET_RESOURCE_OCCUPIED", "Target table is already reserved during this time");
        }

        Long oldResourceId = booking.getResourceId();
        bookingSlotRepository.deleteByBookingId(booking.getId());
        booking.setResourceId(targetResource.getId());
        bookingRepository.save(booking);

        log.info("Session #{} swapped from resource #{} to target resource #{} ('{}'). Reason: {}",
                sessionId, oldResourceId, targetResource.getId(), targetResource.getName(), req.getReason());

        return toSessionDto(session);
    }

    @Transactional
    public QrCheckinResponseDto qrCheckin(QrCheckinRequestDto req, Long staffUserId) {
        if (req == null || req.getQrData() == null || req.getQrData().isBlank()) {
            throw BusinessException.badRequest("QR data cannot be empty");
        }

        // Parse booking ID from raw ID, "BOOKING:12", or URL
        String raw = req.getQrData().trim();
        String idStr = raw.replaceAll("[^0-9]", "");
        if (idStr.isEmpty()) {
            throw BusinessException.badRequest("Invalid QR code format");
        }

        Long bookingId = Long.parseLong(idStr);
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> BusinessException.notFound("Booking #" + bookingId + " not found"));

        if (booking.getStatus() == Booking.Status.CANCELLED || booking.getStatus() == Booking.Status.EXPIRED) {
            throw new BusinessException("INVALID_BOOKING_STATUS", "Booking is " + booking.getStatus() + " and cannot be checked in");
        }

        // Mark checked in
        booking.setStatus(Booking.Status.IN_PROGRESS);
        bookingRepository.save(booking);

        // Auto-start play session if not already running
        PlaySession session = playSessionRepository.findByBookingId(booking.getId())
                .orElseGet(() -> playSessionRepository.save(PlaySession.builder()
                        .tenantId(booking.getTenantId())
                        .bookingId(booking.getId())
                        .startedAt(Instant.now())
                        .startedBy(staffUserId != null ? staffUserId : 1L)
                        .build()));

        Resource resource = resourceRepository.findById(booking.getResourceId()).orElse(null);
        String custName = booking.getCustomer() != null ? booking.getCustomer().getName()
                : (booking.getWalkinName() != null ? booking.getWalkinName() : "App Customer");
        String custPhone = booking.getCustomer() != null ? booking.getCustomer().getPhone()
                : (booking.getWalkinPhone() != null ? booking.getWalkinPhone() : "-");
        String resName = resource != null ? resource.getName() : "Resource #" + booking.getResourceId();
        String sportName = (resource != null && resource.getSport() != null) ? resource.getSport().getNameEn() : "Sport";

        String timeWindow = (booking.getStartUtc() != null && booking.getEndUtc() != null)
                ? (booking.getStartUtc() + " - " + booking.getEndUtc()) : "Live Session";

        log.info("QR check-in validated for booking #{} (Session #{}, Customer: {})", booking.getId(), session.getId(), custName);

        return QrCheckinResponseDto.builder()
                .success(true)
                .message("Check-in verified! Play session timer started.")
                .bookingId(booking.getId())
                .sessionId(session.getId())
                .customerName(custName)
                .customerPhone(custPhone)
                .resourceName(resName)
                .sportName(sportName)
                .timeWindow(timeWindow)
                .status("IN_PROGRESS")
                .build();
    }

    private PlaySessionResponseDto toSessionDto(PlaySession s) {
        Booking b = s.getBooking();
        if (b == null && s.getBookingId() != null) {
            b = bookingRepository.findById(s.getBookingId()).orElse(null);
        }

        Resource r = b != null ? resourceRepository.findById(b.getResourceId()).orElse(null) : null;
        Venue v = r != null ? r.getVenue() : null;

        Instant end = s.getEndedAt();
        long elapsedSeconds = Duration.between(s.getStartedAt(), end != null ? end : Instant.now()).getSeconds();

        return PlaySessionResponseDto.builder()
                .sessionId(s.getId())
                .bookingId(s.getBookingId())
                .tenantId(s.getTenantId())
                .venueId(b != null ? b.getVenueId() : null)
                .venueName(v != null ? v.getName() : null)
                .resourceId(b != null ? b.getResourceId() : null)
                .resourceName(r != null ? r.getName() : null)
                .customerName(b != null ? (b.getWalkinName() != null ? b.getWalkinName() : "App Customer") : null)
                .customerPhone(b != null ? b.getWalkinPhone() : null)
                .bookingSource(b != null ? b.getSource() : null)
                .bookingStatus(b != null ? b.getStatus() : null)
                .startedAt(s.getStartedAt())
                .endedAt(s.getEndedAt())
                .elapsedSeconds(elapsedSeconds)
                .billedMinutes(s.getBilledMinutes())
                .amountPaise(s.getAmountPaise() != null ? s.getAmountPaise() : (b != null ? b.getAmountPaise() : 0L))
                .paidPaise(b != null ? b.getPaidPaise() : 0L)
                .startedBy(s.getStartedBy())
                .endedBy(s.getEndedBy())
                .active(s.getEndedAt() == null)
                .build();
    }

    @Transactional
    public BookingItemResponseDto addItemToBooking(Long bookingId, AddBookingItemDto req) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> BusinessException.notFound("Booking not found"));

        long totalPaise = req.getUnitPricePaise() * req.getQuantity();

        BookingItem item = BookingItem.builder()
                .tenantId(booking.getTenantId())
                .bookingId(booking.getId())
                .canteenItemId(req.getCanteenItemId())
                .itemName(req.getItemName())
                .quantity(req.getQuantity())
                .unitPricePaise(req.getUnitPricePaise())
                .totalPaise(totalPaise)
                .build();

        BookingItem saved = bookingItemRepository.save(item);

        // Increment total bill on booking
        booking.setAmountPaise((booking.getAmountPaise() != null ? booking.getAmountPaise() : 0L) + totalPaise);
        bookingRepository.save(booking);

        log.info("Attached {}x '{}' (₹{}) to booking #{}", req.getQuantity(), req.getItemName(), totalPaise / 100, bookingId);

        return BookingItemResponseDto.builder()
                .id(saved.getId())
                .bookingId(saved.getBookingId())
                .canteenItemId(saved.getCanteenItemId())
                .itemName(saved.getItemName())
                .quantity(saved.getQuantity())
                .unitPricePaise(saved.getUnitPricePaise())
                .totalPaise(saved.getTotalPaise())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<BookingItemResponseDto> getBookingItems(Long bookingId) {
        return bookingItemRepository.findByBookingId(bookingId).stream()
                .map(i -> BookingItemResponseDto.builder()
                        .id(i.getId())
                        .bookingId(i.getBookingId())
                        .canteenItemId(i.getCanteenItemId())
                        .itemName(i.getItemName())
                        .quantity(i.getQuantity())
                        .unitPricePaise(i.getUnitPricePaise())
                        .totalPaise(i.getTotalPaise())
                        .createdAt(i.getCreatedAt())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public ShiftSummaryResponseDto getShiftSummary(Long venueId, Long tenantId) {
        Long targetTenant = tenantId != null ? tenantId : 1L;
        List<Booking> todayBookings = bookingRepository.findByTenantIdOrderByStartUtcDesc(targetTenant);

        long count = 0;
        long totalRevenue = 0;
        long cashTotal = 0;
        long upiTotal = 0;
        long canteenTotal = 0;

        for (Booking b : todayBookings) {
            if (venueId != null && !venueId.equals(b.getVenueId())) {
                continue;
            }
            if (b.getStatus() == Booking.Status.COMPLETED || b.getStatus() == Booking.Status.IN_PROGRESS) {
                count++;
                long paid = b.getPaidPaise() != null ? b.getPaidPaise() : (b.getAmountPaise() != null ? b.getAmountPaise() : 0L);
                totalRevenue += paid;

                if (b.getPaymentMode() == Booking.PaymentMode.PAY_AT_VENUE) {
                    cashTotal += paid;
                } else {
                    upiTotal += paid;
                }

                List<BookingItem> items = bookingItemRepository.findByBookingId(b.getId());
                for (BookingItem item : items) {
                    canteenTotal += item.getTotalPaise();
                }
            }
        }

        long gameTimeRevenue = Math.max(0, totalRevenue - canteenTotal);

        return ShiftSummaryResponseDto.builder()
                .venueId(venueId)
                .date(java.time.LocalDate.now())
                .totalSessionsCount(count)
                .gameTimeRevenuePaise(gameTimeRevenue)
                .canteenRevenuePaise(canteenTotal)
                .totalRevenuePaise(totalRevenue)
                .cashCollectedPaise(cashTotal)
                .upiCollectedPaise(upiTotal)
                .build();
    }
}
