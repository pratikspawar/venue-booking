package com.venuebooking.booking.dto;

import com.venuebooking.booking.entity.Booking;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaySessionResponseDto {

    private Long sessionId;
    private Long bookingId;
    private Long tenantId;
    private Long venueId;
    private String venueName;
    private Long resourceId;
    private String resourceName;

    private String customerName;
    private String customerPhone;
    private Booking.Source bookingSource;
    private Booking.Status bookingStatus;

    private Instant startedAt;
    private Instant endedAt;
    private Long elapsedSeconds;
    private Integer billedMinutes;
    private Long amountPaise;
    private Long paidPaise;

    private Long startedBy;
    private Long endedBy;
    private boolean active;
}
