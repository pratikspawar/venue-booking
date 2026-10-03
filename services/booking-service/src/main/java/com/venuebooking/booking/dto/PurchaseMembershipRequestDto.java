package com.venuebooking.booking.dto;

import jakarta.validation.constraints.NotNull;

public record PurchaseMembershipRequestDto(
    @NotNull Long userId,
    @NotNull Long planId,
    String paymentMode // RAZORPAY_ONLINE, WALLET, CASH
) {}
