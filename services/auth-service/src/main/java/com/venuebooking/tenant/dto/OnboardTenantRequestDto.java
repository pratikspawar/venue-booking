package com.venuebooking.tenant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnboardTenantRequestDto {

    @NotBlank(message = "Business name is required")
    @Size(max = 150)
    private String name;

    @NotBlank(message = "URL slug is required")
    @Size(max = 80)
    private String slug;

    private String logoUrl;
    private Long planId;
    private String gstNumber;
    private String razorpayAccountId;
    private String contactEmail;
    private String contactPhone;
}
