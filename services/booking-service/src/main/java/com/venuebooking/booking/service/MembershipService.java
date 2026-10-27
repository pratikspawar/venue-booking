package com.venuebooking.booking.service;

import com.venuebooking.booking.dto.CreateMembershipPlanDto;
import com.venuebooking.booking.dto.CustomerMembershipDto;
import com.venuebooking.booking.dto.MembershipPlanDto;
import com.venuebooking.booking.dto.PurchaseMembershipRequestDto;
import com.venuebooking.booking.entity.CustomerMembership;
import com.venuebooking.booking.entity.MembershipPlan;
import com.venuebooking.booking.repository.CustomerMembershipRepository;
import com.venuebooking.booking.repository.MembershipPlanRepository;
import com.venuebooking.common.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class MembershipService {

    private final MembershipPlanRepository membershipPlanRepository;
    private final CustomerMembershipRepository customerMembershipRepository;
    private final WalletService walletService;

    @Transactional
    public MembershipPlanDto createPlan(Long tenantId, CreateMembershipPlanDto request) {
        MembershipPlan plan = MembershipPlan.builder()
                .tenantId(tenantId)
                .name(request.name())
                .sportCode(request.sportCode() != null && !request.sportCode().isBlank() ? request.sportCode().trim().toUpperCase() : null)
                .pricePaise(request.pricePaise())
                .durationDays(request.durationDays() != null ? request.durationDays() : 30)
                .discountPercent(request.discountPercent() != null ? request.discountPercent() : 15)
                .freeMinutes(request.freeMinutes() != null ? request.freeMinutes() : 120)
                .active(true)
                .build();

        plan = membershipPlanRepository.save(plan);
        log.info("Membership plan created: tenant={}, name={}, pricePaise={}", tenantId, plan.getName(), plan.getPricePaise());

        return toPlanDto(plan);
    }

    @Transactional(readOnly = true)
    public List<MembershipPlanDto> getPlans(Long tenantId) {
        return membershipPlanRepository.findByTenantIdAndActiveTrueOrderByIdAsc(tenantId).stream()
                .map(this::toPlanDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MembershipPlanDto> getAllPlans(Long tenantId) {
        return membershipPlanRepository.findByTenantIdOrderByIdAsc(tenantId).stream()
                .map(this::toPlanDto)
                .toList();
    }

    @Transactional
    public MembershipPlanDto togglePlanActive(Long tenantId, Long planId) {
        MembershipPlan plan = membershipPlanRepository.findById(planId)
                .orElseThrow(() -> BusinessException.notFound("Membership plan not found: " + planId));
        if (!plan.getTenantId().equals(tenantId)) {
            throw new BusinessException("FORBIDDEN", "Plan does not belong to this venue.");
        }
        plan.setActive(!Boolean.TRUE.equals(plan.getActive()));
        plan = membershipPlanRepository.save(plan);
        return toPlanDto(plan);
    }

    @Transactional
    public CustomerMembershipDto purchaseMembership(Long tenantId, PurchaseMembershipRequestDto request) {
        MembershipPlan plan = membershipPlanRepository.findById(request.planId())
                .orElseThrow(() -> BusinessException.notFound("Membership plan not found: " + request.planId()));

        if (!plan.getTenantId().equals(tenantId) || !plan.getActive()) {
            throw new IllegalArgumentException("Plan is inactive or not available for this venue.");
        }

        // If paying via wallet, debit wallet
        if ("WALLET".equalsIgnoreCase(request.paymentMode())) {
            walletService.debit(tenantId, request.userId(), plan.getPricePaise(), null, "Purchase Membership: " + plan.getName());
        }

        Instant now = Instant.now();
        Instant endDate = now.plus(Duration.ofDays(plan.getDurationDays()));

        CustomerMembership membership = CustomerMembership.builder()
                .tenantId(tenantId)
                .userId(request.userId())
                .planId(plan.getId())
                .planName(plan.getName())
                .sportCode(plan.getSportCode())
                .discountPercent(plan.getDiscountPercent())
                .remainingFreeMinutes(plan.getFreeMinutes())
                .startDate(now)
                .endDate(endDate)
                .status(CustomerMembership.Status.ACTIVE)
                .build();

        membership = customerMembershipRepository.save(membership);
        log.info("Customer purchased membership: tenant={}, user={}, plan={}", tenantId, request.userId(), plan.getName());

        return toCustomerMembershipDto(membership);
    }

    @Transactional(readOnly = true)
    public Optional<CustomerMembershipDto> getActiveMembership(Long tenantId, Long userId) {
        return customerMembershipRepository.findByTenantIdAndUserIdAndStatusAndEndDateAfter(
                tenantId, userId, CustomerMembership.Status.ACTIVE, Instant.now()
        ).map(this::toCustomerMembershipDto);
    }

    @Transactional(readOnly = true)
    public List<CustomerMembershipDto> getCustomerMemberships(Long tenantId, Long userId) {
        return customerMembershipRepository.findByTenantIdAndUserIdOrderByCreatedAtDesc(tenantId, userId).stream()
                .map(this::toCustomerMembershipDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CustomerMembershipDto> getTenantMemberships(Long tenantId) {
        return customerMembershipRepository.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toCustomerMembershipDto)
                .toList();
    }

    @Transactional
    public void deductFreeMinutes(Long membershipId, int minutes) {
        customerMembershipRepository.findById(membershipId).ifPresent(m -> {
            int current = m.getRemainingFreeMinutes() != null ? m.getRemainingFreeMinutes() : 0;
            m.setRemainingFreeMinutes(Math.max(0, current - minutes));
            customerMembershipRepository.save(m);
            log.info("Deducted {} free minutes from membership #{} (remaining: {})", minutes, membershipId, m.getRemainingFreeMinutes());
        });
    }

    private MembershipPlanDto toPlanDto(MembershipPlan p) {
        return new MembershipPlanDto(
                p.getId(),
                p.getName(),
                p.getSportCode(),
                p.getPricePaise(),
                p.getPricePaise() / 100.0,
                p.getDurationDays(),
                p.getDiscountPercent(),
                p.getFreeMinutes(),
                p.getActive()
        );
    }

    private CustomerMembershipDto toCustomerMembershipDto(CustomerMembership m) {
        return new CustomerMembershipDto(
                m.getId(),
                m.getUserId(),
                m.getPlanId(),
                m.getPlanName(),
                m.getSportCode(),
                m.getDiscountPercent(),
                m.getRemainingFreeMinutes(),
                m.getStartDate(),
                m.getEndDate(),
                m.getStatus().name()
        );
    }
}
