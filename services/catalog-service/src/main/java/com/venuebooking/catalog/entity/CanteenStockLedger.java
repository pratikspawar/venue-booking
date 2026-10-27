package com.venuebooking.catalog.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "canteen_stock_ledger", indexes = {
    @Index(name = "ix_stock_ledger_item", columnList = "canteen_item_id, created_at"),
    @Index(name = "ix_stock_ledger_venue", columnList = "tenant_id, venue_id, created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CanteenStockLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "venue_id", nullable = false)
    private Long venueId;

    @Column(name = "canteen_item_id", nullable = false)
    private Long canteenItemId;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 30)
    private TransactionType transactionType;

    @Column(name = "quantity_change", nullable = false)
    private Integer quantityChange;

    @Column(name = "previous_stock", nullable = false)
    private Integer previousStock;

    @Column(name = "new_stock", nullable = false)
    private Integer newStock;

    @Column(name = "unit_cost_paise")
    private Long unitCostPaise;

    @Column(name = "reason", length = 255)
    private String reason;

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(name = "performed_by")
    private Long performedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public enum TransactionType {
        RECEIPT,
        SALE,
        ADJUSTMENT,
        WASTAGE,
        RETURN
    }
}
