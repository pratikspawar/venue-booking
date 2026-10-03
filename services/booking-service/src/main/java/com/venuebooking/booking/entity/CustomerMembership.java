package com.venuebooking.booking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "customer_memberships", indexes = {
    @Index(name = "ix_cust_mem", columnList = "tenant_id, user_id, status"),
    @Index(name = "ix_mem_expiry", columnList = "end_date, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "plan_id", nullable = false)
    private Long planId;

    @Column(name = "plan_name", nullable = false, length = 120)
    private String planName;

    @Column(name = "sport_code", length = 40)
    private String sportCode;

    @Column(name = "discount_percent", nullable = false)
    private Integer discountPercent;

    @Column(name = "remaining_free_minutes", nullable = false)
    @Builder.Default
    private Integer remainingFreeMinutes = 0;

    @Column(name = "start_date", nullable = false)
    private Instant startDate;

    @Column(name = "end_date", nullable = false)
    private Instant endDate;

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

    public enum Status {
        ACTIVE,
        EXPIRED,
        CANCELLED
    }
}
