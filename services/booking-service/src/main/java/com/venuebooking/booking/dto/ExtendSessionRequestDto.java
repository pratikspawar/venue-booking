package com.venuebooking.booking.dto;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExtendSessionRequestDto {
    @Min(value = 15, message = "Extension must be at least 15 minutes")
    private int extraMinutes = 30;
}
