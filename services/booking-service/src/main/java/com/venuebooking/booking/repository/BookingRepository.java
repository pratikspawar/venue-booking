package com.venuebooking.booking.repository;

import com.venuebooking.booking.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByCustomerIdOrderByStartUtcDesc(Long customerId);

    List<Booking> findByTenantIdOrderByStartUtcDesc(Long tenantId);

    List<Booking> findByTenantIdAndStartUtcBetweenOrderByStartUtcAsc(Long tenantId, Instant start, Instant end);

    List<Booking> findByTenantIdAndVenueIdAndStartUtcBetweenOrderByStartUtcAsc(Long tenantId, Long venueId, Instant start, Instant end);

    List<Booking> findByVenueIdAndStartUtcBetweenOrderByStartUtcAsc(Long venueId, Instant start, Instant end);

    Optional<Booking> findByIdAndTenantId(Long id, Long tenantId);

    Optional<Booking> findByIdAndCustomerId(Long id, Long customerId);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.status = 'HELD'
          AND b.holdExpiresAt < :now
    """)
    List<Booking> findExpiredHolds(@Param("now") Instant now);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.resourceId = :resourceId
          AND b.status = 'HELD'
          AND b.holdExpiresAt <= :now
    """)
    List<Booking> findExpiredHoldsForResource(@Param("resourceId") Long resourceId, @Param("now") Instant now);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.status = 'CONFIRMED'
          AND b.startUtc < :cutoff
          AND NOT EXISTS (SELECT ps FROM PlaySession ps WHERE ps.bookingId = b.id)
    """)
    List<Booking> findPotentialNoShows(@Param("cutoff") Instant cutoff);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.status = 'CONFIRMED'
          AND b.reminderSent = false
          AND b.startUtc BETWEEN :windowStart AND :windowEnd
    """)
    List<Booking> findUpcomingConfirmedBookingsForReminder(
            @Param("windowStart") Instant windowStart,
            @Param("windowEnd") Instant windowEnd
    );
}
