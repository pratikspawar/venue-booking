package com.venuebooking.catalog.dto;

import com.venuebooking.catalog.entity.Resource;
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
public class ResourceDto {

    private Long id;
    private Long tenantId;
    private Long venueId;
    private Long sportId;
    private String sportCode;
    private String sportName;
    private String name;
    private Integer capacity;
    private Integer slotMinutes;
    private Resource.BillingMode billingMode;
    private Resource.Status status;
    private List<PricingRuleDto> pricingRules;
}
