package com.venuebooking.catalog.dto;

import com.venuebooking.catalog.entity.CanteenItem;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCanteenItemDto {

    @NotBlank(message = "Item name is required")
    private String name;

    @NotNull(message = "Category is required")
    private CanteenItem.Category category;

    @NotNull(message = "Price in paise is required")
    private Long pricePaise;

    private Integer stockCount;

    private Integer lowStockThreshold;

    private Boolean isEquipment;
}
