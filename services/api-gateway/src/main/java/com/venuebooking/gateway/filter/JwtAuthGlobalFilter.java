package com.venuebooking.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import org.springframework.web.reactive.function.client.WebClient;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class JwtAuthGlobalFilter implements GlobalFilter, Ordered {

    private final SecretKey key;
    private final WebClient webClient;
    private final Set<String> revokedTokenHashes = ConcurrentHashMap.newKeySet();

    public JwtAuthGlobalFilter(
            @Value("${app.jwt.secret}") String secret,
            @Value("${AUTH_SERVICE_HOST:localhost}") String authHost,
            @Value("${AUTH_SERVICE_PORT:8081}") int authPort
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.webClient = WebClient.builder()
                .baseUrl("http://" + authHost + ":" + authPort)
                .build();
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        HttpMethod method = exchange.getRequest().getMethod();
        String correlationId = exchange.getRequest().getHeaders().getFirst("X-Correlation-Id");
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }

        // Add correlation ID to outgoing response headers
        exchange.getResponse().getHeaders().set("X-Correlation-Id", correlationId);

        ServerHttpRequest.Builder reqBuilder = exchange.getRequest().mutate()
                .header("X-Correlation-Id", correlationId);
        reqBuilder.headers(headers -> {
            headers.remove("X-User-Id");
            headers.remove("X-Tenant-Id");
            headers.remove("X-Roles");
            headers.remove("X-Super-Admin");
        });

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        Claims authenticatedClaims = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                Claims claims = Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();
                authenticatedClaims = claims;

                String userId = claims.getSubject();
                Number tenantIdNum = claims.get("tenantId", Number.class);
                String tenantId = tenantIdNum != null ? tenantIdNum.toString() : "";
                Boolean isSuperAdmin = claims.get("isSuperAdmin", Boolean.class);
                List<?> roles = claims.get("roles", List.class);
                String rolesStr = roles != null ? String.join(",", roles.stream().map(Object::toString).toList()) : "";

                reqBuilder.header("X-User-Id", userId)
                        .header("X-Tenant-Id", tenantId)
                        .header("X-Roles", rolesStr)
                        .header("X-Super-Admin", String.valueOf(isSuperAdmin));
            } catch (Exception e) {
                log.warn("Invalid JWT in Gateway filter: {}", e.getMessage());
                exchange.getResponse().setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            String tokenHash = hashToken(token);
            if (revokedTokenHashes.contains(tokenHash)) {
                log.warn("Blocked revoked/blacklisted JWT in Gateway filter");
                exchange.getResponse().setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
            if (path.endsWith("/logout")) {
                revokedTokenHashes.add(tokenHash);
            }
        }

        boolean publicRequest = HttpMethod.OPTIONS.equals(method)
                || (path.startsWith("/api/v1/auth/") && HttpMethod.POST.equals(method))
                || ("/api/v1/webhooks/razorpay".equals(path) && HttpMethod.POST.equals(method))
                || (HttpMethod.GET.equals(method) && (path.startsWith("/api/v1/venues/")
                    || "/api/v1/venues".equals(path) || path.startsWith("/api/v1/resources/")
                    || path.startsWith("/api/v1/sports") || path.startsWith("/api/v1/catalog/")));
        if (authenticatedClaims == null && !publicRequest) {
            exchange.getResponse().setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        if (authenticatedClaims != null && !hasRequiredRole(path, method, authenticatedClaims)) {
            exchange.getResponse().setStatusCode(org.springframework.http.HttpStatus.FORBIDDEN);
            return exchange.getResponse().setComplete();
        }

        return chain.filter(exchange.mutate().request(reqBuilder.build()).build());
    }

    private boolean hasRequiredRole(String path, HttpMethod method, Claims claims) {
        List<?> roles = claims.get("roles", List.class);
        if (roles == null) return false;
        if (path.startsWith("/api/v1/owner/")) {
            return roles.stream().anyMatch(r -> List.of("ROLE_OWNER", "ROLE_MANAGER", "ROLE_SUPER_ADMIN").contains(r.toString()));
        }
        if (path.startsWith("/api/v1/staff/")) {
            return roles.stream().anyMatch(r -> List.of("ROLE_STAFF", "ROLE_MANAGER", "ROLE_OWNER", "ROLE_SUPER_ADMIN").contains(r.toString()));
        }
        if (path.startsWith("/api/v1/admin/")) {
            return roles.contains("ROLE_SUPER_ADMIN");
        }
        if (path.startsWith("/api/v1/reports/")) {
            return hasAnyRole(roles, "ROLE_STAFF", "ROLE_MANAGER", "ROLE_OWNER", "ROLE_SUPER_ADMIN");
        }
        if (path.startsWith("/api/v1/payments/counter") || path.startsWith("/api/v1/payments/refund")
                || ("/api/v1/sports".equals(path) && !HttpMethod.GET.equals(method))) {
            return hasAnyRole(roles, "ROLE_STAFF", "ROLE_MANAGER", "ROLE_OWNER", "ROLE_SUPER_ADMIN");
        }
        if (path.startsWith("/api/v1/venues/") && path.contains("/canteen/items") && !HttpMethod.GET.equals(method)) {
            if (roles.contains("ROLE_STAFF")) return true;
            return hasAnyRole(roles, "ROLE_MANAGER", "ROLE_OWNER", "ROLE_SUPER_ADMIN");
        }
        if (path.startsWith("/api/v1/canteen/items/")) {
            return hasAnyRole(roles, "ROLE_STAFF", "ROLE_MANAGER", "ROLE_OWNER", "ROLE_SUPER_ADMIN");
        }
        if (path.equals("/api/v1/wallets/topup") || path.equals("/api/v1/wallets/debit")) {
            return false;
        }
        return true;
    }

    private boolean hasAnyRole(List<?> roles, String... required) {
        for (String role : required) if (roles.contains(role)) return true;
        return false;
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return "";
        }
    }

    @Override
    public int getOrder() {
        return -100; // Execute early before routing
    }
}
