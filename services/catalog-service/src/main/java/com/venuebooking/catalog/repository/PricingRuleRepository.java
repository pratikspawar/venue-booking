package com.venuebooking.catalog.repository;

import com.venuebooking.catalog.entity.PricingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PricingRuleRepository extends JpaRepository<PricingRule, Long> {

    List<PricingRule> findByResourceIdOrderByPriorityDesc(Long resourceId);

    void deleteByResourceId(Long resourceId);

    List<PricingRule> findByTenantId(Long tenantId);
}
