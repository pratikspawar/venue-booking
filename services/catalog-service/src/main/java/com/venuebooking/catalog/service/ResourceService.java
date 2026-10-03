package com.venuebooking.catalog.service;

import com.venuebooking.catalog.dto.CreateResourceDto;
import com.venuebooking.catalog.dto.PricingRuleDto;
import com.venuebooking.catalog.dto.ResourceDto;
import com.venuebooking.catalog.entity.PricingRule;
import com.venuebooking.catalog.entity.Resource;
import com.venuebooking.catalog.entity.ResourceBlock;
import com.venuebooking.catalog.entity.Venue;
import com.venuebooking.catalog.repository.*;
import com.venuebooking.common.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final VenueRepository venueRepository;
    private final SportRepository sportRepository;
    private final PricingRuleRepository pricingRuleRepository;
    private final ResourceBlockRepository resourceBlockRepository;

    @Transactional
    public ResourceDto createResource(Long tenantId, CreateResourceDto dto) {
        Venue venue = venueRepository.findByIdAndTenantId(dto.getVenueId(), tenantId)
                .orElseThrow(() -> BusinessException.notFound("Venue not found or access denied"));

        if (!sportRepository.existsById(dto.getSportId())) {
            throw BusinessException.notFound("Sport category not found");
        }

        Resource resource = Resource.builder()
                .tenantId(tenantId)
                .venueId(venue.getId())
                .sportId(dto.getSportId())
                .name(dto.getName())
                .capacity(dto.getCapacity() != null ? dto.getCapacity() : 2)
                .slotMinutes(dto.getSlotMinutes() != null ? dto.getSlotMinutes() : 60)
                .billingMode(dto.getBillingMode() != null ? dto.getBillingMode() : Resource.BillingMode.FIXED_SLOT)
                .status(dto.getStatus() != null ? dto.getStatus() : Resource.Status.ACTIVE)
                .build();

        Resource saved = resourceRepository.save(resource);

        if (dto.getPricingRules() != null && !dto.getPricingRules().isEmpty()) {
            setPricingRules(tenantId, saved.getId(), dto.getPricingRules());
        }

        return toDto(saved);
    }

    @Transactional
    public ResourceDto updateResource(Long tenantId, Long resourceId, CreateResourceDto dto) {
        Resource resource = resourceRepository.findByIdAndTenantId(resourceId, tenantId)
                .orElseThrow(() -> BusinessException.notFound("Resource not found or access denied"));

        resource.setName(dto.getName());
        if (dto.getCapacity() != null) resource.setCapacity(dto.getCapacity());
        if (dto.getSlotMinutes() != null) resource.setSlotMinutes(dto.getSlotMinutes());
        if (dto.getBillingMode() != null) resource.setBillingMode(dto.getBillingMode());
        if (dto.getStatus() != null) resource.setStatus(dto.getStatus());

        Resource updated = resourceRepository.save(resource);
        return toDto(updated);
    }

    @Transactional
    public void setPricingRules(Long tenantId, Long resourceId, List<PricingRuleDto> rulesDto) {
        Resource resource = resourceRepository.findByIdAndTenantId(resourceId, tenantId)
                .orElseThrow(() -> BusinessException.notFound("Resource not found or access denied"));

        List<PricingRule> rules = rulesDto.stream()
                .map(r -> PricingRule.builder()
                        .tenantId(tenantId)
                        .resourceId(resource.getId())
                        .dayType(r.getDayType() != null ? r.getDayType() : PricingRule.DayType.ANY)
                        .startTime(r.getStartTime())
                        .endTime(r.getEndTime())
                        .pricePerSlotPaise(r.getPricePerSlotPaise())
                        .pricePerHourPaise(r.getPricePerHourPaise())
                        .minChargeMinutes(r.getMinChargeMinutes() != null ? r.getMinChargeMinutes() : 0)
                        .roundingMinutes(r.getRoundingMinutes() != null ? r.getRoundingMinutes() : 1)
                        .priority(r.getPriority() != null ? r.getPriority() : 0)
                        .build())
                .toList();

        pricingRuleRepository.saveAll(rules);
        log.info("Saved {} pricing rules for resource #{}", rules.size(), resourceId);
    }

    @Transactional
    public ResourceBlock addBlock(Long tenantId, Long resourceId, Instant startUtc, Instant endUtc, String reason) {
        Resource resource = resourceRepository.findByIdAndTenantId(resourceId, tenantId)
                .orElseThrow(() -> BusinessException.notFound("Resource not found or access denied"));

        if (!startUtc.isBefore(endUtc)) {
            throw new BusinessException("INVALID_BLOCK_TIME", "Block start must be before end");
        }

        ResourceBlock block = ResourceBlock.builder()
                .tenantId(tenantId)
                .resourceId(resource.getId())
                .startUtc(startUtc)
                .endUtc(endUtc)
                .reason(reason)
                .build();

        return resourceBlockRepository.save(block);
    }

    @Transactional(readOnly = true)
    public List<ResourceDto> listResourcesByVenue(Long venueId) {
        return resourceRepository.findByVenueId(venueId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ResourceDto getResourceById(Long resourceId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> BusinessException.notFound("Resource not found"));
        return toDto(resource);
    }

    public ResourceDto toDto(Resource r) {
        List<PricingRuleDto> rules = pricingRuleRepository.findByResourceIdOrderByPriorityDesc(r.getId())
                .stream()
                .map(p -> PricingRuleDto.builder()
                        .id(p.getId())
                        .resourceId(p.getResourceId())
                        .dayType(p.getDayType())
                        .startTime(p.getStartTime())
                        .endTime(p.getEndTime())
                        .pricePerSlotPaise(p.getPricePerSlotPaise())
                        .pricePerHourPaise(p.getPricePerHourPaise())
                        .minChargeMinutes(p.getMinChargeMinutes())
                        .roundingMinutes(p.getRoundingMinutes())
                        .priority(p.getPriority())
                        .build())
                .toList();

        return ResourceDto.builder()
                .id(r.getId())
                .tenantId(r.getTenantId())
                .venueId(r.getVenueId())
                .sportId(r.getSportId())
                .sportCode(r.getSport() != null ? r.getSport().getCode() : null)
                .sportName(r.getSport() != null ? r.getSport().getNameEn() : null)
                .name(r.getName())
                .capacity(r.getCapacity())
                .slotMinutes(r.getSlotMinutes())
                .billingMode(r.getBillingMode())
                .status(r.getStatus())
                .pricingRules(rules)
                .build();
    }
}
