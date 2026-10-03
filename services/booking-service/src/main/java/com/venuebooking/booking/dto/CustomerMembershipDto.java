package com.venuebooking.booking.dto;

import java.time.Instant;

public record CustomerMembershipDto(
    Long id,
    Long userId,
    Long planId,
    String planName,
    String sportCode,
    Integer discountPercent,
    Integer remainingFreeMinutes,
    Instant startDate,
    Instant endDate,
    String status
) {}
