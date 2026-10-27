package com.venuebooking.booking.dto;

import java.time.LocalDate;

public record DailyEarningsDto(
    LocalDate date,
    String dayLabel,
    Long grossRevenuePaise,
    Long gameTimeRevenuePaise,
    Long canteenRevenuePaise,
    Long equipmentRentalRevenuePaise,
    Long cashPaise,
    Long upiPaise,
    Long onlinePaise,
    Long discountPaise,
    Long refundPaise,
    Long netEarningsPaise,
    Integer totalBookingsCount,
    Integer completedCount
) {}
