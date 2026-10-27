package com.venuebooking.auth.repository;

import com.venuebooking.auth.entity.SmsDeliveryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SmsDeliveryLogRepository extends JpaRepository<SmsDeliveryLog, Long> {

    Optional<SmsDeliveryLog> findByMessageId(String messageId);

    List<SmsDeliveryLog> findByPhoneOrderByCreatedAtDesc(String phone);

    Optional<SmsDeliveryLog> findTopByPhoneOrderByCreatedAtDesc(String phone);
}
