package com.venuebooking.booking.controller;

import com.venuebooking.booking.dto.CreateMembershipPlanDto;
import com.venuebooking.booking.dto.CustomerMembershipDto;
import com.venuebooking.booking.dto.MembershipPlanDto;
import com.venuebooking.booking.dto.PurchaseMembershipRequestDto;
import com.venuebooking.booking.service.MembershipService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/memberships")
@RequiredArgsConstructor
@Tag(name = "Membership Plans & Passes API", description = "VIP tiers, passes, customer memberships, and auto-discount engine")
public class MembershipController {

    private final MembershipService membershipService;

    @GetMapping("/plans")
    @Operation(summary = "Get active membership plans for the venue")
    public ResponseEntity<List<MembershipPlanDto>> getActivePlans(
            @RequestHeader("X-Tenant-Id") Long tenantId
    ) {
        return ResponseEntity.ok(membershipService.getPlans(tenantId));
    }

    @GetMapping("/plans/all")
    @Operation(summary = "Get all membership plans including inactive (for owner/manager)")
    public ResponseEntity<List<MembershipPlanDto>> getAllPlans(
            @RequestHeader("X-Tenant-Id") Long tenantId
    ) {
        return ResponseEntity.ok(membershipService.getAllPlans(tenantId));
    }

    @PostMapping("/plans")
    @Operation(summary = "Create a new membership tier / plan (owner/manager)")
    public ResponseEntity<MembershipPlanDto> createPlan(
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @Valid @RequestBody CreateMembershipPlanDto request
    ) {
        MembershipPlanDto plan = membershipService.createPlan(tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(plan);
    }

    @PutMapping("/plans/{planId}/toggle")
    @Operation(summary = "Toggle active/inactive status of a membership plan")
    public ResponseEntity<MembershipPlanDto> togglePlan(
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @PathVariable Long planId
    ) {
        return ResponseEntity.ok(membershipService.togglePlanActive(tenantId, planId));
    }

    @PostMapping("/purchase")
    @Operation(summary = "Purchase a membership plan for customer")
    public ResponseEntity<CustomerMembershipDto> purchaseMembership(
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @Valid @RequestBody PurchaseMembershipRequestDto request
    ) {
        return ResponseEntity.ok(membershipService.purchaseMembership(tenantId, request));
    }

    @GetMapping("/customer/{userId}/active")
    @Operation(summary = "Get current active membership for a customer")
    public ResponseEntity<CustomerMembershipDto> getActiveMembership(
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @PathVariable Long userId
    ) {
        return membershipService.getActiveMembership(tenantId, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/customer/{userId}/history")
    @Operation(summary = "Get membership purchase history for a customer")
    public ResponseEntity<List<CustomerMembershipDto>> getCustomerMemberships(
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(membershipService.getCustomerMemberships(tenantId, userId));
    }

    @GetMapping("/ledger")
    @Operation(summary = "Get all customer memberships across the venue (owner/manager)")
    public ResponseEntity<List<CustomerMembershipDto>> getTenantMemberships(
            @RequestHeader("X-Tenant-Id") Long tenantId
    ) {
        return ResponseEntity.ok(membershipService.getTenantMemberships(tenantId));
    }
}
