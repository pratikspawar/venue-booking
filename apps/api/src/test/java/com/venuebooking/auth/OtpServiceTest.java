package com.venuebooking.auth;

import com.venuebooking.auth.dto.AuthResponseDto;
import com.venuebooking.auth.entity.OtpRequest;
import com.venuebooking.auth.entity.User;
import com.venuebooking.auth.repository.OtpRequestRepository;
import com.venuebooking.auth.repository.UserRepository;
import com.venuebooking.auth.service.JwtService;
import com.venuebooking.auth.service.OtpService;
import com.venuebooking.auth.service.SmsService;
import com.venuebooking.common.BusinessException;
import com.venuebooking.tenant.entity.TenantMember;
import com.venuebooking.tenant.repository.TenantMemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    @Mock
    private OtpRequestRepository otpRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TenantMemberRepository tenantMemberRepository;

    @Mock
    private SmsService smsService;

    private JwtService jwtService;
    private OtpService otpService;

    private final String secret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(secret, 900000, 2592000000L);
        otpService = new OtpService(
                otpRequestRepository,
                userRepository,
                tenantMemberRepository,
                smsService,
                jwtService
        );
    }

    @Test
    @DisplayName("Should successfully request OTP when within rate limits")
    void testRequestOtp_Success() {
        when(otpRequestRepository.countByPhoneAndCreatedAtAfter(any(), any())).thenReturn(0L);

        otpService.requestOtp("9820112345");

        verify(smsService, times(1)).sendOtp(eq("+919820112345"), any());
        verify(otpRequestRepository, times(1)).save(any(OtpRequest.class));
    }

    @Test
    @DisplayName("Should throw BusinessException when OTP rate limit exceeded")
    void testRequestOtp_RateLimitExceeded() {
        when(otpRequestRepository.countByPhoneAndCreatedAtAfter(any(), any())).thenReturn(3L);

        BusinessException ex = assertThrows(BusinessException.class, () -> otpService.requestOtp("9820112345"));
        assertEquals("RATE_LIMIT_EXCEEDED", ex.getCode());
        verify(smsService, never()).sendOtp(any(), any());
    }

    @Test
    @DisplayName("Should verify valid OTP and return JWT access token")
    void testVerifyOtp_Success() {
        String phone = "+919999999999"; // test phone with known OTP 123456
        String testOtp = "123456";

        // Generate expected hash for +919999999999 and 123456
        OtpRequest activeRequest = OtpRequest.builder()
                .id(1L)
                .phone(phone)
                // We let OtpService hash it or we create the request via requestOtp
                .expiresAt(Instant.now().plusSeconds(300))
                .attempts(0)
                .consumed(false)
                .build();

        // Calculate expected hash for the test
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest((phone + ":" + testOtp + ":venue_salt").getBytes(java.nio.charset.StandardCharsets.UTF_8));
            activeRequest.setOtpHash(java.util.HexFormat.of().formatHex(hash));
        } catch (Exception e) {
            fail(e);
        }

        when(otpRequestRepository.findTopByPhoneAndConsumedFalseOrderByCreatedAtDesc(phone))
                .thenReturn(Optional.of(activeRequest));

        User mockUser = User.builder()
                .id(10L)
                .phone(phone)
                .isSuperAdmin(false)
                .language("en")
                .build();
        when(userRepository.findByPhone(phone)).thenReturn(Optional.of(mockUser));
        when(tenantMemberRepository.findByUserIdAndActiveTrue(10L)).thenReturn(Collections.emptyList());

        AuthResponseDto response = otpService.verifyOtp(phone, testOtp, null);

        assertNotNull(response);
        assertNotNull(response.getAccessToken());
        assertNotNull(response.getRefreshToken());
        assertEquals(phone, response.getUser().getPhone());
        assertTrue(activeRequest.getConsumed());
    }
}
