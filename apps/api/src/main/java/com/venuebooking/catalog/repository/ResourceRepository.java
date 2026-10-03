package com.venuebooking.catalog.repository;

import com.venuebooking.catalog.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    List<Resource> findByVenueIdAndStatus(Long venueId, Resource.Status status);

    List<Resource> findByVenueId(Long venueId);

    List<Resource> findByTenantId(Long tenantId);

    Optional<Resource> findByIdAndTenantId(Long id, Long tenantId);

    @Query("SELECT r FROM Resource r LEFT JOIN FETCH r.pricingRules WHERE r.id = :id AND r.status = 'ACTIVE'")
    Optional<Resource> findActiveWithPricingRules(@Param("id") Long id);
}
