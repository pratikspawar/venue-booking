package com.venuebooking.booking.dto;

import com.venuebooking.booking.entity.Coupon;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.Instant;

public record CreateCouponDto(
    @NotBlank String code,
    @NotNull Coupon.DiscountType discountType,
    @NotNull @Positive Long discountValue,
    Long minBookingAmountPaise,
    Long maxDiscountPaise,
    String applicableSportCode, // Null = all sports; or specific dynamic sport
    @NotNull Instant validFrom,
    @NotNull Instant validTo,
    Integer maxUses
) {}
