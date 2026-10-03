package com.venuebooking.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateMembershipPlanDto(
    @NotBlank String name,
    String sportCode,
    @NotNull @Positive Long pricePaise,
    @NotNull @Positive Integer durationDays,
    Integer discountPercent,
    Integer freeMinutes
) {}
