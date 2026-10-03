package com.venuebooking.payment.repository;

import com.venuebooking.payment.entity.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RefundRepository extends JpaRepository<Refund, Long> {

    List<Refund> findByBookingId(Long bookingId);

    List<Refund> findByTenantId(Long tenantId);
}
