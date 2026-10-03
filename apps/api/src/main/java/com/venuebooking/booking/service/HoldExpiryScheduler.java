package com.venuebooking.booking.service;

import com.venuebooking.booking.entity.Booking;
import com.venuebooking.booking.repository.BookingRepository;
import com.venuebooking.booking.repository.BookingSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class HoldExpiryScheduler {

    private final BookingRepository bookingRepository;
    private final BookingSlotRepository bookingSlotRepository;

    /**
     * Runs every 60 seconds to release unpurchased slot holds.
     */
    @Scheduled(fixedDelay = 60000, initialDelay = 15000)
    @Transactional
    public void releaseExpiredHolds() {
        Instant now = Instant.now();
        List<Booking> expiredHolds = bookingRepository.findExpiredHolds(now);

        if (expiredHolds.isEmpty()) {
            return;
        }

        log.info("Found {} expired booking holds to release", expiredHolds.size());

        List<Long> bookingIds = expiredHolds.stream().map(Booking::getId).toList();

        // 1. Release all occupied booking_slots
        bookingSlotRepository.deleteByBookingIdIn(bookingIds);

        // 2. Mark bookings as EXPIRED
        for (Booking booking : expiredHolds) {
            booking.setStatus(Booking.Status.EXPIRED);
        }
        bookingRepository.saveAll(expiredHolds);

        log.info("Successfully expired {} bookings and released reserved slots", expiredHolds.size());
    }
}
