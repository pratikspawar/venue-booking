package com.venuebooking.booking.service;

import com.venuebooking.booking.dto.CouponDto;
import com.venuebooking.booking.dto.CouponValidationResponseDto;
import com.venuebooking.booking.dto.CreateCouponDto;
import com.venuebooking.booking.entity.Coupon;
import com.venuebooking.booking.repository.CouponRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CouponServiceTest {

    @Mock
    private CouponRepository couponRepository;

    private CouponService couponService;

    @BeforeEach
    void setUp() {
        couponService = new CouponService(couponRepository);
    }

    @Test
    @DisplayName("Should create promotional coupon code successfully")
    void shouldCreateCoupon() {
        CreateCouponDto dto = new CreateCouponDto(
                "DIWALI50",
                Coupon.DiscountType.PERCENTAGE,
                50L,
                50000L, // min 500
                30000L, // max 300
                "BADMINTON",
                Instant.now().minus(1, ChronoUnit.DAYS),
                Instant.now().plus(10, ChronoUnit.DAYS),
                100
        );

        when(couponRepository.findByTenantIdAndCodeIgnoreCaseAndActiveTrue(1L, "DIWALI50"))
                .thenReturn(Optional.empty());

        Coupon savedCoupon = Coupon.builder()
                .id(10L)
                .tenantId(1L)
                .code("DIWALI50")
                .discountType(Coupon.DiscountType.PERCENTAGE)
                .discountValue(50L)
                .minBookingAmountPaise(50000L)
                .maxDiscountPaise(30000L)
                .applicableSportCode("BADMINTON")
                .validFrom(dto.validFrom())
                .validTo(dto.validTo())
                .maxUses(100)
                .usedCount(0)
                .active(true)
                .createdAt(Instant.now())
                .build();

        when(couponRepository.save(any(Coupon.class))).thenReturn(savedCoupon);

        CouponDto result = couponService.createCoupon(1L, dto);

        assertThat(result).isNotNull();
        assertThat(result.code()).isEqualTo("DIWALI50");
        assertThat(result.discountValue()).isEqualTo(50L);
    }

    @Test
    @DisplayName("Should validate percentage coupon and apply max discount cap")
    void shouldValidateAndQuoteCouponWithCap() {
        Coupon coupon = Coupon.builder()
                .id(1L)
                .tenantId(1L)
                .code("SUPER50")
                .discountType(Coupon.DiscountType.PERCENTAGE)
                .discountValue(50L) // 50%
                .minBookingAmountPaise(20000L) // min ₹200
                .maxDiscountPaise(10000L) // max ₹100
                .applicableSportCode(null)
                .validFrom(Instant.now().minus(1, ChronoUnit.DAYS))
                .validTo(Instant.now().plus(5, ChronoUnit.DAYS))
                .maxUses(50)
                .usedCount(5)
                .active(true)
                .build();

        when(couponRepository.findByTenantIdAndCodeIgnoreCaseAndActiveTrue(1L, "SUPER50"))
                .thenReturn(Optional.of(coupon));

        // Booking is ₹400 (40,000 paise). 50% = ₹200 (20,000 paise), capped at ₹100 (10,000 paise).
        CouponValidationResponseDto response = couponService.validateAndQuoteCoupon(1L, "SUPER50", 40000L, "FOOTBALL");

        assertThat(response.valid()).isTrue();
        assertThat(response.discountPaise()).isEqualTo(10000L); // capped at 10000
        assertThat(response.finalAmountPaise()).isEqualTo(30000L);
    }

    @Test
    @DisplayName("Should reject coupon when applicable sport does not match")
    void shouldRejectWhenSportMismatch() {
        Coupon coupon = Coupon.builder()
                .id(1L)
                .tenantId(1L)
                .code("BOXING20")
                .discountType(Coupon.DiscountType.FLAT)
                .discountValue(2000L)
                .minBookingAmountPaise(10000L)
                .applicableSportCode("BOXING")
                .validFrom(Instant.now().minus(1, ChronoUnit.DAYS))
                .validTo(Instant.now().plus(5, ChronoUnit.DAYS))
                .maxUses(50)
                .usedCount(0)
                .active(true)
                .build();

        when(couponRepository.findByTenantIdAndCodeIgnoreCaseAndActiveTrue(1L, "BOXING20"))
                .thenReturn(Optional.of(coupon));

        CouponValidationResponseDto response = couponService.validateAndQuoteCoupon(1L, "BOXING20", 30000L, "CRICKET");

        assertThat(response.valid()).isFalse();
        assertThat(response.message()).contains("only valid for BOXING");
    }

    @Test
    @DisplayName("Should increment usedCount and deactivate upon reaching max uses on redemption")
    void shouldRecordRedemption() {
        Coupon coupon = Coupon.builder()
                .id(1L)
                .tenantId(1L)
                .code("ONETIME")
                .maxUses(1)
                .usedCount(0)
                .active(true)
                .build();

        when(couponRepository.findById(1L)).thenReturn(Optional.of(coupon));

        couponService.recordRedemption(1L, 1L);

        assertThat(coupon.getUsedCount()).isEqualTo(1);
        assertThat(coupon.getActive()).isFalse();
        verify(couponRepository).save(coupon);
    }
}
