package com.venuebooking.tenant.repository;

import com.venuebooking.tenant.entity.SupportImpersonationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportImpersonationLogRepository extends JpaRepository<SupportImpersonationLog, Long> {

    List<SupportImpersonationLog> findAllByOrderByImpersonatedAtDesc();

    List<SupportImpersonationLog> findByTargetTenantIdOrderByImpersonatedAtDesc(Long targetTenantId);
}
