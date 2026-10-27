-- Migration V10: Support Impersonation Audit Logs & Platform Super-Admin
CREATE TABLE IF NOT EXISTS support_impersonation_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  admin_user_id BIGINT NOT NULL,
  admin_username VARCHAR(100) NOT NULL,
  target_tenant_id BIGINT NOT NULL,
  target_tenant_name VARCHAR(150) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  client_ip VARCHAR(50),
  impersonated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_impersonate_tenant (target_tenant_id, impersonated_at),
  KEY ix_impersonate_admin (admin_user_id, impersonated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
