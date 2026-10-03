package com.venuebooking.booking;

import com.venuebooking.booking.dto.BookingResponseDto;
import com.venuebooking.booking.dto.CreateBookingRequestDto;
import com.venuebooking.booking.entity.Booking;
import com.venuebooking.booking.repository.BookingRepository;
import com.venuebooking.booking.repository.BookingSlotRepository;
import com.venuebooking.booking.service.BookingService;
import com.venuebooking.catalog.entity.Resource;
import com.venuebooking.catalog.entity.Venue;
import com.venuebooking.catalog.entity.VenueHours;
import com.venuebooking.catalog.repository.ResourceBlockRepository;
import com.venuebooking.catalog.repository.ResourceRepository;
import com.venuebooking.catalog.repository.VenueHoursRepository;
import com.venuebooking.catalog.service.PricingService;
import com.venuebooking.common.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.Instant;
import java.time.LocalTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private BookingSlotRepository bookingSlotRepository;

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private VenueHoursRepository venueHoursRepository;

    @Mock
    private ResourceBlockRepository resourceBlockRepository;

    @Mock
    private PricingService pricingService;

    private BookingService bookingService;

    private Venue testVenue;
    private Resource testResource;
    private VenueHours testHours;

    @BeforeEach
    void setUp() {
        bookingService = new BookingService(
                bookingRepository,
                bookingSlotRepository,
                resourceRepository,
                venueHoursRepository,
                resourceBlockRepository,
                pricingService
        );

        testVenue = Venue.builder()
                .id(1L)
                .tenantId(10L)
                .name("Apex Lounge")
                .timezone("UTC")
                .active(true)
                .payAtVenueMode(Venue.PayAtVenueMode.OFF)
                .holdMinutes(8)
                .build();

        testResource = Resource.builder()
                .id(2L)
                .tenantId(10L)
                .venueId(1L)
                .venue(testVenue)
                .name("PS5 Console #1")
                .slotMinutes(60)
                .billingMode(Resource.BillingMode.FIXED_SLOT)
                .status(Resource.Status.ACTIVE)
                .build();

        testHours = VenueHours.builder()
                .id(100L)
                .venueId(1L)
                .dayOfWeek(6) // Saturday
                .openTime(LocalTime.of(8, 0))
                .closeTime(LocalTime.of(23, 0))
                .build();
    }

    @Test
    @DisplayName("Should successfully hold slot for 8 minutes on valid request")
    void testCreateBooking_SuccessWithHold() {
        when(resourceRepository.findById(2L)).thenReturn(Optional.of(testResource));
        when(venueHoursRepository.findByVenueIdAndDayOfWeek(any(), any())).thenReturn(Optional.of(testHours));
        when(resourceBlockRepository.findOverlappingBlocks(any(), any(), any())).thenReturn(Collections.emptyList());

        PricingService.PriceQuote quote = PricingService.PriceQuote.builder()
                .baseAmountPaise(25000L)
                .discountPaise(0L)
                .taxPaise(0L)
                .totalPaise(25000L)
                .build();
        when(pricingService.quoteFixedSlots(any(), any(), any())).thenReturn(quote);

        when(bookingRepository.saveAndFlush(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            b.setId(99L);
            return b;
        });

        // Use a future time
        Instant start = Instant.now().plusSeconds(7200).truncatedTo(java.time.temporal.ChronoUnit.HOURS);
        Instant end = start.plusSeconds(3600);

        CreateBookingRequestDto request = CreateBookingRequestDto.builder()
                .resourceId(2L)
                .startUtc(start)
                .endUtc(end)
                .paymentMode(Booking.PaymentMode.ONLINE)
                .build();

        BookingResponseDto response = bookingService.createBooking(request, 500L, Booking.Source.APP);

        assertNotNull(response);
        assertEquals(99L, response.getId());
        assertEquals(Booking.Status.HELD, response.getStatus());
        assertNotNull(response.getHoldExpiresAt());
        assertEquals(25000L, response.getAmountPaise());

        verify(bookingSlotRepository, times(1)).saveAll(any());
        verify(bookingSlotRepository, times(1)).flush();
    }

    @Test
    @DisplayName("Should throw BusinessException with SLOT_TAKEN on database unique constraint collision")
    void testCreateBooking_DoubleBookingThrowsSlotTaken() {
        when(resourceRepository.findById(2L)).thenReturn(Optional.of(testResource));
        when(venueHoursRepository.findByVenueIdAndDayOfWeek(any(), any())).thenReturn(Optional.of(testHours));
        when(resourceBlockRepository.findOverlappingBlocks(any(), any(), any())).thenReturn(Collections.emptyList());

        PricingService.PriceQuote quote = PricingService.PriceQuote.builder()
                .totalPaise(25000L)
                .discountPaise(0L)
                .taxPaise(0L)
                .build();
        when(pricingService.quoteFixedSlots(any(), any(), any())).thenReturn(quote);

        when(bookingRepository.saveAndFlush(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            b.setId(101L);
            return b;
        });

        // Simulate database unique key violation on booking_slots
        doThrow(new DataIntegrityViolationException("Duplicate entry '2-2026-10-03' for key 'uq_slot'"))
                .when(bookingSlotRepository).flush();

        Instant start = Instant.now().plusSeconds(7200).truncatedTo(java.time.temporal.ChronoUnit.HOURS);
        Instant end = start.plusSeconds(3600);

        CreateBookingRequestDto request = CreateBookingRequestDto.builder()
                .resourceId(2L)
                .startUtc(start)
                .endUtc(end)
                .paymentMode(Booking.PaymentMode.ONLINE)
                .build();

        BusinessException ex = assertThrows(BusinessException.class, () ->
                bookingService.createBooking(request, 500L, Booking.Source.APP)
        );

        assertEquals("SLOT_TAKEN", ex.getCode());
    }

    @Test
    @DisplayName("Should auto-confirm booking when venue allows PAY_AT_VENUE with NO_ADVANCE")
    void testCreateBooking_PayAtVenueNoAdvanceAutoConfirms() {
        testVenue.setPayAtVenueMode(Venue.PayAtVenueMode.NO_ADVANCE);

        when(resourceRepository.findById(2L)).thenReturn(Optional.of(testResource));
        when(venueHoursRepository.findByVenueIdAndDayOfWeek(any(), any())).thenReturn(Optional.of(testHours));
        when(resourceBlockRepository.findOverlappingBlocks(any(), any(), any())).thenReturn(Collections.emptyList());

        PricingService.PriceQuote quote = PricingService.PriceQuote.builder()
                .totalPaise(25000L)
                .discountPaise(0L)
                .taxPaise(0L)
                .build();
        when(pricingService.quoteFixedSlots(any(), any(), any())).thenReturn(quote);

        when(bookingRepository.saveAndFlush(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            b.setId(102L);
            return b;
        });

        Instant start = Instant.now().plusSeconds(7200).truncatedTo(java.time.temporal.ChronoUnit.HOURS);
        Instant end = start.plusSeconds(3600);

        CreateBookingRequestDto request = CreateBookingRequestDto.builder()
                .resourceId(2L)
                .startUtc(start)
                .endUtc(end)
                .paymentMode(Booking.PaymentMode.PAY_AT_VENUE)
                .build();

        BookingResponseDto response = bookingService.createBooking(request, 500L, Booking.Source.APP);

        assertNotNull(response);
        assertEquals(Booking.Status.CONFIRMED, response.getStatus());
        assertNull(response.getHoldExpiresAt());
    }
}
