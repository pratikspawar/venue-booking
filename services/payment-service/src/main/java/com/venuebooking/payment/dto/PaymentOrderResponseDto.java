package com.venuebooking.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentOrderResponseDto {

    private String orderId;
    private String keyId;
    private Long amountPaise;
    private String currency;
    private Long bookingId;
}
