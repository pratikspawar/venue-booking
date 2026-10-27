package com.venuebooking.tenant.dto;

import com.venuebooking.tenant.entity.Tenant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformTenantDto {

    private Long id;
    private String name;
    private String slug;
    private String logoUrl;
    private Tenant.Status status;
    private Long planId;
    private String planName;
    private String gstNumber;
    private String razorpayAccountId;
    private Long memberCount;
    private Long gmvPaise;
    private Instant createdAt;
    private Instant updatedAt;
}
