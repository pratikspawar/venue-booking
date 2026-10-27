package com.venuebooking.payment.service;

import com.venuebooking.common.BusinessException;
import com.venuebooking.payment.dto.CreateWalletTopupOrderRequestDto;
import com.venuebooking.payment.dto.PaymentOrderResponseDto;
import com.venuebooking.payment.dto.VerifyCheckoutRequest;
import com.venuebooking.payment.entity.Payment;
import com.venuebooking.payment.repository.BookingPaymentReferenceRepository;
import com.venuebooking.payment.repository.PaymentRepository;
import com.venuebooking.payment.repository.RefundRepository;
import com.venuebooking.payment.repository.WebhookEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Customer Wallet Top-Up Payment Service Tests (Task 2.1)")
class WalletTopupPaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private RefundRepository refundRepository;
    @Mock
    private WebhookEventRepository webhookEventRepository;
    @Mock
    private RazorpaySignatureValidator signatureValidator;
    @Mock
    private BookingPaymentReferenceRepository bookingRepository;
    @Mock
    private TenantGatewayConfigService gatewayConfigService;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(
                paymentRepository,
                refundRepository,
                webhookEventRepository,
                signatureValidator,
                bookingRepository,
                RestClient.builder(),
                gatewayConfigService
        );

        ReflectionTestUtils.setField(paymentService, "internalServiceToken", "test-token");
        ReflectionTestUtils.setField(paymentService, "bookingServiceUrl", "http://localhost:8083");
    }

    @Test
    @DisplayName("Create wallet top-up payment order successfully")
    void testCreateWalletTopupOrder_Success() {
        Long customerId = 42L;
        Long tenantId = 1L;
        Long amountPaise = 50000L; // ₹500

        when(gatewayConfigService.resolveCredentials(tenantId))
                .thenReturn(new TenantGatewayConfigService.ResolvedGatewayCredentials("rzp_test_key", "", "", true));

        CreateWalletTopupOrderRequestDto req = new CreateWalletTopupOrderRequestDto(amountPaise, tenantId);
        PaymentOrderResponseDto response = paymentService.createWalletTopupOrder(req, customerId);

        assertNotNull(response);
        assertEquals(amountPaise, response.getAmountPaise());
        assertEquals("INR", response.getCurrency());
        assertNull(response.getBookingId());

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository, times(1)).save(captor.capture());

        Payment saved = captor.getValue();
        assertEquals(Payment.Purpose.WALLET_TOPUP, saved.getPurpose());
        assertEquals(Payment.Status.CREATED, saved.getStatus());
        assertEquals(amountPaise, saved.getAmountPaise());
        assertEquals(customerId, saved.getReceivedBy());
        assertEquals(tenantId, saved.getTenantId());
    }

    @Test
    @DisplayName("Reject wallet top-up order below ₹100 minimum threshold")
    void testCreateWalletTopupOrder_MinimumThreshold() {
        Long customerId = 42L;
        CreateWalletTopupOrderRequestDto req = new CreateWalletTopupOrderRequestDto(5000L, 1L); // ₹50

        assertThrows(BusinessException.class, () -> paymentService.createWalletTopupOrder(req, customerId));
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Reject wallet top-up order when customer is unauthenticated")
    void testCreateWalletTopupOrder_Unauthenticated() {
        CreateWalletTopupOrderRequestDto req = new CreateWalletTopupOrderRequestDto(50000L, 1L);

        assertThrows(BusinessException.class, () -> paymentService.createWalletTopupOrder(req, null));
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Verify wallet top-up checkout and update payment to SUCCESS")
    void testVerifyCheckout_WalletTopup() {
        Long customerId = 42L;
        String orderId = "order_mock_wallet_999";
        String paymentId = "pay_mock_123456";

        Payment existingPayment = Payment.builder()
                .id(101L)
                .tenantId(1L)
                .purpose(Payment.Purpose.WALLET_TOPUP)
                .amountPaise(50000L)
                .status(Payment.Status.CREATED)
                .gatewayOrderId(orderId)
                .receivedBy(customerId)
                .build();

        when(paymentRepository.findByGatewayOrderId(orderId))
                .thenReturn(Optional.of(existingPayment));
        when(gatewayConfigService.resolveCredentials(1L))
                .thenReturn(new TenantGatewayConfigService.ResolvedGatewayCredentials("key", "secret", "wh", true));
        when(signatureValidator.isCheckoutValid(eq(orderId), eq(paymentId), any(), eq("secret")))
                .thenReturn(true);

        VerifyCheckoutRequest request = new VerifyCheckoutRequest(orderId, paymentId, "valid_signature");
        paymentService.verifyCheckout(request, customerId);

        assertEquals(Payment.Status.SUCCESS, existingPayment.getStatus());
        assertEquals(paymentId, existingPayment.getGatewayPaymentId());
        verify(paymentRepository, times(1)).save(existingPayment);
    }
}
