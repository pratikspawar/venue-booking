-- Migration V9: Canteen Stock Ledger & Low-Stock Alerts
CREATE TABLE IF NOT EXISTS canteen_stock_ledger (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  venue_id BIGINT NOT NULL,
  canteen_item_id BIGINT NOT NULL,
  transaction_type VARCHAR(30) NOT NULL, -- RECEIPT, SALE, ADJUSTMENT, WASTAGE, RETURN
  quantity_change INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  unit_cost_paise BIGINT,
  reason VARCHAR(255),
  reference_id VARCHAR(100),
  performed_by BIGINT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_stock_ledger_item (canteen_item_id, created_at),
  KEY ix_stock_ledger_venue (tenant_id, venue_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
