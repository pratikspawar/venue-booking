package com.venuebooking.catalog.isolation;

import com.venuebooking.catalog.dto.CreateResourceDto;
import com.venuebooking.catalog.dto.CreateVenueDto;
import com.venuebooking.catalog.dto.PricingRuleDto;
import com.venuebooking.catalog.dto.VenueHoursDto;
import com.venuebooking.catalog.entity.PricingRule;
import com.venuebooking.catalog.entity.Resource;
import com.venuebooking.catalog.entity.Venue;
import com.venuebooking.catalog.repository.*;
import com.venuebooking.catalog.service.ResourceService;
import com.venuebooking.catalog.service.VenueService;
import com.venuebooking.common.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Cross-Tenant Data Isolation Tests - Catalog Service")
class CatalogTenantIsolationTest {

    private static final Long TENANT_A = 100L;
    private static final Long TENANT_B = 200L;

    @Mock
    private VenueRepository venueRepository;
    @Mock
    private VenueHoursRepository venueHoursRepository;
    @Mock
    private ResourceRepository resourceRepository;
    @Mock
    private SportRepository sportRepository;
    @Mock
    private PricingRuleRepository pricingRuleRepository;
    @Mock
    private ResourceBlockRepository resourceBlockRepository;

    private VenueService venueService;
    private ResourceService resourceService;

    @BeforeEach
    void setUp() {
        venueService = new VenueService(venueRepository, venueHoursRepository);
        resourceService = new ResourceService(
                resourceRepository,
                venueRepository,
                sportRepository,
                pricingRuleRepository,
                resourceBlockRepository
        );
    }

    @Test
    @DisplayName("Tenant A owner CANNOT update Tenant B venue configuration")
    void testTenantCannotUpdateOtherTenantVenue() {
        Long venueId = 42L;
        // Tenant A tries to update Venue 42 belonging to Tenant B
        when(venueRepository.findByIdAndTenantId(venueId, TENANT_A)).thenReturn(Optional.empty());

        CreateVenueDto updateDto = CreateVenueDto.builder()
                .name("Hacked Venue Name")
                .city("Mumbai")
                .build();

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            venueService.updateVenue(TENANT_A, venueId, updateDto);
        });

        assertTrue(ex.getMessage().contains("not found or access denied"));
        verify(venueRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tenant A owner CANNOT modify Tenant B operating hours")
    void testTenantCannotModifyOtherTenantOperatingHours() {
        Long venueId = 42L;
        when(venueRepository.findByIdAndTenantId(venueId, TENANT_A)).thenReturn(Optional.empty());

        List<VenueHoursDto> hours = List.of(VenueHoursDto.builder()
                .dayOfWeek(1)
                .openTime(LocalTime.of(8, 0))
                .closeTime(LocalTime.of(22, 0))
                .build());

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            venueService.setOperatingHours(TENANT_A, venueId, hours);
        });

        assertTrue(ex.getMessage().contains("not found or access denied"));
        verify(venueHoursRepository, never()).deleteByVenueId(any());
        verify(venueHoursRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("Tenant A owner CANNOT create a resource under Tenant B venue")
    void testTenantCannotCreateResourceUnderOtherTenantVenue() {
        Long venueId = 99L;
        CreateResourceDto createDto = CreateResourceDto.builder()
                .venueId(venueId)
                .sportId(1L)
                .name("Illicit PlayStation Booth")
                .build();

        when(venueRepository.findByIdAndTenantId(venueId, TENANT_A)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            resourceService.createResource(TENANT_A, createDto);
        });

        assertTrue(ex.getMessage().contains("not found or access denied"));
        verify(resourceRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tenant A owner CANNOT update Tenant B resource")
    void testTenantCannotUpdateOtherTenantResource() {
        Long resourceId = 77L;
        when(resourceRepository.findByIdAndTenantId(resourceId, TENANT_A)).thenReturn(Optional.empty());

        CreateResourceDto updateDto = CreateResourceDto.builder()
                .name("Hijacked Console 1")
                .build();

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            resourceService.updateResource(TENANT_A, resourceId, updateDto);
        });

        assertTrue(ex.getMessage().contains("not found or access denied"));
        verify(resourceRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tenant A owner CANNOT overwrite Tenant B pricing rules")
    void testTenantCannotSetPricingRulesOnOtherTenantResource() {
        Long resourceId = 77L;
        when(resourceRepository.findByIdAndTenantId(resourceId, TENANT_A)).thenReturn(Optional.empty());

        List<PricingRuleDto> rules = List.of(PricingRuleDto.builder()
                .dayType(PricingRule.DayType.WEEKDAY)
                .pricePerHourPaise(50000L)
                .build());

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            resourceService.setPricingRules(TENANT_A, resourceId, rules);
        });

        assertTrue(ex.getMessage().contains("not found or access denied"));
        verify(pricingRuleRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("Tenant A owner CANNOT inject resource downtime blocks onto Tenant B resource")
    void testTenantCannotBlockOtherTenantResource() {
        Long resourceId = 77L;
        when(resourceRepository.findByIdAndTenantId(resourceId, TENANT_A)).thenReturn(Optional.empty());

        Instant start = Instant.now().plusSeconds(3600);
        Instant end = Instant.now().plusSeconds(7200);

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            resourceService.addBlock(TENANT_A, resourceId, start, end, "Malicious Maintenance");
        });

        assertTrue(ex.getMessage().contains("not found or access denied"));
        verify(resourceBlockRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tenant venue listing strictly scoped to requesting tenantId")
    void testListVenuesStrictTenantScoping() {
        when(venueRepository.findByTenantId(TENANT_A)).thenReturn(List.of());

        List<?> result = venueService.listVenuesByTenant(TENANT_A);

        assertNotNull(result);
        verify(venueRepository).findByTenantId(TENANT_A);
        verify(venueRepository, never()).findByTenantId(TENANT_B);
    }
}
