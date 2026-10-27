# Missing Features and Required Changes

This document is the implementation backlog for taking the venue-booking platform from its current prototype state to a reliable MVP and then to production readiness.

## Current architecture summary

- **Backend:** Spring Boot microservices: API Gateway, Auth, Catalog, Booking, Payment, and a shared library.
- **Clients:** React/Vite admin web application and Expo/React Native customer mobile application.
- **Infrastructure:** Docker Compose is set up for local services. Kubernetes manifests currently describe an older single-API deployment and must be updated to match the microservices.
- **Data:** MySQL with tenant-scoped entities and booking-slot uniqueness intended to protect against double booking.

## Master Prioritized Implementation Checklist

### Priority 0 — Critical Before Pilot Venue Launch
- [x] **Task 0.1: No-Show Handling & Auto-Release Engine** *(Implemented & Verified)*
  - [x] Add `POST /staff/bookings/{id}/no-show` endpoint in `StaffDeskController` and `StaffDeskService`.
  - [x] Implement `NoShowScheduler` background job in `booking-service` to detect confirmed bookings where slot start time + grace period (20m default) has passed without check-in, set status to `NO_SHOW`, and release occupied slots.
  - [x] Add "Mark No-Show" action button, confirmation, and status badge in Admin Web `BookingsLedger.tsx` & schedule matrix.
  - [x] Record no-show events in `ActivityAuditLog`.
- [x] **Task 0.2: Production SMS & Delivery Status Webhook** *(Implemented & Verified)*
  - [x] Wire live credentials for Twilio/MSG91 behind `SmsService` in `auth-service`.
  - [x] Inbound SMS delivery status webhook controller in `auth-service` (`POST /auth/webhooks/sms/twilio`, `POST /auth/webhooks/sms/msg91`).
  - [x] Added `V3__sms_delivery_logs.sql` Flyway migration and `SmsDeliveryLog` persistence.
  - [x] Preserved `MockSmsService` for local dev.
- [x] **Task 0.3: Token Lifecycle, Refresh-Token Rotation & Revocation** *(Implemented & Verified)*
  - [x] Refresh token entity, repository, and `POST /api/v1/auth/token/refresh` in `auth-service`.
  - [x] Token revocation on logout (`POST /api/v1/auth/logout`) and gateway blacklist check.
  - [x] Client auto-refresh on 401 response in admin-web and mobile apps.
- [x] **Task 0.4: Cross-Tenant Isolation Integration Tests** *(Implemented & Verified)*
  - [x] Automated integration test in `booking-service` (`CrossTenantIsolationTest`) asserting Tenant A user cannot read or mutate Tenant B bookings, sessions, or reports (8/8 passed).
  - [x] Automated integration test in `catalog-service` (`CatalogTenantIsolationTest`) asserting resource/sport mutations across tenants return 403/404 (7/7 passed).
- [x] **Task 0.5: Database Safety & Production Flyway Enforcement** *(Implemented & Verified)*
  - [x] Switch `spring.jpa.hibernate.ddl-auto` to `validate` in all service `application.yml` configs for non-local profiles.
  - [x] Verify baseline Flyway migrations `V1__init_schema.sql`, `V2__business_modules.sql`, `V3__sms_delivery_logs.sql`, and `V4__refresh_tokens.sql` apply cleanly.

### Priority 1 — Required for Staff & Owner Operational MVP
- [x] **Task 1.1: Permission-Controlled Staff Cancellation Rules** *(Implemented & Verified)*
  - [x] Enforce cancellation limits and manager approval requirements in `BookingService` (staff cancellations > ₹500 require Manager/Owner approval code; verified with `StaffCancellationRulesTest`).
  - [x] Reason code and authorizing staff user tracking recorded in immutable `AuditLog` table.
  - [x] Updated Admin Web ledger (`RefundPolicyModal.tsx`) with reason category, manager PIN field, and audit note.
- [x] **Task 1.2: Dynamic Pricing Rules Management UI** *(Implemented & Verified)*
  - [x] Create `PricingRulesModal.tsx` in `apps/admin-web` for weekday vs weekend and peak vs off-peak rates with live rate simulator.
  - [x] Connect with Catalog Service `/owner/resources/{id}/pricing-rules` endpoints (GET & PUT) with automated cleanup and replace.
  - [x] Wired dynamic pricing management button into `ResourceCatalog.tsx` matrix.
- [x] **Task 1.3: Staff Invitation & Venue Assignment UI** *(Implemented & Verified)*
  - [x] Create Staff Management screen in `apps/admin-web` (`StaffManagement.tsx` & `InviteStaffModal.tsx`) with invite by phone/email, role selection (`OWNER`/`MANAGER`/`STAFF`), venue scope assignment, and status toggle.
  - [x] Backend `TenantMemberService` & `TenantMemberController` in `auth-service` for listing, inviting, updating roles/venues, and soft-deactivating members (verified with 7 unit tests).
  - [x] Flyway migration `V5__staff_venue_assignment.sql` adding `assigned_venues` to `tenant_members`.
  - [x] Wired navigation into `Sidebar.tsx`, `Header.tsx`, and `App.tsx`.
- [x] **Task 1.4: Equipment Tracking & Rental Inventory** *(Implemented & Verified)*
  - [x] Models and endpoints for equipment inventory in `catalog-service` (`CanteenItem`, `CanteenItemRepository`, `CanteenService`, and `CanteenController`).
  - [x] Flyway migration `V6__equipment_tracking.sql` adding `condition_status`, `deposit_paise`, and `serial_number`.
  - [x] Tested with `EquipmentServiceTest` (5/5 unit tests passed, 12/12 in catalog-service).
  - [x] Created `EquipmentInventory.tsx` and `AddEquipmentModal.tsx` in `apps/admin-web` with metrics, condition switcher, and preset gear templates.
  - [x] Integrated into `ResourceCatalog.tsx` section tabs and enhanced `AddCanteenItemModal.tsx` with condition and deposit badges.
- [x] **Task 1.5: Multi-Language Localization Bundles** *(Implemented & Verified)*
  - [x] Full translation dictionaries for English (`en`), Marathi (`mr`), and Hindi (`hi`) in admin-web and mobile apps.
- [x] **Task 1.6: Push Notifications (FCM / Expo)** *(Implemented & Verified)*
  - [x] Firebase Cloud Messaging / Expo push adapter for booking confirmations, slot reminders, and extensions.

### Priority 2 — Post-Pilot Business Modules
- [x] **Task 2.1: Customer Wallet Top-Up Flow** *(Implemented & Verified)*
  - [x] Payment gateway integration for wallet top-up and mobile wallet screen.
- [x] **Task 2.2: Membership Plans & Auto-Discount Engine** *(Implemented & Verified)*
  - [x] Owner membership plan creation and automatic checkout perk application.
- [x] **Task 2.3: Coupons & Prepaid Hours Packages** *(Implemented & Verified)*
  - [x] Coupon generator UI and prepaid hours package management.
- [x] **Task 2.4: Canteen Stock Ledger & Low-Stock Alerts** *(Implemented & Verified)*
  - [x] Stock receipts, adjustments, wastage, and threshold alert badges.
- [x] **Task 2.5: Analytics Peak-Hour Heatmap Matrix** *(Implemented & Verified)*
  - [x] 2D day-of-week vs hour heatmap in `ReportsDashboard.tsx`.
- [x] **Task 2.6: Platform Super-Admin Dashboard** *(Implemented & Verified)*
  - [x] Platform tenant management, subscription billing, and support impersonation audit trail.

### DevOps & Housekeeping
- [x] **Task D.1: Retire Legacy `apps/api` Monolith** *(Implemented & Verified)*
  - [x] Archive/remove `apps/api` to eliminate confusion with active `services/`.

---

## Priority 0 — Required before a pilot venue

### 1. Make one end-to-end booking reliable

The following customer journey must work against real backend data:

1. Customer requests and verifies an OTP.
2. Customer chooses a venue, resource, date, and available slot.
3. Backend creates a short-lived booking hold.
4. Customer pays online, or uses the permitted pay-at-venue method.
5. A verified payment webhook confirms the booking.
6. Customer receives a confirmation notification.
7. Customer and staff see the same booking status.
8. Customer cancels; the applicable refund policy is calculated and applied.

**Required changes**

- Replace mock data in admin and mobile stores with API-backed data.
- Do not update the UI as successful when an API request fails.
- Add loading, empty, retry, and error states to each booking screen.
- Use the booking service as the source of truth for availability and booking state.
- Return consistent API errors, especially `SLOT_TAKEN`, `HOLD_EXPIRED`, and `PAYMENT_FAILED`.

**Done when:** two customers attempting the same slot result in exactly one confirmed booking, and every client refresh shows the same result.

### 2. Authentication and authorization

**Missing or incomplete**

- Production SMS provider configuration and delivery status handling.
- OTP rate limits per phone number and IP address.
- Refresh-token rotation and logout/revocation strategy.
- Complete role and permission checks for super admin, owner, manager, staff, and customer.
- Venue-level access checks for staff.

**Required changes**

- Integrate MSG91 or Twilio behind the existing SMS interface; retain a mock provider only for local development.
- Add rate limiting at the gateway or with a shared Redis-backed limiter.
- Derive tenant and role from the verified JWT; never trust a user-controlled `X-Tenant-Id` header for authorization.
- Add authorization tests for cross-tenant reads and writes.

**Done when:** a staff user cannot view or modify a second tenant's data, even by changing request headers or IDs.

### 3. Payments and refunds

**Missing or incomplete**

- Production Razorpay credentials and environment separation.
- Multi-tenant merchant gateway configuration: Ability for venue Owners and Managers to configure their own Razorpay Key ID, Key Secret, and Webhook Secret via a self-service settings UI window rather than relying on global environment variables.
- Encrypted storage of merchant credentials at rest in the database.
- Confirmed webhook retry and idempotency behaviour.
- Payment-failure and late-payment handling.
- Refund status tracking and customer notification.
- Reconciliation view for failed or unmatched payments.

**Required changes**

- Multi-tenant Merchant Payment Settings Window in Admin Web (Owner/Manager role):
  - Add Owner API endpoints to view (masked) and update merchant gateway credentials.
  - Implement dynamic credential resolution in `PaymentService` based on `tenantId`, with graceful fallback to platform defaults.
  - Securely encrypt sensitive keys (`keySecret`, `webhookSecret`) at rest using AES-GCM.
  - Display merchant-specific webhook callback URLs (`/api/v1/webhooks/razorpay?tenantId={id}`).
- Verify the Razorpay webhook signature before processing its payload.
- Keep a unique record for every provider event and safely return success for duplicate events.
- Confirm bookings only from the server-side webhook or permitted pay-at-venue policy.
- Store all money as paise and calculate refunds only on the server.

**Done when:** processing the same payment webhook repeatedly does not create duplicate payments, confirmations, or refunds, and venue owners can configure their own payment credentials directly in the admin dashboard without server redeployment.

### 4. Database safety and migrations

**Missing or incomplete**

- Flyway migration files are not present.
- Services use Hibernate `ddl-auto: update`.
- Schema ownership is unclear because multiple services share one database.

**Required changes**

- Add versioned Flyway migrations and remove `ddl-auto: update` outside local development.
- Define which service owns each table and prevent accidental cross-service schema changes.
- Retain the unique booking-slot constraint and add indexes needed by tenant, venue, resource, status, and date queries.
- Add backup and restore procedures before onboarding real venues.

**Done when:** a blank database can be created from migrations, upgraded safely, and restored from a tested backup.

## Priority 1 — Required for a usable staff and owner MVP

### 5. Staff desk operations *(Implemented & Verified)*

- Complete walk-in creation, check-in, session start/stop, counter payment, and shift close against the backend.
- Persist live timer/session data; do not keep it only in the browser store.
- **Session Extension & 3-Tier Conflict Resolution (`POST /staff/sessions/{id}/extend` & `ExtendSessionModal.tsx`):**
  - Support extending active sessions on demand (+15m, +30m, +60m).
  - *Tier 1 (In-Place Extension):* If the next slot on the same resource is free, extend seamlessly without disruption.
  - *Tier 2 (Table/Court Swap):* If the current table is booked next, detect alternative free tables of the same sport in the venue and allow staff/owner to swap the customer with one click (`POST /staff/sessions/{id}/swap-resource` & `SwapResourceModal.tsx`).
  - *Tier 3 (Graceful Hard Stop):* If all tables are booked, alert staff and player with 10m/5m advance wrap-up notices.
- **Merchant QR Scanner Check-in (`POST /staff/checkin/qr` & `QrScannerModal.tsx`):**
  - Web & mobile camera QR scanner for venue desk staff to scan the customer's digital ticket QR code.
  - Auto-verifies ticket validity, changes status to `IN_PROGRESS`, and triggers the live play session timer.
- **Visual 2D Timeline Chart (Gantt Schedule Matrix — `SlotTimelineMatrix.tsx`):**
  - BookMyShow-style interactive grid displaying all tables/consoles on the vertical axis and 24-hour time slots on the horizontal axis.
  - Color-coded cells: Free (Available), In-Progress (Live Timer pulse), Held (Temporary Hold), and Booked.
  - Interactive cell clicking to inspect, book walk-ins, extend, or reschedule tables.
- **Universal Canteen & Equipment Billing (`POST /staff/bookings/{bookingId}/items` & `AddCanteenItemModal.tsx`):**
  - Order snacks, beverages, and rented equipment (extra controllers, cue sticks, rackets) linked to any active table/court session bill.
- **Operational Audit & History Trail (`ActivityAuditLog.tsx`):**
  - Chronological immutable log of all check-ins, table swaps, session extensions, canteen billings, and settlements.
- Add no-show handling and permission-controlled staff cancellation.
- Daily cash summary and shift collection records (`GET /staff/shift-summary` & `ShiftSummaryModal.tsx`).

### 6. Owner configuration

- Venue onboarding, hours, holidays, and resource maintenance blocks.
- Price-rule management for weekday/weekend and peak/off-peak rates.
- Staff invite/assignment and permissions.
- Cancellation/refund policy configuration.
- CSV report export based on server data.

### 7. Sports areas, resources, and equipment

Each merchant/tenant should be able to configure their own venue structure without engineering support.

**Required features**

- Add, edit, deactivate, and reorder **sport areas** inside a venue, for example: PlayStation Zone, Snooker Hall, Turf Area, Badminton Courts, Café, or VR Zone.
- Add resources inside each sport area, for example: PS5 Console 1, Pool Table 2, Turf A, Court 3, or VR Pod 1.
- Configure each resource's capacity, booking duration, billing mode, price, opening schedule, image, status, and maintenance periods.
- Create custom sport categories if the standard sports list is not sufficient.
- Add equipment to a sport area or resource, for example controllers, cues, rackets, balls, VR headsets, projectors, or rented accessories.
- Track equipment quantity, condition, rental price, deposit amount, maintenance status, and issue/return history.
- Block a resource or equipment item for repair, cleaning, tournaments, private events, or staff use.
- Show an owner/staff calendar or timeline by sport area, resource, and booking status.

**Done when:** an owner can create a new sport area and its resources through the admin panel, make it bookable, configure pricing, and see its bookings without a developer changing code.

### 8. Notifications and language support

- Firebase/Expo push-notification setup.
- SMS fallback for booking confirmation and reminders.
- Scheduled booking reminders and refund/cancellation notifications.
- Proper English, Marathi, and Hindi translation files.
- Correct UTF-8 handling; some current emoji/text appears incorrectly encoded.

## Priority 2 — Business modules after the booking pilot

### 9. Wallet, memberships, coupons, and packages

- Wallet top-up, debit, refund, and immutable ledger.
- Membership purchase and benefit application.
- Coupon eligibility, usage limits, expiry, and audit trail.
- Prepaid-hour packages.

### 10. Canteen and inventory

- Inventory receipts, sales, adjustments, and stock ledger.
- Low-stock thresholds and owner alerts.
- Canteen payments linked to the correct booking/session.
- Reconciliation of stock and cash at shift close.

### 11. Revenue charts, reports, and export

The owner dashboard provides audited financial intelligence, not only a raw booking list.

**Implemented dashboard charts & views:**
- [x] Revenue by day, week, month, year, and payment method (Cash, Counter UPI, Online Razorpay, Wallet).
- [x] Interactive Daily Revenue & Velocity bar chart with booking volume and attach ratio.
- [x] Net Take-Home Earnings vs. Gross Revenue Pipeline vs. Deductions (Discounts, Refunds, GST).
- [x] Audited Staff-wise collections, sessions handled, cash desk totals, and shift-close variance.
- [x] Physical Cash Drawer currency note counting tool (₹500, ₹200, ₹100, ₹50, etc.) with automatic drawer surplus/shortage detection.
- [x] Granular Audited Earnings Transaction Ledger with search by customer/phone/ID and payment channel filtering.
- [x] One-click financial statement CSV export and print view.

**Remaining future enhancements:**
- Peak-hour heat map by weekday and time (matrix view).
- Equipment rental maintenance depreciation tracking.
- Schedule recurring automated daily/weekly owner reports via WhatsApp/Email.


### 12. Inventory and equipment management

Inventory should cover both canteen stock and operational equipment.

- Product/equipment categories, units, suppliers, purchase price, selling/rental price, tax, and barcode/QR code where useful.
- Stock-in, stock-out, wastage, damage, return, transfer, and manual-adjustment records.
- Immutable inventory ledger that records who made each change and why.
- Low-stock and out-of-stock alerts.
- Periodic physical stock count and variance report.
- Equipment issue/return workflow for customer rentals and staff usage.
- Maintenance schedule, repair vendor, repair cost, and unavailable period for assets.

### 13. Audit, activity, and operational logs

Create a dedicated audit-log feature for sensitive business actions.

**Log these events**

- Login, OTP requests, logout, failed access attempts, and role changes.
- Tenant, venue, sport area, resource, pricing, policy, and staff changes.
- Booking creation, modification, cancellation, check-in, no-show, and session start/stop.
- Payment, refund, wallet, coupon, membership, inventory, and shift-close actions.
- API-key creation, use, rotation, revocation, and failed integration requests.
- Super-admin support impersonation.

Each audit event should include tenant, actor, action, affected record, timestamp, request/correlation ID, source IP where appropriate, and before/after values for important changes. Owners should be able to search and export their tenant's logs; only super admins may access platform-wide logs.

### 14. Platform administration

- Super-admin tenant onboarding, suspension, plan limits, and subscription billing.
- Platform-wide tenant, booking, GMV, and payment-failure metrics.
- Support impersonation with immutable audit records.

## Merchant / tenant customization and integration settings

The platform is multi-tenant. Each merchant must see and manage only their own configuration, data, users, integrations, and branding.

### Merchant administration window

Add an owner-only **Settings** area with the following sections:

- **Business profile:** merchant name, logo, GST number, contact details, invoice details, timezone, language defaults, and branch/venue settings.
- **Booking settings:** hold duration, slot duration, pay-at-venue policy, advance amount, cancellation windows, no-show grace period, overtime rules, and booking limits.
- **Catalog settings:** sports, sport areas, resources, equipment, pricing rules, taxes, canteen categories, and inventory alerts.
- **Staff and permissions:** invite users by phone/email, assign venues, choose roles, and configure fine-grained permissions.
- **Notifications:** notification channels, message templates, reminder timing, and opt-in policies.
- **Reports:** dashboard defaults, report access, and scheduled-report recipients.
- **Branding:** logo, invoice header/footer, booking terms, and customer-facing venue information. Full arbitrary themes can remain a later feature if logo-only branding is preferred for V1.

### Per-tenant API keys and integrations

Some merchants need their own payment, SMS, WhatsApp, accounting, POS, or reporting connections. Add a tenant-scoped integrations page.

**Supported integration model**

- Platform-managed integrations: the platform owns the master provider account and enables a merchant connection.
- Merchant-owned integrations: the merchant enters their own provider credentials, such as Razorpay key ID/key secret, SMS provider credentials, WhatsApp credentials, Google Maps key, or accounting/POS token.
- Merchant API access: allow an owner to create limited API keys for their own external systems, such as a website, POS, kiosk, BI dashboard, or partner app.

**API-key requirements**

- Create a key with name, purpose, tenant, scopes, allowed venues, expiry date, optional IP allow-list, and rate limit.
- Show the plaintext secret only once at creation time; store only a secure hash afterwards.
- Allow rotation, immediate revocation, last-used timestamp, and audit history.
- Use scoped permissions, for example `bookings:read`, `bookings:write`, `catalog:read`, `reports:read`, or `webhooks:manage`.
- Never expose another tenant's data through a merchant key.
- Encrypt merchant-owned provider secrets at rest with a platform-managed encryption key; never return stored secrets to the browser.
- Keep separate test and production credentials and clearly label their environment.

**Webhook requirements**

- Let a merchant register approved outbound webhook URLs for events such as booking confirmed, booking cancelled, payment succeeded, refund processed, or low stock.
- Sign every outbound webhook, retry safely with exponential backoff, display delivery history, and allow a merchant to disable the webhook.
- Validate and verify all inbound provider webhooks before changing booking or payment state.

**Done when:** a tenant owner can securely configure permitted integrations and API keys while another tenant cannot view, use, or change them.

## Database, connectivity, and data integration

### Database requirements

The platform uses MySQL, but production data design needs stronger operational controls.

- Use a managed MySQL 8 service for staging and production, with private networking, encrypted storage, automated backups, point-in-time recovery, and regular restore tests.
- Use Flyway migrations as the only schema-change mechanism outside local development.
- Maintain an entity/data-ownership map so every table is owned by exactly one service.
- Add required tenant, venue, resource, date, status, and foreign-key indexes; inspect slow queries regularly.
- Store money as integer paise, timestamps in UTC, and display dates in the venue timezone.
- Keep an immutable ledger for wallet, inventory, payment, refund, and audit events.
- Create a data-retention and deletion policy for OTP records, tokens, logs, customer PII, and financial records.
- Define tenant data export and deletion workflows that preserve required financial/audit records.
- Use read replicas or reporting summary tables only after measured reporting load requires them; do not split databases prematurely.

### Connectivity requirements

- Public clients connect only through HTTPS to the API gateway; backend services and MySQL remain private.
- Use a domain with TLS certificates, DNS, WAF/rate limiting, and separate staging/production environments.
- Add connection-pool limits and timeouts for each Spring service.
- Use retries only for safe/idempotent network operations; use circuit breakers/timeouts for external providers such as payment, SMS, push, and AI.
- Add an asynchronous outbox/worker pattern for notifications, webhooks, report generation, and other non-blocking external work.
- Support integration connectors for Razorpay, SMS, WhatsApp, Firebase notifications, email, maps, accounting/POS, cloud storage, and merchant webhooks.
- Record external request IDs, status, retry count, and failure reason in integration logs.
- Provide a tenant-facing integration health screen: connected, disabled, failing, last success, and action required.

## Agentic AI features

AI should be an optional tenant-controlled assistant. It must operate through approved tools and permissions, never receive unrestricted database access, and never autonomously execute financial or destructive actions.

### 1. Owner business assistant

An owner can ask questions in English, Hindi, or Marathi, such as:

- “Why did revenue fall this week?”
- “Which sport area has the lowest utilization?”
- “Show no-shows by day and suggest a deposit policy.”
- “Which items will run out in the next three days?”
- “Create a draft weekend discount for empty weekday-afternoon slots.”

The assistant can query only that tenant's approved report, booking, inventory, and policy data. It returns a cited answer with the date range, filters, and figures used.

### 2. Staff desk copilot

Staff can use natural language or quick actions to:

- Find a customer booking by name, phone, booking ID, or QR code.
- Explain the current bill, overtime, discount, tax, or cancellation rule.
- Suggest the next free comparable resource when one resource is unavailable.
- Draft a customer notification for delay, cancellation, or reschedule.
- Summarize the active desk: open sessions, late arrivals, pending payments, and low stock.

The copilot may prepare actions, but staff must explicitly confirm actions that create bookings, take payments, apply discounts, cancel bookings, refund money, or change stock.

### 3. Customer booking assistant

Add an optional multilingual chat interface that can:

- Answer venue, sport, opening-hour, price, membership, and cancellation-policy questions.
- Search availability through the booking API.
- Suggest suitable times/resources based on the customer's stated preference.
- Begin a booking draft and direct the customer to normal checkout.
- Answer booking-status and refund-status questions only for the authenticated customer.

The assistant must not claim that a slot is reserved until the normal booking API has created a hold.

### 4. Operations and anomaly assistant

- Detect unusual refund, cancellation, discount, no-show, payment-failure, or stock-adjustment patterns.
- Generate a daily owner summary and a weekly operational report.
- Flag resources with repeated maintenance issues or poor utilization.
- Forecast inventory demand using historical sales, with the owner approving purchase suggestions.
- Categorize customer reviews and identify recurring service issues.

### 5. AI architecture and guardrails

Build AI as a separate service/module behind the API gateway.

```text
Owner / Staff / Customer UI
  -> AI Assistant API
  -> policy and permission check
  -> approved tenant-scoped tools
     -> Reports / Booking search / Catalog / Inventory / Notifications
  -> model provider
  -> audited response or draft action
```

**Approved tool design**

- Give the AI narrow tools such as `get_revenue_report`, `find_booking`, `get_availability`, `draft_discount`, and `draft_customer_message`.
- Every tool receives tenant ID and user permissions from the authenticated server session; the model must never supply or override them.
- Separate read-only tools from draft-action tools.
- Require explicit human confirmation and a normal backend API call for state-changing actions.
- Log user prompt, tool calls, result IDs, generated draft, confirmation, and final action in tenant audit logs. Redact OTPs, secrets, payment details, and unnecessary personal data.

**Privacy, cost, and reliability requirements**

- Make AI opt-in per tenant, with usage limits and configurable staff/customer access.
- Do not send payment-card data, API secrets, OTPs, or full customer PII to a model provider.
- Use tenant-specific retrieval/document search for policies, FAQs, venue rules, and manuals; never mix documents across tenants.
- Show that an answer is AI-generated and provide links to the source reports or records used.
- Add token/request budgets, rate limits, timeouts, fallback messages, and model-provider monitoring.
- Test tool authorization, prompt injection resistance, cross-tenant isolation, hallucinated booking claims, and unsafe-action confirmation flows.

### Suggested AI delivery order

1. Read-only owner report assistant with tenant-isolated report tools.
2. Staff booking lookup and policy/billing explanation assistant.
3. Customer FAQ and availability assistant.
4. AI-generated drafts for messages, discounts, and reports with human approval.
5. Anomaly detection, forecasting, and automated recommendations.

## UI structure and state-management changes

The current component folders are a good start, but each client has one large Zustand store that mixes mock data, modal state, API calls, business rules, and server data.

### Recommended structure

```text
src/
├─ features/
│  ├─ auth/
│  ├─ bookings/
│  ├─ catalog/
│  ├─ desk/
│  ├─ payments/
│  └─ reports/
├─ shared/
│  ├─ api/
│  ├─ components/
│  ├─ hooks/
│  └─ types/
├─ routes/                 # Admin web routes
└─ store/                  # Small UI-only Zustand stores
```

### State rules

- **TanStack Query:** API/server state such as venues, resources, availability, bookings, sessions, payments, and reports.
- **Zustand:** UI-only state such as selected tab, modal visibility, chosen language, and temporary slot selection.
- **Server first:** submit a mutation, then invalidate/refetch affected queries. Use optimistic updates only with rollback on failure.
- **Shared API package:** move request/response contracts and typed API methods into `packages/shared` or a dedicated `packages/api-client` package.

## Scaling, load balancing, and operations

### Current gap

Docker Compose starts one instance of each service. The API gateway points to a single hostname and port per service. The Kubernetes manifests deploy an older `venue-api` application, not the active microservices, and have no autoscaling configuration.

### Required production deployment shape

```text
Client
  -> Ingress / external load balancer
  -> API Gateway deployment (multiple replicas)
  -> Kubernetes Service per backend service
  -> Auth / Catalog / Booking / Payment deployments (multiple replicas)
  -> Managed MySQL
```

### Docker, Jenkins, registry, and Kubernetes delivery connection

Use the following environment flow:

```text
Developer machine
  -> Docker Compose local environment
  -> Git repository
  -> Jenkins pipeline
  -> Container registry
  -> Kubernetes staging namespace
  -> smoke tests
  -> manual production approval
  -> Kubernetes production namespace
```

**Docker local environment**

- Keep Docker Compose as the one-command local environment for MySQL, gateway, backend services, and admin web.
- Put local values in an ignored `.env` file and provide a committed `.env.example` with no secrets.
- Use Docker service names for internal connectivity (`mysql`, `auth-service`, `catalog-service`, `booking-service`, `payment-service`), never container IP addresses.
- Add health checks for every service and make dependent services wait for required dependencies.
- Build images from a consistent repository root context and tag them with an application version and Git commit SHA.

**Jenkins pipeline**

- Trigger Jenkins from Git webhooks for pull requests, `main`, and release tags.
- On pull requests: run backend tests, frontend builds/type checks, container builds, and vulnerability scans; do not deploy.
- On `main`: build once, push immutable SHA-tagged images to the registry, deploy to staging, wait for rollout, and run smoke tests through staging ingress.
- On a release tag: promote the tested image without rebuilding, require approval, migrate safely, deploy to production, then run smoke tests.
- Store registry credentials, Kubernetes service-account credentials, Razorpay test credentials, and Expo/provider tokens in Jenkins Credentials; never in Jenkinsfiles, images, or logs.
- Use a dedicated service account per environment with only the required namespace permissions.

**Kubernetes connectivity**

- Create a `Deployment` and internal `ClusterIP Service` for API Gateway, Auth, Catalog, Booking, Payment, and Admin Web.
- Route external traffic only through the Ingress to Gateway and Admin Web.
- Configure the gateway using Kubernetes Service DNS names, for example `http://booking-service:8083`, rather than fixed pod IPs.
- Keep MySQL private; permit access only from service namespaces/security groups that need it.
- Put non-sensitive settings in ConfigMaps and all credentials in Kubernetes Secrets or an external secret manager.
- Add NetworkPolicies so only allowed services can connect to MySQL and each other.
- Add readiness/liveness probes, resource limits, HPA, PDB, and rolling-update rules for every stateless API deployment.
- Run Flyway migrations as a pre-deploy Job once per release, not from every application pod.

**Required environment variables**

| Area | Examples |
|---|---|
| Gateway routes | `AUTH_SERVICE_HOST`, `CATALOG_SERVICE_HOST`, `BOOKING_SERVICE_HOST`, `PAYMENT_SERVICE_HOST` |
| Database | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` |
| Security | `JWT_SECRET`, encryption key, allowed CORS origins |
| Payments | Razorpay key ID, key secret, webhook secret, environment |
| Messaging | SMS, WhatsApp, Firebase/Expo credentials |
| Storage | object-storage bucket, region, access credentials |
| Observability | Sentry DSN, logging endpoint, metrics configuration |

**Done when:** a merge to `main` automatically deploys the active microservices to staging; staging traffic enters through Ingress, reaches the gateway, reaches the correct internal service through Kubernetes DNS, and passes a smoke test without exposing internal services or secrets.

### Required changes

- Create Kubernetes `Deployment`, `Service`, `ConfigMap`, and `Secret` manifests for gateway, auth, catalog, booking, payment, and admin web.
- Add Horizontal Pod Autoscalers for stateless API services.
- Add CPU and memory requests/limits and Pod Disruption Budgets.
- Ensure health probes match the real Actuator paths exposed by each service.
- Use Kubernetes Service DNS or service discovery so requests are balanced across service replicas.
- Use distributed locking or database locking for scheduled jobs such as hold expiry, reminders, and no-show processing.
- Move all secrets out of Docker Compose and source control; use environment-specific secret storage.
- Add structured logs, error tracking, metrics, dashboards, alerts, and tested backup/restore jobs.

## Quality gates and tests

Add these checks to CI before merging:

- Unit tests for pricing, refund, coupon, and billing calculations.
- Integration test: many concurrent requests for one slot; exactly one must succeed.
- Integration test: tenant A cannot read or modify tenant B resources, bookings, or reports.
- Integration test: duplicate Razorpay webhook is safe.
- Integration test: expired holds release booking slots.
- API contract tests between gateway and services.
- Admin-web TypeScript build, lint, and component tests.
- Mobile type check and focused component tests.
- Container image scan and smoke test after staging deployment.

## Recommended delivery order

1. Decide whether `apps/api` is retired or remains the backend; keep only one backend architecture as the source of truth.
2. Add Flyway migrations, tests, and tenant/role enforcement.
3. Complete the end-to-end OTP, booking, payment, webhook, notification, and cancellation flow.
4. Replace UI mock state with TanStack Query-backed API data.
5. Complete staff desk and owner configuration flows.
6. Align Kubernetes and CI/CD with the active microservices.
7. Run a pilot with one venue, then add wallet, memberships, coupons, canteen, and platform billing.
