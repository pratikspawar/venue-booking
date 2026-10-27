# Venue Booking Platform — Master Implementation Checklist

This checklist tracks all remaining engineering work required to transition the platform from its active prototype state to a robust, pilot-ready and production-grade SaaS system. Items are ordered strictly by priority and dependencies.

---

## Priority 0 — Critical Before Pilot Venue Launch

### [x] Task 0.1: No-Show Handling & Auto-Release Engine *(Completed & Verified)*
- [x] Add `POST /staff/bookings/{id}/no-show` endpoint in `StaffDeskController` and `StaffDeskService`.
- [x] Implement `NoShowScheduler` background job in `booking-service` to detect confirmed bookings where slot start time + grace period (20m default) has elapsed without check-in, set status to `NO_SHOW`, and release occupied slots.
- [x] Add "Mark No-Show" quick action and badge in Admin Web (`BookingsLedger.tsx` & `SlotTimelineMatrix.tsx`).
- [x] Log no-show events to `ActivityAuditLog`.

### [x] Task 0.2: Production SMS & Delivery Status Webhook *(Completed & Verified)*
- [x] Wire live credentials for Twilio/MSG91 behind `SmsService` in `services/auth-service`.
- [x] Add inbound SMS webhook controller in `auth-service` to track delivery status (DELIVERED, FAILED, UNDELIVERED).
- [x] Added `V3__sms_delivery_logs.sql` Flyway migration and persistent `SmsDeliveryLog` tracking.
- [x] Ensure development profile gracefully retains `MockSmsService`.

### [x] Task 0.3: Token Lifecycle, Refresh-Token Rotation & Revocation *(Completed & Verified)*
- [x] Add refresh token entity, repository, and `/api/v1/auth/token/refresh` endpoint in `auth-service`.
- [x] Implement token revocation on logout (`/api/v1/auth/logout`) and token blacklist lookup in API Gateway filter.
- [x] Update mobile and admin web HTTP clients to handle automatic token refresh on 401.

### [x] Task 0.4: Cross-Tenant Isolation Integration Tests *(Completed & Verified)*
- [x] Write automated integration test in `booking-service` asserting Tenant A user cannot read or modify Tenant B bookings, play sessions, or reports (`CrossTenantIsolationTest` - 8/8 passed).
- [x] Write integration test in `catalog-service` asserting resource/sport mutations across tenants return 403/404 (`CatalogTenantIsolationTest` - 7/7 passed).
- [x] Integrate into CI test execution across maven reactor modules.

### [x] Task 0.5: Database Safety & Production Flyway Enforcement *(Completed & Verified)*
- [x] Switch `spring.jpa.hibernate.ddl-auto` from `update` to `validate` in all service `application.yml` configs for non-local profiles.
- [x] Verify that baseline Flyway migrations `V1__init_schema.sql`, `V2__business_modules.sql`, `V3__sms_delivery_logs.sql`, and `V4__refresh_tokens.sql` apply cleanly.

---

## Priority 1 — Required for Staff & Owner Operational MVP

### [x] Task 1.1: Permission-Controlled Staff Cancellation Rules *(Completed & Verified)*
- [x] Implement cancellation permission rules in `BookingService` (staff cancellations > ₹500 require Manager/Owner approval code; verified with `StaffCancellationRulesTest`).
- [x] Add cancellation reason and authorizing staff user tracking to immutable `AuditLog` table.
- [x] Surface cancellation policy warnings and manager authorization input in Admin Web `RefundPolicyModal.tsx` and `BookingsLedger.tsx`.

### [x] Task 1.2: Dynamic Pricing Rules Management UI *(Completed & Verified)*
- [x] Create `PricingRulesModal.tsx` in `apps/admin-web` allowing Owners to configure weekday vs. weekend hourly rates, peak vs. off-peak multipliers, and holiday pricing with live rate simulator.
- [x] Connect with Catalog Service pricing endpoints (`/owner/resources/{id}/pricing-rules`).
- [x] Wired dynamic pricing management button into `ResourceCatalog.tsx` matrix.

### [x] Task 1.3: Staff Invitation & Venue Assignment UI *(Completed & Verified)*
- [x] Create Staff Management screen in `apps/admin-web` (`StaffManagement.tsx`) and `InviteStaffModal.tsx` with role explanations and live venue scope selector.
- [x] Add invite staff flow by phone number/email, assign roles (`OWNER`, `MANAGER`, `STAFF`), and assign permitted venues with status suspension toggle.
- [x] Backend `TenantMemberService` and `TenantMemberController` in `auth-service` with 7/7 unit tests passed.
- [x] Flyway migration `V5__staff_venue_assignment.sql` adding `assigned_venues` to `tenant_members`.
- [x] Navigation wired into `Sidebar.tsx`, `Header.tsx`, and `App.tsx`.

### [x] Task 1.4: Equipment Tracking & Rental Inventory *(Completed & Verified)*
- [x] Create backend models and endpoints for equipment inventory in `catalog-service` (`CanteenItem`, `CanteenItemRepository`, `CanteenService`, and `CanteenController`).
- [x] Track equipment quantity, condition (`EXCELLENT`, `GOOD`, `FAIR`, `MAINTENANCE`, `DAMAGED`), rental rates, and deposit amounts.
- [x] Flyway migration `V6__equipment_tracking.sql` adding `condition_status`, `deposit_paise`, and `serial_number`.
- [x] Verified with `EquipmentServiceTest` unit tests (5/5 passed, 12/12 in catalog-service).
- [x] Created `EquipmentInventory.tsx` and `AddEquipmentModal.tsx` in `apps/admin-web`, integrated into `ResourceCatalog.tsx` tabs and enhanced `AddCanteenItemModal.tsx`.

### [x] Task 1.5: Multi-Language Localization Bundles *(Completed & Verified)*
- [x] Populate complete translation dictionaries for English (`en`), Marathi (`mr`), and Hindi (`hi`) in `apps/admin-web/src/locales` and `apps/mobile/src/locales`.
- [x] Verify correct UTF-8 display for all Devanagari characters and currency symbols (`₹`).
- [x] Language switcher pills wired into Admin Web (`Sidebar.tsx`) and Mobile App (`ProfileScreen.tsx`).

### [x] Task 1.6: Push Notifications (FCM / Expo) *(Completed & Verified)*
- [x] Set up Firebase Cloud Messaging (`FcmPushNotificationAdapter`) and Expo (`ExpoPushNotificationAdapter`) push notification adapters with mock fallback in `booking-service`.
- [x] Flyway migration `V7__push_notifications.sql` adding `reminder_sent` to `bookings` and `push_notification_logs` table for delivery tracking.
- [x] Multi-lingual push messaging (`en`, `mr`, `hi`) in `PushNotificationService` covering: Booking Hold Created, Payment Confirmed, 1-Hour Pre-Slot Reminder, Session Extended, and No-Show Auto Release.
- [x] Background `BookingReminderScheduler` running periodic scans for upcoming sessions within 50-70m window to dispatch reminders.
- [x] Full unit test coverage in `PushNotificationServiceTest` (8/8 passed, 21/21 in `booking-service`).

---

## Priority 2 — Post-Pilot Business Modules

### [x] Task 2.1: Customer Wallet Top-Up Flow *(Completed & Verified)*
- [x] Added wallet top-up payment order endpoint (`POST /payments/wallet-topup-order`) in `payment-service` integrating Razorpay gateway order generation for `Purpose.WALLET_TOPUP`.
- [x] Routed verified payment checkout webhook to `booking-service` `/wallets/topup` for automated balance crediting and ledger entry.
- [x] Verified with unit tests in `WalletTopupPaymentServiceTest` (10/10 tests passed in `payment-service`).
- [x] Created `WalletTopupModal.tsx` in `apps/mobile` with quick recharge chips (₹200, ₹500, ₹1000, ₹2000), custom amount input, Razorpay flow, and transaction history ledger.
- [x] Integrated wallet actions into `useCustomerStore.ts`, `api.ts`, `ProfileScreen.tsx`, and `App.tsx` with full multi-language localization (`en`, `mr`, `hi`).
- [x] Verified clean TypeScript compilation (`npx tsc --noEmit` 0 errors).

### [x] Task 2.2: Membership Plans & Auto-Discount Engine *(Completed & Verified)*
- [x] Implemented `MembershipController.java` in `booking-service` exposing tier creation, plan activation/pause toggling, customer plan purchases, and tenant member ledger.
- [x] Connected `MembershipService` auto-discount engine to slot checkout in `BookingService.java`: automatically applies complimentary free minutes and percentage discounts during slot holds, and deducts free minutes upon booking payment confirmation.
- [x] Verified backend with unit tests in `MembershipServiceTest` (26/26 tests passed in `booking-service`).
- [x] Built Owner Membership Management UI (`MembershipManagement.tsx` and `AddMembershipPlanModal.tsx`) in `apps/admin-web`, added `memberships` navigation tab in `Sidebar.tsx`, and verified production build (`npm run build` passed).
- [x] Integrated VIP membership perks display and tier subscription in customer mobile app (`ProfileScreen.tsx`, `useCustomerStore.ts`, `api.ts`), verified with `npx tsc --noEmit` (0 errors).

### [x] Task 2.3: Coupons & Prepaid Hours Packages *(Completed & Verified)*
- [x] Build coupon generator UI (`AddCouponModal.tsx`) with code generation, flat vs. percentage discounts, sport constraints, validity periods, and usage caps.
- [x] Build prepaid package creator (`AddPrepaidPackageModal.tsx`) with hourly rates and validity days.
- [x] Build comprehensive promotions center (`PromotionManagement.tsx`) with Coupons ledger, Prepaid packages list, and customer hourly deduction audit ledger.
- [x] Backend `CouponController`, `CouponService`, `PrepaidPackageController`, and `PrepaidPackageService` in `booking-service` verified with unit tests (`CouponServiceTest` 4/4 passed, `PrepaidPackageServiceTest` 3/3 passed).

### [x] Task 2.4: Canteen Stock Ledger & Low-Stock Alerts *(Completed & Verified)*
- [x] Implement canteen inventory ledger: stock receipts, sales deductions, manual adjustments, and wastage tracking (`CanteenStockLedger`, `CanteenStockLedgerRepository`, `CanteenService`, and `CanteenController` in `catalog-service`).
- [x] Verified with unit tests in `CanteenStockLedgerTest` (4/4 passed).
- [x] Built interactive `StockLedgerModal.tsx` in `apps/admin-web` for recording inventory transactions, viewing immutable audit history, and calculating live stock counts.
- [x] Display low-stock badges in Admin Web (`LiveDesk.tsx` and `ResourceCatalog.tsx`) when stock dips below threshold.

### [x] Task 2.5: Analytics Peak-Hour Heatmap Matrix *(Completed & Verified)*
- [x] Built interactive 2D heatmap matrix (`PeakHourHeatmapMatrix.tsx`) graphing Day of Week (Mon-Sun) vs. Time of Day (9:00 - 23:00) with occupancy thresholds (Dead, Low, Moderate, Busy, Peak).
- [x] Integrated into `ReportsDashboard.tsx` with revenue yield simulations and discount recommendation triggers for dead hours.
- [x] Connected to `ReportService` and `ReportController` peak hour analysis endpoints.

### [x] Task 2.6: Platform Super-Admin Dashboard *(Completed & Verified)*
- [x] Implemented dedicated Super-Admin UI (`SuperAdminDashboard.tsx`) with platform KPI cards (Tenants, Processed GMV, SaaS MRR, Fleet SLA), Tenant Venues directory, live status toggling (ACTIVE, TRIAL, SUSPENDED), and SaaS subscription plan tiers.
- [x] Built `OnboardTenantModal.tsx` for registering new venue businesses with custom URL slug generation, GST number, and Razorpay account routing.
- [x] Built `SupportImpersonateModal.tsx` enforcing SOC-2 audited support sessions with mandatory ticket reason and permanent client IP logging.
- [x] Backend `SuperAdminController` and `SuperAdminService` in `auth-service` with 5/5 unit tests passed (`SuperAdminServiceTest`).
- [x] Integrated navigation tab into `Sidebar.tsx` and `App.tsx`; verified with clean Vite production build (`npm run build`).

---

## DevOps & Technical Debt

### [x] Task D.1: Retire Legacy `apps/api` Monolith *(Completed & Verified)*
- [x] Formally archived and retired legacy `apps/api` monolith with `apps/api/ARCHIVED_LEGACY_NOTICE.md`.
- [x] Updated root `README.md` to exclusively reference active Spring Boot 3 microservices under `services/`.
- [x] Confirmed CI pipeline (`Jenkinsfile`) and Docker Compose (`deploy/docker/docker-compose.yml`) exclusively build and run microservices.
