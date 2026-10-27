package com.venuebooking.booking.repository;

import com.venuebooking.booking.entity.PlaySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlaySessionRepository extends JpaRepository<PlaySession, Long> {

    Optional<PlaySession> findByBookingId(Long bookingId);

    Optional<PlaySession> findByIdAndTenantId(Long id, Long tenantId);

    @Query("""
        SELECT ps FROM PlaySession ps
        JOIN FETCH ps.booking b
        WHERE ps.tenantId = :tenantId
          AND ps.endedAt IS NULL
        ORDER BY ps.startedAt ASC
    """)
    List<PlaySession> findActiveSessionsByTenantId(@Param("tenantId") Long tenantId);

    @Query("""
        SELECT ps FROM PlaySession ps
        JOIN FETCH ps.booking b
        WHERE b.venueId = :venueId
          AND ps.endedAt IS NULL
        ORDER BY ps.startedAt ASC
    """)
    List<PlaySession> findActiveSessionsByVenueId(@Param("venueId") Long venueId);

    List<PlaySession> findByTenantIdAndStartedAtBetween(Long tenantId, Instant start, Instant end);
}

