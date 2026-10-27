package com.venuebooking.booking.cancellation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.venuebooking.booking.dto.BookingResponseDto;
import com.venuebooking.booking.dto.CancelBookingRequestDto;
import com.venuebooking.booking.entity.Booking;
import com.venuebooking.booking.repository.AuditLogRepository;
import com.venuebooking.booking.repository.BookingRepository;
import com.venuebooking.booking.repository.BookingSlotRepository;
import com.venuebooking.booking.service.BookingService;
import com.venuebooking.catalog.entity.CancellationPolicy;
import com.venuebooking.catalog.repository.CancellationPolicyRepository;
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
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Staff Cancellation & Permission Rules Tests (Task 1.1)")
class StaffCancellationRulesTest {

    private static final Long TENANT_ID = 100L;
    private static final Long VENUE_ID = 10L;

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
    private CancellationPolicyRepository cancellationPolicyRepository;
    @Mock
    private PricingService pricingService;
    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private com.venuebooking.notification.service.PushNotificationService pushNotificationService;

    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        bookingService = new BookingService(
                RestClient.builder(),
                bookingRepository,
                bookingSlotRepository,
                resourceRepository,
                venueHoursRepository,
                resourceBlockRepository,
                cancellationPolicyRepository,
                pricingService,
                auditLogRepository,
                objectMapper,
                pushNotificationService
        );
    }

    @Test
    @DisplayName("Staff can cancel bookings <= ₹500 without manager approval code")
    void testStaffCanCancelSmallBookingsWithoutManagerApproval() {
        Long bookingId = 101L;
        Booking booking = Booking.builder()
                .id(bookingId)
                .tenantId(TENANT_ID)
                .venueId(VENUE_ID)
                .customerId(55L)
                .amountPaise(40000L) // ₹400
                .paidPaise(40000L)
                .status(Booking.Status.CONFIRMED)
                .paymentMode(Booking.PaymentMode.PAY_AT_VENUE)
                .startUtc(Instant.now().plusSeconds(7200))
                .endUtc(Instant.now().plusSeconds(10800))
                .build();

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(cancellationPolicyRepository.findByVenueIdOrderByHoursBeforeDesc(VENUE_ID)).thenReturn(List.of());

        CancelBookingRequestDto req = CancelBookingRequestDto.builder()
                .reason("Customer called to cancel")
                .reasonCode("CUSTOMER_REQUEST")
                .build();

        BookingResponseDto response = bookingService.cancelBooking(
                bookingId, 2L, true, TENANT_ID, "ROLE_STAFF", req
        );

        assertNotNull(response);
        assertEquals(Booking.Status.CANCELLED, booking.getStatus());
        verify(bookingRepository).save(booking);
        verify(bookingSlotRepository).deleteByBookingId(bookingId);
        verify(auditLogRepository).save(any());
    }

    @Test
    @DisplayName("Staff CANNOT cancel bookings > ₹500 without manager approval code")
    void testStaffCannotCancelLargeBookingsWithoutApproval() {
        Long bookingId = 102L;
        Booking booking = Booking.builder()
                .id(bookingId)
                .tenantId(TENANT_ID)
                .venueId(VENUE_ID)
                .customerId(55L)
                .amountPaise(150000L) // ₹1500
                .paidPaise(150000L)
                .status(Booking.Status.CONFIRMED)
                .paymentMode(Booking.PaymentMode.PAY_AT_VENUE)
                .startUtc(Instant.now().plusSeconds(7200))
                .endUtc(Instant.now().plusSeconds(10800))
                .build();

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));

        CancelBookingRequestDto req = CancelBookingRequestDto.builder()
                .reason("Attempted large cancellation")
                .reasonCode("CUSTOMER_REQUEST")
                .managerApprovalCode(null) // No code provided
                .build();

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            bookingService.cancelBooking(bookingId, 2L, true, TENANT_ID, "ROLE_STAFF", req);
        });

        assertEquals("MANAGER_APPROVAL_REQUIRED", ex.getCode());
        assertEquals(Booking.Status.CONFIRMED, booking.getStatus());
        verify(bookingRepository, never()).save(any());
        verify(bookingSlotRepository, never()).deleteByBookingId(any());
    }

    @Test
    @DisplayName("Staff CAN cancel bookings > ₹500 when providing valid manager approval code")
    void testStaffCanCancelLargeBookingsWithApprovalCode() {
        Long bookingId = 103L;
        Booking booking = Booking.builder()
                .id(bookingId)
                .tenantId(TENANT_ID)
                .venueId(VENUE_ID)
                .customerId(55L)
                .amountPaise(150000L) // ₹1500
                .paidPaise(150000L)
                .status(Booking.Status.CONFIRMED)
                .paymentMode(Booking.PaymentMode.PAY_AT_VENUE)
                .startUtc(Instant.now().plusSeconds(7200))
                .endUtc(Instant.now().plusSeconds(10800))
                .build();

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(cancellationPolicyRepository.findByVenueIdOrderByHoursBeforeDesc(VENUE_ID)).thenReturn(List.of());

        CancelBookingRequestDto req = CancelBookingRequestDto.builder()
                .reason("VIP Customer rescheduling")
                .reasonCode("VIP_OVERRIDE")
                .managerApprovalCode("MGR-8899")
                .build();

        BookingResponseDto response = bookingService.cancelBooking(
                bookingId, 2L, true, TENANT_ID, "ROLE_STAFF", req
        );

        assertNotNull(response);
        assertEquals(Booking.Status.CANCELLED, booking.getStatus());
        verify(bookingRepository).save(booking);
        verify(auditLogRepository).save(any());
    }

    @Test
    @DisplayName("Manager or Owner can cancel bookings > ₹500 directly without approval code")
    void testManagerCanCancelLargeBookingsDirectly() {
        Long bookingId = 104L;
        Booking booking = Booking.builder()
                .id(bookingId)
                .tenantId(TENANT_ID)
                .venueId(VENUE_ID)
                .customerId(55L)
                .amountPaise(500000L) // ₹5000
                .paidPaise(500000L)
                .status(Booking.Status.CONFIRMED)
                .paymentMode(Booking.PaymentMode.PAY_AT_VENUE)
                .startUtc(Instant.now().plusSeconds(7200))
                .endUtc(Instant.now().plusSeconds(10800))
                .build();

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(cancellationPolicyRepository.findByVenueIdOrderByHoursBeforeDesc(VENUE_ID)).thenReturn(List.of());

        CancelBookingRequestDto req = CancelBookingRequestDto.builder()
                .reason("Owner decided to cancel")
                .reasonCode("OWNER_ACTION")
                .build();

        BookingResponseDto response = bookingService.cancelBooking(
                bookingId, 1L, true, TENANT_ID, "ROLE_OWNER,ROLE_MANAGER", req
        );

        assertNotNull(response);
        assertEquals(Booking.Status.CANCELLED, booking.getStatus());
        verify(bookingRepository).save(booking);
        verify(auditLogRepository).save(any());
    }

    @Test
    @DisplayName("Customer cannot cancel another customer's booking")
    void testCustomerCannotCancelOtherCustomerBooking() {
        Long bookingId = 105L;
        Booking booking = Booking.builder()
                .id(bookingId)
                .tenantId(TENANT_ID)
                .venueId(VENUE_ID)
                .customerId(55L) // Owned by 55
                .status(Booking.Status.CONFIRMED)
                .build();

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            // Customer 99 tries to cancel customer 55's booking
            bookingService.cancelBooking(bookingId, 99L, false, null, "ROLE_CUSTOMER", null);
        });

        assertTrue(ex.getMessage().contains("not authorized to cancel"));
        verify(bookingRepository, never()).save(any());
    }
}
