package com.venuebooking.config;

import com.venuebooking.auth.service.JwtService;
import com.venuebooking.common.TenantContext;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                filterChain.doFilter(request, response);
                return;
            }

            String jwt = authHeader.substring(7);
            Optional<Claims> claimsOpt = jwtService.parseToken(jwt);

            if (claimsOpt.isPresent()) {
                Claims claims = claimsOpt.get();
                String userId = claims.getSubject();
                Boolean isSuperAdmin = claims.get("isSuperAdmin", Boolean.class);
                Number tenantIdNum = claims.get("tenantId", Number.class);
                Long tenantId = tenantIdNum != null ? tenantIdNum.longValue() : null;

                // Support header override for Super Admin impersonation or testing
                String headerTenant = request.getHeader("X-Tenant-Id");
                if (headerTenant != null && (Boolean.TRUE.equals(isSuperAdmin) || tenantId == null)) {
                    try {
                        tenantId = Long.parseLong(headerTenant);
                    } catch (NumberFormatException ignored) {}
                }

                // Populate ThreadLocal TenantContext
                TenantContext.setTenantId(tenantId);
                TenantContext.setSuperAdminBypass(Boolean.TRUE.equals(isSuperAdmin));

                // Parse authorities
                List<?> rolesRaw = claims.get("roles", List.class);
                List<SimpleGrantedAuthority> authorities = rolesRaw != null
                        ? rolesRaw.stream().map(r -> new SimpleGrantedAuthority(r.toString())).toList()
                        : Collections.emptyList();

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        authorities
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }

            filterChain.doFilter(request, response);
        } finally {
            // Guarantee cleanup of ThreadLocal to prevent thread reuse pollution
            TenantContext.clear();
        }
    }
}
