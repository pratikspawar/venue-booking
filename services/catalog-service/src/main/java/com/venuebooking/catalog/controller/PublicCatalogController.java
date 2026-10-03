package com.venuebooking.catalog.controller;

import com.venuebooking.catalog.dto.ResourceDto;
import com.venuebooking.catalog.dto.VenueDto;
import com.venuebooking.catalog.entity.Sport;
import com.venuebooking.catalog.repository.SportRepository;
import com.venuebooking.catalog.service.ResourceService;
import com.venuebooking.catalog.service.VenueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Public Catalog", description = "Public venue and resource discovery for customer apps and guests")
public class PublicCatalogController {

    private final VenueService venueService;
    private final ResourceService resourceService;
    private final SportRepository sportRepository;

    @GetMapping("/venues")
    @Operation(summary = "Search active venues", description = "Browse venues filtered by city, sport category, or search term")
    public ResponseEntity<List<VenueDto>> searchVenues(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String sport,
            @RequestParam(required = false) String q
    ) {
        return ResponseEntity.ok(venueService.searchPublicVenues(city, sport, q));
    }

    @GetMapping("/venues/{id}")
    @Operation(summary = "Get venue details", description = "Retrieves operating hours, location, and advance rules for a venue")
    public ResponseEntity<VenueDto> getVenue(@PathVariable Long id) {
        return ResponseEntity.ok(venueService.getVenueById(id));
    }

    @GetMapping("/venues/{id}/resources")
    @Operation(summary = "List resources for venue", description = "Retrieves all gaming resources, consoles, and tables for a venue")
    public ResponseEntity<List<ResourceDto>> getVenueResources(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.listResourcesByVenue(id));
    }

    @GetMapping("/sports")
    @Operation(summary = "List all supported sports", description = "Returns system sports (PlayStation, Pool, Carrom, Turf, Tennis, and custom sports)")
    public ResponseEntity<List<Sport>> listSports() {
        return ResponseEntity.ok(sportRepository.findAll());
    }

    @PostMapping("/sports")
    @Operation(summary = "Register new sport", description = "Register a new sport or game category dynamically")
    public ResponseEntity<Sport> createSport(@jakarta.validation.Valid @RequestBody com.venuebooking.catalog.dto.CreateSportDto dto) {
        String code = dto.getCode().trim().toUpperCase().replace(" ", "_");
        java.util.Optional<Sport> existing = sportRepository.findByCode(code);
        if (existing.isPresent()) {
            return ResponseEntity.ok(existing.get());
        }

        Sport sport = Sport.builder()
                .code(code)
                .nameEn(dto.getNameEn().trim())
                .nameMr(dto.getNameMr())
                .nameHi(dto.getNameHi())
                .build();

        return ResponseEntity.ok(sportRepository.save(sport));
    }
}
