package com.venuebooking.payment.service;

import com.venuebooking.common.BusinessException;
import com.venuebooking.payment.dto.CreatePaymentOrderRequestDto;
import com.venuebooking.payment.dto.CreateWalletTopupOrderRequestDto;
import com.venuebooking.payment.dto.PaymentOrderResponseDto;
import com.venuebooking.payment.dto.ProcessRefundRequestDto;
import com.venuebooking.payment.dto.RefundResponseDto;
import com.venuebooking.payment.dto.VerifyCheckoutRequest;
import com.venuebooking.payment.entity.Payment;
import com.venuebooking.payment.entity.Refund;
import com.venuebooking.payment.entity.WebhookEvent;
import com.venuebooking.payment.repository.PaymentRepository;
import com.venuebooking.payment.repository.RefundRepository;
import com.venuebooking.payment.repository.WebhookEventRepository;
import com.venuebooking.payment.repository.BookingPaymentReferenceRepository;
import com.venuebooking.payment.entity.BookingPaymentReference;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.time.Instant;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final WebhookEventRepository webhookEventRepository;
    private final RazorpaySignatureValidator signatureValidator;
    private final BookingPaymentReferenceRepository bookingRepository;
    private final RestClient.Builder restClientBuilder;
    private final TenantGatewayConfigService gatewayConfigService;

    @Value("${app.razorpay.api-url:https://api.razorpay.com/v1}")
    private String razorpayApiUrl;

    @Value("${app.internal.booking-base-url:http://localhost:8083}")
    private String bookingServiceUrl;

    @Value("${app.internal.service-token:}")
    private String internalServiceToken;

    @Transactional
    public PaymentOrderResponseDto createOrder(CreatePaymentOrderRequestDto req, Long customerId) {
        if (customerId == null) throw BusinessException.unauthorized("Sign in before paying for a booking");
        BookingPaymentReference booking = bookingRepository.findById(req.getBookingId())
                .orElseThrow(() -> BusinessException.notFound("Booking not found"));
        if (!customerId.equals(booking.getCustomerId())) throw BusinessException.forbidden("This booking belongs to another customer");
        if (!"HELD".equals(booking.getStatus()) || booking.getHoldExpiresAt() == null || !booking.getHoldExpiresAt().isAfter(Instant.now())) {
            throw new BusinessException("HOLD_EXPIRED", "The temporary slot hold has expired", HttpStatus.CONFLICT);
        }
        if (booking.getAmountPaise() == null || booking.getAmountPaise() <= 0) throw BusinessException.badRequest("Booking total must be positive");

        TenantGatewayConfigService.ResolvedGatewayCredentials creds = gatewayConfigService.resolveCredentials(booking.getTenantId());
        if (creds.getKeyId() == null || creds.getKeyId().isBlank() || creds.getKeySecret() == null || creds.getKeySecret().isBlank()) {
            throw new BusinessException("PAYMENT_NOT_CONFIGURED", "Online payment is not configured for this venue", HttpStatus.SERVICE_UNAVAILABLE);
        }

        Map<?, ?> providerOrder;
        try {
            providerOrder = restClientBuilder.clone().baseUrl(razorpayApiUrl)
                    .defaultHeaders(headers -> headers.setBasicAuth(creds.getKeyId(), creds.getKeySecret()))
                    .build().post().uri("/orders")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("amount", booking.getAmountPaise(), "currency", "INR", "receipt", "booking_" + booking.getId()))
                    .retrieve().body(Map.class);
        } catch (Exception e) {
            log.error("Razorpay order creation failed for booking #{} (tenant: {})", booking.getId(), booking.getTenantId(), e);
            throw new BusinessException("PAYMENT_PROVIDER_ERROR", "Could not start online payment. Try again.", HttpStatus.BAD_GATEWAY);
        }
        if (providerOrder == null || providerOrder.get("id") == null) {
            throw new BusinessException("PAYMENT_PROVIDER_ERROR", "Payment provider returned an invalid order", HttpStatus.BAD_GATEWAY);
        }
        String orderId = providerOrder.get("id").toString();

        Payment payment = Payment.builder()
                .tenantId(booking.getTenantId())
                .bookingId(req.getBookingId())
                .purpose(Payment.Purpose.BOOKING)
                .method(Payment.Method.ONLINE)
                .amountPaise(booking.getAmountPaise())
                .status(Payment.Status.CREATED)
                .gateway("RAZORPAY")
                .gatewayOrderId(orderId)
                .build();

        paymentRepository.save(payment);
        log.info("Created Razorpay order #{} for booking #{} on tenant #{}", orderId, req.getBookingId(), booking.getTenantId());

        return PaymentOrderResponseDto.builder()
                .orderId(orderId)
                .keyId(creds.getKeyId())
                .amountPaise(booking.getAmountPaise())
                .currency("INR")
                .bookingId(req.getBookingId())
                .build();
    }

    @Transactional
    public PaymentOrderResponseDto createWalletTopupOrder(CreateWalletTopupOrderRequestDto req, Long customerId) {
        if (customerId == null) throw BusinessException.unauthorized("Sign in before topping up wallet");
        if (req.amountPaise() == null || req.amountPaise() < 10000) {
            throw BusinessException.badRequest("Minimum wallet recharge amount is ₹100");
        }
        Long tenantId = req.tenantId() != null ? req.tenantId() : 1L;

        TenantGatewayConfigService.ResolvedGatewayCredentials creds = gatewayConfigService.resolveCredentials(tenantId);
        final String resolvedKeyId = (creds.getKeyId() != null && !creds.getKeyId().isBlank())
                ? creds.getKeyId() : "rzp_test_mock_wallet";
        final String resolvedKeySecret = creds.getKeySecret();

        String orderId;
        if (creds.getKeyId() != null && !creds.getKeyId().isBlank() && resolvedKeySecret != null && !resolvedKeySecret.isBlank()) {
            try {
                Map<?, ?> providerOrder = restClientBuilder.clone().baseUrl(razorpayApiUrl)
                        .defaultHeaders(headers -> headers.setBasicAuth(resolvedKeyId, resolvedKeySecret))
                        .build().post().uri("/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of("amount", req.amountPaise(), "currency", "INR", "receipt", "wallet_" + customerId + "_" + System.currentTimeMillis()))
                        .retrieve().body(Map.class);
                if (providerOrder == null || providerOrder.get("id") == null) {
                    throw new BusinessException("PAYMENT_PROVIDER_ERROR", "Payment provider returned invalid order", HttpStatus.BAD_GATEWAY);
                }
                orderId = providerOrder.get("id").toString();
            } catch (Exception e) {
                log.error("Razorpay order creation failed for wallet topup: customer={}, amount={}", customerId, req.amountPaise(), e);
                throw new BusinessException("PAYMENT_PROVIDER_ERROR", "Could not start wallet recharge payment", HttpStatus.BAD_GATEWAY);
            }
        } else {
            orderId = "order_mock_wallet_" + System.currentTimeMillis();
        }

        Payment payment = Payment.builder()
                .tenantId(tenantId)
                .bookingId(null)
                .purpose(Payment.Purpose.WALLET_TOPUP)
                .method(Payment.Method.ONLINE)
                .amountPaise(req.amountPaise())
                .status(Payment.Status.CREATED)
                .gateway("RAZORPAY")
                .gatewayOrderId(orderId)
                .receivedBy(customerId)
                .build();

        paymentRepository.save(payment);
        log.info("Created Razorpay wallet topup order #{} for customer #{} on tenant #{} (₹{})",
                orderId, customerId, tenantId, req.amountPaise() / 100);

        return PaymentOrderResponseDto.builder()
                .orderId(orderId)
                .keyId(resolvedKeyId)
                .amountPaise(req.amountPaise())
                .currency("INR")
                .bookingId(null)
                .build();
    }

    @Transactional
    public void verifyCheckout(VerifyCheckoutRequest request, Long customerId) {
        Payment payment = paymentRepository.findByGatewayOrderId(request.orderId())
                .orElseThrow(() -> BusinessException.notFound("Payment order not found"));

        if (payment.getPurpose() == Payment.Purpose.WALLET_TOPUP) {
            if (customerId == null || !customerId.equals(payment.getReceivedBy())) {
                throw BusinessException.forbidden("This wallet top-up belongs to another customer");
            }
        } else {
            BookingPaymentReference booking = bookingRepository.findById(payment.getBookingId())
                    .orElseThrow(() -> BusinessException.notFound("Booking not found"));
            if (customerId == null || !customerId.equals(booking.getCustomerId())) {
                throw BusinessException.forbidden("This booking belongs to another customer");
            }
        }

        TenantGatewayConfigService.ResolvedGatewayCredentials creds = gatewayConfigService.resolveCredentials(payment.getTenantId());
        if (!signatureValidator.isCheckoutValid(payment.getGatewayOrderId(), request.paymentId(), request.signature(), creds.getKeySecret())) {
            throw BusinessException.badRequest("Invalid payment signature");
        }
        if (payment.getStatus() == Payment.Status.SUCCESS && !request.paymentId().equals(payment.getGatewayPaymentId())) {
            throw BusinessException.badRequest("Payment order was already paid with a different payment");
        }
        payment.setStatus(Payment.Status.SUCCESS);
        payment.setGatewayPaymentId(request.paymentId());
        paymentRepository.save(payment);
        confirmBookingOrRefund(payment);
    }

    @Transactional
    public void processWebhook(String eventId, String eventType, String orderId, String paymentId, String refundId, Long capturedAmountPaise, String payload, String signature) {
        processWebhook(eventId, eventType, orderId, paymentId, refundId, capturedAmountPaise, payload, signature, null);
    }

    @Transactional
    public void processWebhook(String eventId, String eventType, String orderId, String paymentId, String refundId, Long capturedAmountPaise, String payload, String signature, Long tenantId) {
        if (eventId == null || eventId.isBlank() || eventType == null || eventType.isBlank()) {
            throw BusinessException.badRequest("Missing Razorpay event ID or type");
        }

        TenantGatewayConfigService.ResolvedGatewayCredentials creds = gatewayConfigService.resolveCredentials(tenantId);
        String activeWebhookSecret = creds.getWebhookSecret();

        if (activeWebhookSecret == null || activeWebhookSecret.isBlank() || signature == null || signature.isBlank()
                || !signatureValidator.isValid(payload, signature, activeWebhookSecret)) {
            log.warn("Rejected webhook with invalid HMAC-SHA256 signature for event #{} (tenant: {})", eventId, tenantId);
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
            if (orderId == null || paymentId == null) throw BusinessException.badRequest("Webhook is missing payment identifiers");
            Payment payment = paymentRepository.findByGatewayOrderId(orderId)
                    .orElseThrow(() -> BusinessException.notFound("Payment order #" + orderId + " not found"));
            if (capturedAmountPaise == null || !payment.getAmountPaise().equals(capturedAmountPaise)) {
                throw BusinessException.badRequest("Captured amount does not match the payment order");
            }

            payment.setStatus(Payment.Status.SUCCESS);
            payment.setGatewayPaymentId(paymentId);
            paymentRepository.save(payment);

            confirmBookingOrRefund(payment);

            log.info("Payment #{} successfully captured for booking #{} (₹{})",
                    paymentId, payment.getBookingId(), payment.getAmountPaise() / 100);
        } else if ("payment.failed".equalsIgnoreCase(eventType)) {
            if (orderId == null) throw BusinessException.badRequest("Webhook is missing payment order ID");
            paymentRepository.findByGatewayOrderId(orderId).ifPresent(payment -> {
                if (payment.getStatus() != Payment.Status.SUCCESS) {
                    payment.setStatus(Payment.Status.FAILED);
                    paymentRepository.save(payment);
                    releaseFailedHold(payment.getBookingId());
                }
            });
        } else if ("refund.processed".equalsIgnoreCase(eventType) || "refund.failed".equalsIgnoreCase(eventType)) {
            if (refundId != null) refundRepository.findByGatewayRefundId(refundId).ifPresent(refund -> {
                refund.setStatus("refund.processed".equalsIgnoreCase(eventType) ? Refund.Status.PROCESSED : Refund.Status.FAILED);
                refundRepository.save(refund);
            });
        }
    }

    private void confirmBookingOrRefund(Payment payment) {
        if (payment.getPurpose() == Payment.Purpose.WALLET_TOPUP) {
            try {
                restClientBuilder.clone().baseUrl(bookingServiceUrl).build()
                        .post().uri("/wallets/topup")
                        .header("X-Tenant-Id", String.valueOf(payment.getTenantId()))
                        .body(Map.of(
                                "userId", payment.getReceivedBy(),
                                "amountPaise", payment.getAmountPaise(),
                                "referenceId", payment.getGatewayPaymentId() != null ? payment.getGatewayPaymentId() : "pay_mock_" + payment.getId(),
                                "notes", "Razorpay Online Wallet Top-Up"
                        ))
                        .retrieve().toBodilessEntity();
                log.info("Wallet credited successfully for customer #{}: ₹{}",
                        payment.getReceivedBy(), payment.getAmountPaise() / 100.0);
            } catch (Exception e) {
                log.error("Failed to credit wallet top-up for customer #{}: {}", payment.getReceivedBy(), e.getMessage());
            }
            return;
        }

        if (internalServiceToken == null || internalServiceToken.isBlank()) {
            throw new BusinessException("INTERNAL_SERVICE_NOT_CONFIGURED", "Booking payment confirmation is not configured", HttpStatus.SERVICE_UNAVAILABLE);
        }
        try {
            restClientBuilder.clone().baseUrl(bookingServiceUrl).build()
                    .post().uri("/internal/bookings/{id}/payment-captured", payment.getBookingId())
                    .header("X-Internal-Service-Token", internalServiceToken)
                    .body(Map.of("amountPaise", payment.getAmountPaise()))
                    .retrieve().toBodilessEntity();
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() != 409) {
                throw new BusinessException("BOOKING_CONFIRMATION_FAILED", "Could not confirm the booking after payment", HttpStatus.BAD_GATEWAY);
            }
            issueLatePaymentRefund(payment);
        }
    }

    private void issueLatePaymentRefund(Payment payment) {
        TenantGatewayConfigService.ResolvedGatewayCredentials creds = gatewayConfigService.resolveCredentials(payment.getTenantId());
        try {
            Map<?, ?> providerRefund = restClientBuilder.clone().baseUrl(razorpayApiUrl)
                    .defaultHeaders(headers -> headers.setBasicAuth(creds.getKeyId(), creds.getKeySecret()))
                    .build().post().uri("/payments/{id}/refund", payment.getGatewayPaymentId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("amount", payment.getAmountPaise(), "notes", Map.of("reason", "booking_hold_expired")))
                    .retrieve().body(Map.class);
            if (providerRefund == null || providerRefund.get("id") == null) {
                throw new IllegalStateException("Razorpay returned an invalid refund response");
            }
            refundRepository.save(Refund.builder()
                    .tenantId(payment.getTenantId())
                    .paymentId(payment.getId())
                    .bookingId(payment.getBookingId())
                    .amountPaise(payment.getAmountPaise())
                    .status(Refund.Status.REQUESTED)
                    .gatewayRefundId(providerRefund.get("id").toString())
                    .reason("Automatic refund: booking hold expired before payment confirmation")
                    .build());
            log.warn("Late payment for booking #{} automatically refunded", payment.getBookingId());
        } catch (Exception e) {
            log.error("Automatic refund failed for late payment #{}", payment.getGatewayPaymentId(), e);
            throw new BusinessException("AUTO_REFUND_FAILED", "Payment arrived after the slot expired; refund needs reconciliation", HttpStatus.BAD_GATEWAY);
        }
    }

    private void releaseFailedHold(Long bookingId) {
        if (internalServiceToken == null || internalServiceToken.isBlank()) return;
        restClientBuilder.clone().baseUrl(bookingServiceUrl).build()
                .post().uri("/internal/bookings/{id}/payment-failed", bookingId)
                .header("X-Internal-Service-Token", internalServiceToken)
                .retrieve().toBodilessEntity();
    }

    @Transactional
    public RefundResponseDto processRefund(ProcessRefundRequestDto req, Long tenantId) {
        if (tenantId == null) throw BusinessException.unauthorized("Tenant context is required");
        Payment payment = paymentRepository.findByBookingId(req.getBookingId())
                .stream()
                .filter(p -> p.getStatus() == Payment.Status.SUCCESS && tenantId.equals(p.getTenantId()))
                .findFirst()
                .orElseThrow(() -> BusinessException.notFound("No successful payment found for booking #" + req.getBookingId()));

        if (req.getAmountPaise() <= 0) {
            throw BusinessException.badRequest("Refund amount must be greater than zero paise");
        }

        long previouslyRefunded = refundRepository.findByBookingId(req.getBookingId()).stream()
                .filter(refund -> refund.getStatus() != Refund.Status.FAILED)
                .mapToLong(Refund::getAmountPaise).sum();
        if (req.getAmountPaise() > payment.getAmountPaise() - previouslyRefunded) {
            throw BusinessException.badRequest("Refund amount cannot exceed original payment amount of ₹" + (payment.getAmountPaise() / 100));
        }

        TenantGatewayConfigService.ResolvedGatewayCredentials creds = gatewayConfigService.resolveCredentials(payment.getTenantId());
        if (!"RAZORPAY".equals(payment.getGateway()) || payment.getGatewayPaymentId() == null
                || creds.getKeyId() == null || creds.getKeyId().isBlank() || creds.getKeySecret() == null || creds.getKeySecret().isBlank()) {
            throw new BusinessException("REFUND_NOT_AVAILABLE", "A refundable online payment was not found", HttpStatus.CONFLICT);
        }
        Map<?, ?> providerRefund;
        try {
            providerRefund = restClientBuilder.clone().baseUrl(razorpayApiUrl)
                    .defaultHeaders(headers -> headers.setBasicAuth(creds.getKeyId(), creds.getKeySecret()))
                    .build().post().uri("/payments/{id}/refund", payment.getGatewayPaymentId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("amount", req.getAmountPaise(), "notes", Map.of("booking_id", req.getBookingId().toString())))
                    .retrieve().body(Map.class);
        } catch (Exception e) {
            log.error("Razorpay refund request failed for booking #{}", req.getBookingId(), e);
            throw new BusinessException("REFUND_PROVIDER_ERROR", "Could not issue the refund; reconcile with the payment provider", HttpStatus.BAD_GATEWAY);
        }
        if (providerRefund == null || providerRefund.get("id") == null) {
            throw new BusinessException("REFUND_PROVIDER_ERROR", "Payment provider returned an invalid refund", HttpStatus.BAD_GATEWAY);
        }
        Refund refund = Refund.builder()
                .tenantId(payment.getTenantId())
                .paymentId(payment.getId())
                .bookingId(req.getBookingId())
                .amountPaise(req.getAmountPaise())
                .status(Refund.Status.REQUESTED)
                .gatewayRefundId(providerRefund.get("id").toString())
                .reason(req.getReason() != null ? req.getReason() : "Customer cancellation per venue policy")
                .build();

        Refund savedRefund = refundRepository.save(refund);
        log.info("Processed policy refund #{} of ₹{} for booking #{}",
                savedRefund.getGatewayRefundId(), req.getAmountPaise() / 100, req.getBookingId());

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
    public List<Payment> getPaymentsByBooking(Long bookingId, Long tenantId, Long customerId, boolean staff) {
        BookingPaymentReference booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> BusinessException.notFound("Booking not found"));
        if (tenantId == null || !tenantId.equals(booking.getTenantId())) throw BusinessException.notFound("Booking not found");
        if (!staff && (customerId == null || !customerId.equals(booking.getCustomerId()))) throw BusinessException.forbidden("This booking belongs to another customer");
        return paymentRepository.findByBookingId(bookingId).stream().filter(p -> tenantId.equals(p.getTenantId())).toList();
    }

    @Transactional(readOnly = true)
    public List<Refund> getRefundsByBooking(Long bookingId) {
        return refundRepository.findByBookingId(bookingId);
    }

    @Transactional(readOnly = true)
    public List<Refund> getRefundsByBooking(Long bookingId, Long tenantId, Long customerId, boolean staff) {
        getPaymentsByBooking(bookingId, tenantId, customerId, staff);
        return refundRepository.findByBookingId(bookingId).stream().filter(r -> tenantId.equals(r.getTenantId())).toList();
    }

    @Transactional
    public Payment recordCounterPayment(Long bookingId, Long amountPaise, Long tenantId, Long receivedBy, Payment.Method method) {
        BookingPaymentReference booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> BusinessException.notFound("Booking not found"));
        if (tenantId == null || !tenantId.equals(booking.getTenantId())) throw BusinessException.notFound("Booking not found");
        if (!"CONFIRMED".equals(booking.getStatus()) && !"IN_PROGRESS".equals(booking.getStatus())) {
            throw new BusinessException("BOOKING_NOT_PAYABLE", "Only confirmed bookings can be settled at the counter", HttpStatus.CONFLICT);
        }
        if (amountPaise == null || amountPaise <= 0 || booking.getAmountPaise() == null || amountPaise > booking.getAmountPaise()) {
            throw BusinessException.badRequest("Counter payment amount is invalid");
        }
        if (method != Payment.Method.CASH && method != Payment.Method.UPI_COUNTER) {
            throw BusinessException.badRequest("Counter payments must use CASH or UPI_COUNTER");
        }
        Payment payment = Payment.builder()
                .tenantId(tenantId)
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
