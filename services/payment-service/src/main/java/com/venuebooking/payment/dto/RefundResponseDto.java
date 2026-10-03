package com.venuebooking.payment.dto;

import com.venuebooking.payment.entity.Refund;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundResponseDto {

    private Long id;
    private Long paymentId;
    private Long bookingId;
    private Long amountPaise;
    private Refund.Status status;
    private String gatewayRefundId;
    private String reason;
    private Instant createdAt;
}
