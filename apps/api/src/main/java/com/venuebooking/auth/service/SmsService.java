package com.venuebooking.auth.service;

public interface SmsService {
    void sendOtp(String phone, String otp);
}
