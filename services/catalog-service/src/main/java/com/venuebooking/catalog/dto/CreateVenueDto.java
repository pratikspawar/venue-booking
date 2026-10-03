package com.venuebooking.catalog.dto;

import com.venuebooking.catalog.entity.Venue;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateVenueDto {

    @NotBlank(message = "Venue name is required")
    private String name;

    private String address;
    private String city;
    private BigDecimal latitude;
    private BigDecimal longitude;

    @Builder.Default
    private String timezone = "Asia/Kolkata";

    @Builder.Default
    private Venue.PayAtVenueMode payAtVenueMode = Venue.PayAtVenueMode.OFF;

    @Builder.Default
    private Long advanceAmountPaise = 0L;

    @Builder.Default
    private Integer holdMinutes = 8;

    private List<VenueHoursDto> operatingHours;
}
