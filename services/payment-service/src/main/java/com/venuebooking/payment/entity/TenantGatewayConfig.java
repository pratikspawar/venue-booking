package com.venuebooking.payment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "tenant_gateway_configs",
        uniqueConstraints = @UniqueConstraint(name = "uq_tenant_gateway", columnNames = {"tenant_id", "gateway"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantGatewayConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "gateway", nullable = false, length = 20)
    @Builder.Default
    private String gateway = "RAZORPAY";

    @Column(name = "key_id", nullable = false, length = 100)
    private String keyId;

    @Column(name = "encrypted_key_secret", nullable = false, length = 500)
    private String encryptedKeySecret;

    @Column(name = "encrypted_webhook_secret", length = 500)
    private String encryptedWebhookSecret;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
