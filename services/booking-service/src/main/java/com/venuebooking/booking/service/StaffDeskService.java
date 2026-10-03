package com.venuebooking.booking.service;

import com.venuebooking.booking.dto.*;
import com.venuebooking.booking.entity.Booking;
import com.venuebooking.booking.entity.BookingItem;
import com.venuebooking.booking.entity.PlaySession;
import com.venuebooking.booking.repository.BookingItemRepository;
import com.venuebooking.booking.repository.BookingRepository;
import com.venuebooking.booking.repository.BookingSlotRepository;
import com.venuebooking.booking.repository.PlaySessionRepository;
import com.venuebooking.catalog.entity.PricingRule;
import com.venuebooking.catalog.entity.Resource;
import com.venuebooking.catalog.entity.Venue;
import com.venuebooking.catalog.repository.PricingRuleRepository;
import com.venuebooking.catalog.repository.ResourceRepository;
import com.venuebooking.catalog.service.PricingService;
import com.venuebooking.common.BusinessException;
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
    public PlaySessionResponseDto stopSession(Long sessionId, StopSessionRequestDto req, Long staffUserId) {
        PlaySession session = playSessionRepository.findById(sessionId)
                .orElseThrow(() -> BusinessException.notFound("Session not found"));

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
    public void markCheckin(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> BusinessException.notFound("Booking not found"));
        if (booking.getStatus() == Booking.Status.HELD || booking.getStatus() == Booking.Status.CONFIRMED) {
            booking.setStatus(Booking.Status.CONFIRMED);
            bookingRepository.save(booking);
        }
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
