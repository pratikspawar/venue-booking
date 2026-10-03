package com.venuebooking.booking.repository;

import com.venuebooking.booking.entity.BookingItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingItemRepository extends JpaRepository<BookingItem, Long> {

    List<BookingItem> findByBookingId(Long bookingId);

    List<BookingItem> findByTenantId(Long tenantId);

    List<BookingItem> findByTenantIdAndCreatedAtBetween(Long tenantId, java.time.Instant start, java.time.Instant end);

    void deleteByBookingId(Long bookingId);
}
