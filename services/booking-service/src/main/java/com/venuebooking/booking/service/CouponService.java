package com.venuebooking.booking.service;

import com.venuebooking.booking.dto.CouponDto;
import com.venuebooking.booking.dto.CouponValidationResponseDto;
import com.venuebooking.booking.dto.CreateCouponDto;
import com.venuebooking.booking.entity.Coupon;
import com.venuebooking.booking.repository.CouponRepository;
import com.venuebooking.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CouponService {

    private final CouponRepository couponRepository;

    @Transactional
    public CouponDto createCoupon(Long tenantId, CreateCouponDto request) {
        String cleanCode = request.code().trim().toUpperCase();

        Optional<Coupon> existing = couponRepository.findByTenantIdAndCodeIgnoreCaseAndActiveTrue(tenantId, cleanCode);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("A coupon with code '" + cleanCode + "' already exists and is active.");
        }

        Coupon coupon = Coupon.builder()
                .tenantId(tenantId)
                .code(cleanCode)
                .discountType(request.discountType())
                .discountValue(request.discountValue())
                .minBookingAmountPaise(request.minBookingAmountPaise() != null ? request.minBookingAmountPaise() : 0L)
                .maxDiscountPaise(request.maxDiscountPaise())
                .applicableSportCode(request.applicableSportCode() != null && !request.applicableSportCode().isBlank() ? request.applicableSportCode().trim().toUpperCase() : null)
                .validFrom(request.validFrom())
                .validTo(request.validTo())
                .maxUses(request.maxUses() != null ? request.maxUses() : 1000)
                .usedCount(0)
                .active(true)
                .build();

        coupon = couponRepository.save(coupon);
        log.info("Coupon created: tenant={}, code={}, discountType={}, value={}",
                tenantId, cleanCode, request.discountType(), request.discountValue());

        return toDto(coupon);
    }

    @Transactional(readOnly = true)
    public List<CouponDto> getTenantCoupons(Long tenantId) {
        return couponRepository.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public CouponValidationResponseDto validateAndQuoteCoupon(Long tenantId, String code, Long bookingAmountPaise, String sportCode) {
        if (code == null || code.isBlank()) {
            return new CouponValidationResponseDto(false, null, code, 0L, 0.0, bookingAmountPaise, bookingAmountPaise / 100.0, "Coupon code is empty.");
        }

        String cleanCode = code.trim().toUpperCase();
        Optional<Coupon> opt = couponRepository.findByTenantIdAndCodeIgnoreCaseAndActiveTrue(tenantId, cleanCode);

        if (opt.isEmpty()) {
            return new CouponValidationResponseDto(false, null, cleanCode, 0L, 0.0, bookingAmountPaise, bookingAmountPaise / 100.0, "Invalid coupon code or expired.");
        }

        Coupon coupon = opt.get();
        Instant now = Instant.now();

        if (now.isBefore(coupon.getValidFrom()) || now.isAfter(coupon.getValidTo())) {
            return new CouponValidationResponseDto(false, coupon.getId(), cleanCode, 0L, 0.0, bookingAmountPaise, bookingAmountPaise / 100.0, "Coupon has expired or is not yet active.");
        }

        if (coupon.getUsedCount() >= coupon.getMaxUses()) {
            return new CouponValidationResponseDto(false, coupon.getId(), cleanCode, 0L, 0.0, bookingAmountPaise, bookingAmountPaise / 100.0, "Coupon usage limit has been reached.");
        }

        if (bookingAmountPaise < coupon.getMinBookingAmountPaise()) {
            return new CouponValidationResponseDto(
                    false, coupon.getId(), cleanCode, 0L, 0.0, bookingAmountPaise, bookingAmountPaise / 100.0,
                    String.format("Minimum booking amount of ₹%.2f required to apply this coupon.", coupon.getMinBookingAmountPaise() / 100.0)
            );
        }

        // Dynamic sport applicability check (Zero Hardcoding)
        if (coupon.getApplicableSportCode() != null && !coupon.getApplicableSportCode().isBlank()) {
            if (sportCode == null || !coupon.getApplicableSportCode().equalsIgnoreCase(sportCode.trim())) {
                return new CouponValidationResponseDto(
                        false, coupon.getId(), cleanCode, 0L, 0.0, bookingAmountPaise, bookingAmountPaise / 100.0,
                        "Coupon is only valid for " + coupon.getApplicableSportCode() + " sessions."
                );
            }
        }

        // Calculate discount
        long discountPaise;
        if (coupon.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
            discountPaise = (bookingAmountPaise * coupon.getDiscountValue()) / 100;
            if (coupon.getMaxDiscountPaise() != null && coupon.getMaxDiscountPaise() > 0) {
                discountPaise = Math.min(discountPaise, coupon.getMaxDiscountPaise());
            }
        } else {
            discountPaise = Math.min(bookingAmountPaise, coupon.getDiscountValue());
        }

        long finalAmountPaise = Math.max(0L, bookingAmountPaise - discountPaise);

        return new CouponValidationResponseDto(
                true,
                coupon.getId(),
                cleanCode,
                discountPaise,
                discountPaise / 100.0,
                finalAmountPaise,
                finalAmountPaise / 100.0,
                String.format("Promo code '%s' applied! You saved ₹%.2f", cleanCode, discountPaise / 100.0)
        );
    }

    @Transactional
    public void recordRedemption(Long tenantId, Long couponId) {
        if (couponId == null) return;
        couponRepository.findById(couponId).ifPresent(coupon -> {
            if (coupon.getTenantId().equals(tenantId)) {
                coupon.setUsedCount(coupon.getUsedCount() + 1);
                if (coupon.getUsedCount() >= coupon.getMaxUses()) {
                    coupon.setActive(false);
                }
                couponRepository.save(coupon);
            }
        });
    }

    @Transactional
    public void deleteCoupon(Long tenantId, Long couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found: " + couponId));
        if (!coupon.getTenantId().equals(tenantId)) {
            throw new ResourceNotFoundException("Coupon not found in tenant");
        }
        coupon.setActive(false);
        couponRepository.save(coupon);
    }

    private CouponDto toDto(Coupon c) {
        return new CouponDto(
                c.getId(),
                c.getCode(),
                c.getDiscountType().name(),
                c.getDiscountValue(),
                c.getMinBookingAmountPaise(),
                c.getMaxDiscountPaise(),
                c.getApplicableSportCode(),
                c.getValidFrom(),
                c.getValidTo(),
                c.getMaxUses(),
                c.getUsedCount(),
                c.getActive(),
                c.getCreatedAt()
        );
    }
}
