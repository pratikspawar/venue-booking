package com.venuebooking.notification.repository;

import com.venuebooking.notification.entity.PushNotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PushNotificationLogRepository extends JpaRepository<PushNotificationLog, Long> {
    List<PushNotificationLog> findByBookingId(Long bookingId);
    List<PushNotificationLog> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<PushNotificationLog> findByNotificationType(String notificationType);
}
