package com.venuebooking.payment.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyCheckoutRequest(
        @NotBlank String orderId,
        @NotBlank String paymentId,
        @NotBlank String signature
) {}
