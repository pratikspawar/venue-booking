package com.venuebooking.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelBookingRequestDto {

    private String reason;
    private String reasonCode;
    private String managerApprovalCode;
    private Long customRefundPaise;
}
