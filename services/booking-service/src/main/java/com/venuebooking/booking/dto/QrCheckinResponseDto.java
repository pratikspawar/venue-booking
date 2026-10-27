package com.venuebooking.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QrCheckinResponseDto {
    private boolean success;
    private String message;
    private Long bookingId;
    private Long sessionId;
    private String customerName;
    private String customerPhone;
    private String resourceName;
    private String sportName;
    private String timeWindow;
    private String status;
}
