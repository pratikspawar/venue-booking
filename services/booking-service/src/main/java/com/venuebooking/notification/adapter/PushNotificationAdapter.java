package com.venuebooking.notification.adapter;

import java.util.Map;

public interface PushNotificationAdapter {

    boolean supports(String token);

    PushResult send(String token, String title, String body, Map<String, String> data);

    record PushResult(
            boolean success,
            String provider,
            String messageId,
            String error
    ) {
        public static PushResult ok(String provider, String messageId) {
            return new PushResult(true, provider, messageId, null);
        }

        public static PushResult failed(String provider, String error) {
            return new PushResult(false, provider, null, error);
        }
    }
}
