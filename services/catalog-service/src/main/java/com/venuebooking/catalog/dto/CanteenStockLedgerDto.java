package com.venuebooking.catalog.dto;

import com.venuebooking.catalog.entity.CanteenStockLedger;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CanteenStockLedgerDto {

    private Long id;
    private Long tenantId;
    private Long venueId;
    private Long canteenItemId;
    private String itemName;
    private CanteenStockLedger.TransactionType transactionType;
    private Integer quantityChange;
    private Integer previousStock;
    private Integer newStock;
    private Long unitCostPaise;
    private String reason;
    private String referenceId;
    private Long performedBy;
    private Instant createdAt;
}
