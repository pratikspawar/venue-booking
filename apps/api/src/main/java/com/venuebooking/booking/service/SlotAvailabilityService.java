package com.venuebooking.booking.service;

import com.venuebooking.booking.dto.ResourceAvailabilityResponseDto;
import com.venuebooking.booking.dto.SlotAvailabilityDto;
import com.venuebooking.booking.entity.BookingSlot;
import com.venuebooking.booking.repository.BookingSlotRepository;
import com.venuebooking.catalog.entity.*;
import com.venuebooking.catalog.repository.PricingRuleRepository;
import com.venuebooking.catalog.repository.ResourceBlockRepository;
import com.venuebooking.catalog.repository.ResourceRepository;
import com.venuebooking.catalog.repository.VenueHoursRepository;
import com.venuebooking.catalog.service.PricingService;
import com.venuebooking.common.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SlotAvailabilityService {

    private final ResourceRepository resourceRepository;
    private final VenueHoursRepository venueHoursRepository;
    private final BookingSlotRepository bookingSlotRepository;
    private final ResourceBlockRepository resourceBlockRepository;
    private final PricingRuleRepository pricingRuleRepository;
    private final PricingService pricingService;

    @Transactional(readOnly = true)
    public ResourceAvailabilityResponseDto getAvailability(Long resourceId, LocalDate date) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> BusinessException.notFound("Resource not found"));

        Venue venue = resource.getVenue();
        if (venue == null || !Boolean.TRUE.equals(venue.getActive())) {
            throw BusinessException.notFound("Venue not found or inactive");
        }

        ZoneId venueZone = ZoneId.of(venue.getTimezone() != null ? venue.getTimezone() : "Asia/Kolkata");
        int dayOfWeek = date.getDayOfWeek().getValue(); // 1=Mon ... 7=Sun

        Optional<VenueHours> hoursOpt = venueHoursRepository.findByVenueIdAndDayOfWeek(venue.getId(), dayOfWeek);
        if (hoursOpt.isEmpty()) {
            return buildEmptyResponse(resource, venue, date);
        }

        VenueHours hours = hoursOpt.get();
        LocalTime openTime = hours.getOpenTime();
        LocalTime closeTime = hours.getCloseTime();
        int slotMinutes = resource.getSlotMinutes() > 0 ? resource.getSlotMinutes() : 60;

        ZonedDateTime dayStartLocal = ZonedDateTime.of(date, openTime, venueZone);
        ZonedDateTime dayEndLocal = Boolean.TRUE.equals(hours.getClosesNextDay()) || closeTime.isBefore(openTime)
                ? ZonedDateTime.of(date.plusDays(1), closeTime, venueZone)
                : ZonedDateTime.of(date, closeTime, venueZone);

        Instant rangeStartUtc = dayStartLocal.toInstant();
        Instant rangeEndUtc = dayEndLocal.toInstant();

        // 1. Fetch reserved booking slots
        Set<Instant> bookedSlots = bookingSlotRepository
                .findSlotsForResourceAndRange(resource.getId(), rangeStartUtc, rangeEndUtc)
                .stream()
                .map(BookingSlot::getSlotStart)
                .collect(Collectors.toSet());

        // 2. Fetch overlapping resource maintenance blocks
        List<ResourceBlock> blocks = resourceBlockRepository.findOverlappingBlocks(resource.getId(), rangeStartUtc, rangeEndUtc);

        // 3. Fetch pricing rules
        List<PricingRule> rules = pricingRuleRepository.findByResourceIdOrderByPriorityDesc(resource.getId());

        // 4. Build grid cells
        List<SlotAvailabilityDto> slotDtos = new ArrayList<>();
        ZonedDateTime currentLocal = dayStartLocal;
        Instant nowUtc = Instant.now();

        while (currentLocal.plusMinutes(slotMinutes).isBefore(dayEndLocal) || currentLocal.plusMinutes(slotMinutes).isEqual(dayEndLocal)) {
            Instant cellStartUtc = currentLocal.toInstant();
            Instant cellEndUtc = currentLocal.plusMinutes(slotMinutes).toInstant();

            SlotAvailabilityDto.SlotStatus status = SlotAvailabilityDto.SlotStatus.AVAILABLE;

            if (cellStartUtc.isBefore(nowUtc.minus(Duration.ofMinutes(5)))) {
                status = SlotAvailabilityDto.SlotStatus.PAST;
            } else if (bookedSlots.contains(cellStartUtc)) {
                status = SlotAvailabilityDto.SlotStatus.BOOKED;
            } else if (isCellBlocked(cellStartUtc, cellEndUtc, blocks)) {
                status = SlotAvailabilityDto.SlotStatus.BLOCKED;
            }

            Long cellPricePaise = 0L;
            if (!rules.isEmpty()) {
                try {
                    PricingRule matchedRule = pricingService.resolveBestRule(rules, currentLocal.toLocalDate(), currentLocal.toLocalTime());
                    cellPricePaise = resource.getBillingMode() == Resource.BillingMode.FIXED_SLOT
                            ? matchedRule.getPricePerSlotPaise()
                            : matchedRule.getPricePerHourPaise();
                } catch (Exception e) {
                    log.warn("No pricing rule matched cell at {}: {}", currentLocal, e.getMessage());
                }
            }

            slotDtos.add(SlotAvailabilityDto.builder()
                    .slotStart(cellStartUtc)
                    .slotEnd(cellEndUtc)
                    .status(status)
                    .pricePaise(cellPricePaise)
                    .build());

            currentLocal = currentLocal.plusMinutes(slotMinutes);
        }

        return ResourceAvailabilityResponseDto.builder()
                .resourceId(resource.getId())
                .resourceName(resource.getName())
                .venueTimezone(venue.getTimezone())
                .billingMode(resource.getBillingMode())
                .slotMinutes(slotMinutes)
                .date(date)
                .slots(slotDtos)
                .build();
    }

    private boolean isCellBlocked(Instant cellStart, Instant cellEnd, List<ResourceBlock> blocks) {
        return blocks.stream().anyMatch(b -> b.getStartUtc().isBefore(cellEnd) && b.getEndUtc().isAfter(cellStart));
    }

    private ResourceAvailabilityResponseDto buildEmptyResponse(Resource resource, Venue venue, LocalDate date) {
        return ResourceAvailabilityResponseDto.builder()
                .resourceId(resource.getId())
                .resourceName(resource.getName())
                .venueTimezone(venue.getTimezone())
                .billingMode(resource.getBillingMode())
                .slotMinutes(resource.getSlotMinutes())
                .date(date)
                .slots(Collections.emptyList())
                .build();
    }
}
