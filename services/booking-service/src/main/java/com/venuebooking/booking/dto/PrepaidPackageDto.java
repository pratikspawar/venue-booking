package com.venuebooking.booking.dto;

public record PrepaidPackageDto(
    Long id,
    String name,
    String sportCode,
    Integer totalMinutes,
    Double totalHours,
    Long pricePaise,
    Double priceRupees,
    Integer validityDays,
    Boolean active
) {}
