package com.venuebooking.booking.repository;

import com.venuebooking.booking.entity.CustomerMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerMembershipRepository extends JpaRepository<CustomerMembership, Long> {

    Optional<CustomerMembership> findByTenantIdAndUserIdAndStatusAndEndDateAfter(
            Long tenantId, Long userId, CustomerMembership.Status status, Instant now);

    List<CustomerMembership> findByTenantIdAndUserIdOrderByCreatedAtDesc(Long tenantId, Long userId);
}
