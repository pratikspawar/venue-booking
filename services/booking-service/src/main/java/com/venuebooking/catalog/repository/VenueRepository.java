package com.venuebooking.catalog.repository;

import com.venuebooking.catalog.entity.Venue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VenueRepository extends JpaRepository<Venue, Long> {

    List<Venue> findByTenantId(Long tenantId);

    Optional<Venue> findByIdAndTenantId(Long id, Long tenantId);

    @Query("""
        SELECT DISTINCT v FROM Venue v
        LEFT JOIN Resource r ON r.venueId = v.id AND r.status = 'ACTIVE'
        LEFT JOIN Sport s ON s.id = r.sportId
        WHERE v.active = true
          AND (:city IS NULL OR LOWER(v.city) LIKE LOWER(CONCAT('%', :city, '%')))
          AND (:sportCode IS NULL OR LOWER(s.code) = LOWER(:sportCode))
          AND (:query IS NULL OR (
                LOWER(v.name) LIKE LOWER(CONCAT('%', :query, '%')) OR
                LOWER(v.address) LIKE LOWER(CONCAT('%', :query, '%')) OR
                LOWER(v.city) LIKE LOWER(CONCAT('%', :query, '%'))
              ))
    """)
    List<Venue> searchActiveVenues(
            @Param("city") String city,
            @Param("sportCode") String sportCode,
            @Param("query") String query
    );
}
