package com.venuebooking.catalog.repository;

import com.venuebooking.catalog.entity.CanteenItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CanteenItemRepository extends JpaRepository<CanteenItem, Long> {

    List<CanteenItem> findByVenueIdAndActiveTrue(Long venueId);

    List<CanteenItem> findByTenantId(Long tenantId);
}
