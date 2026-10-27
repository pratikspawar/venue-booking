package com.venuebooking.booking.dto;

import java.time.Instant;

public record CustomerPrepaidPackageDto(
    Long id,
    Long userId,
    Long packageId,
    String packageName,
    String sportCode,
    Integer totalMinutes,
    Double totalHours,
    Integer remainingMinutes,
    Double remainingHours,
    Instant purchasedAt,
    Instant expiresAt,
    String status
) {}
