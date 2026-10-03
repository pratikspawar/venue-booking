package com.venuebooking.payment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "payments", indexes = {
    @Index(name = "ix_pay_booking", columnList = "booking_id"),
    @Index(name = "ix_pay_tenant_time", columnList = "tenant_id, created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "booking_id")
    private Long bookingId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Purpose purpose = Purpose.BOOKING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Method method = Method.ONLINE;

    @Column(name = "amount_paise", nullable = false)
    private Long amountPaise;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.CREATED;

    @Column(length = 20)
    private String gateway;

    @Column(name = "gateway_order_id", unique = true, length = 80)
    private String gatewayOrderId;

    @Column(name = "gateway_payment_id", unique = true, length = 80)
    private String gatewayPaymentId;

    @Column(name = "received_by")
    private Long receivedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum Purpose {
        BOOKING,
        WALLET_TOPUP,
        MEMBERSHIP,
        CANTEEN
    }

    public enum Method {
        ONLINE,
        CASH,
        UPI_COUNTER,
        WALLET
    }

    public enum Status {
        CREATED,
        PENDING,
        SUCCESS,
        FAILED
    }
}
