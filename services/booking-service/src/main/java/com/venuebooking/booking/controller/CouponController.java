package com.venuebooking.booking.controller;

import com.venuebooking.booking.dto.CouponDto;
import com.venuebooking.booking.dto.CouponValidationResponseDto;
import com.venuebooking.booking.dto.CreateCouponDto;
import com.venuebooking.booking.dto.ValidateCouponRequestDto;
import com.venuebooking.booking.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/coupons")
@RequiredArgsConstructor
@Tag(name = "Coupons & Promotional Discounts API", description = "Tenant promo codes, validation quotes, and redemption tracking")
public class CouponController {

    private final CouponService couponService;

    @GetMapping
    @Operation(summary = "Get all coupons for venue (owner/manager)")
    public ResponseEntity<List<CouponDto>> getCoupons(
            @RequestHeader("X-Tenant-Id") Long tenantId
    ) {
        return ResponseEntity.ok(couponService.getTenantCoupons(tenantId));
    }

    @PostMapping
    @Operation(summary = "Create a new promotional coupon code")
    public ResponseEntity<CouponDto> createCoupon(
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @Valid @RequestBody CreateCouponDto request
    ) {
        CouponDto coupon = couponService.createCoupon(tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(coupon);
    }

    @PostMapping("/validate")
    @Operation(summary = "Validate and compute discount quote for a promo code")
    public ResponseEntity<CouponValidationResponseDto> validateCoupon(
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @Valid @RequestBody ValidateCouponRequestDto request
    ) {
        CouponValidationResponseDto response = couponService.validateAndQuoteCoupon(
                tenantId,
                request.code(),
                request.bookingAmountPaise(),
                request.sportCode()
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{couponId}")
    @Operation(summary = "Deactivate/delete a coupon")
    public ResponseEntity<Void> deleteCoupon(
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @PathVariable Long couponId
    ) {
        couponService.deleteCoupon(tenantId, couponId);
        return ResponseEntity.noContent().build();
    }
}
