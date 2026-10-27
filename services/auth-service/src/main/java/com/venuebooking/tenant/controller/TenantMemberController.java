package com.venuebooking.tenant.controller;

import com.venuebooking.common.BusinessException;
import com.venuebooking.common.TenantContext;
import com.venuebooking.tenant.dto.InviteMemberRequestDto;
import com.venuebooking.tenant.dto.TenantMemberDto;
import com.venuebooking.tenant.dto.UpdateMemberRequestDto;
import com.venuebooking.tenant.service.TenantMemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/auth/members", "/api/v1/auth/members"})
@RequiredArgsConstructor
@Tag(name = "Staff Management", description = "Endpoints for managing staff members, roles, invitations, and venue assignments")
public class TenantMemberController {

    private final TenantMemberService tenantMemberService;

    private Long resolveTenantId(Long headerTenantId) {
        Long tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        if (tenantId == null) {
            throw BusinessException.forbidden("Tenant context required for staff operations");
        }
        return tenantId;
    }

    @GetMapping
    @Operation(summary = "List staff members", description = "List all team and staff members for the current tenant")
    public ResponseEntity<List<TenantMemberDto>> listMembers(
            @RequestHeader(value = "X-Tenant-Id", required = false) Long headerTenantId
    ) {
        return ResponseEntity.ok(tenantMemberService.listMembers(resolveTenantId(headerTenantId)));
    }

    @PostMapping({"", "/invite"})
    @Operation(summary = "Invite staff member", description = "Invite or assign a user as a staff member with role and venue permissions")
    public ResponseEntity<TenantMemberDto> inviteMember(
            @RequestHeader(value = "X-Tenant-Id", required = false) Long headerTenantId,
            @Valid @RequestBody InviteMemberRequestDto requestDto
    ) {
        return ResponseEntity.ok(tenantMemberService.inviteMember(resolveTenantId(headerTenantId), requestDto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update staff member", description = "Update role, active status, or venue assignments for a staff member")
    public ResponseEntity<TenantMemberDto> updateMember(
            @RequestHeader(value = "X-Tenant-Id", required = false) Long headerTenantId,
            @PathVariable Long id,
            @RequestBody UpdateMemberRequestDto requestDto
    ) {
        return ResponseEntity.ok(tenantMemberService.updateMember(resolveTenantId(headerTenantId), id, requestDto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate staff member", description = "Deactivate or remove a staff member from the tenant")
    public ResponseEntity<Map<String, Object>> deleteMember(
            @RequestHeader(value = "X-Tenant-Id", required = false) Long headerTenantId,
            @PathVariable Long id
    ) {
        tenantMemberService.deleteMember(resolveTenantId(headerTenantId), id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Staff member deactivated successfully"));
    }
}
