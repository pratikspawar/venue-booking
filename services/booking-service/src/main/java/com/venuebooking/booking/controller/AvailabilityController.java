package com.venuebooking.booking.controller;

import com.venuebooking.booking.dto.ResourceAvailabilityResponseDto;
import com.venuebooking.booking.service.SlotAvailabilityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/resources")
@RequiredArgsConstructor
@Tag(name = "Slot Availability", description = "Dynamic slot availability and pricing engine")
public class AvailabilityController {

    private final SlotAvailabilityService slotAvailabilityService;

    @GetMapping("/{id}/availability")
    @Operation(summary = "Get live slot availability", description = "Calculates on-demand slot grid for a resource and date, overlaying active bookings and blocks")
    public ResponseEntity<ResourceAvailabilityResponseDto> getAvailability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(slotAvailabilityService.getAvailability(id, date));
    }
}
