package com.venuebooking.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformMetricsDto {

    private Long totalTenants;
    private Long activeTenants;
    private Long trialTenants;
    private Long suspendedTenants;
    private Long totalPlatformGmvPaise;
    private Long monthlyRecurringRevenuePaise;
    private Long totalActiveBookingsCount;
    private Double platformUptimePercent;
}
