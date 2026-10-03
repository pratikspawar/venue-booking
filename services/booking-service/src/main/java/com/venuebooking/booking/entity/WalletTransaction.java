package com.venuebooking.booking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "wallet_transactions", indexes = {
    @Index(name = "ix_txn_wallet", columnList = "wallet_id, created_at"),
    @Index(name = "ix_txn_tenant", columnList = "tenant_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "wallet_id", nullable = false)
    private Long walletId;

    @Column(name = "amount_paise", nullable = false)
    private Long amountPaise; // Positive for credit, negative for debit

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Type type;

    @Column(name = "reference_id", length = 100)
    private String referenceId; // Booking ID or Razorpay Payment ID

    @Column(length = 255)
    private String description;

    @Column(name = "balance_after_paise", nullable = false)
    private Long balanceAfterPaise;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public enum Type {
        TOPUP,
        DEBIT_BOOKING,
        REFUND,
        DEBIT_CANTEEN,
        MEMBERSHIP_FEE,
        PROMO_BONUS
    }
}
