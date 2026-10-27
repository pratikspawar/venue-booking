-- =============================================================================
-- Venue Booking Platform - V1 Schema Migration
-- =============================================================================

-- 1. Platform and Identity
CREATE TABLE IF NOT EXISTS tenants (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  name                VARCHAR(150) NOT NULL,
  slug                VARCHAR(80)  NOT NULL UNIQUE,
  logo_url            VARCHAR(500),
  status              ENUM('ACTIVE','SUSPENDED','TRIAL') NOT NULL DEFAULT 'TRIAL',
  plan_id             BIGINT,
  gst_number          VARCHAR(20),
  razorpay_account_id VARCHAR(60),
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  phone               VARCHAR(15) NOT NULL UNIQUE,
  name                VARCHAR(120),
  email               VARCHAR(150),
  language            VARCHAR(5) NOT NULL DEFAULT 'en',
  fcm_token           VARCHAR(300),
  is_super_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tenant_members (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id           BIGINT NOT NULL,
  user_id             BIGINT NOT NULL,
  role                ENUM('OWNER','MANAGER','STAFF') NOT NULL,
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_member (tenant_id, user_id),
  CONSTRAINT fk_member_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS otp_requests (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  phone               VARCHAR(15) NOT NULL,
  otp_hash            VARCHAR(100) NOT NULL,
  expires_at          DATETIME NOT NULL,
  attempts            INT NOT NULL DEFAULT 0,
  consumed            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_otp_phone (phone, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Venues and Resources
CREATE TABLE IF NOT EXISTS venues (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id           BIGINT NOT NULL,
  name                VARCHAR(150) NOT NULL,
  address             VARCHAR(300),
  city                VARCHAR(80),
  latitude            DECIMAL(9,6),
  longitude           DECIMAL(9,6),
  timezone            VARCHAR(40) NOT NULL DEFAULT 'Asia/Kolkata',
  pay_at_venue_mode   ENUM('OFF','NO_ADVANCE','ADVANCE') NOT NULL DEFAULT 'OFF',
  advance_amount_paise BIGINT NOT NULL DEFAULT 0,
  hold_minutes        INT NOT NULL DEFAULT 8,
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_venue_tenant (tenant_id),
  KEY ix_venue_city (city),
  CONSTRAINT fk_venue_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS venue_hours (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  venue_id            BIGINT NOT NULL,
  day_of_week         TINYINT NOT NULL,           -- 1=Mon ... 7=Sun
  open_time           TIME NOT NULL,
  close_time          TIME NOT NULL,
  closes_next_day     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_hours (venue_id, day_of_week),
  CONSTRAINT fk_hours_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sports (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  code                VARCHAR(40) NOT NULL UNIQUE, -- POOL, CARROM, TURF, TENNIS, PLAYSTATION
  name_en             VARCHAR(80) NOT NULL,
  name_mr             VARCHAR(80),
  name_hi             VARCHAR(80),
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS resources (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id           BIGINT NOT NULL,
  venue_id            BIGINT NOT NULL,
  sport_id            BIGINT NOT NULL,
  name                VARCHAR(100) NOT NULL,       -- e.g. "Pool Table 2", "PlayStation 5 Console #1"
  capacity            INT NOT NULL DEFAULT 2,
  slot_minutes        INT NOT NULL DEFAULT 60,     -- grid size for this resource
  billing_mode        ENUM('FIXED_SLOT','TIME_PLAYED') NOT NULL DEFAULT 'FIXED_SLOT',
  status              ENUM('ACTIVE','MAINTENANCE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_res_venue (tenant_id, venue_id),
  CONSTRAINT fk_res_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_res_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  CONSTRAINT fk_res_sport FOREIGN KEY (sport_id) REFERENCES sports(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS resource_blocks (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id           BIGINT NOT NULL,
  resource_id         BIGINT NOT NULL,
  start_utc           DATETIME NOT NULL,
  end_utc             DATETIME NOT NULL,
  reason              VARCHAR(200),
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_block (resource_id, start_utc, end_utc),
  CONSTRAINT fk_block_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_block_res FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pricing_rules (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id           BIGINT NOT NULL,
  resource_id         BIGINT NOT NULL,
  day_type            ENUM('ANY','WEEKDAY','WEEKEND') NOT NULL DEFAULT 'ANY',
  start_time          TIME NOT NULL DEFAULT '00:00:00',
  end_time            TIME NOT NULL DEFAULT '23:59:59',
  price_per_slot_paise BIGINT,                     -- for FIXED_SLOT
  price_per_hour_paise BIGINT,                     -- for TIME_PLAYED
  min_charge_minutes  INT NOT NULL DEFAULT 0,
  rounding_minutes    INT NOT NULL DEFAULT 1,
  priority            INT NOT NULL DEFAULT 0,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_price (resource_id),
  CONSTRAINT fk_price_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_price_res FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cancellation_policies (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id           BIGINT NOT NULL,
  venue_id            BIGINT NOT NULL,
  hours_before        INT NOT NULL,               -- cancel at least this many hours before
  refund_percent      INT NOT NULL,               -- 0 to 100
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_policy (venue_id, hours_before),
  CONSTRAINT fk_policy_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_policy_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bookings and Sessions
CREATE TABLE IF NOT EXISTS bookings (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id           BIGINT NOT NULL,
  venue_id            BIGINT NOT NULL,
  resource_id         BIGINT NOT NULL,
  customer_id         BIGINT,                     -- null for walk-in without phone
  walkin_name         VARCHAR(100),
  walkin_phone        VARCHAR(15),
  source              ENUM('APP','WALKIN') NOT NULL,
  start_utc           DATETIME NOT NULL,
  end_utc             DATETIME NOT NULL,
  status              ENUM('HELD','CONFIRMED','IN_PROGRESS','COMPLETED',
                           'CANCELLED','NO_SHOW','EXPIRED') NOT NULL,
  hold_expires_at     DATETIME,
  amount_paise        BIGINT NOT NULL,            -- price at booking time
  discount_paise      BIGINT NOT NULL DEFAULT 0,
  tax_paise           BIGINT NOT NULL DEFAULT 0,
  paid_paise          BIGINT NOT NULL DEFAULT 0,
  payment_mode        ENUM('ONLINE','PAY_AT_VENUE','WALLET','MIXED') NOT NULL,
  coupon_id           BIGINT,
  version             INT NOT NULL DEFAULT 0,     -- optimistic lock
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_book_venue_time (tenant_id, venue_id, start_utc),
  KEY ix_book_resource_time (resource_id, start_utc),
  KEY ix_book_customer (customer_id, start_utc),
  KEY ix_book_hold (status, hold_expires_at),
  CONSTRAINT fk_book_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_book_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  CONSTRAINT fk_book_res FOREIGN KEY (resource_id) REFERENCES resources(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Grid cells enforcement (Double-booking prevention at database level)
CREATE TABLE IF NOT EXISTS booking_slots (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  booking_id          BIGINT NOT NULL,
  resource_id         BIGINT NOT NULL,
  slot_start          DATETIME NOT NULL,          -- UTC, aligned to resource grid
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_slot (resource_id, slot_start),
  KEY ix_slot_booking (booking_id),
  CONSTRAINT fk_slot_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_slot_res FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS play_sessions (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id           BIGINT NOT NULL,
  booking_id          BIGINT NOT NULL UNIQUE,
  started_at          DATETIME NOT NULL,
  ended_at            DATETIME,
  billed_minutes      INT,
  amount_paise        BIGINT,
  started_by          BIGINT,                     -- staff user id
  ended_by            BIGINT,                     -- staff user id
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_session_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_session_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Payments and Refunds
CREATE TABLE IF NOT EXISTS payments (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id           BIGINT NOT NULL,
  booking_id          BIGINT,
  purpose             ENUM('BOOKING','WALLET_TOPUP','MEMBERSHIP','CANTEEN') NOT NULL,
  method              ENUM('ONLINE','CASH','UPI_COUNTER','WALLET') NOT NULL,
  amount_paise        BIGINT NOT NULL,
  status              ENUM('CREATED','PENDING','SUCCESS','FAILED') NOT NULL,
  gateway             VARCHAR(20),
  gateway_order_id    VARCHAR(80) UNIQUE,
  gateway_payment_id  VARCHAR(80) UNIQUE,
  received_by         BIGINT,                     -- staff user id for counter payments
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_pay_booking (booking_id),
  KEY ix_pay_tenant_time (tenant_id, created_at),
  CONSTRAINT fk_pay_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_pay_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refunds (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id           BIGINT NOT NULL,
  payment_id          BIGINT NOT NULL,
  booking_id          BIGINT NOT NULL,
  amount_paise        BIGINT NOT NULL,
  status              ENUM('REQUESTED','PROCESSED','FAILED') NOT NULL,
  gateway_refund_id   VARCHAR(80) UNIQUE,
  reason              VARCHAR(200),
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_refund_tenant (tenant_id),
  CONSTRAINT fk_ref_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_ref_payment FOREIGN KEY (payment_id) REFERENCES payments(id),
  CONSTRAINT fk_ref_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webhook_events (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  gateway             VARCHAR(20) NOT NULL,
  event_id            VARCHAR(100) NOT NULL,
  payload             JSON,
  processed           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_event (gateway, event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Notifications, Audit and Reviews
CREATE TABLE IF NOT EXISTS notifications (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id             BIGINT NOT NULL,
  channel             ENUM('PUSH','SMS','WHATSAPP') NOT NULL,
  template            VARCHAR(60) NOT NULL,
  payload             JSON,
  status              ENUM('QUEUED','SENT','FAILED') NOT NULL DEFAULT 'QUEUED',
  send_after          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_notif_queue (status, send_after),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_log (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id           BIGINT,
  actor_id            BIGINT NOT NULL,
  action              VARCHAR(60) NOT NULL,       -- REFUND, PRICE_CHANGE, CANCEL, IMPERSONATE, etc.
  entity              VARCHAR(40),
  entity_id           BIGINT,
  details             JSON,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_audit (tenant_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id           BIGINT NOT NULL,
  venue_id            BIGINT NOT NULL,
  booking_id          BIGINT NOT NULL UNIQUE,
  customer_id         BIGINT NOT NULL,
  rating              TINYINT NOT NULL,
  comment             VARCHAR(500),
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_review_venue (venue_id),
  CONSTRAINT fk_rev_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_rev_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  CONSTRAINT fk_rev_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_rev_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Initial Seed Data
INSERT INTO sports (code, name_en, name_mr, name_hi) VALUES
  ('PLAYSTATION', 'PlayStation Lounge', 'प्लेस्टेशन लाउंज', 'प्लेस्टेशन लाउंज'),
  ('POOL', 'Pool / Snooker', 'पूल / स्नूकर', 'पूल / स्नूकर'),
  ('CARROM', 'Carrom', 'कॅरम', 'कैरम'),
  ('TURF', 'Box Turf Cricket / Football', 'बॉक्स टर्फ', 'बॉक्स टर्फ'),
  ('TENNIS', 'Table Tennis / Tennis', 'टेनिस', 'टेनिस')
ON DUPLICATE KEY UPDATE name_en = VALUES(name_en);
