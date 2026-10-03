package com.venuebooking.booking.dto;

public record ResourceUtilizationDto(
    Long resourceId,
    String resourceName,
    String sportCode,
    String sportName,
    Integer totalBookedMinutes,
    Long revenuePaise,
    Double utilizationPercent
) {}
