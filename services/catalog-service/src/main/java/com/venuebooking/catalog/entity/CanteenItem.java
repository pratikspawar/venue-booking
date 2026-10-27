package com.venuebooking.catalog.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "canteen_items", indexes = {
    @Index(name = "ix_canteen_venue", columnList = "venue_id"),
    @Index(name = "ix_canteen_tenant", columnList = "tenant_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CanteenItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "venue_id", nullable = false)
    private Long venueId;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Category category;

    @Column(name = "price_paise", nullable = false)
    private Long pricePaise;

    @Column(name = "stock_count", nullable = false)
    @Builder.Default
    private Integer stockCount = 0;

    @Column(name = "low_stock_threshold", nullable = false)
    @Builder.Default
    private Integer lowStockThreshold = 5;

    @Column(name = "is_equipment", nullable = false)
    @Builder.Default
    private Boolean isEquipment = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_status", nullable = false, length = 30)
    @Builder.Default
    private ConditionStatus conditionStatus = ConditionStatus.GOOD;

    @Column(name = "deposit_paise", nullable = false)
    @Builder.Default
    private Long depositPaise = 0L;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum Category {
        FOOD,
        BEVERAGE,
        EQUIPMENT_RENTAL,
        ACCESSORY
    }

    public enum ConditionStatus {
        EXCELLENT,
        GOOD,
        FAIR,
        MAINTENANCE,
        DAMAGED
    }
}
