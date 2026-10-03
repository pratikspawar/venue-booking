package com.venuebooking.booking.dto;

public record PeakHourAnalysisDto(
    Integer hourOfDay,
    String hourLabel,
    Integer bookingCount,
    Long revenuePaise,
    String peakLevel // PEAK, MODERATE, OFF_PEAK
) {}
