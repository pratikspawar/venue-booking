package com.venuebooking.payment.repository;

import com.venuebooking.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByGatewayOrderId(String gatewayOrderId);

    List<Payment> findByBookingId(Long bookingId);

    List<Payment> findByTenantId(Long tenantId);
}
