package com.venuebooking.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ValidateCouponRequestDto(
    @NotBlank String code,
    @NotNull @Positive Long bookingAmountPaise,
    String sportCode
) {}
