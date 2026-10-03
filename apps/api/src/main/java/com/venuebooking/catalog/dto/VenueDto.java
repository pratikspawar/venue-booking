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
public class VenueDto {

    private Long id;
    private Long tenantId;
    private String name;
    private String address;
    private String city;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String timezone;
    private Venue.PayAtVenueMode payAtVenueMode;
    private Long advanceAmountPaise;
    private Integer holdMinutes;
    private Boolean active;
    private List<VenueHoursDto> operatingHours;
}
