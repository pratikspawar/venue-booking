package com.venuebooking.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotAvailabilityDto {

    private Instant slotStart;
    private Instant slotEnd;
    private SlotStatus status;
    private Long pricePaise;

    public enum SlotStatus {
        AVAILABLE,
        HELD,
        BOOKED,
        BLOCKED,
        PAST
    }
}
