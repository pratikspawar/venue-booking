package com.venuebooking.catalog.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "resources", indexes = {
    @Index(name = "ix_res_venue", columnList = "tenant_id, venue_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "venue_id", nullable = false)
    private Long venueId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venue_id", insertable = false, updatable = false)
    private Venue venue;

    @Column(name = "sport_id", nullable = false)
    private Long sportId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sport_id", insertable = false, updatable = false)
    private Sport sport;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private Integer capacity = 2;

    @Column(name = "slot_minutes", nullable = false)
    @Builder.Default
    private Integer slotMinutes = 60;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_mode", nullable = false, length = 20)
    @Builder.Default
    private BillingMode billingMode = BillingMode.FIXED_SLOT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @OneToMany(mappedBy = "resource", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PricingRule> pricingRules = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum BillingMode {
        FIXED_SLOT,
        TIME_PLAYED
    }

    public enum Status {
        ACTIVE,
        MAINTENANCE,
        INACTIVE
    }
}
