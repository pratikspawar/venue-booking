package com.venuebooking.booking.dto;

public record PaymentMethodEarningsDto(
    String paymentMode,
    String label,
    Long amountPaise,
    Integer transactionCount,
    Double percentage
) {}
