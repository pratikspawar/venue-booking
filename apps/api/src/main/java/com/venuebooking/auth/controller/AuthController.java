package com.venuebooking.auth.controller;

import com.venuebooking.auth.dto.AuthResponseDto;
import com.venuebooking.auth.dto.OtpRequestDto;
import com.venuebooking.auth.dto.OtpVerifyDto;
import com.venuebooking.auth.service.OtpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth/otp")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Mobile OTP login and JWT token issuance")
public class AuthController {

    private final OtpService otpService;

    @PostMapping("/request")
    @Operation(summary = "Request a 6-digit OTP via SMS", description = "Generates and sends an OTP to the given phone number with rate-limiting")
    public ResponseEntity<Map<String, Object>> requestOtp(@Valid @RequestBody OtpRequestDto requestDto) {
        otpService.requestOtp(requestDto.getPhone());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "OTP sent successfully",
                "expiresInSeconds", 300
        ));
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify OTP and obtain JWT tokens", description = "Verifies the submitted OTP, creates or loads the user account, and returns access and refresh JWT tokens")
    public ResponseEntity<AuthResponseDto> verifyOtp(@Valid @RequestBody OtpVerifyDto verifyDto) {
        AuthResponseDto response = otpService.verifyOtp(
                verifyDto.getPhone(),
                verifyDto.getOtp(),
                verifyDto.getTenantId()
        );
        return ResponseEntity.ok(response);
    }
}
