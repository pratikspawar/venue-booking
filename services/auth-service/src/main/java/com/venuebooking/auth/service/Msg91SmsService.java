package com.venuebooking.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "msg91")
public class Msg91SmsService implements SmsService {

    private final RestClient.Builder restClientBuilder;

    @Value("${app.sms.msg91.auth-key}")
    private String authKey;

    @Value("${app.sms.msg91.template-id}")
    private String templateId;

    @Value("${app.sms.msg91.otp-expiry-minutes:5}")
    private int otpExpiryMinutes;

    @Override
    public String sendOtp(String phone, String otp) {
        if (authKey.isBlank() || templateId.isBlank()) {
            throw new IllegalStateException("MSG91 authKey or templateId is not configured");
        }

        // MSG91 mobile parameter should contain country code without '+'
        String cleanMobile = phone.replace("+", "").trim();
        if (cleanMobile.length() == 10) {
            cleanMobile = "91" + cleanMobile; // default to India code if 10-digit
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("template_id", templateId);
        requestBody.put("mobile", cleanMobile);
        requestBody.put("otp", otp);
        requestBody.put("otp_expiry", otpExpiryMinutes);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClientBuilder.clone()
                    .baseUrl("https://control.msg91.com/api/v5")
                    .defaultHeader("authkey", authKey)
                    .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                    .build()
                    .post()
                    .uri("/otp")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            log.info("MSG91 OTP response for {}: {}", cleanMobile, response);

            if (response != null && response.get("request_id") != null) {
                return response.get("request_id").toString();
            }
            return "msg91-" + UUID.randomUUID().toString().substring(0, 8);
        } catch (Exception e) {
            log.error("Failed to send SMS via MSG91 to {}: {}", cleanMobile, e.getMessage());
            throw new IllegalStateException("MSG91 delivery failure: " + e.getMessage(), e);
        }
    }
}
