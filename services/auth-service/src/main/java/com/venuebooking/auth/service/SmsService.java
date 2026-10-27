package com.venuebooking.auth.service;

public interface SmsService {
    String sendOtp(String phone, String otp);
}
