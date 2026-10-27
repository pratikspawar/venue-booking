package com.venuebooking.booking.dto;

import java.time.Instant;

public record EarningsLedgerEntryDto(
    Long bookingId,
    Instant timestamp,
    String formattedTime,
    String customerName,
    String customerPhone,
    String resourceName,
    String sportName,
    String paymentMode,
    Long gameTimePaise,
    Long canteenPaise,
    Long discountPaise,
    Long taxPaise,
    Long grossPaise,
    Long netPaise,
    String status,
    String source
) {}
