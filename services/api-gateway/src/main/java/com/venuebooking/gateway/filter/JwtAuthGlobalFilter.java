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
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
public class JwtAuthGlobalFilter implements GlobalFilter, Ordered {

    private final SecretKey key;

    public JwtAuthGlobalFilter(@Value("${app.jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String correlationId = exchange.getRequest().getHeaders().getFirst("X-Correlation-Id");
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }

        // Add correlation ID to outgoing response headers
        exchange.getResponse().getHeaders().set("X-Correlation-Id", correlationId);

        ServerHttpRequest.Builder reqBuilder = exchange.getRequest().mutate()
                .header("X-Correlation-Id", correlationId);

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                Claims claims = Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

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
            }
        }

        return chain.filter(exchange.mutate().request(reqBuilder.build()).build());
    }

    @Override
    public int getOrder() {
        return -100; // Execute early before routing
    }
}
