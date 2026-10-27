package com.venuebooking.payment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateTenantGatewayConfigRequestDto {
    @NotBlank(message = "Gateway is required")
    private String gateway = "RAZORPAY";

    @NotBlank(message = "Key ID is required")
    private String keyId;

    @NotBlank(message = "Key Secret is required")
    private String keySecret;

    private String webhookSecret;

    private Boolean isActive = true;
}
