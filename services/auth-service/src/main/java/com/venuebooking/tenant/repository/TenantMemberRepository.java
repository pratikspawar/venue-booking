package com.venuebooking.tenant.repository;

import com.venuebooking.tenant.entity.TenantMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenantMemberRepository extends JpaRepository<TenantMember, Long> {

    List<TenantMember> findByUserIdAndActiveTrue(Long userId);

    Optional<TenantMember> findByTenantIdAndUserIdAndActiveTrue(Long tenantId, Long userId);
}
