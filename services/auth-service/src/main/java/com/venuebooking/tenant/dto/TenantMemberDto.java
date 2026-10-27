package com.venuebooking.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantMemberDto {
    private Long id;
    private Long userId;
    private Long tenantId;
    private String phone;
    private String name;
    private String email;
    private String role;
    private Boolean active;
    private String assignedVenues;
    private Instant createdAt;
    private Instant updatedAt;
}
