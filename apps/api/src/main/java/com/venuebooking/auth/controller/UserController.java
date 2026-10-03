package com.venuebooking.auth.controller;

import com.venuebooking.auth.dto.UpdateUserDto;
import com.venuebooking.auth.dto.UserProfileDto;
import com.venuebooking.auth.entity.User;
import com.venuebooking.auth.repository.UserRepository;
import com.venuebooking.common.BusinessException;
import com.venuebooking.tenant.entity.TenantMember;
import com.venuebooking.tenant.repository.TenantMemberRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/me")
@RequiredArgsConstructor
@Tag(name = "Customer Profile", description = "Current authenticated customer or staff profile")
public class UserController {

    private final UserRepository userRepository;
    private final TenantMemberRepository tenantMemberRepository;

    @GetMapping
    @Operation(summary = "Get current authenticated profile", description = "Returns user details and all active tenant memberships")
    public ResponseEntity<UserProfileDto> getMe(Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("User not found"));

        List<TenantMember> memberships = tenantMemberRepository.findByUserIdAndActiveTrue(user.getId());
        List<UserProfileDto.MembershipDto> membershipDtos = memberships.stream()
                .map(m -> UserProfileDto.MembershipDto.builder()
                        .tenantId(m.getTenantId())
                        .tenantName(m.getTenant() != null ? m.getTenant().getName() : "Tenant #" + m.getTenantId())
                        .role(m.getRole().name())
                        .build())
                .toList();

        return ResponseEntity.ok(UserProfileDto.builder()
                .id(user.getId())
                .phone(user.getPhone())
                .name(user.getName())
                .email(user.getEmail())
                .language(user.getLanguage())
                .isSuperAdmin(user.getIsSuperAdmin())
                .memberships(membershipDtos)
                .build());
    }

    @PutMapping
    @Operation(summary = "Update profile", description = "Updates customer name, preferred language (en, mr, hi), and FCM push notification token")
    public ResponseEntity<UserProfileDto> updateMe(
            Authentication authentication,
            @RequestBody UpdateUserDto updateDto
    ) {
        Long userId = Long.parseLong(authentication.getName());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("User not found"));

        if (updateDto.getName() != null) user.setName(updateDto.getName());
        if (updateDto.getEmail() != null) user.setEmail(updateDto.getEmail());
        if (updateDto.getLanguage() != null) user.setLanguage(updateDto.getLanguage());
        if (updateDto.getFcmToken() != null) user.setFcmToken(updateDto.getFcmToken());

        userRepository.save(user);

        return getMe(authentication);
    }
}
