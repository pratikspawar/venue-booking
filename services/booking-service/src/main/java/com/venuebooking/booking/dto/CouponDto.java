package com.venuebooking.booking.dto;

import java.time.Instant;

public record CouponDto(
    Long id,
    String code,
    String discountType,
    Long discountValue,
    Long minBookingAmountPaise,
    Long maxDiscountPaise,
    String applicableSportCode,
    Instant validFrom,
    Instant validTo,
    Integer maxUses,
    Integer usedCount,
    Boolean active,
    Instant createdAt
) {}
