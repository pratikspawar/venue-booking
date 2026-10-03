package com.venuebooking.common;

/**
 * ThreadLocal holder for multi-tenant context per incoming request across microservices.
 */
public final class TenantContext {

    private static final ThreadLocal<Long> CURRENT_TENANT = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> SUPER_ADMIN_BYPASS = ThreadLocal.withInitial(() -> false);

    private TenantContext() {
    }

    public static void setTenantId(Long tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static Long getTenantId() {
        return CURRENT_TENANT.get();
    }

    public static void setSuperAdminBypass(boolean bypass) {
        SUPER_ADMIN_BYPASS.set(bypass);
    }

    public static boolean isSuperAdminBypass() {
        return Boolean.TRUE.equals(SUPER_ADMIN_BYPASS.get());
    }

    public static void clear() {
        CURRENT_TENANT.remove();
        SUPER_ADMIN_BYPASS.remove();
    }
}
