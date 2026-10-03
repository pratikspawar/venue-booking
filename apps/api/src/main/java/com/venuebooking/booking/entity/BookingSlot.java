package com.venuebooking.booking.entity;

import com.venuebooking.catalog.entity.Resource;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "booking_slots", uniqueConstraints = {
    @UniqueConstraint(name = "uq_slot", columnNames = {"resource_id", "slot_start"})
}, indexes = {
    @Index(name = "ix_slot_booking", columnList = "booking_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", insertable = false, updatable = false)
    private Booking booking;

    @Column(name = "resource_id", nullable = false)
    private Long resourceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id", insertable = false, updatable = false)
    private Resource resource;

    @Column(name = "slot_start", nullable = false)
    private Instant slotStart; // UTC, aligned to resource grid

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public BookingSlot(Long bookingId, Long resourceId, Instant slotStart) {
        this.bookingId = bookingId;
        this.resourceId = resourceId;
        this.slotStart = slotStart;
    }
}
