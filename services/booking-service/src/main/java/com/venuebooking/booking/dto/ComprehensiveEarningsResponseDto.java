package com.venuebooking.booking.dto;

import java.time.Instant;
import java.util.List;

public record ComprehensiveEarningsResponseDto(
    EarningsFinancialSummaryDto summary,
    List<DailyEarningsDto> dailyTrends,
    List<PaymentMethodEarningsDto> paymentBreakdown,
    List<SportRevenueBreakdownDto> sportBreakdown,
    List<StaffCollectionDto> staffCollections,
    List<EarningsLedgerEntryDto> recentTransactions,
    Instant periodStart,
    Instant periodEnd
) {}
