package com.venuebooking.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingItemResponseDto {

    private Long id;
    private Long bookingId;
    private Long canteenItemId;
    private String itemName;
    private Integer quantity;
    private Long unitPricePaise;
    private Long totalPaise;
    private Instant createdAt;
}
