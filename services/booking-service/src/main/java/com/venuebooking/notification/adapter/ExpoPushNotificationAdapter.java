package com.venuebooking.notification.adapter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
public class ExpoPushNotificationAdapter implements PushNotificationAdapter {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    @Value("${app.notification.expo.enabled:false}")
    private boolean enabled;

    private final RestClient restClient;

    public ExpoPushNotificationAdapter(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.build();
    }

    @Override
    public boolean supports(String token) {
        if (token == null) return false;
        String trimmed = token.trim();
        return trimmed.startsWith("ExponentPushToken[") || trimmed.startsWith("ExpoPushToken[");
    }

    @Override
    public PushResult send(String token, String title, String body, Map<String, String> data) {
        if (!enabled) {
            log.info("[EXPO MOCK] Push simulated to {}: title='{}', body='{}'", token, title, body);
            return PushResult.ok("EXPO", "mock-expo-" + UUID.randomUUID());
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("to", token);
            payload.put("title", title);
            payload.put("body", body);
            payload.put("sound", "default");
            payload.put("priority", "high");
            if (data != null && !data.isEmpty()) {
                payload.put("data", data);
            }

            String response = restClient.post()
                    .uri(EXPO_PUSH_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            log.info("Expo push sent successfully to {}. Response: {}", token, response);
            return PushResult.ok("EXPO", "expo-" + UUID.randomUUID());
        } catch (Exception e) {
            log.error("Failed to send Expo push notification to {}: {}", token, e.getMessage());
            return PushResult.failed("EXPO", e.getMessage());
        }
    }
}
