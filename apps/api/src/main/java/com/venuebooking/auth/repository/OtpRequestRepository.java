package com.venuebooking.auth.repository;

import com.venuebooking.auth.entity.OtpRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface OtpRequestRepository extends JpaRepository<OtpRequest, Long> {

    long countByPhoneAndCreatedAtAfter(String phone, Instant after);

    Optional<OtpRequest> findTopByPhoneAndConsumedFalseOrderByCreatedAtDesc(String phone);
}
