package com.venuebooking.payment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** Read-only projection used to validate payment requests against the booking source of truth. */
@Entity
@Table(name = "bookings")
@Getter
@NoArgsConstructor
public class BookingPaymentReference {
    @Id
    private Long id;
    @Column(name = "tenant_id")
    private Long tenantId;
    @Column(name = "customer_id")
    private Long customerId;
    @Column(name = "amount_paise")
    private Long amountPaise;
    @Column(name = "status")
    private String status;
    @Column(name = "hold_expires_at")
    private Instant holdExpiresAt;
}
