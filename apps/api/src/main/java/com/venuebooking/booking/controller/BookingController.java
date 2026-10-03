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
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Bookings", description = "Customer booking holds, confirmations, and cancellations")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/bookings")
    @Operation(summary = "Create a booking hold", description = "Reserves slot cells for 8 minutes and enforces double-booking prevention")
    public ResponseEntity<BookingResponseDto> createBooking(
            Authentication authentication,
            @Valid @RequestBody CreateBookingRequestDto requestDto
    ) {
        Long customerId = authentication != null && authentication.getName() != null
                ? Long.parseLong(authentication.getName())
                : null;

        BookingResponseDto response = bookingService.createBooking(
                requestDto,
                customerId,
                customerId != null ? Booking.Source.APP : Booking.Source.WALKIN
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/bookings/{id}")
    @Operation(summary = "Get booking details", description = "Retrieves status, amount, and reserved time for a booking")
    public ResponseEntity<BookingResponseDto> getBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    @GetMapping("/me/bookings")
    @Operation(summary = "List customer bookings", description = "Retrieves upcoming and past bookings for the authenticated customer")
    public ResponseEntity<List<BookingResponseDto>> getMyBookings(Authentication authentication) {
        Long customerId = Long.parseLong(authentication.getName());
        return ResponseEntity.ok(bookingService.listCustomerBookings(customerId));
    }

    @PostMapping("/bookings/{id}/cancel")
    @Operation(summary = "Cancel booking", description = "Cancels a held or confirmed booking and releases reserved slots")
    public ResponseEntity<BookingResponseDto> cancelBooking(
            Authentication authentication,
            @PathVariable Long id
    ) {
        Long customerId = Long.parseLong(authentication.getName());
        boolean isStaff = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_STAFF") ||
                               a.getAuthority().equals("ROLE_MANAGER") ||
                               a.getAuthority().equals("ROLE_OWNER"));

        return ResponseEntity.ok(bookingService.cancelBooking(id, customerId, isStaff));
    }
}
