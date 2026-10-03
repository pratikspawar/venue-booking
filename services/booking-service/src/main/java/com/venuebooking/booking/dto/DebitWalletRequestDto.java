package com.venuebooking.booking.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record DebitWalletRequestDto(
    @NotNull Long userId,
    @NotNull @Positive Long amountPaise,
    Long bookingId,
    String description
) {}
