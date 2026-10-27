package com.venuebooking.tenant.service;

import com.venuebooking.common.BusinessException;
import com.venuebooking.tenant.dto.ImpersonateRequestDto;
import com.venuebooking.tenant.dto.ImpersonationAuditDto;
import com.venuebooking.tenant.dto.OnboardTenantRequestDto;
import com.venuebooking.tenant.dto.PlatformMetricsDto;
import com.venuebooking.tenant.dto.PlatformTenantDto;
import com.venuebooking.tenant.entity.SupportImpersonationLog;
import com.venuebooking.tenant.entity.Tenant;
import com.venuebooking.tenant.repository.SupportImpersonationLogRepository;
import com.venuebooking.tenant.repository.TenantMemberRepository;
import com.venuebooking.tenant.repository.TenantRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Platform Super-Admin Service Tests")
class SuperAdminServiceTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private TenantMemberRepository tenantMemberRepository;

    @Mock
    private SupportImpersonationLogRepository impersonationLogRepository;

    @InjectMocks
    private SuperAdminService superAdminService;

    @Test
    @DisplayName("Onboard new tenant creates tenant with unique slug and active status")
    void testOnboardTenant_Success() {
        OnboardTenantRequestDto req = OnboardTenantRequestDto.builder()
                .name("Apex Cyber Sports Hub")
                .slug("apex-cyber")
                .planId(2L)
                .gstNumber("27AAAAA0000A1Z5")
                .razorpayAccountId("acc_apex_01")
                .build();

        when(tenantRepository.existsBySlug("apex-cyber")).thenReturn(false);

        Tenant savedTenant = Tenant.builder()
                .id(10L)
                .name(req.getName())
                .slug("apex-cyber")
                .planId(2L)
                .gstNumber(req.getGstNumber())
                .razorpayAccountId(req.getRazorpayAccountId())
                .status(Tenant.Status.ACTIVE)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(tenantRepository.save(any(Tenant.class))).thenReturn(savedTenant);
        when(tenantMemberRepository.findByTenantId(10L)).thenReturn(List.of());

        PlatformTenantDto result = superAdminService.onboardTenant(req);

        assertNotNull(result);
        assertEquals("apex-cyber", result.getSlug());
        assertEquals(Tenant.Status.ACTIVE, result.getStatus());
        assertEquals("Pro Enterprise (₹9,999/mo)", result.getPlanName());
        verify(tenantRepository).save(any(Tenant.class));
    }

    @Test
    @DisplayName("Onboard tenant with duplicate slug throws BAD_REQUEST BusinessException")
    void testOnboardTenant_DuplicateSlug_ThrowsException() {
        OnboardTenantRequestDto req = OnboardTenantRequestDto.builder()
                .name("Duplicate Arena")
                .slug("playstation-prime")
                .build();

        when(tenantRepository.existsBySlug("playstation-prime")).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> superAdminService.onboardTenant(req));

        assertEquals("BAD_REQUEST", ex.getCode());
        verify(tenantRepository, never()).save(any());
    }

    @Test
    @DisplayName("Update tenant status transitions tenant to SUSPENDED")
    void testUpdateTenantStatus() {
        Tenant tenant = Tenant.builder()
                .id(1L)
                .name("Test Arena")
                .slug("test-arena")
                .status(Tenant.Status.ACTIVE)
                .build();

        when(tenantRepository.findById(1L)).thenReturn(Optional.of(tenant));
        when(tenantRepository.save(tenant)).thenReturn(tenant);
        when(tenantMemberRepository.findByTenantId(1L)).thenReturn(List.of());

        PlatformTenantDto updated = superAdminService.updateTenantStatus(1L, Tenant.Status.SUSPENDED);

        assertEquals(Tenant.Status.SUSPENDED, updated.getStatus());
        assertEquals(Tenant.Status.SUSPENDED, tenant.getStatus());
    }

    @Test
    @DisplayName("Get platform metrics aggregates active tenants and GMV correctly")
    void testGetPlatformMetrics() {
        Tenant t1 = Tenant.builder().id(1L).status(Tenant.Status.ACTIVE).build();
        Tenant t2 = Tenant.builder().id(2L).status(Tenant.Status.ACTIVE).build();
        Tenant t3 = Tenant.builder().id(3L).status(Tenant.Status.TRIAL).build();

        when(tenantRepository.findAll()).thenReturn(List.of(t1, t2, t3));

        PlatformMetricsDto metrics = superAdminService.getPlatformMetrics();

        assertEquals(3, metrics.getTotalTenants());
        assertEquals(2, metrics.getActiveTenants());
        assertEquals(1, metrics.getTrialTenants());
        assertEquals(0, metrics.getSuspendedTenants());
        assertTrue(metrics.getTotalPlatformGmvPaise() > 0);
    }

    @Test
    @DisplayName("Support impersonation logs immutable entry and returns audit response")
    void testImpersonateTenant() {
        Tenant target = Tenant.builder().id(5L).name("Pune Turf Park").build();
        when(tenantRepository.findById(5L)).thenReturn(Optional.of(target));

        SupportImpersonationLog logEntry = SupportImpersonationLog.builder()
                .id(99L)
                .adminUserId(1L)
                .adminUsername("superadmin")
                .targetTenantId(5L)
                .targetTenantName("Pune Turf Park")
                .reason("Investigate Razorpay webhook delivery failure")
                .clientIp("192.168.1.100")
                .impersonatedAt(Instant.now())
                .build();

        when(impersonationLogRepository.save(any(SupportImpersonationLog.class))).thenReturn(logEntry);

        ImpersonateRequestDto req = ImpersonateRequestDto.builder()
                .targetTenantId(5L)
                .reason("Investigate Razorpay webhook delivery failure")
                .build();

        ImpersonationAuditDto audit = superAdminService.impersonateTenant(1L, "superadmin", req, "192.168.1.100");

        assertNotNull(audit);
        assertEquals(5L, audit.getTargetTenantId());
        assertEquals("Pune Turf Park", audit.getTargetTenantName());
        assertEquals("superadmin", audit.getAdminUsername());
        verify(impersonationLogRepository).save(any(SupportImpersonationLog.class));
    }
}
