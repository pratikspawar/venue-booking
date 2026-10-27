package com.venuebooking.booking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "prepaid_packages", indexes = {
    @Index(name = "ix_pkg_tenant", columnList = "tenant_id, active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrepaidPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(nullable = false, length = 120)
    private String name; // e.g. "10-Hour PS5 Bundle", "20-Hour Snooker Pass", "5-Hour Box Turf Pack"

    @Column(name = "sport_code", length = 40)
    private String sportCode; // Null = all sports

    @Column(name = "total_minutes", nullable = false)
    private Integer totalMinutes; // e.g. 600 mins = 10 hrs

    @Column(name = "price_paise", nullable = false)
    private Long pricePaise;

    @Column(name = "validity_days", nullable = false)
    @Builder.Default
    private Integer validityDays = 90;

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
