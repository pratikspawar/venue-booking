package com.venuebooking.payment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateWalletTopupOrderRequestDto(
    @NotNull(message = "amountPaise is required")
    @Positive(message = "amountPaise must be positive")
    Long amountPaise,

    Long tenantId
) {}
