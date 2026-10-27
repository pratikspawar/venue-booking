package com.venuebooking.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "support_impersonation_logs", indexes = {
    @Index(name = "ix_impersonate_tenant", columnList = "target_tenant_id, impersonated_at"),
    @Index(name = "ix_impersonate_admin", columnList = "admin_user_id, impersonated_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportImpersonationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_user_id", nullable = false)
    private Long adminUserId;

    @Column(name = "admin_username", nullable = false, length = 100)
    private String adminUsername;

    @Column(name = "target_tenant_id", nullable = false)
    private Long targetTenantId;

    @Column(name = "target_tenant_name", nullable = false, length = 150)
    private String targetTenantName;

    @Column(name = "reason", nullable = false, length = 255)
    private String reason;

    @Column(name = "client_ip", length = 50)
    private String clientIp;

    @CreationTimestamp
    @Column(name = "impersonated_at", nullable = false, updatable = false)
    private Instant impersonatedAt;
}
