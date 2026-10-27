package com.venuebooking.catalog.controller;

import com.venuebooking.catalog.dto.CanteenItemDto;
import com.venuebooking.catalog.dto.CreateCanteenItemDto;
import com.venuebooking.catalog.dto.UpdateEquipmentDto;
import com.venuebooking.catalog.service.CanteenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Canteen & Equipment Catalog", description = "Snacks, beverages, and equipment rental inventory management")
public class CanteenController {

    private final CanteenService canteenService;

    @GetMapping("/venues/{venueId}/canteen/items")
    @Operation(summary = "List venue canteen & equipment items", description = "Retrieves all available F&B items and equipment rentals with current stock levels")
    public ResponseEntity<List<CanteenItemDto>> listItems(@PathVariable Long venueId) {
        return ResponseEntity.ok(canteenService.listVenueItems(venueId));
    }

    @GetMapping("/venues/{venueId}/equipment")
    @Operation(summary = "List rentable gear & equipment inventory", description = "Retrieves all sports equipment, game controllers, and VR gear with conditions and deposits")
    public ResponseEntity<List<CanteenItemDto>> listEquipment(@PathVariable Long venueId) {
        return ResponseEntity.ok(canteenService.listVenueEquipment(venueId));
    }

    @PostMapping("/venues/{venueId}/canteen/items")
    @Operation(summary = "Register canteen item or equipment", description = "Adds a snack, beverage, or rentable equipment to the venue inventory")
    public ResponseEntity<CanteenItemDto> createItem(
            @PathVariable Long venueId,
            @RequestHeader(value = "X-Tenant-Id", required = false) Long tenantId,
            @Valid @RequestBody CreateCanteenItemDto req
    ) {
        CanteenItemDto created = canteenService.createItem(venueId, tenantId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/venues/{venueId}/equipment/{itemId}")
    @Operation(summary = "Update equipment rental asset", description = "Updates equipment specifications, rental rate, condition, and security deposit")
    public ResponseEntity<CanteenItemDto> updateEquipment(
            @PathVariable Long venueId,
            @PathVariable Long itemId,
            @RequestBody UpdateEquipmentDto req
    ) {
        return ResponseEntity.ok(canteenService.updateEquipment(itemId, req));
    }

    @PatchMapping("/venues/{venueId}/equipment/{itemId}/condition")
    @Operation(summary = "Update equipment physical condition", description = "Records physical condition changes (EXCELLENT, GOOD, FAIR, MAINTENANCE, DAMAGED)")
    public ResponseEntity<CanteenItemDto> updateCondition(
            @PathVariable Long venueId,
            @PathVariable Long itemId,
            @RequestParam String condition
    ) {
        return ResponseEntity.ok(canteenService.updateEquipmentCondition(itemId, condition));
    }

    @PatchMapping("/canteen/items/{itemId}/stock")
    @Operation(summary = "Adjust inventory stock count", description = "Increases or decreases inventory stock count for an item")
    public ResponseEntity<CanteenItemDto> adjustStock(
            @PathVariable Long itemId,
            @RequestParam int delta
    ) {
        return ResponseEntity.ok(canteenService.adjustStock(itemId, delta));
    }

    @PostMapping("/venues/{venueId}/canteen/items/{itemId}/stock-adjustment")
    @Operation(summary = "Record stock movement in ledger", description = "Records receipt, sale, wastage, return, or manual adjustment with reason and audit trail")
    public ResponseEntity<com.venuebooking.catalog.dto.CanteenStockLedgerDto> recordStockAdjustment(
            @PathVariable Long venueId,
            @PathVariable Long itemId,
            @Valid @RequestBody com.venuebooking.catalog.dto.StockAdjustmentRequestDto req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(canteenService.recordStockAdjustment(itemId, req));
    }

    @GetMapping("/venues/{venueId}/canteen/items/{itemId}/stock-ledger")
    @Operation(summary = "Get stock transaction ledger for item", description = "Lists complete chronological stock movement history for a specific canteen or equipment item")
    public ResponseEntity<List<com.venuebooking.catalog.dto.CanteenStockLedgerDto>> getItemStockLedger(
            @PathVariable Long venueId,
            @PathVariable Long itemId
    ) {
        return ResponseEntity.ok(canteenService.getItemStockLedger(itemId));
    }

    @GetMapping("/venues/{venueId}/canteen/stock-ledger")
    @Operation(summary = "Get venue-wide stock movements ledger", description = "Lists recent stock movements across all items for the venue")
    public ResponseEntity<List<com.venuebooking.catalog.dto.CanteenStockLedgerDto>> getVenueStockLedger(
            @PathVariable Long venueId
    ) {
        return ResponseEntity.ok(canteenService.getVenueStockLedger(venueId));
    }

    @GetMapping("/venues/{venueId}/canteen/low-stock-alerts")
    @Operation(summary = "Get items with low stock alerts", description = "Returns all items currently at or below their low-stock threshold")
    public ResponseEntity<List<CanteenItemDto>> getLowStockItems(
            @PathVariable Long venueId
    ) {
        return ResponseEntity.ok(canteenService.getLowStockItems(venueId));
    }
}
