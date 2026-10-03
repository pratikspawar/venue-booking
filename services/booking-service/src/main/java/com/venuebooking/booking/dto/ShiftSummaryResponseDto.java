package com.venuebooking.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftSummaryResponseDto {

    private Long venueId;
    private LocalDate date;
    private Long totalSessionsCount;
    private Long gameTimeRevenuePaise;
    private Long canteenRevenuePaise;
    private Long totalRevenuePaise;
    private Long cashCollectedPaise;
    private Long upiCollectedPaise;
}
