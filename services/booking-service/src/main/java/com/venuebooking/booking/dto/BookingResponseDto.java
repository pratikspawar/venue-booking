package com.venuebooking.booking.dto;

import com.venuebooking.booking.entity.Booking;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponseDto {

    private Long id;
    private Long tenantId;
    private Long venueId;
    private String venueName;
    private Long resourceId;
    private String resourceName;
    private Long customerId;
    private String walkinName;
    private String walkinPhone;
    private Booking.Source source;
    private Instant startUtc;
    private Instant endUtc;
    private Booking.Status status;
    private Instant holdExpiresAt;
    private Long amountPaise;
    private Long discountPaise;
    private Long taxPaise;
    private Long paidPaise;
    private Booking.PaymentMode paymentMode;
    private Long refundPaise;
    private Integer refundPercent;
    private List<Instant> reservedSlotStarts;
    private Instant createdAt;
}
