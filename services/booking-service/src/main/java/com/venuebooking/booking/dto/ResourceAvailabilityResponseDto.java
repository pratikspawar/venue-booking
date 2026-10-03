package com.venuebooking.booking.dto;

import com.venuebooking.catalog.entity.Resource;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceAvailabilityResponseDto {

    private Long resourceId;
    private String resourceName;
    private String venueTimezone;
    private Resource.BillingMode billingMode;
    private Integer slotMinutes;
    private LocalDate date;
    private List<SlotAvailabilityDto> slots;
}
