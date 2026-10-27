package com.venuebooking.payment.service;

import com.venuebooking.common.BusinessException;
import com.venuebooking.payment.dto.TenantGatewayConfigResponseDto;
import com.venuebooking.payment.dto.TestGatewayConnectionResponseDto;
import com.venuebooking.payment.dto.UpdateTenantGatewayConfigRequestDto;
import com.venuebooking.payment.entity.TenantGatewayConfig;
import com.venuebooking.payment.repository.TenantGatewayConfigRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantGatewayConfigService {

    private final TenantGatewayConfigRepository gatewayConfigRepository;
    private final CredentialEncryptionService encryptionService;
    private final RestClient.Builder restClientBuilder;

    @Value("${app.razorpay.key-id:}")
    private String defaultKeyId;

    @Value("${app.razorpay.key-secret:}")
    private String defaultKeySecret;

    @Value("${app.razorpay.webhook-secret:}")
    private String defaultWebhookSecret;

    @Value("${app.razorpay.api-url:https://api.razorpay.com/v1}")
    private String razorpayApiUrl;

    @Value("${app.public-api-base-url:https://api.venuebooking.com}")
    private String publicApiBaseUrl;

    @Data
    @Builder
    public static class ResolvedGatewayCredentials {
        private String keyId;
        private String keySecret;
        private String webhookSecret;
        private boolean isTenantSpecific;
    }

    @Transactional(readOnly = true)
    public TenantGatewayConfigResponseDto getTenantConfig(Long tenantId) {
        Optional<TenantGatewayConfig> configOpt = gatewayConfigRepository.findByTenantIdAndGateway(tenantId, "RAZORPAY");

        String webhookUrl = publicApiBaseUrl + "/api/v1/webhooks/razorpay?tenantId=" + tenantId;

        if (configOpt.isPresent()) {
            TenantGatewayConfig config = configOpt.get();
            String decryptedSecret = encryptionService.decrypt(config.getEncryptedKeySecret());
            String decryptedWebhook = encryptionService.decrypt(config.getEncryptedWebhookSecret());

            return TenantGatewayConfigResponseDto.builder()
                    .id(config.getId())
                    .tenantId(config.getTenantId())
                    .gateway(config.getGateway())
                    .keyId(config.getKeyId())
                    .maskedKeySecret(encryptionService.mask(decryptedSecret))
                    .maskedWebhookSecret(encryptionService.mask(decryptedWebhook))
                    .isConfigured(true)
                    .isActive(config.getIsActive())
                    .webhookCallbackUrl(webhookUrl)
                    .updatedAt(config.getUpdatedAt())
                    .build();
        }

        // Check if platform default exists
        boolean hasPlatformDefault = defaultKeyId != null && !defaultKeyId.isBlank();
        return TenantGatewayConfigResponseDto.builder()
                .tenantId(tenantId)
                .gateway("RAZORPAY")
                .keyId(hasPlatformDefault ? defaultKeyId : null)
                .maskedKeySecret(hasPlatformDefault ? encryptionService.mask(defaultKeySecret) : "Not Configured")
                .maskedWebhookSecret(hasPlatformDefault ? encryptionService.mask(defaultWebhookSecret) : "Not Configured")
                .isConfigured(hasPlatformDefault)
                .isActive(hasPlatformDefault)
                .webhookCallbackUrl(webhookUrl)
                .build();
    }

    @Transactional
    public TenantGatewayConfigResponseDto updateTenantConfig(Long tenantId, UpdateTenantGatewayConfigRequestDto req) {
        if (req.getKeyId() == null || req.getKeyId().isBlank()) {
            throw BusinessException.badRequest("Razorpay Key ID cannot be empty");
        }
        if (req.getKeySecret() == null || req.getKeySecret().isBlank()) {
            throw BusinessException.badRequest("Razorpay Key Secret cannot be empty");
        }

        TenantGatewayConfig config = gatewayConfigRepository.findByTenantIdAndGateway(tenantId, req.getGateway())
                .orElseGet(() -> TenantGatewayConfig.builder()
                        .tenantId(tenantId)
                        .gateway(req.getGateway())
                        .build());

        config.setKeyId(req.getKeyId().trim());
        config.setEncryptedKeySecret(encryptionService.encrypt(req.getKeySecret().trim()));

        if (req.getWebhookSecret() != null && !req.getWebhookSecret().isBlank()) {
            config.setEncryptedWebhookSecret(encryptionService.encrypt(req.getWebhookSecret().trim()));
        }

        config.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);

        TenantGatewayConfig saved = gatewayConfigRepository.save(config);
        log.info("Updated payment gateway credentials for tenant #{} (gateway: {})", tenantId, req.getGateway());

        return getTenantConfig(tenantId);
    }

    public TestGatewayConnectionResponseDto testConnection(Long tenantId, String keyId, String keySecret) {
        String testKeyId = keyId;
        String testKeySecret = keySecret;

        // If credentials not provided in request, resolve saved ones
        if ((testKeyId == null || testKeyId.isBlank()) || (testKeySecret == null || testKeySecret.isBlank())) {
            ResolvedGatewayCredentials creds = resolveCredentials(tenantId);
            testKeyId = creds.getKeyId();
            testKeySecret = creds.getKeySecret();
        }

        if (testKeyId == null || testKeyId.isBlank() || testKeySecret == null || testKeySecret.isBlank()) {
            return TestGatewayConnectionResponseDto.builder()
                    .success(false)
                    .message("No Razorpay credentials provided or configured")
                    .build();
        }

        final String finalKeyId = testKeyId;
        final String finalKeySecret = testKeySecret;

        try {
            // Test credentials by creating a dummy order or querying payments endpoint
            restClientBuilder.clone()
                    .baseUrl(razorpayApiUrl)
                    .defaultHeaders(h -> h.setBasicAuth(finalKeyId, finalKeySecret))
                    .build()
                    .get()
                    .uri("/payments?count=1")
                    .retrieve()
                    .toBodilessEntity();

            return TestGatewayConnectionResponseDto.builder()
                    .success(true)
                    .message("Razorpay connection verified successfully!")
                    .build();
        } catch (Exception e) {
            log.warn("Razorpay credentials validation failed: {}", e.getMessage());
            return TestGatewayConnectionResponseDto.builder()
                    .success(false)
                    .message("Verification failed: " + (e.getMessage() != null ? e.getMessage() : "Invalid credentials"))
                    .build();
        }
    }

    public ResolvedGatewayCredentials resolveCredentials(Long tenantId) {
        if (tenantId != null) {
            Optional<TenantGatewayConfig> tenantConfigOpt = gatewayConfigRepository.findActiveRazorpayConfig(tenantId);
            if (tenantConfigOpt.isPresent()) {
                TenantGatewayConfig c = tenantConfigOpt.get();
                String secret = encryptionService.decrypt(c.getEncryptedKeySecret());
                String webhook = encryptionService.decrypt(c.getEncryptedWebhookSecret());
                if (c.getKeyId() != null && !c.getKeyId().isBlank() && secret != null && !secret.isBlank()) {
                    return ResolvedGatewayCredentials.builder()
                            .keyId(c.getKeyId())
                            .keySecret(secret)
                            .webhookSecret(webhook != null ? webhook : defaultWebhookSecret)
                            .isTenantSpecific(true)
                            .build();
                }
            }
        }

        // Fallback to platform environment defaults
        return ResolvedGatewayCredentials.builder()
                .keyId(defaultKeyId)
                .keySecret(defaultKeySecret)
                .webhookSecret(defaultWebhookSecret)
                .isTenantSpecific(false)
                .build();
    }
}
