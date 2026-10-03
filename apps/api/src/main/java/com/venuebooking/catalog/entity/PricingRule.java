package com.venuebooking.catalog.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalTime;

@Entity
@Table(name = "pricing_rules", indexes = {
    @Index(name = "ix_price", columnList = "resource_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PricingRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "resource_id", nullable = false)
    private Long resourceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id", insertable = false, updatable = false)
    private Resource resource;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_type", nullable = false, length = 20)
    @Builder.Default
    private DayType dayType = DayType.ANY;

    @Column(name = "start_time", nullable = false)
    @Builder.Default
    private LocalTime startTime = LocalTime.of(0, 0, 0);

    @Column(name = "end_time", nullable = false)
    @Builder.Default
    private LocalTime endTime = LocalTime.of(23, 59, 59);

    @Column(name = "price_per_slot_paise")
    private Long pricePerSlotPaise; // For FIXED_SLOT

    @Column(name = "price_per_hour_paise")
    private Long pricePerHourPaise; // For TIME_PLAYED

    @Column(name = "min_charge_minutes", nullable = false)
    @Builder.Default
    private Integer minChargeMinutes = 0;

    @Column(name = "rounding_minutes", nullable = false)
    @Builder.Default
    private Integer roundingMinutes = 1;

    @Column(nullable = false)
    @Builder.Default
    private Integer priority = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum DayType {
        ANY,
        WEEKDAY,
        WEEKEND
    }
}
