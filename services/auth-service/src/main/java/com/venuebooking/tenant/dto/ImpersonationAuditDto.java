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
public class ImpersonationAuditDto {

    private Long id;
    private Long adminUserId;
    private String adminUsername;
    private Long targetTenantId;
    private String targetTenantName;
    private String reason;
    private String clientIp;
    private Instant impersonatedAt;
}
