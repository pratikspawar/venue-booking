package com.venuebooking.payment.controller;

import com.venuebooking.payment.dto.CreatePaymentOrderRequestDto;
import com.venuebooking.payment.dto.PaymentOrderResponseDto;
import com.venuebooking.payment.dto.ProcessRefundRequestDto;
import com.venuebooking.payment.dto.RefundResponseDto;
import com.venuebooking.payment.entity.Payment;
import com.venuebooking.payment.entity.Refund;
import com.venuebooking.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Payments & Webhooks", description = "Online checkout orders, counter collections, gateway webhooks, and refunds")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/payments/order")
    @Operation(summary = "Initiate online booking payment", description = "Creates a Razorpay order for an active booking hold")
    public ResponseEntity<PaymentOrderResponseDto> createOrder(@Valid @RequestBody CreatePaymentOrderRequestDto req) {
        return ResponseEntity.ok(paymentService.createOrder(req));
    }

    @PostMapping("/webhooks/razorpay")
    @Operation(summary = "Razorpay webhook callback", description = "Cryptographically verified, idempotent payment capture webhook")
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @RequestHeader(value = "X-Razorpay-Event-Id", required = false) String headerEventId,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            @RequestBody Map<String, Object> payload
    ) {
        String eventId = headerEventId != null ? headerEventId : (String) payload.getOrDefault("event_id", "evt_" + System.currentTimeMillis());
        String eventType = (String) payload.getOrDefault("event", "payment.captured");

        // Parse order and payment IDs from payload
        String orderId = (String) payload.getOrDefault("order_id", "order_test");
        String paymentId = (String) payload.getOrDefault("payment_id", "pay_test");

        paymentService.processWebhook(eventId, eventType, orderId, paymentId, payload.toString(), signature);
        return ResponseEntity.ok(Map.of("status", "ok", "event_id", eventId));
    }

    @PostMapping("/payments/refund")
    @Operation(summary = "Process cancellation refund", description = "Issues policy-calculated refund against original payment")
    public ResponseEntity<RefundResponseDto> processRefund(@Valid @RequestBody ProcessRefundRequestDto req) {
        return ResponseEntity.ok(paymentService.processRefund(req));
    }

    @GetMapping("/payments/booking/{bookingId}")
    @Operation(summary = "Get booking payments", description = "Retrieves payment history for a given booking")
    public ResponseEntity<List<Payment>> getBookingPayments(@PathVariable Long bookingId) {
        return ResponseEntity.ok(paymentService.getPaymentsByBooking(bookingId));
    }

    @GetMapping("/refunds/booking/{bookingId}")
    @Operation(summary = "Get booking refunds", description = "Retrieves refund records for a given booking")
    public ResponseEntity<List<Refund>> getBookingRefunds(@PathVariable Long bookingId) {
        return ResponseEntity.ok(paymentService.getRefundsByBooking(bookingId));
    }

    @PostMapping("/payments/counter")
    @Operation(summary = "Record counter payment", description = "Records cash or counter UPI payment collected at venue desk")
    public ResponseEntity<Payment> recordCounterPayment(
            @RequestParam Long bookingId,
            @RequestParam Long amountPaise,
            @RequestParam(required = false, defaultValue = "1") Long tenantId,
            @RequestParam(required = false) Long staffId,
            @RequestParam(defaultValue = "CASH") Payment.Method method
    ) {
        return ResponseEntity.ok(paymentService.recordCounterPayment(bookingId, amountPaise, tenantId, staffId, method));
    }
}
