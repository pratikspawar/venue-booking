package com.venuebooking.booking.dto;

public record MembershipPlanDto(
    Long id,
    String name,
    String sportCode,
    Long pricePaise,
    Double priceRupees,
    Integer durationDays,
    Integer discountPercent,
    Integer freeMinutes,
    Boolean active
) {}
