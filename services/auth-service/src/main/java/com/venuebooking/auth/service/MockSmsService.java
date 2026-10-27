package com.venuebooking.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "mock")
public class MockSmsService implements SmsService {

    @Override
    public String sendOtp(String phone, String otp) {
        String mockId = "mock-" + java.util.UUID.randomUUID().toString().substring(0, 8);
        log.info("=================================================");
        log.info(">>> [MOCK SMS DISPATCH] To: {} | OTP: {} | MsgId: {}", phone, otp, mockId);
        log.info("=================================================");
        return mockId;
    }
}
