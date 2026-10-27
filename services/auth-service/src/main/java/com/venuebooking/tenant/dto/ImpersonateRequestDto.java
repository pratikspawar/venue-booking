package com.venuebooking.tenant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImpersonateRequestDto {

    @NotNull(message = "Target tenant ID is required")
    private Long targetTenantId;

    @NotBlank(message = "Impersonation reason is required for audit compliance")
    private String reason;
}
