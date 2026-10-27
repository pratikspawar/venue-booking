package com.venuebooking.payment.controller;

import com.venuebooking.common.BusinessException;
import com.venuebooking.payment.dto.TenantGatewayConfigResponseDto;
import com.venuebooking.payment.dto.TestGatewayConnectionResponseDto;
import com.venuebooking.payment.dto.UpdateTenantGatewayConfigRequestDto;
import com.venuebooking.payment.service.TenantGatewayConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments/settings/gateway")
@RequiredArgsConstructor
@Tag(name = "Payment Gateway Settings", description = "Merchant self-service payment gateway configuration (BYOK)")
public class TenantGatewayConfigController {

    private final TenantGatewayConfigService gatewayConfigService;

    @GetMapping
    @Operation(summary = "Get current merchant gateway settings", description = "Returns configured gateway keys in masked format")
    public ResponseEntity<TenantGatewayConfigResponseDto> getSettings(
            @RequestHeader(value = "X-Tenant-Id", defaultValue = "1") Long tenantId,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        verifyOwnerOrManager(role);
        return ResponseEntity.ok(gatewayConfigService.getTenantConfig(tenantId));
    }

    @PutMapping
    @Operation(summary = "Save or update merchant gateway credentials", description = "Securely encrypts and stores merchant Razorpay credentials")
    public ResponseEntity<TenantGatewayConfigResponseDto> updateSettings(
            @RequestHeader(value = "X-Tenant-Id", defaultValue = "1") Long tenantId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @Valid @RequestBody UpdateTenantGatewayConfigRequestDto req
    ) {
        verifyOwnerOrManager(role);
        return ResponseEntity.ok(gatewayConfigService.updateTenantConfig(tenantId, req));
    }

    @PostMapping("/test")
    @Operation(summary = "Test Razorpay API connectivity with provided or stored credentials")
    public ResponseEntity<TestGatewayConnectionResponseDto> testConnection(
            @RequestHeader(value = "X-Tenant-Id", defaultValue = "1") Long tenantId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestBody(required = false) UpdateTenantGatewayConfigRequestDto req
    ) {
        verifyOwnerOrManager(role);
        String keyId = req != null ? req.getKeyId() : null;
        String keySecret = req != null ? req.getKeySecret() : null;
        return ResponseEntity.ok(gatewayConfigService.testConnection(tenantId, keyId, keySecret));
    }

    private void verifyOwnerOrManager(String role) {
        if (role != null && !role.isBlank()) {
            if (!"OWNER".equalsIgnoreCase(role) && !"MANAGER".equalsIgnoreCase(role) && !"SUPER_ADMIN".equalsIgnoreCase(role)) {
                throw BusinessException.forbidden("Only venue owners and managers can access payment gateway settings");
            }
        }
    }
}
