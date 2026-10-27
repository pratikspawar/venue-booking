package com.venuebooking.booking.dto;

import jakarta.validation.constraints.NotNull;

public record PurchasePrepaidPackageRequestDto(
    @NotNull Long userId,
    @NotNull Long packageId,
    String paymentMode // WALLET, ONLINE, CASH
) {}
