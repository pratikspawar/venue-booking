package com.venuebooking.catalog.service;

import com.venuebooking.catalog.dto.CreateVenueDto;
import com.venuebooking.catalog.dto.VenueDto;
import com.venuebooking.catalog.dto.VenueHoursDto;
import com.venuebooking.catalog.entity.Venue;
import com.venuebooking.catalog.entity.VenueHours;
import com.venuebooking.catalog.repository.VenueHoursRepository;
import com.venuebooking.catalog.repository.VenueRepository;
import com.venuebooking.common.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class VenueService {

    private final VenueRepository venueRepository;
    private final VenueHoursRepository venueHoursRepository;

    @Transactional
    public VenueDto createVenue(Long tenantId, CreateVenueDto dto) {
        Venue venue = Venue.builder()
                .tenantId(tenantId)
                .name(dto.getName())
                .address(dto.getAddress())
                .city(dto.getCity())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .timezone(dto.getTimezone() != null ? dto.getTimezone() : "Asia/Kolkata")
                .payAtVenueMode(dto.getPayAtVenueMode() != null ? dto.getPayAtVenueMode() : Venue.PayAtVenueMode.OFF)
                .advanceAmountPaise(dto.getAdvanceAmountPaise() != null ? dto.getAdvanceAmountPaise() : 0L)
                .holdMinutes(dto.getHoldMinutes() != null ? dto.getHoldMinutes() : 8)
                .active(true)
                .build();

        Venue saved = venueRepository.save(venue);

        if (dto.getOperatingHours() != null && !dto.getOperatingHours().isEmpty()) {
            setOperatingHours(tenantId, saved.getId(), dto.getOperatingHours());
        }

        return toDto(saved);
    }

    @Transactional
    public VenueDto updateVenue(Long tenantId, Long venueId, CreateVenueDto dto) {
        Venue venue = venueRepository.findByIdAndTenantId(venueId, tenantId)
                .orElseThrow(() -> BusinessException.notFound("Venue not found or access denied"));

        venue.setName(dto.getName());
        venue.setAddress(dto.getAddress());
        venue.setCity(dto.getCity());
        venue.setLatitude(dto.getLatitude());
        venue.setLongitude(dto.getLongitude());
        if (dto.getTimezone() != null) venue.setTimezone(dto.getTimezone());
        if (dto.getPayAtVenueMode() != null) venue.setPayAtVenueMode(dto.getPayAtVenueMode());
        if (dto.getAdvanceAmountPaise() != null) venue.setAdvanceAmountPaise(dto.getAdvanceAmountPaise());
        if (dto.getHoldMinutes() != null) venue.setHoldMinutes(dto.getHoldMinutes());

        Venue updated = venueRepository.save(venue);
        return toDto(updated);
    }

    @Transactional
    public void setOperatingHours(Long tenantId, Long venueId, List<VenueHoursDto> hoursList) {
        Venue venue = venueRepository.findByIdAndTenantId(venueId, tenantId)
                .orElseThrow(() -> BusinessException.notFound("Venue not found or access denied"));

        venueHoursRepository.deleteByVenueId(venue.getId());

        List<VenueHours> entities = hoursList.stream()
                .map(h -> VenueHours.builder()
                        .venueId(venue.getId())
                        .dayOfWeek(h.getDayOfWeek())
                        .openTime(h.getOpenTime())
                        .closeTime(h.getCloseTime())
                        .closesNextDay(Boolean.TRUE.equals(h.getClosesNextDay()))
                        .build())
                .toList();

        venueHoursRepository.saveAll(entities);
        log.info("Saved {} operating hour schedules for venue #{}", entities.size(), venueId);
    }

    @Transactional(readOnly = true)
    public VenueDto getVenueById(Long venueId) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> BusinessException.notFound("Venue not found"));
        return toDto(venue);
    }

    @Transactional(readOnly = true)
    public List<VenueDto> listVenuesByTenant(Long tenantId) {
        return venueRepository.findByTenantId(tenantId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VenueDto> searchPublicVenues(String city, String sportCode, String query) {
        return venueRepository.searchActiveVenues(city, sportCode, query).stream()
                .map(this::toDto)
                .toList();
    }

    public VenueDto toDto(Venue venue) {
        List<VenueHoursDto> hours = venueHoursRepository.findByVenueIdOrderByDayOfWeekAsc(venue.getId())
                .stream()
                .map(h -> VenueHoursDto.builder()
                        .dayOfWeek(h.getDayOfWeek())
                        .openTime(h.getOpenTime())
                        .closeTime(h.getCloseTime())
                        .closesNextDay(h.getClosesNextDay())
                        .build())
                .toList();

        return VenueDto.builder()
                .id(venue.getId())
                .tenantId(venue.getTenantId())
                .name(venue.getName())
                .address(venue.getAddress())
                .city(venue.getCity())
                .latitude(venue.getLatitude())
                .longitude(venue.getLongitude())
                .timezone(venue.getTimezone())
                .payAtVenueMode(venue.getPayAtVenueMode())
                .advanceAmountPaise(venue.getAdvanceAmountPaise())
                .holdMinutes(venue.getHoldMinutes())
                .active(venue.getActive())
                .operatingHours(hours)
                .build();
    }
}
