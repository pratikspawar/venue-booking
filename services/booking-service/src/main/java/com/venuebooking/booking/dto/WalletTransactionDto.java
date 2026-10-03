package com.venuebooking.booking.dto;

import java.time.Instant;

public record WalletTransactionDto(
    Long id,
    Long amountPaise,
    Double amountRupees,
    String type,
    String referenceId,
    String description,
    Long balanceAfterPaise,
    Double balanceAfterRupees,
    Instant createdAt
) {}
