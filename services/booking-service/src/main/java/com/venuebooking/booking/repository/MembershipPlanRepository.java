package com.venuebooking.booking.repository;

import com.venuebooking.booking.entity.MembershipPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MembershipPlanRepository extends JpaRepository<MembershipPlan, Long> {

    List<MembershipPlan> findByTenantIdAndActiveTrueOrderByIdAsc(Long tenantId);

    List<MembershipPlan> findByTenantIdOrderByIdAsc(Long tenantId);
}
