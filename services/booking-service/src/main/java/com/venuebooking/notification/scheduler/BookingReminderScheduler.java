package com.venuebooking.notification.scheduler;

import com.venuebooking.booking.entity.Booking;
import com.venuebooking.booking.repository.BookingRepository;
import com.venuebooking.notification.service.PushNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingReminderScheduler {

    private final BookingRepository bookingRepository;
    private final PushNotificationService pushNotificationService;

    /**
     * Periodically inspects confirmed bookings starting ~1 hour in the future (50-70m window)
     * and dispatches push reminders to the reserved players.
     */
    @Scheduled(fixedDelayString = "${app.notification.reminder-interval-ms:60000}")
    @Transactional
    public void dispatchUpcomingBookingReminders() {
        Instant now = Instant.now();
        Instant windowStart = now.plus(Duration.ofMinutes(50));
        Instant windowEnd = now.plus(Duration.ofMinutes(70));

        List<Booking> upcoming = bookingRepository.findUpcomingConfirmedBookingsForReminder(windowStart, windowEnd);
        if (upcoming.isEmpty()) return;

        log.info("Found {} upcoming bookings in 1-hour pre-slot window for push reminders", upcoming.size());

        for (Booking booking : upcoming) {
            try {
                pushNotificationService.sendPreSlotReminder(booking);
                booking.setReminderSent(true);
                bookingRepository.save(booking);
                log.info("Dispatched 1-hour pre-slot reminder for Booking #{}", booking.getId());
            } catch (Exception e) {
                log.error("Failed to dispatch pre-slot reminder for Booking #{}: {}", booking.getId(), e.getMessage());
            }
        }
    }
}
