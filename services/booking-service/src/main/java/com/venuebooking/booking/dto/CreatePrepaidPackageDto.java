package com.venuebooking.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreatePrepaidPackageDto(
    @NotBlank String name,
    String sportCode,
    @NotNull @Positive Integer totalMinutes,
    @NotNull @Positive Long pricePaise,
    Integer validityDays
) {}
