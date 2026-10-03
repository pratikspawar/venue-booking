package com.venuebooking.booking.repository;

import com.venuebooking.booking.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByTenantIdAndCodeIgnoreCaseAndActiveTrue(Long tenantId, String code);

    List<Coupon> findByTenantIdOrderByCreatedAtDesc(Long tenantId);
}
