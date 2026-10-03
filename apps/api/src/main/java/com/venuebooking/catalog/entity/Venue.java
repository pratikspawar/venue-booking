package com.venuebooking.catalog.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "venues", indexes = {
    @Index(name = "ix_venue_tenant", columnList = "tenant_id"),
    @Index(name = "ix_venue_city", columnList = "city")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Venue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 300)
    private String address;

    @Column(length = 80)
    private String city;

    @Column(precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(precision = 9, scale = 6)
    private BigDecimal longitude;

    @Column(nullable = false, length = 40)
    @Builder.Default
    private String timezone = "Asia/Kolkata";

    @Enumerated(EnumType.STRING)
    @Column(name = "pay_at_venue_mode", nullable = false, length = 20)
    @Builder.Default
    private PayAtVenueMode payAtVenueMode = PayAtVenueMode.OFF;

    @Column(name = "advance_amount_paise", nullable = false)
    @Builder.Default
    private Long advanceAmountPaise = 0L;

    @Column(name = "hold_minutes", nullable = false)
    @Builder.Default
    private Integer holdMinutes = 8;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @OneToMany(mappedBy = "venue", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<VenueHours> operatingHours = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum PayAtVenueMode {
        OFF,
        NO_ADVANCE,
        ADVANCE
    }
}
