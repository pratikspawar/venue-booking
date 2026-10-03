package com.venuebooking.common;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdMdcFilter implements Filter {

    public static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
    public static final String TENANT_ID_HEADER = "X-Tenant-Id";
    public static final String USER_ID_HEADER = "X-User-Id";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (request instanceof HttpServletRequest httpRequest && response instanceof HttpServletResponse httpResponse) {
            String correlationId = httpRequest.getHeader(CORRELATION_ID_HEADER);
            if (correlationId == null || correlationId.isBlank()) {
                correlationId = UUID.randomUUID().toString();
            }

            String tenantId = httpRequest.getHeader(TENANT_ID_HEADER);
            String userId = httpRequest.getHeader(USER_ID_HEADER);

            if (tenantId != null && !tenantId.isBlank()) {
                try {
                    TenantContext.setTenantId(Long.parseLong(tenantId));
                } catch (NumberFormatException ignored) {
                }
            }

            MDC.put("correlationId", correlationId);
            if (tenantId != null) MDC.put("tenantId", tenantId);
            if (userId != null) MDC.put("userId", userId);

            httpResponse.setHeader(CORRELATION_ID_HEADER, correlationId);

            try {
                chain.doFilter(request, response);
            } finally {
                TenantContext.clear();
                MDC.clear();
            }
        } else {
            chain.doFilter(request, response);
        }
    }
}
