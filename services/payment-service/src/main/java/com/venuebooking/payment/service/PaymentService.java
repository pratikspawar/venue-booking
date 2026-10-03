package com.venuebooking.payment.service;

import com.venuebooking.common.BusinessException;
import com.venuebooking.payment.dto.CreatePaymentOrderRequestDto;
import com.venuebooking.payment.dto.PaymentOrderResponseDto;
import com.venuebooking.payment.dto.ProcessRefundRequestDto;
import com.venuebooking.payment.dto.RefundResponseDto;
import com.venuebooking.payment.entity.Payment;
import com.venuebooking.payment.entity.Refund;
import com.venuebooking.payment.entity.WebhookEvent;
import com.venuebooking.payment.repository.PaymentRepository;
import com.venuebooking.payment.repository.RefundRepository;
import com.venuebooking.payment.repository.WebhookEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final WebhookEventRepository webhookEventRepository;
    private final RazorpaySignatureValidator signatureValidator;

    @Value("${app.razorpay.key-id:rzp_test_dummy}")
    private String keyId;

    @Value("${app.razorpay.webhook-secret:rzp_webhook_secret_dummy}")
    private String webhookSecret;

    @Transactional
    public PaymentOrderResponseDto createOrder(CreatePaymentOrderRequestDto req) {
        String mockOrderId = "order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);

        Payment payment = Payment.builder()
                .tenantId(req.getTenantId() != null ? req.getTenantId() : 1L)
                .bookingId(req.getBookingId())
                .purpose(Payment.Purpose.BOOKING)
                .method(Payment.Method.ONLINE)
                .amountPaise(req.getAmountPaise())
                .status(Payment.Status.CREATED)
                .gateway("RAZORPAY")
                .gatewayOrderId(mockOrderId)
                .build();

        paymentRepository.save(payment);
        log.info("Created payment order #{} for booking #{} (Amount: ₹{})", mockOrderId, req.getBookingId(), req.getAmountPaise() / 100);

        return PaymentOrderResponseDto.builder()
                .orderId(mockOrderId)
                .keyId(keyId)
                .amountPaise(req.getAmountPaise())
                .currency("INR")
                .bookingId(req.getBookingId())
                .build();
    }

    @Transactional
    public void processWebhook(String eventId, String eventType, String orderId, String paymentId, String payload, String signature) {
        // 1. Signature validation (if signature header provided)
        if (signature != null && !signature.isBlank() && !signatureValidator.isValid(payload, signature, webhookSecret)) {
            log.warn("Rejected webhook with invalid HMAC-SHA256 signature for event #{}", eventId);
            throw BusinessException.badRequest("Invalid webhook signature");
        }

        // 2. Idempotency check: don't process duplicate webhook callbacks
        if (webhookEventRepository.existsByGatewayAndEventId("RAZORPAY", eventId)) {
            log.info("Ignoring duplicate webhook event: {}", eventId);
            return;
        }

        WebhookEvent event = WebhookEvent.builder()
                .gateway("RAZORPAY")
                .eventId(eventId)
                .payload(payload)
                .processed(true)
                .build();
        webhookEventRepository.save(event);

        // 3. Process payment capture event
        if ("payment.captured".equalsIgnoreCase(eventType)) {
            Payment payment = paymentRepository.findByGatewayOrderId(orderId)
                    .orElseThrow(() -> BusinessException.notFound("Payment order #" + orderId + " not found"));

            payment.setStatus(Payment.Status.SUCCESS);
            payment.setGatewayPaymentId(paymentId);
            paymentRepository.save(payment);

            log.info("Payment #{} successfully captured for booking #{} (₹{})",
                    paymentId, payment.getBookingId(), payment.getAmountPaise() / 100);
        } else if ("refund.processed".equalsIgnoreCase(eventType)) {
            log.info("Gateway confirmed refund processing for event #{}", eventId);
        }
    }

    @Transactional
    public RefundResponseDto processRefund(ProcessRefundRequestDto req) {
        Payment payment = paymentRepository.findByBookingId(req.getBookingId())
                .stream()
                .filter(p -> p.getStatus() == Payment.Status.SUCCESS)
                .findFirst()
                .orElseThrow(() -> BusinessException.notFound("No successful payment found for booking #" + req.getBookingId()));

        if (req.getAmountPaise() <= 0) {
            throw BusinessException.badRequest("Refund amount must be greater than zero paise");
        }

        if (req.getAmountPaise() > payment.getAmountPaise()) {
            throw BusinessException.badRequest("Refund amount cannot exceed original payment amount of ₹" + (payment.getAmountPaise() / 100));
        }

        String mockGatewayRefundId = "rfnd_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);

        Refund refund = Refund.builder()
                .tenantId(payment.getTenantId())
                .paymentId(payment.getId())
                .bookingId(req.getBookingId())
                .amountPaise(req.getAmountPaise())
                .status(Refund.Status.PROCESSED)
                .gatewayRefundId(mockGatewayRefundId)
                .reason(req.getReason() != null ? req.getReason() : "Customer cancellation per venue policy")
                .build();

        Refund savedRefund = refundRepository.save(refund);
        log.info("Processed policy refund #{} of ₹{} for booking #{}",
                mockGatewayRefundId, req.getAmountPaise() / 100, req.getBookingId());

        return RefundResponseDto.builder()
                .id(savedRefund.getId())
                .paymentId(savedRefund.getPaymentId())
                .bookingId(savedRefund.getBookingId())
                .amountPaise(savedRefund.getAmountPaise())
                .status(savedRefund.getStatus())
                .gatewayRefundId(savedRefund.getGatewayRefundId())
                .reason(savedRefund.getReason())
                .createdAt(savedRefund.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<Payment> getPaymentsByBooking(Long bookingId) {
        return paymentRepository.findByBookingId(bookingId);
    }

    @Transactional(readOnly = true)
    public List<Refund> getRefundsByBooking(Long bookingId) {
        return refundRepository.findByBookingId(bookingId);
    }

    @Transactional
    public Payment recordCounterPayment(Long bookingId, Long amountPaise, Long tenantId, Long receivedBy, Payment.Method method) {
        Payment payment = Payment.builder()
                .tenantId(tenantId != null ? tenantId : 1L)
                .bookingId(bookingId)
                .purpose(Payment.Purpose.BOOKING)
                .method(method != null ? method : Payment.Method.CASH)
                .amountPaise(amountPaise)
                .status(Payment.Status.SUCCESS)
                .receivedBy(receivedBy)
                .build();

        return paymentRepository.save(payment);
    }
}
