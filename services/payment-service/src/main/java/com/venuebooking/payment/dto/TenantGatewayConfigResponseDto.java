package com.venuebooking.payment.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class TenantGatewayConfigResponseDto {
    private Long id;
    private Long tenantId;
    private String gateway;
    private String keyId;
    private String maskedKeySecret;
    private String maskedWebhookSecret;
    private Boolean isConfigured;
    private Boolean isActive;
    private String webhookCallbackUrl;
    private Instant updatedAt;
}
