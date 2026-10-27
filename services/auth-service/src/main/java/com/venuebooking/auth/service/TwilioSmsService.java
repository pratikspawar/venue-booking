package com.venuebooking.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "twilio")
public class TwilioSmsService implements SmsService {
    private final RestClient.Builder restClientBuilder;

    @Value("${app.sms.twilio.account-sid}") private String accountSid;
    @Value("${app.sms.twilio.auth-token}") private String authToken;
    @Value("${app.sms.twilio.from:}") private String from;
    @Value("${app.sms.twilio.messaging-service-sid:}") private String messagingServiceSid;
    @Value("${app.sms.twilio.status-callback:}") private String statusCallback;

    @Override
    public String sendOtp(String phone, String otp) {
        if (from.isBlank() && messagingServiceSid.isBlank()) {
            throw new IllegalStateException("Configure a Twilio From number or Messaging Service SID");
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("To", phone);
        form.add("Body", "Your Venue Booking verification code is " + otp + ". It expires in 5 minutes.");
        if (!messagingServiceSid.isBlank()) form.add("MessagingServiceSid", messagingServiceSid);
        else form.add("From", from);

        if (statusCallback != null && !statusCallback.isBlank()) {
            form.add("StatusCallback", statusCallback);
        }

        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> response = restClientBuilder.clone()
                .baseUrl("https://api.twilio.com/2010-04-01")
                .defaultHeaders(headers -> headers.setBasicAuth(accountSid, authToken))
                .build().post().uri("/Accounts/{sid}/Messages.json", accountSid)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form).retrieve().body(java.util.Map.class);

        return (response != null && response.get("sid") != null)
                ? response.get("sid").toString()
                : "tw-" + java.util.UUID.randomUUID().toString().substring(0, 8);
    }
}
