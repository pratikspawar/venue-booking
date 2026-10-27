package com.venuebooking.catalog.service;

import com.venuebooking.catalog.dto.CanteenItemDto;
import com.venuebooking.catalog.dto.CanteenStockLedgerDto;
import com.venuebooking.catalog.dto.CreateCanteenItemDto;
import com.venuebooking.catalog.dto.StockAdjustmentRequestDto;
import com.venuebooking.catalog.dto.UpdateEquipmentDto;
import com.venuebooking.catalog.entity.CanteenItem;
import com.venuebooking.catalog.entity.CanteenStockLedger;
import com.venuebooking.catalog.repository.CanteenItemRepository;
import com.venuebooking.catalog.repository.CanteenStockLedgerRepository;
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
    private final CanteenStockLedgerRepository canteenStockLedgerRepository;

    @Transactional(readOnly = true)
    public List<CanteenItemDto> listVenueItems(Long venueId) {
        return canteenItemRepository.findByVenueIdAndActiveTrue(venueId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CanteenItemDto> listVenueEquipment(Long venueId) {
        return canteenItemRepository.findByVenueIdAndIsEquipmentTrueAndActiveTrue(venueId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public CanteenItemDto createItem(Long venueId, Long tenantId, CreateCanteenItemDto req) {
        boolean isEquipment = Boolean.TRUE.equals(req.getIsEquipment())
                || req.getCategory() == CanteenItem.Category.EQUIPMENT_RENTAL;

        CanteenItem.ConditionStatus conditionStatus = CanteenItem.ConditionStatus.GOOD;
        if (req.getConditionStatus() != null && !req.getConditionStatus().isBlank()) {
            try {
                conditionStatus = CanteenItem.ConditionStatus.valueOf(req.getConditionStatus().trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        CanteenItem item = CanteenItem.builder()
                .tenantId(tenantId != null ? tenantId : 1L)
                .venueId(venueId)
                .name(req.getName().trim())
                .category(req.getCategory())
                .pricePaise(req.getPricePaise())
                .stockCount(req.getStockCount() != null ? req.getStockCount() : 0)
                .lowStockThreshold(req.getLowStockThreshold() != null ? req.getLowStockThreshold() : 5)
                .isEquipment(isEquipment)
                .conditionStatus(conditionStatus)
                .depositPaise(req.getDepositPaise() != null ? req.getDepositPaise() : 0L)
                .serialNumber(req.getSerialNumber() != null && !req.getSerialNumber().isBlank() ? req.getSerialNumber().trim() : null)
                .active(true)
                .build();

        CanteenItem saved = canteenItemRepository.save(item);
        log.info("Created canteen/equipment item #{} [{}] for venue #{}", saved.getId(), saved.getName(), venueId);
        return toDto(saved);
    }

    @Transactional
    public CanteenItemDto updateEquipment(Long itemId, UpdateEquipmentDto req) {
        CanteenItem item = canteenItemRepository.findById(itemId)
                .orElseThrow(() -> BusinessException.notFound("Equipment item not found with ID: " + itemId));

        if (req.getName() != null && !req.getName().isBlank()) {
            item.setName(req.getName().trim());
        }
        if (req.getPricePaise() != null) {
            item.setPricePaise(req.getPricePaise());
        }
        if (req.getStockCount() != null) {
            item.setStockCount(req.getStockCount());
        }
        if (req.getLowStockThreshold() != null) {
            item.setLowStockThreshold(req.getLowStockThreshold());
        }
        if (req.getDepositPaise() != null) {
            item.setDepositPaise(req.getDepositPaise());
        }
        if (req.getSerialNumber() != null) {
            item.setSerialNumber(req.getSerialNumber().trim());
        }
        if (req.getConditionStatus() != null && !req.getConditionStatus().isBlank()) {
            try {
                item.setConditionStatus(CanteenItem.ConditionStatus.valueOf(req.getConditionStatus().trim().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw BusinessException.badRequest("Invalid equipment condition: " + req.getConditionStatus());
            }
        }
        if (req.getActive() != null) {
            item.setActive(req.getActive());
        }

        CanteenItem saved = canteenItemRepository.save(item);
        log.info("Updated equipment #{} [{}] condition={}, stock={}", saved.getId(), saved.getName(), saved.getConditionStatus(), saved.getStockCount());
        return toDto(saved);
    }

    @Transactional
    public CanteenItemDto updateEquipmentCondition(Long itemId, String conditionStr) {
        CanteenItem item = canteenItemRepository.findById(itemId)
                .orElseThrow(() -> BusinessException.notFound("Equipment item not found with ID: " + itemId));

        try {
            CanteenItem.ConditionStatus status = CanteenItem.ConditionStatus.valueOf(conditionStr.trim().toUpperCase());
            item.setConditionStatus(status);
        } catch (IllegalArgumentException e) {
            throw BusinessException.badRequest("Invalid equipment condition status: " + conditionStr);
        }

        CanteenItem saved = canteenItemRepository.save(item);
        log.info("Updated equipment #{} condition to {}", saved.getId(), saved.getConditionStatus());
        return toDto(saved);
    }

    @Transactional
    public CanteenItemDto adjustStock(Long itemId, int delta) {
        StockAdjustmentRequestDto req = StockAdjustmentRequestDto.builder()
                .transactionType(delta >= 0 ? CanteenStockLedger.TransactionType.RECEIPT : CanteenStockLedger.TransactionType.ADJUSTMENT)
                .quantityChange(delta)
                .reason(delta >= 0 ? "Manual stock addition" : "Manual stock deduction")
                .build();
        recordStockAdjustment(itemId, req);
        return toDto(canteenItemRepository.findById(itemId).orElseThrow());
    }

    @Transactional
    public CanteenStockLedgerDto recordStockAdjustment(Long itemId, StockAdjustmentRequestDto req) {
        CanteenItem item = canteenItemRepository.findById(itemId)
                .orElseThrow(() -> BusinessException.notFound("Canteen item not found"));

        int prevStock = item.getStockCount();
        int newStock = prevStock + req.getQuantityChange();
        if (newStock < 0) {
            throw new BusinessException("INSUFFICIENT_STOCK",
                    "Insufficient inventory stock for item: " + item.getName() + " (Available: " + prevStock + ", Requested deduction: " + Math.abs(req.getQuantityChange()) + ")");
        }

        item.setStockCount(newStock);
        canteenItemRepository.save(item);

        CanteenStockLedger ledger = CanteenStockLedger.builder()
                .tenantId(item.getTenantId())
                .venueId(item.getVenueId())
                .canteenItemId(item.getId())
                .transactionType(req.getTransactionType())
                .quantityChange(req.getQuantityChange())
                .previousStock(prevStock)
                .newStock(newStock)
                .unitCostPaise(req.getUnitCostPaise())
                .reason(req.getReason())
                .referenceId(req.getReferenceId())
                .performedBy(req.getPerformedBy())
                .build();

        CanteenStockLedger savedLedger = canteenStockLedgerRepository.save(ledger);

        if (newStock <= item.getLowStockThreshold()) {
            log.warn("LOW STOCK ALERT: Item '{}' (ID #{}) remaining: {} (Threshold: {})",
                    item.getName(), item.getId(), newStock, item.getLowStockThreshold());
        }

        return toLedgerDto(savedLedger, item.getName());
    }

    @Transactional(readOnly = true)
    public List<CanteenStockLedgerDto> getItemStockLedger(Long itemId) {
        CanteenItem item = canteenItemRepository.findById(itemId)
                .orElseThrow(() -> BusinessException.notFound("Canteen item not found"));
        return canteenStockLedgerRepository.findByCanteenItemIdOrderByCreatedAtDesc(itemId).stream()
                .map(l -> toLedgerDto(l, item.getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CanteenStockLedgerDto> getVenueStockLedger(Long venueId) {
        return canteenStockLedgerRepository.findByVenueIdOrderByCreatedAtDesc(venueId).stream()
                .map(l -> {
                    String itemName = canteenItemRepository.findById(l.getCanteenItemId())
                            .map(CanteenItem::getName).orElse("Item #" + l.getCanteenItemId());
                    return toLedgerDto(l, itemName);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CanteenItemDto> getLowStockItems(Long venueId) {
        return canteenItemRepository.findByVenueIdAndActiveTrue(venueId).stream()
                .filter(i -> i.getStockCount() <= i.getLowStockThreshold())
                .map(this::toDto)
                .toList();
    }

    private CanteenStockLedgerDto toLedgerDto(CanteenStockLedger l, String itemName) {
        return CanteenStockLedgerDto.builder()
                .id(l.getId())
                .tenantId(l.getTenantId())
                .venueId(l.getVenueId())
                .canteenItemId(l.getCanteenItemId())
                .itemName(itemName)
                .transactionType(l.getTransactionType())
                .quantityChange(l.getQuantityChange())
                .previousStock(l.getPreviousStock())
                .newStock(l.getNewStock())
                .unitCostPaise(l.getUnitCostPaise())
                .reason(l.getReason())
                .referenceId(l.getReferenceId())
                .performedBy(l.getPerformedBy())
                .createdAt(l.getCreatedAt())
                .build();
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
                .conditionStatus(item.getConditionStatus() != null ? item.getConditionStatus().name() : "GOOD")
                .depositPaise(item.getDepositPaise() != null ? item.getDepositPaise() : 0L)
                .serialNumber(item.getSerialNumber())
                .isLowStock(item.getStockCount() <= item.getLowStockThreshold())
                .active(item.getActive())
                .createdAt(item.getCreatedAt())
                .build();
    }
}
