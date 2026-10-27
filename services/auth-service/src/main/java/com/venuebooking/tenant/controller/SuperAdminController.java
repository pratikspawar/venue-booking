package com.venuebooking.tenant.controller;

import com.venuebooking.tenant.dto.*;
import com.venuebooking.tenant.entity.Tenant;
import com.venuebooking.tenant.service.SuperAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/superadmin")
@RequiredArgsConstructor
@Tag(name = "Platform Super-Admin API", description = "Multi-tenant onboarding, SaaS plan administration, platform GMV reporting, and support impersonation")
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    @GetMapping("/tenants")
    @Operation(summary = "List all platform tenant venues")
    public ResponseEntity<List<PlatformTenantDto>> listTenants() {
        return ResponseEntity.ok(superAdminService.listAllTenants());
    }

    @PostMapping("/tenants")
    @Operation(summary = "Onboard a new venue business tenant")
    public ResponseEntity<PlatformTenantDto> onboardTenant(
            @Valid @RequestBody OnboardTenantRequestDto request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(superAdminService.onboardTenant(request));
    }

    @PatchMapping("/tenants/{tenantId}/status")
    @Operation(summary = "Update tenant venue operating status (ACTIVE, SUSPENDED, TRIAL)")
    public ResponseEntity<PlatformTenantDto> updateStatus(
            @PathVariable Long tenantId,
            @RequestParam Tenant.Status status
    ) {
        return ResponseEntity.ok(superAdminService.updateTenantStatus(tenantId, status));
    }

    @GetMapping("/metrics")
    @Operation(summary = "Get platform-wide aggregated GMV & subscription metrics")
    public ResponseEntity<PlatformMetricsDto> getMetrics() {
        return ResponseEntity.ok(superAdminService.getPlatformMetrics());
    }

    @PostMapping("/impersonate")
    @Operation(summary = "Create support impersonation audit log entry")
    public ResponseEntity<ImpersonationAuditDto> impersonate(
            @RequestHeader(value = "X-Admin-User-Id", required = false) Long adminUserId,
            @RequestHeader(value = "X-Admin-Username", required = false) String adminUsername,
            @Valid @RequestBody ImpersonateRequestDto request,
            HttpServletRequest servletRequest
    ) {
        String clientIp = servletRequest.getRemoteAddr();
        return ResponseEntity.ok(superAdminService.impersonateTenant(adminUserId, adminUsername, request, clientIp));
    }

    @GetMapping("/impersonate/audit")
    @Operation(summary = "Get immutable support impersonation audit trail")
    public ResponseEntity<List<ImpersonationAuditDto>> getImpersonationAuditLogs() {
        return ResponseEntity.ok(superAdminService.getImpersonationAuditLogs());
    }
}
