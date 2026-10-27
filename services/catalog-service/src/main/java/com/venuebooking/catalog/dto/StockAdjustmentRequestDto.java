package com.venuebooking.catalog.dto;

import com.venuebooking.catalog.entity.CanteenStockLedger;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockAdjustmentRequestDto {

    @NotNull(message = "Transaction type is required")
    private CanteenStockLedger.TransactionType transactionType;

    @NotNull(message = "Quantity change is required")
    private Integer quantityChange;

    private Long unitCostPaise;
    private String reason;
    private String referenceId;
    private Long performedBy;
}
