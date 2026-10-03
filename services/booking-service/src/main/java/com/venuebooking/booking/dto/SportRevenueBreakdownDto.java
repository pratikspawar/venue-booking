package com.venuebooking.booking.dto;

public record SportRevenueBreakdownDto(
    String sportCode,
    String sportName,
    Long revenuePaise,
    Integer bookingCount,
    Double percentage
) {}
