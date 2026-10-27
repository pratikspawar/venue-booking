package com.venuebooking.booking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QrCheckinRequestDto {
    @NotBlank(message = "QR data is required")
    private String qrData;
}
