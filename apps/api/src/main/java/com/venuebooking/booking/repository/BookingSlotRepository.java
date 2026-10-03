package com.venuebooking.booking.repository;

import com.venuebooking.booking.entity.BookingSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

@Repository
public interface BookingSlotRepository extends JpaRepository<BookingSlot, Long> {

    @Query("""
        SELECT bs FROM BookingSlot bs
        WHERE bs.resourceId = :resourceId
          AND bs.slotStart >= :startUtc
          AND bs.slotStart < :endUtc
        ORDER BY bs.slotStart ASC
    """)
    List<BookingSlot> findSlotsForResourceAndRange(
            @Param("resourceId") Long resourceId,
            @Param("startUtc") Instant startUtc,
            @Param("endUtc") Instant endUtc
    );

    @Modifying
    @Query("DELETE FROM BookingSlot bs WHERE bs.bookingId = :bookingId")
    void deleteByBookingId(@Param("bookingId") Long bookingId);

    @Modifying
    @Query("DELETE FROM BookingSlot bs WHERE bs.bookingId IN :bookingIds")
    void deleteByBookingIdIn(@Param("bookingIds") Collection<Long> bookingIds);
}
