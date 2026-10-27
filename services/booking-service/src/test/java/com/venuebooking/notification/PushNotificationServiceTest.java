package com.venuebooking.notification;

import com.venuebooking.auth.entity.User;
import com.venuebooking.auth.repository.UserRepository;
import com.venuebooking.booking.entity.Booking;
import com.venuebooking.booking.repository.BookingRepository;
import com.venuebooking.catalog.entity.Resource;
import com.venuebooking.catalog.entity.Venue;
import com.venuebooking.notification.adapter.ExpoPushNotificationAdapter;
import com.venuebooking.notification.adapter.FcmPushNotificationAdapter;
import com.venuebooking.notification.adapter.PushNotificationAdapter;
import com.venuebooking.notification.entity.PushNotificationLog;
import com.venuebooking.notification.repository.PushNotificationLogRepository;
import com.venuebooking.notification.scheduler.BookingReminderScheduler;
import com.venuebooking.notification.service.PushNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
@DisplayName("Push Notifications (FCM / Expo) Unit Tests (Task 1.6)")
class PushNotificationServiceTest {

    @Mock
    private PushNotificationLogRepository logRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private BookingRepository bookingRepository;

    private FcmPushNotificationAdapter fcmAdapter;
    private ExpoPushNotificationAdapter expoAdapter;
    private PushNotificationService pushNotificationService;
    private BookingReminderScheduler reminderScheduler;

    private Venue venue;
    private Resource resource;

    @BeforeEach
    void setUp() {
        fcmAdapter = new FcmPushNotificationAdapter(RestClient.builder());
        expoAdapter = new ExpoPushNotificationAdapter(RestClient.builder());

        pushNotificationService = new PushNotificationService(
                List.of(expoAdapter, fcmAdapter),
                logRepository,
                userRepository
        );

        reminderScheduler = new BookingReminderScheduler(
                bookingRepository,
                pushNotificationService
        );

        venue = Venue.builder()
                .id(1L)
                .name("Apex Gaming & Sports")
                .timezone("Asia/Kolkata")
                .build();

        resource = Resource.builder()
                .id(10L)
                .name("PlayStation 5 Console #1")
                .venue(venue)
                .build();
    }

    @Test
    @DisplayName("Adapter token routing: Expo tokens route to Expo, FCM tokens to FCM")
    void testAdapterRouting() {
        String expoToken = "ExponentPushToken[AbCdEf123456]";
        String fcmToken = "c7v8N_fake_fcm_token_registration_device_99";

        assertTrue(expoAdapter.supports(expoToken));
        assertFalse(expoAdapter.supports(fcmToken));

        assertTrue(fcmAdapter.supports(fcmToken));
        assertFalse(fcmAdapter.supports(expoToken));
    }

    @Test
    @DisplayName("Send Booking Hold Created in English for user with FCM token")
    void testSendBookingHoldCreated_EnglishUser() {
        User user = User.builder()
                .id(501L)
                .name("Rahul Patil")
                .language("en")
                .fcmToken("fcm-device-token-123")
                .build();

        Booking booking = Booking.builder()
                .id(9001L)
                .customer(user)
                .customerId(user.getId())
                .venue(venue)
                .resource(resource)
                .status(Booking.Status.HELD)
                .build();

        pushNotificationService.sendBookingHoldCreated(booking);

        ArgumentCaptor<PushNotificationLog> captor = ArgumentCaptor.forClass(PushNotificationLog.class);
        verify(logRepository, times(1)).save(captor.capture());

        PushNotificationLog savedLog = captor.getValue();
        assertEquals(user.getId(), savedLog.getUserId());
        assertEquals(booking.getId(), savedLog.getBookingId());
        assertEquals("FCM", savedLog.getProvider());
        assertEquals("BOOKING_HOLD_CREATED", savedLog.getNotificationType());
        assertEquals("Booking Slot Reserved!", savedLog.getTitle());
        assertTrue(savedLog.getBody().contains("PlayStation 5 Console #1"));
        assertEquals("SENT", savedLog.getStatus());
    }

    @Test
    @DisplayName("Send Payment Confirmed in Marathi (mr) with Devanagari script")
    void testSendPaymentConfirmed_MarathiUser() {
        User user = User.builder()
                .id(502L)
                .name("अमोल कदम")
                .language("mr")
                .fcmToken("ExponentPushToken[XyZ789Marathi]")
                .build();

        Booking booking = Booking.builder()
                .id(9002L)
                .customer(user)
                .customerId(user.getId())
                .venue(venue)
                .resource(resource)
                .status(Booking.Status.CONFIRMED)
                .build();

        pushNotificationService.sendPaymentConfirmed(booking);

        ArgumentCaptor<PushNotificationLog> captor = ArgumentCaptor.forClass(PushNotificationLog.class);
        verify(logRepository, times(1)).save(captor.capture());

        PushNotificationLog savedLog = captor.getValue();
        assertEquals("EXPO", savedLog.getProvider());
        assertEquals("PAYMENT_CONFIRMED", savedLog.getNotificationType());
        assertEquals("बुकिंग निश्चित झाली! 🎉", savedLog.getTitle());
        assertTrue(savedLog.getBody().contains("कन्फर्म झाले आहे"));
        assertEquals("SENT", savedLog.getStatus());
    }

    @Test
    @DisplayName("Send Payment Confirmed in Hindi (hi) with Devanagari script")
    void testSendPaymentConfirmed_HindiUser() {
        User user = User.builder()
                .id(503L)
                .name("विकास शर्मा")
                .language("hi")
                .fcmToken("fcm-device-token-hindi-456")
                .build();

        Booking booking = Booking.builder()
                .id(9003L)
                .customer(user)
                .customerId(user.getId())
                .venue(venue)
                .resource(resource)
                .status(Booking.Status.CONFIRMED)
                .build();

        pushNotificationService.sendPaymentConfirmed(booking);

        ArgumentCaptor<PushNotificationLog> captor = ArgumentCaptor.forClass(PushNotificationLog.class);
        verify(logRepository, times(1)).save(captor.capture());

        PushNotificationLog savedLog = captor.getValue();
        assertEquals("FCM", savedLog.getProvider());
        assertEquals("PAYMENT_CONFIRMED", savedLog.getNotificationType());
        assertEquals("बुकिंग कन्फर्म हुई! 🎉", savedLog.getTitle());
        assertTrue(savedLog.getBody().contains("डिजिटल टिकट तैयार है"));
        assertEquals("SENT", savedLog.getStatus());
    }

    @Test
    @DisplayName("Send Session Extended notification")
    void testSendSessionExtended() {
        User user = User.builder()
                .id(504L)
                .name("Arjun Nair")
                .language("en")
                .fcmToken("fcm-token-extend-789")
                .build();

        Booking booking = Booking.builder()
                .id(9004L)
                .customer(user)
                .customerId(user.getId())
                .venue(venue)
                .resource(resource)
                .status(Booking.Status.IN_PROGRESS)
                .build();

        pushNotificationService.sendSessionExtended(booking, 30);

        ArgumentCaptor<PushNotificationLog> captor = ArgumentCaptor.forClass(PushNotificationLog.class);
        verify(logRepository, times(1)).save(captor.capture());

        PushNotificationLog savedLog = captor.getValue();
        assertEquals("SESSION_EXTENDED", savedLog.getNotificationType());
        assertEquals("Session Extended! ⏱️", savedLog.getTitle());
        assertTrue(savedLog.getBody().contains("extended by 30 minutes"));
    }

    @Test
    @DisplayName("Send No-Show Auto Release notice")
    void testSendNoShowNotice() {
        User user = User.builder()
                .id(505L)
                .name("Priya Kulkarni")
                .language("mr")
                .fcmToken("fcm-token-noshow-101")
                .build();

        Booking booking = Booking.builder()
                .id(9005L)
                .customer(user)
                .customerId(user.getId())
                .venue(venue)
                .resource(resource)
                .status(Booking.Status.NO_SHOW)
                .build();

        pushNotificationService.sendNoShowNotice(booking);

        ArgumentCaptor<PushNotificationLog> captor = ArgumentCaptor.forClass(PushNotificationLog.class);
        verify(logRepository, times(1)).save(captor.capture());

        PushNotificationLog savedLog = captor.getValue();
        assertEquals("NO_SHOW_NOTICE", savedLog.getNotificationType());
        assertEquals("बुकिंग आपोआप रद्द (No-Show) ⚠️", savedLog.getTitle());
    }

    @Test
    @DisplayName("User without FCM token is safely ignored without throwing error")
    void testUserWithoutTokenSafelyIgnored() {
        User user = User.builder()
                .id(506L)
                .name("Anonymous Walkin")
                .fcmToken(null)
                .build();

        Booking booking = Booking.builder()
                .id(9006L)
                .customer(user)
                .customerId(user.getId())
                .venue(venue)
                .resource(resource)
                .status(Booking.Status.CONFIRMED)
                .build();

        pushNotificationService.sendPaymentConfirmed(booking);

        verify(logRepository, never()).save(any());
    }

    @Test
    @DisplayName("1-Hour Pre-Slot Reminder Scheduler dispatches notification and updates reminderSent flag")
    void testBookingReminderScheduler() {
        User user = User.builder()
                .id(507L)
                .name("Sneha Joshi")
                .language("en")
                .fcmToken("fcm-reminder-token-999")
                .build();

        Booking upcomingBooking = Booking.builder()
                .id(9007L)
                .customer(user)
                .customerId(user.getId())
                .venue(venue)
                .resource(resource)
                .startUtc(Instant.now().plusSeconds(3600)) // 1 hour from now
                .status(Booking.Status.CONFIRMED)
                .reminderSent(false)
                .build();

        when(bookingRepository.findUpcomingConfirmedBookingsForReminder(any(), any()))
                .thenReturn(List.of(upcomingBooking));

        reminderScheduler.dispatchUpcomingBookingReminders();

        assertTrue(upcomingBooking.getReminderSent());
        verify(bookingRepository, times(1)).save(upcomingBooking);
        verify(logRepository, times(1)).save(any(PushNotificationLog.class));
    }
}
