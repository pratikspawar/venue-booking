package com.venuebooking.payment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "webhook_events", uniqueConstraints = {
    @UniqueConstraint(name = "uq_event", columnNames = {"gateway", "event_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebhookEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String gateway;

    @Column(name = "event_id", nullable = false, length = 100)
    private String eventId;

    @Column(columnDefinition = "JSON")
    private String payload;

    @Column(nullable = false)
    @Builder.Default
    private Boolean processed = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
