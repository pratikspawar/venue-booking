package com.venuebooking.catalog.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "cancellation_policies", indexes = {
    @Index(name = "ix_policy", columnList = "venue_id, hours_before")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CancellationPolicy {

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

    @Column(name = "hours_before", nullable = false)
    private Integer hoursBefore; // Minimum hours before slot start

    @Column(name = "refund_percent", nullable = false)
    private Integer refundPercent; // 0 to 100

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
