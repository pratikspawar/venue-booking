package com.venuebooking.booking.isolation;

import com.venuebooking.booking.dto.ExtendSessionRequestDto;
import com.venuebooking.booking.dto.StopSessionRequestDto;
import com.venuebooking.booking.entity.Booking;
import com.venuebooking.booking.entity.PlaySession;
import com.venuebooking.booking.repository.BookingItemRepository;
import com.venuebooking.booking.repository.BookingRepository;
import com.venuebooking.booking.repository.BookingSlotRepository;
import com.venuebooking.booking.repository.PlaySessionRepository;
import com.venuebooking.booking.service.BookingService;
import com.venuebooking.booking.service.StaffDeskService;
import com.venuebooking.catalog.repository.CancellationPolicyRepository;
import com.venuebooking.catalog.repository.PricingRuleRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Cross-Tenant Data Isolation Tests - Booking Service")
class CrossTenantIsolationTest {

    private static final Long TENANT_A = 100L;
    private static final Long TENANT_B = 200L;

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
    private PlaySessionRepository playSessionRepository;
    @Mock
    private PricingRuleRepository pricingRuleRepository;
    @Mock
    private PricingService pricingService;
    @Mock
    private BookingItemRepository bookingItemRepository;
    @Mock
    private com.venuebooking.booking.repository.AuditLogRepository auditLogRepository;
    @Mock
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    @Mock
    private com.venuebooking.notification.service.PushNotificationService pushNotificationService;

    private BookingService bookingService;
    private StaffDeskService staffDeskService;

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

        staffDeskService = new StaffDeskService(
                playSessionRepository,
                bookingRepository,
                bookingSlotRepository,
                resourceRepository,
                pricingRuleRepository,
                pricingService,
                bookingItemRepository,
                pushNotificationService
        );
    }

    @Test
    @DisplayName("Tenant A staff user CANNOT read Tenant B booking details")
    void testTenantCannotReadOtherTenantBooking() {
        Long bookingId = 999L;
        Booking tenantBBooking = Booking.builder()
                .id(bookingId)
                .tenantId(TENANT_B)
                .venueId(20L)
                .resourceId(200L)
                .customerId(50L)
                .status(Booking.Status.CONFIRMED)
                .startUtc(Instant.now().plusSeconds(3600))
                .endUtc(Instant.now().plusSeconds(7200))
                .build();

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(tenantBBooking));

        // Staff from Tenant A tries to read Tenant B booking
        assertThrows(BusinessException.class, () -> {
            bookingService.getBookingById(bookingId, 1L, TENANT_A, true);
        });
    }

    @Test
    @DisplayName("Tenant A staff user CANNOT cancel Tenant B booking")
    void testStaffCannotCancelOtherTenantBooking() {
        Long bookingId = 888L;
        Booking tenantBBooking = Booking.builder()
                .id(bookingId)
                .tenantId(TENANT_B)
                .venueId(20L)
                .resourceId(200L)
                .customerId(50L)
                .status(Booking.Status.CONFIRMED)
                .startUtc(Instant.now().plusSeconds(7200))
                .endUtc(Instant.now().plusSeconds(10800))
                .build();

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(tenantBBooking));

        // Staff from Tenant A attempts cancellation
        assertThrows(BusinessException.class, () -> {
            bookingService.cancelBooking(bookingId, null, true, TENANT_A);
        });

        // Verify booking state was NOT modified
        assertEquals(Booking.Status.CONFIRMED, tenantBBooking.getStatus());
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tenant A staff CANNOT stop Tenant B play session")
    void testTenantCannotStopOtherTenantPlaySession() {
        Long sessionId = 777L;
        PlaySession tenantBSession = PlaySession.builder()
                .id(sessionId)
                .tenantId(TENANT_B)
                .bookingId(888L)
                .startedAt(Instant.now().minusSeconds(1800))
                .build();

        when(playSessionRepository.findById(sessionId)).thenReturn(Optional.of(tenantBSession));

        // Staff from Tenant A attempts to stop Tenant B session
        assertThrows(BusinessException.class, () -> {
            staffDeskService.stopSession(sessionId, new StopSessionRequestDto(), 1L, TENANT_A);
        });

        assertNull(tenantBSession.getEndedAt());
        verify(playSessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tenant A staff CANNOT extend Tenant B play session")
    void testTenantCannotExtendOtherTenantPlaySession() {
        Long sessionId = 666L;
        PlaySession tenantBSession = PlaySession.builder()
                .id(sessionId)
                .tenantId(TENANT_B)
                .bookingId(888L)
                .startedAt(Instant.now().minusSeconds(1800))
                .build();

        when(playSessionRepository.findById(sessionId)).thenReturn(Optional.of(tenantBSession));

        // Staff from Tenant A attempts to extend Tenant B session
        assertThrows(BusinessException.class, () -> {
            staffDeskService.extendSession(sessionId, new ExtendSessionRequestDto(30), 1L, TENANT_A);
        });
    }

    @Test
    @DisplayName("Tenant A staff CANNOT mark Tenant B booking as No-Show")
    void testTenantCannotMarkNoShowOtherTenantBooking() {
        Long bookingId = 555L;
        Booking tenantBBooking = Booking.builder()
                .id(bookingId)
                .tenantId(TENANT_B)
                .venueId(20L)
                .resourceId(200L)
                .status(Booking.Status.CONFIRMED)
                .startUtc(Instant.now().minusSeconds(1800))
                .build();

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(tenantBBooking));

        // Staff from Tenant A tries to mark Tenant B booking as NO_SHOW
        assertThrows(BusinessException.class, () -> {
            staffDeskService.markNoShow(bookingId, 1L, TENANT_A);
        });

        assertEquals(Booking.Status.CONFIRMED, tenantBBooking.getStatus());
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tenant A staff CANNOT check-in Tenant B booking")
    void testTenantCannotCheckinOtherTenantBooking() {
        Long bookingId = 444L;
        Booking tenantBBooking = Booking.builder()
                .id(bookingId)
                .tenantId(TENANT_B)
                .venueId(20L)
                .resourceId(200L)
                .status(Booking.Status.HELD)
                .build();

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(tenantBBooking));

        // Staff from Tenant A tries to check-in Tenant B booking
        assertThrows(BusinessException.class, () -> {
            staffDeskService.markCheckin(bookingId, TENANT_A);
        });

        assertEquals(Booking.Status.HELD, tenantBBooking.getStatus());
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Active sessions lookup strictly filters by caller tenantId")
    void testGetActiveSessionsStrictTenantScoping() {
        when(playSessionRepository.findActiveSessionsByTenantId(TENANT_A)).thenReturn(List.of());

        List<?> active = staffDeskService.getActiveSessions(null, TENANT_A);

        assertNotNull(active);
        assertTrue(active.isEmpty());
        verify(playSessionRepository).findActiveSessionsByTenantId(TENANT_A);
        verify(playSessionRepository, never()).findActiveSessionsByTenantId(TENANT_B);
    }

    @Test
    @DisplayName("Tenant bookings listing strictly queries caller tenantId")
    void testListTenantBookingsStrictScoping() {
        when(bookingRepository.findByTenantIdOrderByStartUtcDesc(TENANT_A)).thenReturn(List.of());

        List<?> bookings = bookingService.listTenantBookings(TENANT_A);

        assertNotNull(bookings);
        assertTrue(bookings.isEmpty());
        verify(bookingRepository).findByTenantIdOrderByStartUtcDesc(TENANT_A);
        verify(bookingRepository, never()).findByTenantIdOrderByStartUtcDesc(TENANT_B);
    }
}
