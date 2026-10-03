package com.venuebooking.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private Long id;
    private String phone;
    private String name;
    private String email;
    private String language;
    private Boolean isSuperAdmin;
    private List<MembershipDto> memberships;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MembershipDto {
        private Long tenantId;
        private String tenantName;
        private String role;
    }
}
