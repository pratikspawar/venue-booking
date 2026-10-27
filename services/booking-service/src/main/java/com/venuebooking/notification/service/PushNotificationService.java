package com.venuebooking.notification.service;

import com.venuebooking.auth.entity.User;
import com.venuebooking.auth.repository.UserRepository;
import com.venuebooking.booking.entity.Booking;
import com.venuebooking.notification.adapter.PushNotificationAdapter;
import com.venuebooking.notification.entity.PushNotificationLog;
import com.venuebooking.notification.repository.PushNotificationLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PushNotificationService {

    private final List<PushNotificationAdapter> adapters;
    private final PushNotificationLogRepository logRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("hh:mm a");

    public void sendBookingHoldCreated(Booking booking) {
        User user = resolveUser(booking);
        if (user == null || user.getFcmToken() == null || user.getFcmToken().isBlank()) return;

        String lang = normalizeLang(user.getLanguage());
        String venueName = booking.getVenue() != null ? booking.getVenue().getName() : "Venue";
        String resourceName = booking.getResource() != null ? booking.getResource().getName() : "Console/Table";

        String title;
        String body;
        switch (lang) {
            case "mr" -> {
                title = "स्लॉट होल्डवर ठेवला आहे!";
                body = String.format("%s (%s) साठी स्लॉट होल्ड केला आहे. आरक्षण पक्के करण्यासाठी त्वरित पेमेंट करा.",
                        resourceName, venueName);
            }
            case "hi" -> {
                title = "स्लॉट होल्ड पर है!";
                body = String.format("%s (%s) के लिए आपका स्लॉट होल्ड किया गया है। आरक्षण की पुष्टि के लिए भुगतान पूरा करें।",
                        resourceName, venueName);
            }
            default -> {
                title = "Booking Slot Reserved!";
                body = String.format("Slot held for %s at %s. Please complete payment before hold expiry to confirm.",
                        resourceName, venueName);
            }
        }

        Map<String, String> data = Map.of(
                "type", "BOOKING_HOLD",
                "bookingId", String.valueOf(booking.getId()),
                "status", "HELD"
        );

        dispatchPush(user.getId(), booking.getId(), user.getFcmToken(), "BOOKING_HOLD_CREATED", title, body, data);
    }

    public void sendPaymentConfirmed(Booking booking) {
        User user = resolveUser(booking);
        if (user == null || user.getFcmToken() == null || user.getFcmToken().isBlank()) return;

        String lang = normalizeLang(user.getLanguage());
        String venueName = booking.getVenue() != null ? booking.getVenue().getName() : "Venue";
        String resourceName = booking.getResource() != null ? booking.getResource().getName() : "Console/Table";

        String title;
        String body;
        switch (lang) {
            case "mr" -> {
                title = "बुकिंग निश्चित झाली! 🎉";
                body = String.format("तुमचे %s चे %s येथील बुकिंग कन्फर्म झाले आहे. तुमचा प्रवेश तिकीट क्यूआर तयार आहे!",
                        resourceName, venueName);
            }
            case "hi" -> {
                title = "बुकिंग कन्फर्म हुई! 🎉";
                body = String.format("%s पर %s के लिए आपकी बुकिंग कन्फर्म हो गई है। डिजिटल टिकट तैयार है!",
                        venueName, resourceName);
            }
            default -> {
                title = "Booking Confirmed! 🎉";
                body = String.format("Your reservation for %s at %s is confirmed. Your digital ticket QR is ready!",
                        resourceName, venueName);
            }
        }

        Map<String, String> data = Map.of(
                "type", "BOOKING_CONFIRMED",
                "bookingId", String.valueOf(booking.getId()),
                "status", "CONFIRMED"
        );

        dispatchPush(user.getId(), booking.getId(), user.getFcmToken(), "PAYMENT_CONFIRMED", title, body, data);
    }

    public void sendPreSlotReminder(Booking booking) {
        User user = resolveUser(booking);
        if (user == null || user.getFcmToken() == null || user.getFcmToken().isBlank()) return;

        String lang = normalizeLang(user.getLanguage());
        String venueName = booking.getVenue() != null ? booking.getVenue().getName() : "Venue";
        String resourceName = booking.getResource() != null ? booking.getResource().getName() : "Console/Table";

        ZoneId zone = ZoneId.of(booking.getVenue() != null && booking.getVenue().getTimezone() != null
                ? booking.getVenue().getTimezone() : "Asia/Kolkata");
        String startTime = booking.getStartUtc() != null
                ? booking.getStartUtc().atZone(zone).format(TIME_FMT) : "soon";

        String title;
        String body;
        switch (lang) {
            case "mr" -> {
                title = "खेळाची आठवण: १ तासात सुरू होत आहे ⏰";
                body = String.format("%s येथील %s चे सत्र %s वाजता सुरू होईल. कृपया वेळेवर पोहोचा!",
                        venueName, resourceName, startTime);
            }
            case "hi" -> {
                title = "सत्र अनुस्मारक: 1 घंटे में शुरू होगा ⏰";
                body = String.format("%s पर %s का सत्र %s बजे शुरू होगा। कृपया समय पर पहुंचें!",
                        venueName, resourceName, startTime);
            }
            default -> {
                title = "Session Reminder: Starting in 1 Hour ⏰";
                body = String.format("Your session for %s at %s begins at %s. Please arrive on time!",
                        resourceName, venueName, startTime);
            }
        }

        Map<String, String> data = Map.of(
                "type", "PRE_SLOT_REMINDER",
                "bookingId", String.valueOf(booking.getId()),
                "startUtc", String.valueOf(booking.getStartUtc())
        );

        dispatchPush(user.getId(), booking.getId(), user.getFcmToken(), "PRE_SLOT_REMINDER", title, body, data);
    }

    public void sendSessionExtended(Booking booking, int extraMinutes) {
        User user = resolveUser(booking);
        if (user == null || user.getFcmToken() == null || user.getFcmToken().isBlank()) return;

        String lang = normalizeLang(user.getLanguage());
        String resourceName = booking.getResource() != null ? booking.getResource().getName() : "Console/Table";

        String title;
        String body;
        switch (lang) {
            case "mr" -> {
                title = "खेळाची वेळ वाढवली गेली! ⏱️";
                body = String.format("%s वरील तुमचे खेळ सत्र %d मिनिटांनी वाढवले आहे. खेळाचा आनंद घ्या!",
                        resourceName, extraMinutes);
            }
            case "hi" -> {
                title = "खेल का समय बढ़ाया गया! ⏱️";
                body = String.format("%s पर आपका खेल सत्र %d मिनट बढ़ा दिया गया है। गेमिंग का आनंद लें!",
                        resourceName, extraMinutes);
            }
            default -> {
                title = "Session Extended! ⏱️";
                body = String.format("Your session on %s has been extended by %d minutes. Keep gaming!",
                        resourceName, extraMinutes);
            }
        }

        Map<String, String> data = Map.of(
                "type", "SESSION_EXTENDED",
                "bookingId", String.valueOf(booking.getId()),
                "extraMinutes", String.valueOf(extraMinutes)
        );

        dispatchPush(user.getId(), booking.getId(), user.getFcmToken(), "SESSION_EXTENDED", title, body, data);
    }

    public void sendNoShowNotice(Booking booking) {
        User user = resolveUser(booking);
        if (user == null || user.getFcmToken() == null || user.getFcmToken().isBlank()) return;

        String lang = normalizeLang(user.getLanguage());
        String resourceName = booking.getResource() != null ? booking.getResource().getName() : "Console/Table";

        String title;
        String body;
        switch (lang) {
            case "mr" -> {
                title = "बुकिंग आपोआप रद्द (No-Show) ⚠️";
                body = String.format("%s साठी विहित ग्रेस वेळेत चेक-इन न झाल्याने स्लॉट मोकळा करण्यात आला आहे.", resourceName);
            }
            case "hi" -> {
                title = "बुकिंग स्वतः रद्द (No-Show) ⚠️";
                body = String.format("%s के लिए निर्धारित समय में चेक-इन नहीं होने पर स्लॉट रिलीज किया गया।", resourceName);
            }
            default -> {
                title = "Booking Auto-Released (No-Show) ⚠️";
                body = String.format("You did not check in within the grace period for %s. The slot has been released.", resourceName);
            }
        }

        Map<String, String> data = Map.of(
                "type", "NO_SHOW_NOTICE",
                "bookingId", String.valueOf(booking.getId()),
                "status", "NO_SHOW"
        );

        dispatchPush(user.getId(), booking.getId(), user.getFcmToken(), "NO_SHOW_NOTICE", title, body, data);
    }

    private void dispatchPush(Long userId, Long bookingId, String token, String notificationType,
                              String title, String body, Map<String, String> data) {
        PushNotificationAdapter adapter = adapters.stream()
                .filter(a -> a.supports(token))
                .findFirst()
                .orElse(null);

        if (adapter == null) {
            log.warn("No suitable push notification adapter found for token: {}", token);
            return;
        }

        PushNotificationAdapter.PushResult result = adapter.send(token, title, body, data);

        PushNotificationLog logEntry = PushNotificationLog.builder()
                .userId(userId)
                .bookingId(bookingId)
                .token(token)
                .provider(result.provider())
                .notificationType(notificationType)
                .title(title)
                .body(body)
                .status(result.success() ? "SENT" : "FAILED")
                .errorMessage(result.error())
                .build();

        try {
            logRepository.save(logEntry);
        } catch (Exception e) {
            log.error("Failed to save push notification log: {}", e.getMessage());
        }
    }

    private User resolveUser(Booking booking) {
        if (booking.getCustomer() != null) return booking.getCustomer();
        if (booking.getCustomerId() != null) {
            Optional<User> u = userRepository.findById(booking.getCustomerId());
            if (u.isPresent()) return u.get();
        }
        return null;
    }

    private String normalizeLang(String lang) {
        if (lang == null) return "en";
        String l = lang.trim().toLowerCase();
        if ("mr".equals(l) || "hi".equals(l)) return l;
        return "en";
    }
}
