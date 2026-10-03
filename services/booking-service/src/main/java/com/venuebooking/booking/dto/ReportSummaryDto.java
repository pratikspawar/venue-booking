package com.venuebooking.booking.dto;

public record ReportSummaryDto(
    Long totalGrossRevenuePaise,
    Long gameTimeRevenuePaise,
    Long canteenRevenuePaise,
    Long equipmentRentalRevenuePaise,
    Integer totalBookingsCount,
    Integer completedCount,
    Integer activeCount,
    Integer cancelledCount,
    Integer noShowCount,
    Double overallUtilizationPercent,
    Integer averageSessionMinutes,
    Long cashCollectionPaise,
    Long upiCollectionPaise,
    Long onlineCollectionPaise
) {}
