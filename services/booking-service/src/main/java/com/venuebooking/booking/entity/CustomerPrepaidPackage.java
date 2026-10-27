package com.venuebooking.booking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "customer_prepaid_packages", indexes = {
    @Index(name = "ix_cust_pkg", columnList = "tenant_id, user_id, status"),
    @Index(name = "ix_pkg_expiry", columnList = "expires_at, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerPrepaidPackage {

    public enum Status {
        ACTIVE,
        EXHAUSTED,
        EXPIRED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "package_id", nullable = false)
    private Long packageId;

    @Column(name = "package_name", nullable = false, length = 120)
    private String packageName;

    @Column(name = "sport_code", length = 40)
    private String sportCode;

    @Column(name = "total_minutes", nullable = false)
    private Integer totalMinutes;

    @Column(name = "remaining_minutes", nullable = false)
    private Integer remainingMinutes;

    @Column(name = "purchased_at", nullable = false)
    @Builder.Default
    private Instant purchasedAt = Instant.now();

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
