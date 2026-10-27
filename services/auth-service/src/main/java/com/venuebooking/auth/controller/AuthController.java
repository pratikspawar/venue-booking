package com.venuebooking.auth.controller;

import com.venuebooking.auth.dto.AuthResponseDto;
import com.venuebooking.auth.dto.LogoutRequestDto;
import com.venuebooking.auth.dto.OtpRequestDto;
import com.venuebooking.auth.dto.OtpVerifyDto;
import com.venuebooking.auth.dto.TokenRefreshRequestDto;
import com.venuebooking.auth.service.OtpService;
import com.venuebooking.auth.service.RefreshTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/auth", "/api/v1/auth"})
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Mobile OTP login, token issuance, refresh-token rotation, and revocation")
public class AuthController {

    private final OtpService otpService;
    private final RefreshTokenService refreshTokenService;

    @PostMapping("/otp/request")
    @Operation(summary = "Request a 6-digit OTP via SMS", description = "Generates and sends an OTP to the given phone number with rate-limiting")
    public ResponseEntity<Map<String, Object>> requestOtp(@Valid @RequestBody OtpRequestDto requestDto) {
        otpService.requestOtp(requestDto.getPhone());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "OTP sent successfully",
                "expiresInSeconds", 300
        ));
    }

    @PostMapping("/otp/verify")
    @Operation(summary = "Verify OTP and obtain JWT tokens", description = "Verifies the submitted OTP, creates or loads the user account, and returns access and refresh JWT tokens")
    public ResponseEntity<AuthResponseDto> verifyOtp(@Valid @RequestBody OtpVerifyDto verifyDto) {
        AuthResponseDto response = otpService.verifyOtp(
                verifyDto.getPhone(),
                verifyDto.getOtp(),
                verifyDto.getTenantId()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/token/refresh")
    @Operation(summary = "Rotate and refresh JWT access token", description = "Validates the refresh token, revokes it, and issues a fresh access & refresh token pair with replay attack detection")
    public ResponseEntity<AuthResponseDto> refreshToken(@Valid @RequestBody TokenRefreshRequestDto requestDto) {
        AuthResponseDto response = refreshTokenService.rotateRefreshToken(
                requestDto.getRefreshToken(),
                requestDto.getRequestedTenantId()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke session and tokens", description = "Invalidates the refresh token family and blacklists the current access token")
    public ResponseEntity<Map<String, Object>> logout(
            @RequestBody(required = false) LogoutRequestDto logoutDto,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader
    ) {
        String refreshToken = logoutDto != null ? logoutDto.getRefreshToken() : null;
        refreshTokenService.logout(refreshToken, authHeader);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Logged out and tokens revoked successfully"
        ));
    }

    @GetMapping("/tokens/revoked/{tokenHash}")
    @Operation(summary = "Check if an access token is blacklisted", description = "Internal/gateway query to verify token revocation status")
    public ResponseEntity<Map<String, Boolean>> isTokenRevoked(@PathVariable String tokenHash) {
        boolean revoked = refreshTokenService.isTokenRevoked(tokenHash);
        return ResponseEntity.ok(Map.of("revoked", revoked));
    }
}
