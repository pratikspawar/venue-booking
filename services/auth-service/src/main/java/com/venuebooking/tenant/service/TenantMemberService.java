package com.venuebooking.tenant.service;

import com.venuebooking.auth.entity.User;
import com.venuebooking.auth.repository.UserRepository;
import com.venuebooking.common.BusinessException;
import com.venuebooking.tenant.dto.InviteMemberRequestDto;
import com.venuebooking.tenant.dto.TenantMemberDto;
import com.venuebooking.tenant.dto.UpdateMemberRequestDto;
import com.venuebooking.tenant.entity.TenantMember;
import com.venuebooking.tenant.repository.TenantMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantMemberService {

    private final TenantMemberRepository tenantMemberRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<TenantMemberDto> listMembers(Long tenantId) {
        if (tenantId == null) {
            throw BusinessException.forbidden("Tenant context required to list staff members");
        }
        return tenantMemberRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public TenantMemberDto inviteMember(Long tenantId, InviteMemberRequestDto dto) {
        if (tenantId == null) {
            throw BusinessException.forbidden("Tenant context required to invite staff members");
        }

        String phone = dto.getPhone().trim();

        // 1. Locate or create user account
        User user = userRepository.findByPhone(phone).orElseGet(() -> {
            User newUser = User.builder()
                    .phone(phone)
                    .name(dto.getName() != null && !dto.getName().isBlank() ? dto.getName().trim() : "Staff " + phone.substring(Math.max(0, phone.length() - 4)))
                    .email(dto.getEmail() != null && !dto.getEmail().isBlank() ? dto.getEmail().trim() : null)
                    .language("en")
                    .isSuperAdmin(false)
                    .build();
            return userRepository.save(newUser);
        });

        // If user already exists and dto has name or email, update if blank
        boolean updated = false;
        if (dto.getName() != null && !dto.getName().isBlank() && (user.getName() == null || user.getName().isBlank())) {
            user.setName(dto.getName().trim());
            updated = true;
        }
        if (dto.getEmail() != null && !dto.getEmail().isBlank() && (user.getEmail() == null || user.getEmail().isBlank())) {
            user.setEmail(dto.getEmail().trim());
            updated = true;
        }
        if (updated) {
            userRepository.save(user);
        }

        // 2. Validate role
        TenantMember.Role role = parseRole(dto.getRole());

        // 3. Check existing membership
        TenantMember member = tenantMemberRepository.findByTenantIdAndUserId(tenantId, user.getId())
                .orElse(null);

        if (member != null) {
            // Reactivate or update role and venues
            member.setRole(role);
            member.setActive(true);
            if (dto.getAssignedVenues() != null) {
                member.setAssignedVenues(dto.getAssignedVenues().trim());
            }
            log.info("Updated existing tenant membership for userId={} in tenantId={}", user.getId(), tenantId);
        } else {
            member = TenantMember.builder()
                    .tenantId(tenantId)
                    .userId(user.getId())
                    .user(user)
                    .role(role)
                    .active(true)
                    .assignedVenues(dto.getAssignedVenues() != null ? dto.getAssignedVenues().trim() : null)
                    .build();
            log.info("Created new tenant membership for userId={} in tenantId={} as role={}", user.getId(), tenantId, role);
        }

        TenantMember saved = tenantMemberRepository.save(member);
        return toDto(saved);
    }

    @Transactional
    public TenantMemberDto updateMember(Long tenantId, Long memberId, UpdateMemberRequestDto dto) {
        if (tenantId == null) {
            throw BusinessException.forbidden("Tenant context required to update staff member");
        }

        TenantMember member = tenantMemberRepository.findByIdAndTenantId(memberId, tenantId)
                .orElseThrow(() -> BusinessException.notFound("Staff member not found with ID: " + memberId));

        if (dto.getRole() != null) {
            TenantMember.Role newRole = parseRole(dto.getRole());
            if (member.getRole() == TenantMember.Role.OWNER && newRole != TenantMember.Role.OWNER) {
                long activeOwners = tenantMemberRepository.countByTenantIdAndRoleAndActiveTrue(tenantId, TenantMember.Role.OWNER);
                if (activeOwners <= 1) {
                    throw BusinessException.badRequest("Cannot demote the last active Owner of the organization");
                }
            }
            member.setRole(newRole);
        }

        if (dto.getActive() != null) {
            if (member.getRole() == TenantMember.Role.OWNER && Boolean.FALSE.equals(dto.getActive())) {
                long activeOwners = tenantMemberRepository.countByTenantIdAndRoleAndActiveTrue(tenantId, TenantMember.Role.OWNER);
                if (activeOwners <= 1) {
                    throw BusinessException.badRequest("Cannot suspend the last active Owner of the organization");
                }
            }
            member.setActive(dto.getActive());
        }

        if (dto.getAssignedVenues() != null) {
            member.setAssignedVenues(dto.getAssignedVenues().trim());
        }

        TenantMember saved = tenantMemberRepository.save(member);
        return toDto(saved);
    }

    @Transactional
    public void deleteMember(Long tenantId, Long memberId) {
        if (tenantId == null) {
            throw BusinessException.forbidden("Tenant context required to remove staff member");
        }

        TenantMember member = tenantMemberRepository.findByIdAndTenantId(memberId, tenantId)
                .orElseThrow(() -> BusinessException.notFound("Staff member not found with ID: " + memberId));

        if (member.getRole() == TenantMember.Role.OWNER) {
            long activeOwners = tenantMemberRepository.countByTenantIdAndRoleAndActiveTrue(tenantId, TenantMember.Role.OWNER);
            if (activeOwners <= 1) {
                throw BusinessException.badRequest("Cannot remove the last active Owner of the organization");
            }
        }

        member.setActive(false);
        tenantMemberRepository.save(member);
        log.info("Soft-deactivated tenant member id={} for tenantId={}", memberId, tenantId);
    }

    private TenantMember.Role parseRole(String roleStr) {
        if (roleStr == null || roleStr.isBlank()) {
            return TenantMember.Role.STAFF;
        }
        try {
            return TenantMember.Role.valueOf(roleStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw BusinessException.badRequest("Invalid role: " + roleStr + ". Allowed values: OWNER, MANAGER, STAFF");
        }
    }

    private TenantMemberDto toDto(TenantMember member) {
        User user = member.getUser();
        if (user == null && member.getUserId() != null) {
            user = userRepository.findById(member.getUserId()).orElse(null);
        }

        return TenantMemberDto.builder()
                .id(member.getId())
                .userId(member.getUserId())
                .tenantId(member.getTenantId())
                .phone(user != null ? user.getPhone() : "")
                .name(user != null ? user.getName() : null)
                .email(user != null ? user.getEmail() : null)
                .role(member.getRole() != null ? member.getRole().name() : "STAFF")
                .active(member.getActive())
                .assignedVenues(member.getAssignedVenues())
                .createdAt(member.getCreatedAt())
                .updatedAt(member.getUpdatedAt())
                .build();
    }
}
