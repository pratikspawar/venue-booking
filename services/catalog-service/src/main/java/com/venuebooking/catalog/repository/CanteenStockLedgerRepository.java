package com.venuebooking.catalog.repository;

import com.venuebooking.catalog.entity.CanteenStockLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CanteenStockLedgerRepository extends JpaRepository<CanteenStockLedger, Long> {

    List<CanteenStockLedger> findByCanteenItemIdOrderByCreatedAtDesc(Long canteenItemId);

    List<CanteenStockLedger> findByVenueIdOrderByCreatedAtDesc(Long venueId);

    List<CanteenStockLedger> findByTenantIdAndVenueIdOrderByCreatedAtDesc(Long tenantId, Long venueId);
}
