-- =============================================================================
-- Venue Booking Platform - Automated Testing Environment Seed Dataset
-- Creates isolated multi-tenant records for E2E integration and concurrency testing
-- =============================================================================

-- 1. Tenants
INSERT INTO tenants (id, name, slug, logo_url, status, plan_id, gst_number, razorpay_account_id)
VALUES 
  (1, 'Alpha Gaming & Snooker Lounge', 'alpha-gaming', 'https://cdn.venueops.io/tenants/alpha.png', 'ACTIVE', 1, '27ABCDE1234F1Z5', 'acc_alpha_test_123'),
  (2, 'Apex Turf & Box Cricket Arena', 'apex-turf', 'https://cdn.venueops.io/tenants/apex.png', 'ACTIVE', 1, '27XYZAB9876C2Z8', 'acc_apex_test_456')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Users
INSERT INTO users (id, phone, name, email, language, is_super_admin)
VALUES
  (1, '+919000000000', 'Super Administrator', 'superadmin@venueops.io', 'en', TRUE),
  (2, '+919111111111', 'Vikram Malhotra (Owner T1)', 'vikram@alphagaming.com', 'en', FALSE),
  (3, '+919222222222', 'Rahul Shinde (Staff T1)', 'rahul@alphagaming.com', 'en', FALSE),
  (4, '+919333333333', 'Pooja Deshmukh (Owner T2)', 'pooja@apexturf.com', 'en', FALSE),
  (5, '+919876543210', 'Aarav Sharma (Test Customer 1)', 'aarav@customer.test', 'en', FALSE),
  (6, '+919876543211', 'Rohan Verma (Test Customer 2)', 'rohan@customer.test', 'en', FALSE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Tenant Memberships (Role-Based Access Control)
INSERT INTO tenant_members (id, tenant_id, user_id, role, active)
VALUES
  (1, 1, 2, 'OWNER', TRUE),
  (2, 1, 3, 'STAFF', TRUE),
  (3, 2, 4, 'OWNER', TRUE)
ON DUPLICATE KEY UPDATE role=VALUES(role);

-- 4. Sports Catalog
INSERT INTO sports (id, code, name_en, name_mr, name_hi)
VALUES
  (1, 'PLAYSTATION', 'PlayStation 5 Lounge', 'प्लेस्टेशन ५', 'प्लेस्टेशन ५'),
  (2, 'POOL', 'Snooker & Pool Tables', 'स्नूकर आणि पूल', 'स्नूकर और पूल'),
  (3, 'TURF', 'Box Turf & Cricket Ground', 'बॉक्स टर्फ', 'बॉक्स टर्फ')
ON DUPLICATE KEY UPDATE name_en=VALUES(name_en);

-- 5. Venues
INSERT INTO venues (id, tenant_id, name, address, city, timezone, pay_at_venue_mode, advance_amount_paise, hold_minutes, active)
VALUES
  (1, 1, 'Alpha Gaming Arena - Andheri West', 'Plot 42, Link Road, Andheri West', 'Mumbai', 'Asia/Kolkata', 'NO_ADVANCE', 0, 8, TRUE),
  (2, 2, 'Apex Box Turf Complex - Baner', 'Survey 18, Balewadi High Street, Baner', 'Pune', 'Asia/Kolkata', 'ADVANCE', 20000, 8, TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 6. Venue Operating Hours (All 7 days: 09:00 to 23:59)
INSERT INTO venue_hours (venue_id, day_of_week, open_time, close_time)
VALUES
  (1, 1, '09:00:00', '23:59:00'),
  (1, 2, '09:00:00', '23:59:00'),
  (1, 3, '09:00:00', '23:59:00'),
  (1, 4, '09:00:00', '23:59:00'),
  (1, 5, '09:00:00', '23:59:00'),
  (1, 6, '09:00:00', '23:59:00'),
  (1, 7, '09:00:00', '23:59:00'),
  (2, 1, '06:00:00', '23:59:00'),
  (2, 2, '06:00:00', '23:59:00'),
  (2, 3, '06:00:00', '23:59:00'),
  (2, 4, '06:00:00', '23:59:00'),
  (2, 5, '06:00:00', '23:59:00'),
  (2, 6, '06:00:00', '23:59:00'),
  (2, 7, '06:00:00', '23:59:00')
ON DUPLICATE KEY UPDATE open_time=VALUES(open_time);

-- 7. Resources
INSERT INTO resources (id, tenant_id, venue_id, sport_id, name, capacity, slot_minutes, billing_mode, status)
VALUES
  (1, 1, 1, 1, 'PS5 Pro Console 1 (VIP Booth)', 4, 60, 'FIXED_SLOT', 'ACTIVE'),
  (2, 1, 1, 2, 'Championship 12ft Snooker Table 1', 4, 60, 'TIME_PLAYED', 'ACTIVE'),
  (3, 2, 2, 3, 'Main Box Turf Ground A', 14, 60, 'FIXED_SLOT', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 8. Pricing Rules
INSERT INTO pricing_rules (id, tenant_id, resource_id, day_type, start_time, end_time, price_per_slot_paise, price_per_hour_paise, min_charge_minutes, rounding_minutes, priority)
VALUES
  (1, 1, 1, 'ANY', '00:00:00', '23:59:59', 25000, NULL, 0, 1, 1),
  (2, 1, 2, 'ANY', '00:00:00', '23:59:59', NULL, 30000, 15, 5, 1),
  (3, 2, 3, 'ANY', '00:00:00', '23:59:59', 120000, NULL, 0, 1, 1)
ON DUPLICATE KEY UPDATE price_per_slot_paise=VALUES(price_per_slot_paise);

-- 9. Canteen Catalog Items
INSERT INTO canteen_items (id, tenant_id, venue_id, name, category, price_paise, stock_count, low_stock_threshold, is_equipment, active)
VALUES
  (1, 1, 1, 'Red Bull Energy Drink (250ml)', 'BEVERAGE', 12500, 50, 5, FALSE, TRUE),
  (2, 1, 1, 'Extra DualSense Controller Rental', 'EQUIPMENT_RENTAL', 10000, 8, 2, TRUE, TRUE),
  (3, 1, 1, 'Loaded Cheese Nachos Tub', 'FOOD', 14000, 25, 4, FALSE, TRUE)
ON DUPLICATE KEY UPDATE price_paise=VALUES(price_paise);

-- 10. Coupons
INSERT INTO coupons (id, tenant_id, code, discount_type, discount_value, min_booking_amount_paise, max_discount_paise, valid_from, valid_to, max_uses, used_count, active)
VALUES
  (1, 1, 'WELCOME50', 'PERCENTAGE', 50, 10000, 10000, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 500, 2, TRUE)
ON DUPLICATE KEY UPDATE code=VALUES(code);

-- 11. Customer Wallets
INSERT INTO wallets (id, tenant_id, user_id, balance_paise)
VALUES
  (1, 1, 5, 50000),
  (2, 1, 6, 25000)
ON DUPLICATE KEY UPDATE balance_paise=VALUES(balance_paise);
