package com.venuebooking.booking.repository;

import com.venuebooking.booking.entity.PrepaidPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrepaidPackageRepository extends JpaRepository<PrepaidPackage, Long> {

    List<PrepaidPackage> findByTenantIdAndActiveTrueOrderByIdAsc(Long tenantId);

    List<PrepaidPackage> findByTenantIdOrderByIdAsc(Long tenantId);
}
