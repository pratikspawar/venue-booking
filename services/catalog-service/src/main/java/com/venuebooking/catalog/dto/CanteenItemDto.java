package com.venuebooking.catalog.dto;

import com.venuebooking.catalog.entity.CanteenItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CanteenItemDto {

    private Long id;
    private Long tenantId;
    private Long venueId;
    private String name;
    private CanteenItem.Category category;
    private Long pricePaise;
    private Integer stockCount;
    private Integer lowStockThreshold;
    private Boolean isEquipment;
    private Boolean isLowStock;
    private Boolean active;
    private Instant createdAt;
}
