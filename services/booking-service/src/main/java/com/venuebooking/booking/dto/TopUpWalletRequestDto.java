package com.venuebooking.booking.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record TopUpWalletRequestDto(
    @NotNull Long userId,
    @NotNull @Positive Long amountPaise,
    String referenceId,
    String notes
) {}
