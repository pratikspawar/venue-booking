package com.venuebooking.booking.controller;

import com.venuebooking.booking.dto.PlaySessionResponseDto;
import com.venuebooking.booking.dto.StartSessionRequestDto;
import com.venuebooking.booking.dto.StopSessionRequestDto;
import com.venuebooking.booking.service.StaffDeskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/staff")
@RequiredArgsConstructor
@Tag(name = "Staff Desk", description = "Live play sessions, walk-in timers, and counter management")
public class StaffDeskController {

    private final StaffDeskService staffDeskService;

    @PostMapping("/sessions/start")
    @Operation(summary = "Start live play session", description = "Starts a timer on a PlayStation console, pool table, or turf for walk-in or booked customer")
    public ResponseEntity<PlaySessionResponseDto> startSession(
            @RequestHeader(value = "X-User-Id", required = false) Long staffUserId,
            @Valid @RequestBody StartSessionRequestDto requestDto
    ) {
        PlaySessionResponseDto response = staffDeskService.startSession(requestDto, staffUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/sessions/{id}/stop")
    @Operation(summary = "Stop live play session", description = "Stops the session timer, calculates billable minutes with rounding, and finalizes invoice")
    public ResponseEntity<PlaySessionResponseDto> stopSession(
            @PathVariable Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) Long tenantId,
            @RequestHeader(value = "X-User-Id", required = false) Long staffUserId,
            @RequestBody(required = false) StopSessionRequestDto requestDto
    ) {
        PlaySessionResponseDto response = staffDeskService.stopSession(id, requestDto, staffUserId, tenantId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sessions/active")
    @Operation(summary = "List active live play sessions", description = "Retrieves all currently running sessions with elapsed duration for the venue desk")
    public ResponseEntity<List<PlaySessionResponseDto>> getActiveSessions(
            @RequestParam(required = false) Long venueId,
            @RequestHeader(value = "X-Tenant-Id", required = false) Long tenantId
    ) {
        return ResponseEntity.ok(staffDeskService.getActiveSessions(venueId, tenantId));
    }

    @PostMapping("/bookings/{id}/checkin")
    @Operation(summary = "Mark customer checked-in", description = "Marks an advance booking as customer arrived at venue")
    public ResponseEntity<Void> checkinBooking(
            @PathVariable Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) Long tenantId
    ) {
        staffDeskService.markCheckin(id, tenantId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bookings/{id}/no-show")
    @Operation(summary = "Mark booking as no-show", description = "Marks a confirmed booking as no-show when customer fails to arrive, releasing occupied slots")
    public ResponseEntity<Void> markNoShow(
            @PathVariable Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) Long tenantId,
            @RequestHeader(value = "X-User-Id", required = false) Long staffUserId
    ) {
        staffDeskService.markNoShow(id, staffUserId, tenantId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bookings/{bookingId}/items")
    @Operation(summary = "Attach canteen or equipment item to booking bill", description = "Adds snacks, beverages, or rented equipment to an active session bill")
    public ResponseEntity<com.venuebooking.booking.dto.BookingItemResponseDto> addItemToBooking(
            @PathVariable Long bookingId,
            @Valid @RequestBody com.venuebooking.booking.dto.AddBookingItemDto req
    ) {
        return ResponseEntity.ok(staffDeskService.addItemToBooking(bookingId, req));
    }

    @GetMapping("/bookings/{bookingId}/items")
    @Operation(summary = "List items attached to booking", description = "Retrieves all canteen and equipment items billed to a session")
    public ResponseEntity<List<com.venuebooking.booking.dto.BookingItemResponseDto>> getBookingItems(
            @PathVariable Long bookingId
    ) {
        return ResponseEntity.ok(staffDeskService.getBookingItems(bookingId));
    }

    @GetMapping("/shift-summary")
    @Operation(summary = "Shift cash and revenue summary", description = "Calculates daily shift close summary separating game time and canteen revenue")
    public ResponseEntity<com.venuebooking.booking.dto.ShiftSummaryResponseDto> getShiftSummary(
            @RequestParam(required = false) Long venueId,
            @RequestHeader(value = "X-Tenant-Id", required = false) Long tenantId
    ) {
        return ResponseEntity.ok(staffDeskService.getShiftSummary(venueId, tenantId));
    }

    @PostMapping("/sessions/{id}/extend")
    @Operation(summary = "Extend live play session", description = "Extends session in-place or identifies alternative tables if conflict occurs")
    public ResponseEntity<com.venuebooking.booking.dto.ExtendSessionResponseDto> extendSession(
            @PathVariable Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) Long tenantId,
            @RequestHeader(value = "X-User-Id", required = false) Long staffUserId,
            @RequestBody(required = false) com.venuebooking.booking.dto.ExtendSessionRequestDto requestDto
    ) {
        return ResponseEntity.ok(staffDeskService.extendSession(id, requestDto, staffUserId, tenantId));
    }

    @PostMapping("/sessions/{id}/swap-resource")
    @Operation(summary = "Swap live session table or resource", description = "Transfers an active session to an alternative available table/court")
    public ResponseEntity<PlaySessionResponseDto> swapSessionResource(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long staffUserId,
            @Valid @RequestBody com.venuebooking.booking.dto.SwapResourceRequestDto requestDto
    ) {
        return ResponseEntity.ok(staffDeskService.swapSessionResource(id, requestDto, staffUserId));
    }

    @PostMapping("/checkin/qr")
    @Operation(summary = "QR Scanner Check-in", description = "Scans merchant booking QR code to instantly verify customer and start live session")
    public ResponseEntity<com.venuebooking.booking.dto.QrCheckinResponseDto> qrCheckin(
            @RequestHeader(value = "X-User-Id", required = false) Long staffUserId,
            @Valid @RequestBody com.venuebooking.booking.dto.QrCheckinRequestDto requestDto
    ) {
        return ResponseEntity.ok(staffDeskService.qrCheckin(requestDto, staffUserId));
    }
}
