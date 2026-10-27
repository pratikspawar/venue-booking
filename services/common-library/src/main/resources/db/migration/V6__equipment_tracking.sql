-- V6: Equipment Tracking, Condition, and Security Deposits
ALTER TABLE canteen_items
  ADD COLUMN condition_status VARCHAR(30) NOT NULL DEFAULT 'GOOD',
  ADD COLUMN deposit_paise BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN serial_number VARCHAR(100) NULL DEFAULT NULL;
