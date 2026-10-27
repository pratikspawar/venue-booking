package com.venuebooking.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEquipmentDto {
    private String name;
    private Long pricePaise;
    private Integer stockCount;
    private Integer lowStockThreshold;
    private String conditionStatus;
    private Long depositPaise;
    private String serialNumber;
    private Boolean active;
}
