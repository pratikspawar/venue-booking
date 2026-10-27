package com.venuebooking.catalog.service;

import com.venuebooking.catalog.dto.CanteenItemDto;
import com.venuebooking.catalog.dto.CreateCanteenItemDto;
import com.venuebooking.catalog.dto.UpdateEquipmentDto;
import com.venuebooking.catalog.entity.CanteenItem;
import com.venuebooking.catalog.repository.CanteenItemRepository;
import com.venuebooking.common.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Equipment & Gear Tracking Service Tests")
class EquipmentServiceTest {

    @Mock
    private CanteenItemRepository canteenItemRepository;

    @Mock
    private com.venuebooking.catalog.repository.CanteenStockLedgerRepository canteenStockLedgerRepository;

    @InjectMocks
    private CanteenService canteenService;

    private static final Long VENUE_ID = 10L;
    private static final Long TENANT_ID = 100L;

    @Test
    @DisplayName("Create equipment sets isEquipment=true, conditionStatus, deposit and serial")
    void testCreateEquipment_Success() {
        CreateCanteenItemDto req = CreateCanteenItemDto.builder()
                .name("PS5 DualSense Controller (Midnight Black)")
                .category(CanteenItem.Category.EQUIPMENT_RENTAL)
                .pricePaise(5000L) // ₹50 rental
                .stockCount(4)
                .lowStockThreshold(1)
                .isEquipment(true)
                .conditionStatus("EXCELLENT")
                .depositPaise(20000L) // ₹200 deposit
                .serialNumber("PS5-CTRL-01")
                .build();

        CanteenItem saved = CanteenItem.builder()
                .id(1L)
                .tenantId(TENANT_ID)
                .venueId(VENUE_ID)
                .name(req.getName())
                .category(req.getCategory())
                .pricePaise(req.getPricePaise())
                .stockCount(req.getStockCount())
                .lowStockThreshold(req.getLowStockThreshold())
                .isEquipment(true)
                .conditionStatus(CanteenItem.ConditionStatus.EXCELLENT)
                .depositPaise(req.getDepositPaise())
                .serialNumber(req.getSerialNumber())
                .active(true)
                .build();

        when(canteenItemRepository.save(any(CanteenItem.class))).thenReturn(saved);

        CanteenItemDto dto = canteenService.createItem(VENUE_ID, TENANT_ID, req);

        assertNotNull(dto);
        assertEquals("PS5 DualSense Controller (Midnight Black)", dto.getName());
        assertTrue(dto.getIsEquipment());
        assertEquals("EXCELLENT", dto.getConditionStatus());
        assertEquals(20000L, dto.getDepositPaise());
        assertEquals("PS5-CTRL-01", dto.getSerialNumber());
    }

    @Test
    @DisplayName("List venue equipment retrieves only active gear")
    void testListVenueEquipment_Success() {
        CanteenItem item = CanteenItem.builder()
                .id(2L)
                .tenantId(TENANT_ID)
                .venueId(VENUE_ID)
                .name("English Willow Bat")
                .category(CanteenItem.Category.EQUIPMENT_RENTAL)
                .pricePaise(10000L)
                .stockCount(3)
                .isEquipment(true)
                .conditionStatus(CanteenItem.ConditionStatus.GOOD)
                .depositPaise(50000L)
                .serialNumber("BAT-EW-02")
                .active(true)
                .build();

        when(canteenItemRepository.findByVenueIdAndIsEquipmentTrueAndActiveTrue(VENUE_ID))
                .thenReturn(List.of(item));

        List<CanteenItemDto> list = canteenService.listVenueEquipment(VENUE_ID);

        assertEquals(1, list.size());
        assertEquals("English Willow Bat", list.get(0).getName());
        assertEquals("GOOD", list.get(0).getConditionStatus());
        assertEquals("BAT-EW-02", list.get(0).getSerialNumber());
    }

    @Test
    @DisplayName("Update equipment updates condition, stock and deposit")
    void testUpdateEquipment_Success() {
        CanteenItem item = CanteenItem.builder()
                .id(3L)
                .tenantId(TENANT_ID)
                .venueId(VENUE_ID)
                .name("Meta Quest 3 VR Headset")
                .pricePaise(15000L)
                .stockCount(2)
                .conditionStatus(CanteenItem.ConditionStatus.GOOD)
                .depositPaise(100000L)
                .active(true)
                .build();

        when(canteenItemRepository.findById(3L)).thenReturn(Optional.of(item));
        when(canteenItemRepository.save(item)).thenReturn(item);

        UpdateEquipmentDto updateDto = UpdateEquipmentDto.builder()
                .conditionStatus("MAINTENANCE")
                .stockCount(1)
                .depositPaise(120000L)
                .build();

        CanteenItemDto dto = canteenService.updateEquipment(3L, updateDto);

        assertEquals("MAINTENANCE", dto.getConditionStatus());
        assertEquals(1, dto.getStockCount());
        assertEquals(120000L, dto.getDepositPaise());
    }

    @Test
    @DisplayName("Update equipment condition updates condition enum successfully")
    void testUpdateEquipmentCondition_Success() {
        CanteenItem item = CanteenItem.builder()
                .id(4L)
                .tenantId(TENANT_ID)
                .venueId(VENUE_ID)
                .name("Snooker Cue - Ash Wood")
                .conditionStatus(CanteenItem.ConditionStatus.GOOD)
                .active(true)
                .build();

        when(canteenItemRepository.findById(4L)).thenReturn(Optional.of(item));
        when(canteenItemRepository.save(item)).thenReturn(item);

        CanteenItemDto dto = canteenService.updateEquipmentCondition(4L, "DAMAGED");

        assertEquals("DAMAGED", dto.getConditionStatus());
    }

    @Test
    @DisplayName("Invalid condition name throws BusinessException")
    void testUpdateEquipmentCondition_Invalid_Throws() {
        CanteenItem item = CanteenItem.builder().id(5L).build();
        when(canteenItemRepository.findById(5L)).thenReturn(Optional.of(item));

        assertThrows(BusinessException.class, () ->
                canteenService.updateEquipmentCondition(5L, "UNKNOWN_CONDITION")
        );
    }
}
