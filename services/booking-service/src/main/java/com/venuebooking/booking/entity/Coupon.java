package com.venuebooking.booking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "coupons", uniqueConstraints = {
    @UniqueConstraint(name = "uq_tenant_coupon_code", columnNames = {"tenant_id", "code"})
}, indexes = {
    @Index(name = "ix_coupon_lookup", columnList = "tenant_id, code, active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(nullable = false, length = 40)
    private String code; // e.g. GAMEON20, FIRST50, APEXSUMMER

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    private DiscountType discountType; // PERCENTAGE, FLAT

    @Column(name = "discount_value", nullable = false)
    private Long discountValue; // percentage (e.g. 20) or paise (e.g. 10000 = ₹100)

    @Column(name = "min_booking_amount_paise")
    @Builder.Default
    private Long minBookingAmountPaise = 0L;

    @Column(name = "max_discount_paise")
    private Long maxDiscountPaise; // Cap on percentage discounts

    @Column(name = "applicable_sport_code", length = 40)
    private String applicableSportCode; // Null = applies to all sports; or specific dynamic sport

    @Column(name = "valid_from", nullable = false)
    private Instant validFrom;

    @Column(name = "valid_to", nullable = false)
    private Instant validTo;

    @Column(name = "max_uses")
    @Builder.Default
    private Integer maxUses = 1000;

    @Column(name = "used_count", nullable = false)
    @Builder.Default
    private Integer usedCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum DiscountType {
        PERCENTAGE,
        FLAT
    }
}
