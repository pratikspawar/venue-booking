package com.venuebooking.catalog.controller;

import com.venuebooking.catalog.dto.*;
import com.venuebooking.catalog.entity.ResourceBlock;
import com.venuebooking.catalog.service.ResourceService;
import com.venuebooking.catalog.service.VenueService;
import com.venuebooking.common.BusinessException;
import com.venuebooking.common.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/owner")
@RequiredArgsConstructor
@Tag(name = "Owner Catalog Management", description = "Tenant owner endpoints for venues, resources, hours, and pricing rules")
public class OwnerCatalogController {

    private final VenueService venueService;
    private final ResourceService resourceService;

    private Long requireTenantId(Long headerTenantId) {
        Long tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        if (tenantId == null) {
            throw BusinessException.forbidden("Tenant context required for owner operations");
        }
        return tenantId;
    }

    private Long requireTenantId() {
        return requireTenantId(null);
    }

    @PostMapping("/venues")
    @Operation(summary = "Create venue", description = "Onboard a new venue under the authenticated tenant")
    public ResponseEntity<VenueDto> createVenue(@Valid @RequestBody CreateVenueDto dto) {
        return ResponseEntity.ok(venueService.createVenue(requireTenantId(), dto));
    }

    @PutMapping("/venues/{id}")
    @Operation(summary = "Update venue", description = "Update venue details, address, or payment modes")
    public ResponseEntity<VenueDto> updateVenue(@PathVariable Long id, @Valid @RequestBody CreateVenueDto dto) {
        return ResponseEntity.ok(venueService.updateVenue(requireTenantId(), id, dto));
    }

    @PutMapping("/venues/{id}/hours")
    @Operation(summary = "Set venue operating hours", description = "Configure weekly operating hours grid for a venue")
    public ResponseEntity<Map<String, String>> setOperatingHours(
            @PathVariable Long id,
            @RequestBody List<VenueHoursDto> hours
    ) {
        venueService.setOperatingHours(requireTenantId(), id, hours);
        return ResponseEntity.ok(Map.of("message", "Operating hours updated successfully"));
    }

    @GetMapping("/venues")
    @Operation(summary = "List tenant venues", description = "List all venues managed by the authenticated tenant")
    public ResponseEntity<List<VenueDto>> listTenantVenues() {
        return ResponseEntity.ok(venueService.listVenuesByTenant(requireTenantId()));
    }

    @PostMapping("/resources")
    @Operation(summary = "Add gaming resource", description = "Add a new PlayStation console, pool table, or turf pitch")
    public ResponseEntity<ResourceDto> createResource(@Valid @RequestBody CreateResourceDto dto) {
        return ResponseEntity.ok(resourceService.createResource(requireTenantId(), dto));
    }

    @PutMapping("/resources/{id}")
    @Operation(summary = "Update gaming resource", description = "Update resource details, capacity, or slot length")
    public ResponseEntity<ResourceDto> updateResource(@PathVariable Long id, @Valid @RequestBody CreateResourceDto dto) {
        return ResponseEntity.ok(resourceService.updateResource(requireTenantId(), id, dto));
    }

    @GetMapping("/resources/{id}/pricing-rules")
    @Operation(summary = "Get pricing rules", description = "Get dynamic weekday/weekend and peak/off-peak rates for resource")
    public ResponseEntity<List<PricingRuleDto>> getPricingRules(
            @PathVariable Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) Long tenantIdHeader
    ) {
        return ResponseEntity.ok(resourceService.getPricingRules(requireTenantId(tenantIdHeader), id));
    }

    @PutMapping("/resources/{id}/pricing-rules")
    @Operation(summary = "Configure pricing rules", description = "Set up peak/off-peak and weekday/weekend rates")
    public ResponseEntity<Map<String, String>> setPricingRules(
            @PathVariable Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) Long tenantIdHeader,
            @RequestBody List<PricingRuleDto> rules
    ) {
        resourceService.setPricingRules(requireTenantId(tenantIdHeader), id, rules);
        return ResponseEntity.ok(Map.of("message", "Pricing rules updated successfully"));
    }

    @PostMapping("/resources/{id}/blocks")
    @Operation(summary = "Block resource", description = "Block a resource for maintenance, tournament, or private event")
    public ResponseEntity<ResourceBlock> blockResource(
            @PathVariable Long id,
            @RequestParam Instant startUtc,
            @RequestParam Instant endUtc,
            @RequestParam(required = false) String reason
    ) {
        return ResponseEntity.ok(resourceService.addBlock(requireTenantId(), id, startUtc, endUtc, reason));
    }
}
