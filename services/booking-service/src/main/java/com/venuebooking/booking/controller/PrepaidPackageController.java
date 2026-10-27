package com.venuebooking.booking.controller;

import com.venuebooking.booking.dto.CreatePrepaidPackageDto;
import com.venuebooking.booking.dto.CustomerPrepaidPackageDto;
import com.venuebooking.booking.dto.PrepaidPackageDto;
import com.venuebooking.booking.dto.PurchasePrepaidPackageRequestDto;
import com.venuebooking.booking.service.PrepaidPackageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/prepaid-packages")
@RequiredArgsConstructor
@Tag(name = "Prepaid Game Hours Packages API", description = "Bulk hours packages, customer bundle purchases, and hourly deduction ledger")
public class PrepaidPackageController {

    private final PrepaidPackageService prepaidPackageService;

    @GetMapping
    @Operation(summary = "Get active prepaid hours packages for venue")
    public ResponseEntity<List<PrepaidPackageDto>> getActivePackages(
            @RequestHeader("X-Tenant-Id") Long tenantId
    ) {
        return ResponseEntity.ok(prepaidPackageService.getPackages(tenantId));
    }

    @GetMapping("/all")
    @Operation(summary = "Get all prepaid hours packages including inactive (for owner/manager)")
    public ResponseEntity<List<PrepaidPackageDto>> getAllPackages(
            @RequestHeader("X-Tenant-Id") Long tenantId
    ) {
        return ResponseEntity.ok(prepaidPackageService.getAllPackages(tenantId));
    }

    @PostMapping
    @Operation(summary = "Create a new prepaid hours bundle package (owner/manager)")
    public ResponseEntity<PrepaidPackageDto> createPackage(
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @Valid @RequestBody CreatePrepaidPackageDto request
    ) {
        PrepaidPackageDto created = prepaidPackageService.createPackage(tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{packageId}/toggle")
    @Operation(summary = "Toggle active/inactive status of a prepaid package")
    public ResponseEntity<PrepaidPackageDto> togglePackage(
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @PathVariable Long packageId
    ) {
        return ResponseEntity.ok(prepaidPackageService.togglePackageActive(tenantId, packageId));
    }

    @PostMapping("/purchase")
    @Operation(summary = "Purchase a prepaid hours package for customer")
    public ResponseEntity<CustomerPrepaidPackageDto> purchasePackage(
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @Valid @RequestBody PurchasePrepaidPackageRequestDto request
    ) {
        return ResponseEntity.ok(prepaidPackageService.purchasePackage(tenantId, request));
    }

    @GetMapping("/customer/{userId}/active")
    @Operation(summary = "Get active prepaid packages with remaining hours for a customer")
    public ResponseEntity<List<CustomerPrepaidPackageDto>> getCustomerPackages(
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(prepaidPackageService.getActiveCustomerPackages(tenantId, userId));
    }

    @GetMapping("/ledger")
    @Operation(summary = "Get all customer prepaid hours package purchases across venue (owner/manager)")
    public ResponseEntity<List<CustomerPrepaidPackageDto>> getTenantLedger(
            @RequestHeader("X-Tenant-Id") Long tenantId
    ) {
        return ResponseEntity.ok(prepaidPackageService.getTenantLedger(tenantId));
    }
}
