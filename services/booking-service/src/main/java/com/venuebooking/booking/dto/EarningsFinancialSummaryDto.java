package com.venuebooking.booking.dto;

public record EarningsFinancialSummaryDto(
    Long totalGrossEarningsPaise,
    Long netEarningsPaise,
    Long gameTimeEarningsPaise,
    Long canteenEarningsPaise,
    Long equipmentRentalEarningsPaise,
    Long totalDiscountsPaise,
    Long totalRefundsPaise,
    Long estimatedGstPaise,
    Long cashInDrawerPaise,
    Long counterUpiPaise,
    Long onlineGatewayPaise,
    Long walletSettledPaise,
    Integer totalPaidTransactions,
    Long averageOrderValuePaise,
    Double refundRatePercent
) {}
