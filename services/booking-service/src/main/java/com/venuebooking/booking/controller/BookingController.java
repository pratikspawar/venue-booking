package com.venuebooking.booking.controller;

import com.venuebooking.booking.dto.BookingResponseDto;
import com.venuebooking.booking.dto.CreateBookingRequestDto;
import com.venuebooking.booking.entity.Booking;
import com.venuebooking.booking.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Bookings", description = "Customer booking holds, confirmations, and cancellations")
public class BookingController {

    private final BookingService bookingService;

    @Value("${app.internal.service-token:}")
    private String internalServiceToken;

    @PostMapping("/bookings")
    @Operation(summary = "Create a booking hold", description = "Reserves slot cells for 8 minutes and enforces double-booking prevention")
    public ResponseEntity<BookingResponseDto> createBooking(
            @RequestHeader(value = "X-User-Id", required = false) Long customerId,
            @Valid @RequestBody CreateBookingRequestDto requestDto
    ) {
        BookingResponseDto response = bookingService.createBooking(
                requestDto,
                customerId,
                customerId != null ? Booking.Source.APP : Booking.Source.WALKIN
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/bookings/{id}")
    @Operation(summary = "Get booking details", description = "Retrieves status, amount, and reserved time for a booking")
    public ResponseEntity<BookingResponseDto> getBooking(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-Tenant-Id", required = false) Long tenantId,
            @RequestHeader(value = "X-Roles", required = false) String roles
    ) {
        boolean isStaff = hasStaffRole(roles);
        return ResponseEntity.ok(bookingService.getBookingById(id, userId, tenantId, isStaff));
    }

    @GetMapping("/bookings")
    @Operation(summary = "List tenant bookings for the staff desk")
    public ResponseEntity<List<BookingResponseDto>> getTenantBookings(
            @RequestHeader(value = "X-Tenant-Id", required = false) Long tenantId,
            @RequestHeader(value = "X-Roles", required = false) String roles
    ) {
        if (!hasStaffRole(roles) || tenantId == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(bookingService.listTenantBookings(tenantId));
    }

    @PostMapping("/bookings/{id}/pay-at-venue")
    @Operation(summary = "Choose pay at venue for an active slot hold")
    public ResponseEntity<BookingResponseDto> choosePayAtVenue(
            @RequestHeader(value = "X-User-Id", required = false) Long customerId,
            @PathVariable Long id
    ) {
        if (customerId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(bookingService.choosePayAtVenue(id, customerId));
    }

    @PostMapping("/internal/bookings/{id}/payment-captured")
    @Operation(hidden = true)
    public ResponseEntity<Void> confirmPayment(
            @PathVariable Long id,
            @RequestHeader(value = "X-Internal-Service-Token", required = false) String suppliedToken,
            @RequestBody PaymentCapturedRequest request
    ) {
        if (!validInternalToken(suppliedToken)) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        bookingService.confirmOnlinePayment(id, request.amountPaise());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/internal/bookings/{id}/payment-failed")
    @Operation(hidden = true)
    public ResponseEntity<Void> releaseFailedPayment(
            @PathVariable Long id,
            @RequestHeader(value = "X-Internal-Service-Token", required = false) String suppliedToken
    ) {
        if (!validInternalToken(suppliedToken)) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        bookingService.releaseFailedPaymentHold(id);
        return ResponseEntity.noContent().build();
    }

    private boolean validInternalToken(String suppliedToken) {
        return internalServiceToken != null && !internalServiceToken.isBlank() && suppliedToken != null
                && MessageDigest.isEqual(internalServiceToken.getBytes(StandardCharsets.UTF_8), suppliedToken.getBytes(StandardCharsets.UTF_8));
    }

    public record PaymentCapturedRequest(Long amountPaise) {}

    @GetMapping("/me/bookings")
    @Operation(summary = "List customer bookings", description = "Retrieves upcoming and past bookings for the authenticated customer")
    public ResponseEntity<List<BookingResponseDto>> getMyBookings(
            @RequestHeader(value = "X-User-Id", required = false) Long customerId
    ) {
        if (customerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(bookingService.listCustomerBookings(customerId));
    }

    @PostMapping("/bookings/{id}/cancel")
    @Operation(summary = "Cancel booking", description = "Cancels a held or confirmed booking with policy refund calculation and staff permission enforcement")
    public ResponseEntity<BookingResponseDto> cancelBooking(
            @RequestHeader(value = "X-User-Id", required = false) Long customerId,
            @RequestHeader(value = "X-Roles", required = false) String roles,
            @RequestHeader(value = "X-Tenant-Id", required = false) Long tenantId,
            @PathVariable Long id,
            @RequestBody(required = false) com.venuebooking.booking.dto.CancelBookingRequestDto requestDto
    ) {
        boolean isStaff = hasStaffRole(roles);
        return ResponseEntity.ok(bookingService.cancelBooking(id, customerId, isStaff, tenantId, roles, requestDto));
    }

    @GetMapping("/staff/audit-logs")
    @Operation(summary = "List audit logs for tenant operations ledger")
    public ResponseEntity<List<com.venuebooking.booking.dto.AuditLogResponseDto>> getTenantAuditLogs(
            @RequestHeader(value = "X-Tenant-Id", required = false) Long tenantId,
            @RequestHeader(value = "X-Roles", required = false) String roles
    ) {
        if (!hasStaffRole(roles) || tenantId == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(bookingService.getAuditLogsForTenant(tenantId));
    }

    private boolean hasStaffRole(String roles) {
        return roles != null && (roles.contains("ROLE_STAFF") || roles.contains("ROLE_MANAGER") || roles.contains("ROLE_OWNER") || roles.contains("ROLE_SUPER_ADMIN"));
    }
}
