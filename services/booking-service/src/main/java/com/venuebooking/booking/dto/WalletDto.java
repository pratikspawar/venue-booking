package com.venuebooking.booking.dto;

public record WalletDto(
    Long walletId,
    Long userId,
    Long balancePaise,
    Double balanceRupees,
    Integer version
) {}
