package com.venuebooking.catalog.repository;

import com.venuebooking.catalog.entity.VenueHours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VenueHoursRepository extends JpaRepository<VenueHours, Long> {

    List<VenueHours> findByVenueIdOrderByDayOfWeekAsc(Long venueId);

    Optional<VenueHours> findByVenueIdAndDayOfWeek(Long venueId, Integer dayOfWeek);

    void deleteByVenueId(Long venueId);
}
