package com.venuebooking.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "mock", matchIfMissing = true)
public class MockSmsService implements SmsService {

    @Override
    public void sendOtp(String phone, String otp) {
        log.info("=================================================");
        log.info(">>> [MOCK SMS DISPATCH] To: {} | OTP: {}", phone, otp);
        log.info("=================================================");
    }
}
