package com.venuebooking.catalog.service;

import com.venuebooking.catalog.dto.CanteenItemDto;
import com.venuebooking.catalog.dto.CreateCanteenItemDto;
import com.venuebooking.catalog.entity.CanteenItem;
import com.venuebooking.catalog.repository.CanteenItemRepository;
import com.venuebooking.common.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CanteenService {

    private final CanteenItemRepository canteenItemRepository;

    @Transactional(readOnly = true)
    public List<CanteenItemDto> listVenueItems(Long venueId) {
        return canteenItemRepository.findByVenueIdAndActiveTrue(venueId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public CanteenItemDto createItem(Long venueId, Long tenantId, CreateCanteenItemDto req) {
        CanteenItem item = CanteenItem.builder()
                .tenantId(tenantId != null ? tenantId : 1L)
                .venueId(venueId)
                .name(req.getName().trim())
                .category(req.getCategory())
                .pricePaise(req.getPricePaise())
                .stockCount(req.getStockCount() != null ? req.getStockCount() : 0)
                .lowStockThreshold(req.getLowStockThreshold() != null ? req.getLowStockThreshold() : 5)
                .isEquipment(req.getIsEquipment() != null ? req.getIsEquipment() : false)
                .active(true)
                .build();

        CanteenItem saved = canteenItemRepository.save(item);
        log.info("Created canteen/equipment item #{} [{}] for venue #{}", saved.getId(), saved.getName(), venueId);
        return toDto(saved);
    }

    @Transactional
    public CanteenItemDto adjustStock(Long itemId, int delta) {
        CanteenItem item = canteenItemRepository.findById(itemId)
                .orElseThrow(() -> BusinessException.notFound("Canteen item not found"));

        int updated = item.getStockCount() + delta;
        if (updated < 0) {
            throw new BusinessException("INSUFFICIENT_STOCK", "Insufficient inventory stock for item: " + item.getName());
        }

        item.setStockCount(updated);
        CanteenItem saved = canteenItemRepository.save(item);

        if (saved.getStockCount() <= saved.getLowStockThreshold()) {
            log.warn("LOW STOCK ALERT: Item '{}' (ID #{}) remaining: {}", saved.getName(), saved.getId(), saved.getStockCount());
        }

        return toDto(saved);
    }

    private CanteenItemDto toDto(CanteenItem item) {
        return CanteenItemDto.builder()
                .id(item.getId())
                .tenantId(item.getTenantId())
                .venueId(item.getVenueId())
                .name(item.getName())
                .category(item.getCategory())
                .pricePaise(item.getPricePaise())
                .stockCount(item.getStockCount())
                .lowStockThreshold(item.getLowStockThreshold())
                .isEquipment(item.getIsEquipment())
                .isLowStock(item.getStockCount() <= item.getLowStockThreshold())
                .active(item.getActive())
                .createdAt(item.getCreatedAt())
                .build();
    }
}
