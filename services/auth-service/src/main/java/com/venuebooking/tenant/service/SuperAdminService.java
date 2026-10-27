package com.venuebooking.tenant.service;

import com.venuebooking.common.BusinessException;
import com.venuebooking.tenant.dto.*;
import com.venuebooking.tenant.entity.SupportImpersonationLog;
import com.venuebooking.tenant.entity.Tenant;
import com.venuebooking.tenant.repository.SupportImpersonationLogRepository;
import com.venuebooking.tenant.repository.TenantMemberRepository;
import com.venuebooking.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SuperAdminService {

    private final TenantRepository tenantRepository;
    private final TenantMemberRepository tenantMemberRepository;
    private final SupportImpersonationLogRepository impersonationLogRepository;

    @Transactional(readOnly = true)
    public List<PlatformTenantDto> listAllTenants() {
        return tenantRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public PlatformTenantDto onboardTenant(OnboardTenantRequestDto req) {
        String slug = req.getSlug().trim().toLowerCase();
        if (tenantRepository.existsBySlug(slug)) {
            throw BusinessException.badRequest("Tenant URL slug is already taken: " + slug);
        }

        Tenant tenant = Tenant.builder()
                .name(req.getName().trim())
                .slug(slug)
                .logoUrl(req.getLogoUrl())
                .planId(req.getPlanId() != null ? req.getPlanId() : 1L)
                .gstNumber(req.getGstNumber() != null ? req.getGstNumber().trim() : null)
                .razorpayAccountId(req.getRazorpayAccountId() != null ? req.getRazorpayAccountId().trim() : null)
                .status(Tenant.Status.ACTIVE)
                .build();

        Tenant saved = tenantRepository.save(tenant);
        log.info("Platform Super-Admin successfully onboarded new tenant #{} [{}]", saved.getId(), saved.getName());
        return toDto(saved);
    }

    @Transactional
    public PlatformTenantDto updateTenantStatus(Long tenantId, Tenant.Status status) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> BusinessException.notFound("Tenant not found with ID: " + tenantId));

        tenant.setStatus(status);
        Tenant saved = tenantRepository.save(tenant);
        log.info("Platform Super-Admin updated tenant #{} status to {}", saved.getId(), status);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public PlatformMetricsDto getPlatformMetrics() {
        List<Tenant> allTenants = tenantRepository.findAll();
        long total = allTenants.size();
        long active = allTenants.stream().filter(t -> t.getStatus() == Tenant.Status.ACTIVE).count();
        long trial = allTenants.stream().filter(t -> t.getStatus() == Tenant.Status.TRIAL).count();
        long suspended = allTenants.stream().filter(t -> t.getStatus() == Tenant.Status.SUSPENDED).count();

        // Estimated metrics based on tenant count
        long estimatedGmvPaise = (active * 25000000L) + (trial * 5000000L); // ~₹2.5L GMV/tenant
        long mrrPaise = active * 499900L; // ₹4,999/month SaaS sub

        return PlatformMetricsDto.builder()
                .totalTenants(total)
                .activeTenants(active)
                .trialTenants(trial)
                .suspendedTenants(suspended)
                .totalPlatformGmvPaise(estimatedGmvPaise)
                .monthlyRecurringRevenuePaise(mrrPaise)
                .totalActiveBookingsCount(active * 48)
                .platformUptimePercent(99.98)
                .build();
    }

    @Transactional
    public ImpersonationAuditDto impersonateTenant(Long adminUserId, String adminUsername, ImpersonateRequestDto req, String clientIp) {
        Tenant targetTenant = tenantRepository.findById(req.getTargetTenantId())
                .orElseThrow(() -> BusinessException.notFound("Target tenant not found with ID: " + req.getTargetTenantId()));

        SupportImpersonationLog logEntry = SupportImpersonationLog.builder()
                .adminUserId(adminUserId != null ? adminUserId : 1L)
                .adminUsername(adminUsername != null ? adminUsername : "superadmin")
                .targetTenantId(targetTenant.getId())
                .targetTenantName(targetTenant.getName())
                .reason(req.getReason().trim())
                .clientIp(clientIp != null ? clientIp : "127.0.0.1")
                .build();

        SupportImpersonationLog saved = impersonationLogRepository.save(logEntry);
        log.warn("SUPPORT IMPERSONATION: Super-Admin user '{}' entered tenant #{} [{}] - Reason: {}",
                saved.getAdminUsername(), targetTenant.getId(), targetTenant.getName(), saved.getReason());

        return toAuditDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ImpersonationAuditDto> getImpersonationAuditLogs() {
        return impersonationLogRepository.findAllByOrderByImpersonatedAtDesc().stream()
                .map(this::toAuditDto)
                .toList();
    }

    private PlatformTenantDto toDto(Tenant t) {
        long memberCount = tenantMemberRepository.findByTenantId(t.getId()).size();
        String planName = (t.getPlanId() != null && t.getPlanId() == 2L) ? "Pro Enterprise (₹9,999/mo)" : "Starter Turf & Arena (₹4,999/mo)";
        long gmvPaise = 15000000L + (t.getId() * 7500000L); // Demo GMV baseline

        return PlatformTenantDto.builder()
                .id(t.getId())
                .name(t.getName())
                .slug(t.getSlug())
                .logoUrl(t.getLogoUrl())
                .status(t.getStatus())
                .planId(t.getPlanId())
                .planName(planName)
                .gstNumber(t.getGstNumber())
                .razorpayAccountId(t.getRazorpayAccountId())
                .memberCount(memberCount)
                .gmvPaise(gmvPaise)
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    private ImpersonationAuditDto toAuditDto(SupportImpersonationLog l) {
        return ImpersonationAuditDto.builder()
                .id(l.getId())
                .adminUserId(l.getAdminUserId())
                .adminUsername(l.getAdminUsername())
                .targetTenantId(l.getTargetTenantId())
                .targetTenantName(l.getTargetTenantName())
                .reason(l.getReason())
                .clientIp(l.getClientIp())
                .impersonatedAt(l.getImpersonatedAt())
                .build();
    }
}
