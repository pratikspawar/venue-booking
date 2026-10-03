package com.venuebooking.catalog.repository;

import com.venuebooking.catalog.entity.CancellationPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CancellationPolicyRepository extends JpaRepository<CancellationPolicy, Long> {

    List<CancellationPolicy> findByVenueIdOrderByHoursBeforeDesc(Long venueId);

    List<CancellationPolicy> findByTenantId(Long tenantId);
}
