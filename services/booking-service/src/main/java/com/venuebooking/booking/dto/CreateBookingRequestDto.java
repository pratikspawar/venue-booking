package com.venuebooking.booking.dto;

import com.venuebooking.booking.entity.Booking;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBookingRequestDto {

    @NotNull(message = "Resource ID is required")
    private Long resourceId;

    @NotNull(message = "Start time UTC is required")
    private Instant startUtc;

    @NotNull(message = "End time UTC is required")
    private Instant endUtc;

    @Builder.Default
    private Booking.PaymentMode paymentMode = Booking.PaymentMode.ONLINE;

    private String walkinName;
    private String walkinPhone;
    private String couponCode;
}
