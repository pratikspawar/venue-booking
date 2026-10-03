package com.venuebooking.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StopSessionRequestDto {

    /**
     * Optional manual override of billable minutes. If null, automatically calculated.
     */
    private Integer manualBilledMinutes;

    /**
     * Optional discount in paise given by staff/manager.
     */
    private Long discountPaise;

    /**
     * Payment collection method: CASH, UPI_COUNTER, WALLET
     */
    private String paymentMethod;
}
