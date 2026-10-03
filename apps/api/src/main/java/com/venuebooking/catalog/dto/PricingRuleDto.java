package com.venuebooking.catalog.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.venuebooking.catalog.entity.PricingRule;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PricingRuleDto {

    private Long id;
    private Long resourceId;

    @NotNull
    @Builder.Default
    private PricingRule.DayType dayType = PricingRule.DayType.ANY;

    @JsonFormat(pattern = "HH:mm")
    @Builder.Default
    private LocalTime startTime = LocalTime.of(0, 0);

    @JsonFormat(pattern = "HH:mm")
    @Builder.Default
    private LocalTime endTime = LocalTime.of(23, 59);

    private Long pricePerSlotPaise;
    private Long pricePerHourPaise;

    @Builder.Default
    private Integer minChargeMinutes = 0;

    @Builder.Default
    private Integer roundingMinutes = 1;

    @Builder.Default
    private Integer priority = 0;
}
