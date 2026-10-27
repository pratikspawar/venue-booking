package com.venuebooking.booking.entity;

import com.venuebooking.auth.entity.User;
import com.venuebooking.catalog.entity.Resource;
import com.venuebooking.catalog.entity.Venue;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings", indexes = {
    @Index(name = "ix_book_venue_time", columnList = "tenant_id, venue_id, start_utc"),
    @Index(name = "ix_book_resource_time", columnList = "resource_id, start_utc"),
    @Index(name = "ix_book_customer", columnList = "customer_id, start_utc"),
    @Index(name = "ix_book_hold", columnList = "status, hold_expires_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

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

    @Column(name = "resource_id", nullable = false)
    private Long resourceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id", insertable = false, updatable = false)
    private Resource resource;

    @Column(name = "customer_id")
    private Long customerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", insertable = false, updatable = false)
    private User customer;

    @Column(name = "walkin_name", length = 100)
    private String walkinName;

    @Column(name = "walkin_phone", length = 15)
    private String walkinPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Source source = Source.APP;

    @Column(name = "start_utc", nullable = false)
    private Instant startUtc;

    @Column(name = "end_utc", nullable = false)
    private Instant endUtc;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.HELD;

    @Column(name = "hold_expires_at")
    private Instant holdExpiresAt;

    @Column(name = "amount_paise", nullable = false)
    private Long amountPaise;

    @Column(name = "discount_paise", nullable = false)
    @Builder.Default
    private Long discountPaise = 0L;

    @Column(name = "tax_paise", nullable = false)
    @Builder.Default
    private Long taxPaise = 0L;

    @Column(name = "paid_paise", nullable = false)
    @Builder.Default
    private Long paidPaise = 0L;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", nullable = false, length = 20)
    @Builder.Default
    private PaymentMode paymentMode = PaymentMode.ONLINE;

    @Column(name = "coupon_id")
    private Long couponId;

    @Column(name = "reminder_sent", nullable = false)
    @Builder.Default
    private Boolean reminderSent = false;

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Integer version = 0;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BookingSlot> slots = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum Status {
        HELD,
        CONFIRMED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED,
        NO_SHOW,
        EXPIRED
    }

    public enum Source {
        APP,
        WALKIN
    }

    public enum PaymentMode {
        ONLINE,
        PAY_AT_VENUE,
        WALLET,
        MIXED
    }
}
