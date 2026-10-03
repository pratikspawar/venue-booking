package com.venuebooking.booking.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartSessionRequestDto {

    /**
     * Optional pre-existing booking ID. If null, a walk-in session is started.
     */
    private Long bookingId;

    /**
     * Required if bookingId is null.
     */
    private Long resourceId;

    private Long venueId;

    private String walkinName;

    private String walkinPhone;
}
