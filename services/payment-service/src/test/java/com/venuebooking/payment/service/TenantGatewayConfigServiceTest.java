package com.venuebooking.payment.service;

import com.venuebooking.payment.dto.TenantGatewayConfigResponseDto;
import com.venuebooking.payment.entity.TenantGatewayConfig;
import com.venuebooking.payment.repository.TenantGatewayConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantGatewayConfigServiceTest {

    @Mock
    private TenantGatewayConfigRepository gatewayConfigRepository;

    private CredentialEncryptionService encryptionService;

    private TenantGatewayConfigService service;

    @BeforeEach
    void setUp() {
        encryptionService = new CredentialEncryptionService("test-secret-key-32-bytes-long-12345");
        service = new TenantGatewayConfigService(gatewayConfigRepository, encryptionService, RestClient.builder());
        ReflectionTestUtils.setField(service, "defaultKeyId", "rzp_test_platform_key");
        ReflectionTestUtils.setField(service, "defaultKeySecret", "platform_secret_123");
        ReflectionTestUtils.setField(service, "defaultWebhookSecret", "platform_webhook_123");
        ReflectionTestUtils.setField(service, "publicApiBaseUrl", "https://api.test.com");
    }

    @Test
    void testResolveCredentials_whenTenantConfigured_returnsTenantCredentials() {
        Long tenantId = 42L;
        TenantGatewayConfig config = TenantGatewayConfig.builder()
                .id(1L)
                .tenantId(tenantId)
                .gateway("RAZORPAY")
                .keyId("rzp_live_tenant_key")
                .encryptedKeySecret(encryptionService.encrypt("tenant_secret_xyz"))
                .encryptedWebhookSecret(encryptionService.encrypt("tenant_webhook_xyz"))
                .isActive(true)
                .build();

        when(gatewayConfigRepository.findActiveRazorpayConfig(tenantId)).thenReturn(Optional.of(config));

        TenantGatewayConfigService.ResolvedGatewayCredentials creds = service.resolveCredentials(tenantId);
        assertTrue(creds.isTenantSpecific());
        assertEquals("rzp_live_tenant_key", creds.getKeyId());
        assertEquals("tenant_secret_xyz", creds.getKeySecret());
        assertEquals("tenant_webhook_xyz", creds.getWebhookSecret());
    }

    @Test
    void testResolveCredentials_whenTenantNotConfigured_fallsBackToPlatform() {
        Long tenantId = 99L;
        when(gatewayConfigRepository.findActiveRazorpayConfig(tenantId)).thenReturn(Optional.empty());

        TenantGatewayConfigService.ResolvedGatewayCredentials creds = service.resolveCredentials(tenantId);
        assertFalse(creds.isTenantSpecific());
        assertEquals("rzp_test_platform_key", creds.getKeyId());
        assertEquals("platform_secret_123", creds.getKeySecret());
    }

    @Test
    void testGetTenantConfig_returnsMaskedSecret() {
        Long tenantId = 42L;
        TenantGatewayConfig config = TenantGatewayConfig.builder()
                .id(1L)
                .tenantId(tenantId)
                .gateway("RAZORPAY")
                .keyId("rzp_live_tenant_key")
                .encryptedKeySecret(encryptionService.encrypt("very_long_secret_key_123456"))
                .encryptedWebhookSecret(encryptionService.encrypt("webhook_secret_789"))
                .isActive(true)
                .build();

        when(gatewayConfigRepository.findByTenantIdAndGateway(tenantId, "RAZORPAY")).thenReturn(Optional.of(config));

        TenantGatewayConfigResponseDto dto = service.getTenantConfig(tenantId);
        assertTrue(dto.getIsConfigured());
        assertEquals("rzp_live_tenant_key", dto.getKeyId());
        assertTrue(dto.getMaskedKeySecret().contains("••••"));
        assertTrue(dto.getWebhookCallbackUrl().contains("tenantId=42"));
    }
}
