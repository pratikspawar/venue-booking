package com.venuebooking.payment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentOrderRequestDto {

    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    @NotNull(message = "Amount in paise is required")
    private Long amountPaise;

    private Long tenantId;
}
