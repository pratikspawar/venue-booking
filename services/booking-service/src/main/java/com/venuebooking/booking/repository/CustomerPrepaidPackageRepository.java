package com.venuebooking.booking.repository;

import com.venuebooking.booking.entity.CustomerPrepaidPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface CustomerPrepaidPackageRepository extends JpaRepository<CustomerPrepaidPackage, Long> {

    List<CustomerPrepaidPackage> findByTenantIdAndUserIdAndStatusAndExpiresAtAfter(
            Long tenantId, Long userId, CustomerPrepaidPackage.Status status, Instant now);

    List<CustomerPrepaidPackage> findByTenantIdAndUserIdOrderByCreatedAtDesc(Long tenantId, Long userId);

    List<CustomerPrepaidPackage> findByTenantIdOrderByCreatedAtDesc(Long tenantId);
}
