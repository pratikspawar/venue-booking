CREATE TABLE IF NOT EXISTS sms_delivery_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(20) NOT NULL,
  provider VARCHAR(30) NOT NULL,
  message_id VARCHAR(100),
  purpose VARCHAR(50) NOT NULL DEFAULT 'OTP',
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  error_code VARCHAR(50),
  error_message VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_sms_phone (phone, created_at),
  KEY ix_sms_message_id (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
