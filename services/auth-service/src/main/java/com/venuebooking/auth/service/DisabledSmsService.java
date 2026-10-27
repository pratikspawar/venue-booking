package com.venuebooking.auth.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "disabled", matchIfMissing = true)
public class DisabledSmsService implements SmsService {
    @Override
    public String sendOtp(String phone, String otp) {
        throw new IllegalStateException("SMS delivery is not configured; set SMS_PROVIDER to mock or configure a provider");
    }
}
