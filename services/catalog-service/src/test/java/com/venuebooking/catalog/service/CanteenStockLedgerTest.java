package com.venuebooking.catalog.service;

import com.venuebooking.catalog.dto.CanteenItemDto;
import com.venuebooking.catalog.dto.CanteenStockLedgerDto;
import com.venuebooking.catalog.dto.StockAdjustmentRequestDto;
import com.venuebooking.catalog.entity.CanteenItem;
import com.venuebooking.catalog.entity.CanteenStockLedger;
import com.venuebooking.catalog.repository.CanteenItemRepository;
import com.venuebooking.catalog.repository.CanteenStockLedgerRepository;
import com.venuebooking.common.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Canteen Stock Ledger & Low-Stock Alerts Tests")
class CanteenStockLedgerTest {

    @Mock
    private CanteenItemRepository canteenItemRepository;

    @Mock
    private CanteenStockLedgerRepository canteenStockLedgerRepository;

    @InjectMocks
    private CanteenService canteenService;

    private static final Long VENUE_ID = 1L;
    private static final Long TENANT_ID = 1L;
    private static final Long ITEM_ID = 5L;

    @Test
    @DisplayName("Stock Receipt increases item inventory and creates immutable ledger entry")
    void testRecordStockAdjustment_Receipt() {
        CanteenItem item = CanteenItem.builder()
                .id(ITEM_ID)
                .tenantId(TENANT_ID)
                .venueId(VENUE_ID)
                .name("Red Bull 250ml")
                .category(CanteenItem.Category.BEVERAGE)
                .pricePaise(12500L)
                .stockCount(10)
                .lowStockThreshold(5)
                .active(true)
                .build();

        when(canteenItemRepository.findById(ITEM_ID)).thenReturn(Optional.of(item));
        when(canteenStockLedgerRepository.save(any(CanteenStockLedger.class))).thenAnswer(invocation -> {
            CanteenStockLedger l = invocation.getArgument(0);
            l.setId(100L);
            l.setCreatedAt(Instant.now());
            return l;
        });

        StockAdjustmentRequestDto req = StockAdjustmentRequestDto.builder()
                .transactionType(CanteenStockLedger.TransactionType.RECEIPT)
                .quantityChange(20)
                .unitCostPaise(8000L)
                .reason("Weekly vendor delivery")
                .referenceId("PO-2026-001")
                .performedBy(42L)
                .build();

        CanteenStockLedgerDto result = canteenService.recordStockAdjustment(ITEM_ID, req);

        assertNotNull(result);
        assertEquals(10, result.getPreviousStock());
        assertEquals(30, result.getNewStock());
        assertEquals(20, result.getQuantityChange());
        assertEquals(CanteenStockLedger.TransactionType.RECEIPT, result.getTransactionType());
        assertEquals(30, item.getStockCount());
        verify(canteenItemRepository).save(item);
        verify(canteenStockLedgerRepository).save(any(CanteenStockLedger.class));
    }

    @Test
    @DisplayName("Wastage deduction decreases stock and creates wastage audit record")
    void testRecordStockAdjustment_Wastage() {
        CanteenItem item = CanteenItem.builder()
                .id(ITEM_ID)
                .tenantId(TENANT_ID)
                .venueId(VENUE_ID)
                .name("Mineral Water 1L")
                .category(CanteenItem.Category.BEVERAGE)
                .pricePaise(2000L)
                .stockCount(15)
                .lowStockThreshold(5)
                .active(true)
                .build();

        when(canteenItemRepository.findById(ITEM_ID)).thenReturn(Optional.of(item));
        when(canteenStockLedgerRepository.save(any(CanteenStockLedger.class))).thenAnswer(invocation -> {
            CanteenStockLedger l = invocation.getArgument(0);
            l.setId(101L);
            l.setCreatedAt(Instant.now());
            return l;
        });

        StockAdjustmentRequestDto req = StockAdjustmentRequestDto.builder()
                .transactionType(CanteenStockLedger.TransactionType.WASTAGE)
                .quantityChange(-3)
                .reason("Damaged bottle seal during stocking")
                .performedBy(7L)
                .build();

        CanteenStockLedgerDto result = canteenService.recordStockAdjustment(ITEM_ID, req);

        assertNotNull(result);
        assertEquals(15, result.getPreviousStock());
        assertEquals(12, result.getNewStock());
        assertEquals(-3, result.getQuantityChange());
        assertEquals(CanteenStockLedger.TransactionType.WASTAGE, result.getTransactionType());
        assertEquals(12, item.getStockCount());
    }

    @Test
    @DisplayName("Deduction exceeding available inventory throws INSUFFICIENT_STOCK BusinessException")
    void testRecordStockAdjustment_InsufficientStock() {
        CanteenItem item = CanteenItem.builder()
                .id(ITEM_ID)
                .tenantId(TENANT_ID)
                .venueId(VENUE_ID)
                .name("Gatorade Blue Bolt")
                .category(CanteenItem.Category.BEVERAGE)
                .pricePaise(5000L)
                .stockCount(4)
                .lowStockThreshold(5)
                .active(true)
                .build();

        when(canteenItemRepository.findById(ITEM_ID)).thenReturn(Optional.of(item));

        StockAdjustmentRequestDto req = StockAdjustmentRequestDto.builder()
                .transactionType(CanteenStockLedger.TransactionType.SALE)
                .quantityChange(-10)
                .reason("Counter sale")
                .build();

        BusinessException ex = assertThrows(BusinessException.class,
                () -> canteenService.recordStockAdjustment(ITEM_ID, req));

        assertEquals("INSUFFICIENT_STOCK", ex.getCode());
        verify(canteenStockLedgerRepository, never()).save(any());
    }

    @Test
    @DisplayName("Low stock items query returns items at or below reorder threshold")
    void testGetLowStockItems() {
        CanteenItem itemLow = CanteenItem.builder()
                .id(1L)
                .venueId(VENUE_ID)
                .name("Badminton Shuttlecocks Tube")
                .stockCount(2)
                .lowStockThreshold(5)
                .active(true)
                .build();

        CanteenItem itemNormal = CanteenItem.builder()
                .id(2L)
                .venueId(VENUE_ID)
                .name("Tennis Balls Can")
                .stockCount(20)
                .lowStockThreshold(5)
                .active(true)
                .build();

        when(canteenItemRepository.findByVenueIdAndActiveTrue(VENUE_ID))
                .thenReturn(List.of(itemLow, itemNormal));

        List<CanteenItemDto> lowStock = canteenService.getLowStockItems(VENUE_ID);

        assertEquals(1, lowStock.size());
        assertEquals("Badminton Shuttlecocks Tube", lowStock.get(0).getName());
        assertTrue(lowStock.get(0).getIsLowStock());
    }
}
