package com.venuebooking.notification.adapter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
public class FcmPushNotificationAdapter implements PushNotificationAdapter {

    private static final String FCM_LEGACY_URL = "https://fcm.googleapis.com/fcm/send";

    @Value("${app.notification.fcm.enabled:false}")
    private boolean enabled;

    @Value("${app.notification.fcm.server-key:}")
    private String serverKey;

    private final RestClient restClient;

    public FcmPushNotificationAdapter(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.build();
    }

    @Override
    public boolean supports(String token) {
        if (token == null || token.isBlank()) return false;
        String trimmed = token.trim();
        // Fallback for all standard device tokens that are not Expo tokens
        return !trimmed.startsWith("ExponentPushToken[") && !trimmed.startsWith("ExpoPushToken[");
    }

    @Override
    public PushResult send(String token, String title, String body, Map<String, String> data) {
        if (!enabled || serverKey == null || serverKey.isBlank()) {
            log.info("[FCM MOCK] Push simulated to {}: title='{}', body='{}'", token, title, body);
            return PushResult.ok("FCM", "mock-fcm-" + UUID.randomUUID());
        }

        try {
            Map<String, Object> notificationPayload = new HashMap<>();
            notificationPayload.put("title", title);
            notificationPayload.put("body", body);
            notificationPayload.put("sound", "default");

            Map<String, Object> payload = new HashMap<>();
            payload.put("to", token);
            payload.put("notification", notificationPayload);
            if (data != null && !data.isEmpty()) {
                payload.put("data", data);
            }

            String response = restClient.post()
                    .uri(FCM_LEGACY_URL)
                    .header(HttpHeaders.AUTHORIZATION, "key=" + serverKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            log.info("FCM push sent successfully to {}. Response: {}", token, response);
            return PushResult.ok("FCM", "fcm-" + UUID.randomUUID());
        } catch (Exception e) {
            log.error("Failed to send FCM push notification to {}: {}", token, e.getMessage());
            return PushResult.failed("FCM", e.getMessage());
        }
    }
}
