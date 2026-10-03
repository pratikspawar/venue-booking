package com.venuebooking.catalog.controller;

import com.venuebooking.catalog.dto.CanteenItemDto;
import com.venuebooking.catalog.dto.CreateCanteenItemDto;
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

    @PatchMapping("/canteen/items/{itemId}/stock")
    @Operation(summary = "Adjust inventory stock count", description = "Increases or decreases inventory stock count for an item")
    public ResponseEntity<CanteenItemDto> adjustStock(
            @PathVariable Long itemId,
            @RequestParam int delta
    ) {
        return ResponseEntity.ok(canteenService.adjustStock(itemId, delta));
    }
}
