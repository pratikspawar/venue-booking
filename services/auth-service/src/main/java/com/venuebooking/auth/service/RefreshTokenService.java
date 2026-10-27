package com.venuebooking.auth.service;

import com.venuebooking.auth.dto.AuthResponseDto;
import com.venuebooking.auth.dto.UserProfileDto;
import com.venuebooking.auth.entity.RefreshToken;
import com.venuebooking.auth.entity.RevokedToken;
import com.venuebooking.auth.entity.User;
import com.venuebooking.auth.repository.RefreshTokenRepository;
import com.venuebooking.auth.repository.RevokedTokenRepository;
import com.venuebooking.auth.repository.UserRepository;
import com.venuebooking.common.BusinessException;
import com.venuebooking.tenant.entity.TenantMember;
import com.venuebooking.tenant.repository.TenantMemberRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final RevokedTokenRepository revokedTokenRepository;
    private final UserRepository userRepository;
    private final TenantMemberRepository tenantMemberRepository;
    private final JwtService jwtService;

    @Transactional
    public void registerRefreshToken(Long userId, String rawToken, String familyId) {
        String tokenHash = JwtService.hashToken(rawToken);
        Instant expiresAt = Instant.now().plusMillis(jwtService.getRefreshTokenExpirationMs());

        RefreshToken refreshToken = RefreshToken.builder()
                .userId(userId)
                .tokenHash(tokenHash)
                .familyId(familyId)
                .isRevoked(false)
                .expiresAt(expiresAt)
                .build();

        refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public AuthResponseDto rotateRefreshToken(String rawRefreshToken, Long requestedTenantId) {
        // 1. Parse token and verify validity & type claim
        Optional<Claims> claimsOpt = jwtService.parseToken(rawRefreshToken);
        if (claimsOpt.isEmpty()) {
            throw new BusinessException("INVALID_TOKEN", "Invalid refresh token signature or expired.", HttpStatus.UNAUTHORIZED);
        }
        Claims claims = claimsOpt.get();
        String type = claims.get("type", String.class);
        if (!"REFRESH".equals(type)) {
            throw new BusinessException("INVALID_TOKEN_TYPE", "Token is not a refresh token.", HttpStatus.UNAUTHORIZED);
        }

        // 2. Lookup in database by hash
        String tokenHash = JwtService.hashToken(rawRefreshToken);
        RefreshToken record = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BusinessException("TOKEN_NOT_FOUND", "Refresh token not recognized.", HttpStatus.UNAUTHORIZED));

        // 3. Detect token reuse: if already revoked, compromise detected!
        if (Boolean.TRUE.equals(record.getIsRevoked())) {
            log.warn("Token reuse detected for user {} in family {}. Revoking all tokens in family.",
                    record.getUserId(), record.getFamilyId());
            refreshTokenRepository.revokeAllInFamily(record.getFamilyId());
            throw new BusinessException(
                    "REFRESH_TOKEN_REUSED",
                    "Security alert: Token reuse detected. All sessions in this chain have been revoked. Please log in again.",
                    HttpStatus.UNAUTHORIZED
            );
        }

        // 4. Check expiration
        if (record.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException("TOKEN_EXPIRED", "Refresh token has expired. Please log in again.", HttpStatus.UNAUTHORIZED);
        }

        // 5. Invalidate current token (rotate out)
        record.setIsRevoked(true);
        refreshTokenRepository.save(record);

        // 6. Fetch user
        User user = userRepository.findById(record.getUserId())
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "User not found for token.", HttpStatus.UNAUTHORIZED));

        // 7. Resolve Tenant Memberships
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

        // 8. Issue new access token and rotated refresh token within the same family
        String newAccessToken = jwtService.generateAccessToken(user, activeTenantId, activeRole);
        String newRefreshToken = jwtService.generateRefreshToken(user, record.getFamilyId());

        // 9. Persist the new refresh token
        registerRefreshToken(user.getId(), newRefreshToken, record.getFamilyId());

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
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .expiresInMs(jwtService.getAccessTokenExpirationMs())
                .user(profileDto)
                .activeTenantId(activeTenantId)
                .activeRole(activeRole)
                .build();
    }

    @Transactional
    public void logout(String rawRefreshToken, String authHeader) {
        // 1. If refresh token provided, revoke entire family
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            String tokenHash = JwtService.hashToken(rawRefreshToken);
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(record -> {
                refreshTokenRepository.revokeAllInFamily(record.getFamilyId());
                log.info("Revoked refresh token family {} on logout for user {}", record.getFamilyId(), record.getUserId());
            });
        }

        // 2. If access token provided in header, blacklist it
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String accessToken = authHeader.substring(7);
            Optional<Claims> claimsOpt = jwtService.parseToken(accessToken);
            if (claimsOpt.isPresent()) {
                Claims claims = claimsOpt.get();
                Instant expiry = claims.getExpiration().toInstant();
                String tokenHash = JwtService.hashToken(accessToken);
                if (!revokedTokenRepository.existsByTokenHash(tokenHash)) {
                    revokedTokenRepository.save(RevokedToken.builder()
                            .tokenHash(tokenHash)
                            .expiresAt(expiry)
                            .build());
                    log.info("Access token blacklisted on logout (expiry: {})", expiry);
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public boolean isTokenRevoked(String tokenHash) {
        return revokedTokenRepository.existsByTokenHash(tokenHash);
    }
}
