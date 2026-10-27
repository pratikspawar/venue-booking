package com.venuebooking.payment.controller;

import com.venuebooking.payment.dto.CreatePaymentOrderRequestDto;
import com.venuebooking.payment.dto.PaymentOrderResponseDto;
import com.venuebooking.payment.dto.ProcessRefundRequestDto;
import com.venuebooking.payment.dto.VerifyCheckoutRequest;
import com.venuebooking.payment.dto.RefundResponseDto;
import com.venuebooking.payment.entity.Payment;
import com.venuebooking.payment.entity.Refund;
import com.venuebooking.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Payments & Webhooks", description = "Online checkout orders, counter collections, gateway webhooks, and refunds")
public class PaymentController {

    private final PaymentService paymentService;
    private final ObjectMapper objectMapper;

    @Value("${app.internal.service-token:}")
    private String internalServiceToken;

    @PostMapping("/payments/order")
    @Operation(summary = "Initiate online booking payment", description = "Creates a Razorpay order for an active booking hold")
    public ResponseEntity<PaymentOrderResponseDto> createOrder(
            @RequestHeader(value = "X-User-Id", required = false) Long customerId,
            @Valid @RequestBody CreatePaymentOrderRequestDto req
    ) {
        return ResponseEntity.ok(paymentService.createOrder(req, customerId));
    }

    @PostMapping("/payments/wallet-topup-order")
    @Operation(summary = "Initiate wallet top-up payment order", description = "Creates a Razorpay order for customer wallet recharge")
    public ResponseEntity<PaymentOrderResponseDto> createWalletTopupOrder(
            @RequestHeader(value = "X-User-Id", required = false) Long customerId,
            @Valid @RequestBody com.venuebooking.payment.dto.CreateWalletTopupOrderRequestDto req
    ) {
        return ResponseEntity.ok(paymentService.createWalletTopupOrder(req, customerId));
    }

    @PostMapping("/payments/verify-checkout")
    @Operation(summary = "Verify the signed Razorpay checkout response")
    public ResponseEntity<Void> verifyCheckout(
            @RequestHeader(value = "X-User-Id", required = false) Long customerId,
            @Valid @RequestBody VerifyCheckoutRequest request
    ) {
        paymentService.verifyCheckout(request, customerId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/webhooks/razorpay")
    @Operation(summary = "Razorpay webhook callback", description = "Cryptographically verified, idempotent payment capture webhook")
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @RequestHeader(value = "X-Razorpay-Event-Id") String eventId,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            @RequestParam(value = "tenantId", required = false) Long tenantId,
            @RequestBody String rawBody
    ) {
        final JsonNode payload;
        try {
            payload = objectMapper.readTree(rawBody);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "invalid_payload"));
        }
        JsonNode entity = payload.path("payload").path("payment").path("entity");
        JsonNode refundEntity = payload.path("payload").path("refund").path("entity");
        String eventType = payload.path("event").asText(null);
        String orderId = entity.path("order_id").asText(null);
        String paymentId = entity.path("id").asText(null);
        String refundId = refundEntity.path("id").asText(null);
        Long capturedAmountPaise = entity.has("amount") ? entity.path("amount").asLong() : null;

        paymentService.processWebhook(eventId, eventType, orderId, paymentId, refundId, capturedAmountPaise, rawBody, signature, tenantId);
        return ResponseEntity.ok(Map.of("status", "ok", "event_id", eventId));
    }

    @PostMapping("/payments/refund")
    @Operation(summary = "Process cancellation refund", description = "Issues policy-calculated refund against original payment")
    public ResponseEntity<RefundResponseDto> processRefund(
            @RequestHeader(value = "X-Tenant-Id", required = false) Long tenantId,
            @Valid @RequestBody ProcessRefundRequestDto req) {
        return ResponseEntity.ok(paymentService.processRefund(req, tenantId));
    }

    @PostMapping("/internal/payments/refund")
    @Operation(hidden = true)
    public ResponseEntity<RefundResponseDto> processInternalRefund(
            @RequestHeader(value = "X-Internal-Service-Token", required = false) String token,
            @RequestHeader(value = "X-Tenant-Id", required = false) Long tenantId,
            @Valid @RequestBody ProcessRefundRequestDto req) {
        if (internalServiceToken == null || internalServiceToken.isBlank() || token == null
                || !MessageDigest.isEqual(internalServiceToken.getBytes(StandardCharsets.UTF_8), token.getBytes(StandardCharsets.UTF_8))) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(paymentService.processRefund(req, tenantId));
    }

    @GetMapping("/payments/booking/{bookingId}")
    @Operation(summary = "Get booking payments", description = "Retrieves payment history for a given booking")
    public ResponseEntity<List<Payment>> getBookingPayments(
            @PathVariable Long bookingId,
            @RequestHeader(value = "X-Tenant-Id", required = false) Long tenantId,
            @RequestHeader(value = "X-User-Id", required = false) Long customerId,
            @RequestHeader(value = "X-Roles", required = false) String roles) {
        return ResponseEntity.ok(paymentService.getPaymentsByBooking(bookingId, tenantId, customerId, isStaff(roles)));
    }

    @GetMapping("/refunds/booking/{bookingId}")
    @Operation(summary = "Get booking refunds", description = "Retrieves refund records for a given booking")
    public ResponseEntity<List<Refund>> getBookingRefunds(
            @PathVariable Long bookingId,
            @RequestHeader(value = "X-Tenant-Id", required = false) Long tenantId,
            @RequestHeader(value = "X-User-Id", required = false) Long customerId,
            @RequestHeader(value = "X-Roles", required = false) String roles) {
        return ResponseEntity.ok(paymentService.getRefundsByBooking(bookingId, tenantId, customerId, isStaff(roles)));
    }

    @PostMapping("/payments/counter")
    @Operation(summary = "Record counter payment", description = "Records cash or counter UPI payment collected at venue desk")
    public ResponseEntity<Payment> recordCounterPayment(
            @RequestHeader(value = "X-Tenant-Id", required = false) Long authenticatedTenantId,
            @RequestHeader(value = "X-User-Id", required = false) Long authenticatedStaffId,
            @RequestParam Long bookingId,
            @RequestParam Long amountPaise,
            @RequestParam(defaultValue = "CASH") Payment.Method method
    ) {
        if (authenticatedTenantId == null) return ResponseEntity.badRequest().build();
        if (authenticatedStaffId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(paymentService.recordCounterPayment(bookingId, amountPaise, authenticatedTenantId,
                authenticatedStaffId, method));
    }

    private boolean isStaff(String roles) {
        return roles != null && (roles.contains("ROLE_STAFF") || roles.contains("ROLE_MANAGER")
                || roles.contains("ROLE_OWNER") || roles.contains("ROLE_SUPER_ADMIN"));
    }
}
