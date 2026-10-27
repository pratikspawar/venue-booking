package com.venuebooking.booking.service;

import com.venuebooking.booking.entity.Booking;
import com.venuebooking.booking.repository.BookingRepository;
import com.venuebooking.booking.repository.BookingSlotRepository;
import com.venuebooking.notification.service.PushNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NoShowScheduler {

    private final BookingRepository bookingRepository;
    private final BookingSlotRepository bookingSlotRepository;
    private final PushNotificationService pushNotificationService;

    @Value("${app.booking.no-show-grace-minutes:20}")
    private int noShowGraceMinutes = 20;

    /**
     * Periodically detects confirmed bookings whose start time plus grace period
     * has elapsed without check-in or play session start, marks them as NO_SHOW,
     * and releases the reserved slot records so resources can be rebooked.
     * Runs every 3 minutes.
     */
    @Scheduled(fixedDelay = 180000, initialDelay = 30000)
    @Transactional
    public void processNoShows() {
        Instant cutoff = Instant.now().minus(Duration.ofMinutes(noShowGraceMinutes));
        List<Booking> noShows = bookingRepository.findPotentialNoShows(cutoff);

        if (noShows.isEmpty()) {
            return;
        }

        log.info("Found {} confirmed bookings past {}-minute grace period for no-show auto-release",
                noShows.size(), noShowGraceMinutes);

        List<Long> bookingIds = noShows.stream().map(Booking::getId).toList();

        // 1. Release occupied booking slots so resource is immediately free for walk-ins/others
        bookingSlotRepository.deleteByBookingIdIn(bookingIds);

        // 2. Mark status as NO_SHOW and dispatch notice
        for (Booking booking : noShows) {
            booking.setStatus(Booking.Status.NO_SHOW);
            try {
                pushNotificationService.sendNoShowNotice(booking);
            } catch (Exception e) {
                log.error("Failed to send no-show notice for booking #{}: {}", booking.getId(), e.getMessage());
            }
        }
        bookingRepository.saveAll(noShows);

        log.info("Successfully marked {} bookings as NO_SHOW and released reserved slots: {}",
                noShows.size(), bookingIds);
    }
}
