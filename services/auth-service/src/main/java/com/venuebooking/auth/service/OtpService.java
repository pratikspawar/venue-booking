package com.venuebooking.auth.service;

import com.venuebooking.auth.dto.AuthResponseDto;
import com.venuebooking.auth.dto.UserProfileDto;
import com.venuebooking.auth.entity.OtpRequest;
import com.venuebooking.auth.entity.SmsDeliveryLog;
import com.venuebooking.auth.entity.User;
import com.venuebooking.auth.repository.OtpRequestRepository;
import com.venuebooking.auth.repository.SmsDeliveryLogRepository;
import com.venuebooking.auth.repository.UserRepository;
import com.venuebooking.common.BusinessException;
import com.venuebooking.tenant.entity.TenantMember;
import com.venuebooking.tenant.repository.TenantMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private static final int MAX_REQUESTS_IN_WINDOW = 3;
    private static final Duration RATE_LIMIT_WINDOW = Duration.ofMinutes(10);
    private static final Duration OTP_VALIDITY = Duration.ofMinutes(5);
    private static final int MAX_VERIFICATION_ATTEMPTS = 5;

    private final OtpRequestRepository otpRequestRepository;
    private final SmsDeliveryLogRepository smsDeliveryLogRepository;
    private final UserRepository userRepository;
    private final TenantMemberRepository tenantMemberRepository;
    private final SmsService smsService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.sms.provider:disabled}")
    private String smsProvider;

    @Value("${app.auth.otp-hash-pepper}")
    private String otpHashPepper;

    @Transactional
    public void requestOtp(String phone) {
        String normalizedPhone = normalizePhone(phone);
        Instant now = Instant.now();
        Instant windowStart = now.minus(RATE_LIMIT_WINDOW);

        long recentRequests = otpRequestRepository.countByPhoneAndCreatedAtAfter(normalizedPhone, windowStart);
        if (recentRequests >= MAX_REQUESTS_IN_WINDOW) {
            log.warn("Rate limit exceeded for phone: {} ({} attempts in {}m)", normalizedPhone, recentRequests, RATE_LIMIT_WINDOW.toMinutes());
            throw new BusinessException(
                    "RATE_LIMIT_EXCEEDED",
                    "Too many OTP requests. Please wait a few minutes before trying again.",
                    HttpStatus.TOO_MANY_REQUESTS
            );
        }

        String otp = String.format("%06d", secureRandom.nextInt(1000000));
        String otpHash = hashOtp(normalizedPhone, otp);

        OtpRequest request = OtpRequest.builder()
                .phone(normalizedPhone)
                .otpHash(otpHash)
                .expiresAt(now.plus(OTP_VALIDITY))
                .attempts(0)
                .consumed(false)
                .build();

        otpRequestRepository.save(request);
        String messageId = smsService.sendOtp(normalizedPhone, otp);

        smsDeliveryLogRepository.save(SmsDeliveryLog.builder()
                .phone(normalizedPhone)
                .provider(smsProvider)
                .messageId(messageId)
                .purpose("OTP")
                .status("DISPATCHED")
                .build());

        log.info("OTP sent to a phone ending in {} (messageId: {})",
                normalizedPhone.substring(Math.max(0, normalizedPhone.length() - 4)), messageId);
    }

    @Transactional
    public AuthResponseDto verifyOtp(String phone, String otp, Long requestedTenantId) {
        String normalizedPhone = normalizePhone(phone);
        Instant now = Instant.now();

        OtpRequest otpRequest = otpRequestRepository.findTopByPhoneAndConsumedFalseOrderByCreatedAtDesc(normalizedPhone)
                .orElseThrow(() -> new BusinessException("OTP_NOT_FOUND", "No active OTP request found. Please request a new OTP.", HttpStatus.BAD_REQUEST));

        if (otpRequest.getExpiresAt().isBefore(now)) {
            throw new BusinessException("OTP_EXPIRED", "The OTP has expired. Please request a new one.", HttpStatus.BAD_REQUEST);
        }

        if (otpRequest.getAttempts() >= MAX_VERIFICATION_ATTEMPTS) {
            throw new BusinessException("TOO_MANY_ATTEMPTS", "Maximum verification attempts exceeded. Please request a new OTP.", HttpStatus.BAD_REQUEST);
        }

        String expectedHash = hashOtp(normalizedPhone, otp);
        if (!MessageDigest.isEqual(expectedHash.getBytes(StandardCharsets.UTF_8), otpRequest.getOtpHash().getBytes(StandardCharsets.UTF_8))) {
            otpRequest.setAttempts(otpRequest.getAttempts() + 1);
            otpRequestRepository.save(otpRequest);
            int remaining = MAX_VERIFICATION_ATTEMPTS - otpRequest.getAttempts();
            throw new BusinessException("INVALID_OTP", "Invalid OTP. " + remaining + " attempts remaining.", HttpStatus.BAD_REQUEST);
        }

        // Mark OTP as consumed
        otpRequest.setConsumed(true);
        otpRequestRepository.save(otpRequest);

        // Find or create customer user
        User user = userRepository.findByPhone(normalizedPhone)
                .orElseGet(() -> userRepository.save(User.builder()
                        .phone(normalizedPhone)
                        .language("en")
                        .isSuperAdmin(false)
                        .build()));

        // Resolve Tenant Memberships
        List<TenantMember> memberships = tenantMemberRepository.findByUserIdAndActiveTrue(user.getId());
        Long activeTenantId = null;
        String activeRole = null;

        if (requestedTenantId != null) {
            Optional<TenantMember> matched = memberships.stream()
                    .filter(m -> m.getTenantId().equals(requestedTenantId))
                    .findFirst();
            if (matched.isPresent()) {
                activeTenantId = matched.get().getTenantId();
                activeRole = matched.get().getRole().name();
            } else if (!Boolean.TRUE.equals(user.getIsSuperAdmin())) {
                throw new BusinessException("FORBIDDEN", "You do not belong to the requested tenant.", HttpStatus.FORBIDDEN);
            }
        } else if (!memberships.isEmpty()) {
            TenantMember first = memberships.get(0);
            activeTenantId = first.getTenantId();
            activeRole = first.getRole().name();
        }

        String accessToken = jwtService.generateAccessToken(user, activeTenantId, activeRole);
        String familyId = java.util.UUID.randomUUID().toString();
        String refreshToken = jwtService.generateRefreshToken(user, familyId);
        refreshTokenService.registerRefreshToken(user.getId(), refreshToken, familyId);

        List<UserProfileDto.MembershipDto> membershipDtos = memberships.stream()
                .map(m -> UserProfileDto.MembershipDto.builder()
                        .tenantId(m.getTenantId())
                        .tenantName(m.getTenant() != null ? m.getTenant().getName() : "Tenant #" + m.getTenantId())
                        .role(m.getRole().name())
                        .build())
                .toList();

        UserProfileDto profileDto = UserProfileDto.builder()
                .id(user.getId())
                .phone(user.getPhone())
                .name(user.getName())
                .email(user.getEmail())
                .language(user.getLanguage())
                .isSuperAdmin(user.getIsSuperAdmin())
                .memberships(membershipDtos)
                .build();

        return AuthResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresInMs(jwtService.getAccessTokenExpirationMs())
                .user(profileDto)
                .activeTenantId(activeTenantId)
                .activeRole(activeRole)
                .build();
    }

    private String normalizePhone(String phone) {
        String digits = phone.replaceAll("[^0-9+]", "");
        if (!digits.startsWith("+") && digits.length() == 10) {
            return "+91" + digits; // Default Indian dialing code
        }
        return digits;
    }

    private String hashOtp(String phone, String otp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest((phone + ":" + otp + ":" + otpHashPepper).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
