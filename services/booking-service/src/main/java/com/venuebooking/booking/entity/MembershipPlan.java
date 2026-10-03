package com.venuebooking.booking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "membership_plans", indexes = {
    @Index(name = "ix_plan_tenant", columnList = "tenant_id, active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MembershipPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(nullable = false, length = 120)
    private String name; // e.g. "Pro Gamer Pass", "Snooker Enthusiast Club", "Weekend Turf League"

    @Column(name = "sport_code", length = 40)
    private String sportCode; // Null = all sports

    @Column(name = "price_paise", nullable = false)
    private Long pricePaise;

    @Column(name = "duration_days", nullable = false)
    @Builder.Default
    private Integer durationDays = 30;

    @Column(name = "discount_percent")
    @Builder.Default
    private Integer discountPercent = 15; // Discount on slots

    @Column(name = "free_minutes")
    @Builder.Default
    private Integer freeMinutes = 120; // 2 free hours complimentary

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
