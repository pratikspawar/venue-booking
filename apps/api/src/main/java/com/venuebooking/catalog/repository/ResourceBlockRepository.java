package com.venuebooking.catalog.repository;

import com.venuebooking.catalog.entity.ResourceBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ResourceBlockRepository extends JpaRepository<ResourceBlock, Long> {

    List<ResourceBlock> findByResourceId(Long resourceId);

    @Query("""
        SELECT b FROM ResourceBlock b
        WHERE b.resourceId = :resourceId
          AND b.startUtc < :endUtc
          AND b.endUtc > :startUtc
    """)
    List<ResourceBlock> findOverlappingBlocks(
            @Param("resourceId") Long resourceId,
            @Param("startUtc") Instant startUtc,
            @Param("endUtc") Instant endUtc
    );
}
