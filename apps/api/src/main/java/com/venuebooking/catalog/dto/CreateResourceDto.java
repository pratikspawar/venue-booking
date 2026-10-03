package com.venuebooking.catalog.dto;

import com.venuebooking.catalog.entity.Resource;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateResourceDto {

    @NotNull(message = "Venue ID is required")
    private Long venueId;

    @NotNull(message = "Sport ID is required")
    private Long sportId;

    @NotBlank(message = "Resource name is required")
    private String name;

    @Builder.Default
    @Min(1)
    private Integer capacity = 2;

    @Builder.Default
    @Min(15)
    private Integer slotMinutes = 60;

    @Builder.Default
    private Resource.BillingMode billingMode = Resource.BillingMode.FIXED_SLOT;

    @Builder.Default
    private Resource.Status status = Resource.Status.ACTIVE;

    private List<PricingRuleDto> pricingRules;
}
