package com.venuebooking.booking.dto;

import java.time.Instant;
import java.util.List;

public record ComprehensiveReportResponseDto(
    ReportSummaryDto summary,
    List<SportRevenueBreakdownDto> sportBreakdown,
    List<PeakHourAnalysisDto> peakHours,
    List<ResourceUtilizationDto> resourceUtilization,
    List<StaffCollectionDto> staffCollections,
    Instant periodStart,
    Instant periodEnd
) {}
