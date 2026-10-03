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
import com.venuebooking.catalog.repository.ResourceBlockRepository;
import com.venuebooking.catalog.repository.ResourceRepository;
import com.venuebooking.catalog.repository.VenueHoursRepository;
import com.venuebooking.catalog.service.PricingService;
import com.venuebooking.common.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookingSlotRepository bookingSlotRepository;
    private final ResourceRepository resourceRepository;
    private final VenueHoursRepository venueHoursRepository;
    private final ResourceBlockRepository resourceBlockRepository;
    private final PricingService pricingService;

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

        // 2. Validate cells against past, venue hours, and maintenance blocks
        validateCells(cells, venue, resource, venueZone, slotMinutes);

        // 3. Calculate price quote
        PricingService.PriceQuote quote = pricingService.quoteFixedSlots(resource, cells, venueZone);

        // 4. Determine initial status and payment rules
        Booking.Status initialStatus = Booking.Status.HELD;
        Instant holdExpiresAt = null;

        if (req.getPaymentMode() == Booking.PaymentMode.PAY_AT_VENUE) {
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
                .amountPaise(quote.getTotalPaise())
                .discountPaise(quote.getDiscountPaise())
                .taxPaise(quote.getTaxPaise())
                .paidPaise(0L)
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
        return toDto(savedBooking, venue.getName(), resource.getName(), cells);
    }

    @Transactional
    public BookingResponseDto cancelBooking(Long bookingId, Long customerId, boolean isStaff) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> BusinessException.notFound("Booking not found"));

        if (!isStaff && (booking.getCustomerId() == null || !booking.getCustomerId().equals(customerId))) {
            throw BusinessException.forbidden("You are not authorized to cancel this booking");
        }

        if (booking.getStatus() == Booking.Status.CANCELLED || booking.getStatus() == Booking.Status.COMPLETED) {
            throw new BusinessException("INVALID_STATE", "Booking cannot be cancelled in status: " + booking.getStatus());
        }

        booking.setStatus(Booking.Status.CANCELLED);
        bookingRepository.save(booking);

        // Delete booking_slots so cells become available for new customers immediately
        bookingSlotRepository.deleteByBookingId(booking.getId());
        log.info("Booking #{} cancelled and slots released", bookingId);

        return toDto(booking, null, null, List.of());
    }

    @Transactional(readOnly = true)
    public BookingResponseDto getBookingById(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> BusinessException.notFound("Booking not found"));
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
