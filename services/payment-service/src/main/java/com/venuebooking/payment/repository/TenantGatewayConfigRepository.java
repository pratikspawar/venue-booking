package com.venuebooking.payment.repository;

import com.venuebooking.payment.entity.TenantGatewayConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TenantGatewayConfigRepository extends JpaRepository<TenantGatewayConfig, Long> {

    Optional<TenantGatewayConfig> findByTenantIdAndGateway(Long tenantId, String gateway);

    Optional<TenantGatewayConfig> findByTenantIdAndGatewayAndIsActiveTrue(Long tenantId, String gateway);

    default Optional<TenantGatewayConfig> findActiveRazorpayConfig(Long tenantId) {
        return findByTenantIdAndGatewayAndIsActiveTrue(tenantId, "RAZORPAY");
    }
}
