package com.venuebooking.booking.dto;

public record CouponValidationResponseDto(
    boolean valid,
    Long couponId,
    String code,
    Long discountPaise,
    Double discountRupees,
    Long finalAmountPaise,
    Double finalAmountRupees,
    String message
) {}
