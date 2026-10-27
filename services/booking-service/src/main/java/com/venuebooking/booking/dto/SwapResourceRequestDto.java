package com.venuebooking.booking.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SwapResourceRequestDto {
    @NotNull(message = "Target resource ID is required")
    private Long targetResourceId;
    private String reason;
}
