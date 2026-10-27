package com.venuebooking.payment.repository;

import com.venuebooking.payment.entity.BookingPaymentReference;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingPaymentReferenceRepository extends JpaRepository<BookingPaymentReference, Long> {
}
