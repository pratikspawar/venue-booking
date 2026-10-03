# Venue Booking Platform: Technical Design (MVP)

Version 0.1 (draft), 3 Oct 2026
Stack: Spring Boot 3 (Java 17+), MySQL 8, React Native (customer and staff apps), React (owner and super admin web panels), Firebase Cloud Messaging.

## 1. Assumptions (until the open questions are answered)

- OTP login is mandatory; no guest booking.
- Pay at venue is an owner setting per venue: off, on with no advance, or on with an advance amount.
- Online payments use Razorpay. Settlement to owners (Razorpay Route) is kept behind a service interface so it can be switched on later without schema changes.
- No recurring bookings and no offline mode in the MVP.
- All timestamps stored in UTC. Each venue has a time zone (default Asia/Kolkata). Money stored as integer paise.
- Booking is auto-confirmed once payment succeeds (or immediately for pay-at-venue, when allowed).

## 2. Architecture

One Spring Boot modular monolith. Do not split into microservices for a solo MVP.

Packages (by feature, not by layer):
- `auth` (OTP, JWT, roles)
- `tenant` (tenants, venues, plans)
- `catalog` (resources, pricing rules)
- `booking` (availability, holds, bookings, sessions)
- `payment` (Razorpay, webhooks, refunds)
- `notification` (SMS, push)
- `report`
- `common` (tenant context, audit, errors, i18n)

Deployment: one app instance behind Nginx, MySQL managed or on the same VPS, daily backups. Scale later by running more instances; the design below is stateless except for the database.

## 3. Multi-tenancy

- Shared database, `tenant_id` on every tenant-owned table.
- The JWT carries `userId`, `tenantId` (for owner and staff) and `roles`. Customers have no tenant in the token; the tenant comes from the venue they are booking.
- A `TenantContext` (ThreadLocal) is set by a request filter. A Hibernate `@Filter` (or a base repository) adds `tenant_id = :tenantId` to every query. Super admin bypasses it explicitly.
- Every composite index starts with `tenant_id` where the table is queried per tenant.
- Write an integration test that logs in as tenant A and tries to read tenant B's booking, resource and report. It must fail. Run it in CI.

## 4. Database schema (MySQL 8)

Conventions: `BIGINT` ids, `created_at` and `updated_at` on every table, `utf8mb4`, amounts in paise.

### 4.1 Platform and identity

```sql
CREATE TABLE tenants (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(150) NOT NULL,
  slug          VARCHAR(80)  NOT NULL UNIQUE,
  logo_url      VARCHAR(500),
  status        ENUM('ACTIVE','SUSPENDED','TRIAL') NOT NULL DEFAULT 'TRIAL',
  plan_id       BIGINT,
  gst_number    VARCHAR(20),
  razorpay_account_id VARCHAR(60),
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  phone         VARCHAR(15) NOT NULL UNIQUE,
  name          VARCHAR(120),
  email         VARCHAR(150),
  language      VARCHAR(5) NOT NULL DEFAULT 'en',
  fcm_token     VARCHAR(300),
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Owner and staff membership. Customers need no row here.
CREATE TABLE tenant_members (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id   BIGINT NOT NULL,
  user_id     BIGINT NOT NULL,
  role        ENUM('OWNER','MANAGER','STAFF') NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_member (tenant_id, user_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE otp_requests (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  phone       VARCHAR(15) NOT NULL,
  otp_hash    VARCHAR(100) NOT NULL,
  expires_at  DATETIME NOT NULL,
  attempts    INT NOT NULL DEFAULT 0,
  consumed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_otp_phone (phone, created_at)
);
```

### 4.2 Venues and resources

```sql
CREATE TABLE venues (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id     BIGINT NOT NULL,
  name          VARCHAR(150) NOT NULL,
  address       VARCHAR(300),
  city          VARCHAR(80),
  latitude      DECIMAL(9,6),
  longitude     DECIMAL(9,6),
  timezone      VARCHAR(40) NOT NULL DEFAULT 'Asia/Kolkata',
  pay_at_venue_mode ENUM('OFF','NO_ADVANCE','ADVANCE') NOT NULL DEFAULT 'OFF',
  advance_amount_paise BIGINT NOT NULL DEFAULT 0,
  hold_minutes  INT NOT NULL DEFAULT 8,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  KEY ix_venue_tenant (tenant_id),
  KEY ix_venue_city (city),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE venue_hours (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  venue_id    BIGINT NOT NULL,
  day_of_week TINYINT NOT NULL,           -- 1=Mon ... 7=Sun
  open_time   TIME NOT NULL,
  close_time  TIME NOT NULL,              -- may be after midnight, see note
  UNIQUE KEY uq_hours (venue_id, day_of_week),
  FOREIGN KEY (venue_id) REFERENCES venues(id)
);

CREATE TABLE sports (
  id    BIGINT PRIMARY KEY AUTO_INCREMENT,
  code  VARCHAR(40) NOT NULL UNIQUE,      -- POOL, CARROM, TURF, TENNIS, PLAYSTATION
  name_en VARCHAR(80) NOT NULL,
  name_mr VARCHAR(80),
  name_hi VARCHAR(80)
);

CREATE TABLE resources (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id     BIGINT NOT NULL,
  venue_id      BIGINT NOT NULL,
  sport_id      BIGINT NOT NULL,
  name          VARCHAR(100) NOT NULL,    -- "Pool Table 2", "Turf A"
  capacity      INT NOT NULL DEFAULT 2,
  slot_minutes  INT NOT NULL DEFAULT 60,  -- grid size for this resource
  billing_mode  ENUM('FIXED_SLOT','TIME_PLAYED') NOT NULL DEFAULT 'FIXED_SLOT',
  status        ENUM('ACTIVE','MAINTENANCE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  KEY ix_res_venue (tenant_id, venue_id),
  FOREIGN KEY (venue_id) REFERENCES venues(id),
  FOREIGN KEY (sport_id) REFERENCES sports(id)
);

CREATE TABLE resource_blocks (            -- maintenance, private events, holidays
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id   BIGINT NOT NULL,
  resource_id BIGINT NOT NULL,
  start_utc   DATETIME NOT NULL,
  end_utc     DATETIME NOT NULL,
  reason      VARCHAR(200),
  KEY ix_block (resource_id, start_utc, end_utc),
  FOREIGN KEY (resource_id) REFERENCES resources(id)
);

-- Price rules: most specific rule wins (see section 6.3)
CREATE TABLE pricing_rules (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id     BIGINT NOT NULL,
  resource_id   BIGINT NOT NULL,
  day_type      ENUM('ANY','WEEKDAY','WEEKEND') NOT NULL DEFAULT 'ANY',
  start_time    TIME NOT NULL DEFAULT '00:00:00',
  end_time      TIME NOT NULL DEFAULT '23:59:59',
  price_per_slot_paise   BIGINT,          -- for FIXED_SLOT
  price_per_hour_paise   BIGINT,          -- for TIME_PLAYED
  min_charge_minutes     INT NOT NULL DEFAULT 0,
  rounding_minutes       INT NOT NULL DEFAULT 1,
  priority      INT NOT NULL DEFAULT 0,
  KEY ix_price (resource_id),
  FOREIGN KEY (resource_id) REFERENCES resources(id)
);

CREATE TABLE cancellation_policies (
  id             BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id      BIGINT NOT NULL,
  venue_id       BIGINT NOT NULL,
  hours_before   INT NOT NULL,            -- cancel at least this many hours before
  refund_percent INT NOT NULL,            -- 0 to 100
  KEY ix_policy (venue_id, hours_before),
  FOREIGN KEY (venue_id) REFERENCES venues(id)
);
```

Note on `venue_hours`: for venues open past midnight, store `close_time` as `26:00` style using a separate `closes_next_day` flag, or generate slots from `open_time` plus a duration. Pick one and keep it in the slot generator only.

### 4.3 Bookings (the core)

```sql
CREATE TABLE bookings (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id       BIGINT NOT NULL,
  venue_id        BIGINT NOT NULL,
  resource_id     BIGINT NOT NULL,
  customer_id     BIGINT,                 -- null for walk-in without phone
  walkin_name     VARCHAR(100),
  walkin_phone    VARCHAR(15),
  source          ENUM('APP','WALKIN') NOT NULL,
  start_utc       DATETIME NOT NULL,
  end_utc         DATETIME NOT NULL,
  status          ENUM('HELD','CONFIRMED','IN_PROGRESS','COMPLETED',
                       'CANCELLED','NO_SHOW','EXPIRED') NOT NULL,
  hold_expires_at DATETIME,
  amount_paise    BIGINT NOT NULL,        -- price at booking time
  discount_paise  BIGINT NOT NULL DEFAULT 0,
  tax_paise       BIGINT NOT NULL DEFAULT 0,
  paid_paise      BIGINT NOT NULL DEFAULT 0,
  payment_mode    ENUM('ONLINE','PAY_AT_VENUE','WALLET','MIXED') NOT NULL,
  coupon_id       BIGINT,
  version         INT NOT NULL DEFAULT 0, -- optimistic lock
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_book_venue_time (tenant_id, venue_id, start_utc),
  KEY ix_book_resource_time (resource_id, start_utc),
  KEY ix_book_customer (customer_id, start_utc),
  KEY ix_book_hold (status, hold_expires_at),
  FOREIGN KEY (resource_id) REFERENCES resources(id)
);

-- One row per reserved grid cell. This table enforces "no double booking".
CREATE TABLE booking_slots (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  booking_id  BIGINT NOT NULL,
  resource_id BIGINT NOT NULL,
  slot_start  DATETIME NOT NULL,          -- UTC, aligned to the resource grid
  UNIQUE KEY uq_slot (resource_id, slot_start),
  KEY ix_slot_booking (booking_id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE TABLE play_sessions (              -- for TIME_PLAYED and walk-ins
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id     BIGINT NOT NULL,
  booking_id    BIGINT NOT NULL UNIQUE,
  started_at    DATETIME NOT NULL,
  ended_at      DATETIME,
  billed_minutes INT,
  amount_paise  BIGINT,
  started_by    BIGINT,                   -- staff user id
  ended_by      BIGINT,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);
```

The unique key on `booking_slots (resource_id, slot_start)` is what makes double booking impossible, regardless of how many app instances or threads run. Cancelled, expired and no-show bookings delete their `booking_slots` rows (the booking row stays for history). MySQL has no partial unique index, so deleting rows is the simplest correct approach.

### 4.4 Payments

```sql
CREATE TABLE payments (
  id                BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id         BIGINT NOT NULL,
  booking_id        BIGINT,
  purpose           ENUM('BOOKING','WALLET_TOPUP','MEMBERSHIP','CANTEEN') NOT NULL,
  method            ENUM('ONLINE','CASH','UPI_COUNTER','WALLET') NOT NULL,
  amount_paise      BIGINT NOT NULL,
  status            ENUM('CREATED','PENDING','SUCCESS','FAILED') NOT NULL,
  gateway           VARCHAR(20),
  gateway_order_id  VARCHAR(80) UNIQUE,
  gateway_payment_id VARCHAR(80) UNIQUE,
  received_by       BIGINT,               -- staff user id for counter payments
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_pay_booking (booking_id),
  KEY ix_pay_tenant_time (tenant_id, created_at)
);

CREATE TABLE refunds (
  id                BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id         BIGINT NOT NULL,
  payment_id        BIGINT NOT NULL,
  booking_id        BIGINT NOT NULL,
  amount_paise      BIGINT NOT NULL,
  status            ENUM('REQUESTED','PROCESSED','FAILED') NOT NULL,
  gateway_refund_id VARCHAR(80) UNIQUE,
  reason            VARCHAR(200),
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id)
);

CREATE TABLE webhook_events (             -- idempotency for gateway callbacks
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  gateway     VARCHAR(20) NOT NULL,
  event_id    VARCHAR(100) NOT NULL,
  payload     JSON,
  processed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_event (gateway, event_id)
);
```

### 4.5 Support tables

```sql
CREATE TABLE notifications (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT NOT NULL,
  channel     ENUM('PUSH','SMS','WHATSAPP') NOT NULL,
  template    VARCHAR(60) NOT NULL,
  payload     JSON,
  status      ENUM('QUEUED','SENT','FAILED') NOT NULL DEFAULT 'QUEUED',
  send_after  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_notif_queue (status, send_after)
);

CREATE TABLE audit_log (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id   BIGINT,
  actor_id    BIGINT NOT NULL,
  action      VARCHAR(60) NOT NULL,       -- REFUND, PRICE_CHANGE, CANCEL, IMPERSONATE
  entity      VARCHAR(40),
  entity_id   BIGINT,
  details     JSON,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_audit (tenant_id, created_at)
);

CREATE TABLE reviews (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id   BIGINT NOT NULL,
  venue_id    BIGINT NOT NULL,
  booking_id  BIGINT NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL,
  rating      TINYINT NOT NULL,
  comment     VARCHAR(500),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 4.6 Phase 2 and 3 tables (outline only)

- `wallets (tenant_id, user_id, balance_paise)` and `wallet_transactions` (append-only ledger; balance is derived or checked against the ledger).
- `coupons`, `coupon_redemptions`, `membership_plans`, `memberships`, `packages`.
- `canteen_items`, `canteen_stock_movements`, `booking_items` (items added to a booking).
- `subscription_plans`, `tenant_invoices`.

Add these when the phase starts. Keep the MVP schema small.

## 5. Booking state machine

```
HELD ──payment success──▶ CONFIRMED ──staff starts──▶ IN_PROGRESS ──stop──▶ COMPLETED
  │                           │
  │ hold timeout / failure    ├── customer or staff cancel ─▶ CANCELLED
  ▼                           └── not arrived after grace ──▶ NO_SHOW
EXPIRED
```

- Pay-at-venue (no advance): created directly as `CONFIRMED`.
- Pay-at-venue with advance: created as `HELD`, then `CONFIRMED` when the advance is paid.
- Walk-in: created as `IN_PROGRESS` (time-played) or `CONFIRMED` (fixed slot, starting now).
- Only forward transitions are allowed, enforced in one `BookingStateMachine` class. Every transition is a single `@Transactional` method with optimistic locking via the `version` column.

## 6. Core logic

### 6.1 Slot generation (availability)

Slots are not pre-generated in the database. They are computed on demand:

1. Load the venue hours for the requested date (in the venue time zone) and the resource's `slot_minutes`.
2. Build the grid: from open time to close time in steps of `slot_minutes`. Convert each slot start to UTC.
3. Query `booking_slots` for that resource and date range, plus `resource_blocks` overlapping the range.
4. Mark each grid cell `AVAILABLE`, `BOOKED` or `BLOCKED`. Hide past cells (with a small buffer).
5. Attach the price for each cell (see 6.3).

```sql
SELECT slot_start FROM booking_slots
WHERE resource_id = :rid AND slot_start >= :dayStartUtc AND slot_start < :dayEndUtc;
```

Cache the venue hours and pricing rules (Caffeine, a few minutes). Do not cache availability for long; at most a few seconds.

### 6.2 Creating a booking hold

```java
@Transactional
public Booking createBooking(CreateBookingRequest req, long customerId) {
    Resource r = resourceRepo.findActiveForUpdate(req.resourceId());  // checks tenant via filter
    Venue v = r.getVenue();

    List<Instant> cells = slotGrid.cellsBetween(r, req.startUtc(), req.endUtc());
    validate(cells, v);   // inside opening hours, not in the past, not blocked, within max days ahead

    Price price = pricing.quote(r, cells, req.couponCode(), customerId);

    Booking b = new Booking();
    b.setTenantId(r.getTenantId());
    b.setVenueId(v.getId());
    b.setResourceId(r.getId());
    b.setCustomerId(customerId);
    b.setSource(Source.APP);
    b.setStartUtc(cells.get(0));
    b.setEndUtc(cells.get(cells.size() - 1).plusSeconds(r.getSlotMinutes() * 60L));
    b.setAmountPaise(price.total());
    b.setStatus(Status.HELD);
    b.setHoldExpiresAt(Instant.now().plus(Duration.ofMinutes(v.getHoldMinutes())));
    bookingRepo.saveAndFlush(b);

    try {
        slotRepo.saveAll(cells.stream().map(c -> new BookingSlot(b.getId(), r.getId(), c)).toList());
        slotRepo.flush();   // unique key violation surfaces here
    } catch (DataIntegrityViolationException e) {
        throw new SlotAlreadyBookedException();   // map to HTTP 409
    }
    return b;
}
```

Key points:
- The database unique key is the source of truth. Do not rely on "check then insert" alone.
- If the insert fails, the whole transaction rolls back (the booking row disappears), so no cleanup is needed.
- Return 409 with a message the app can show: "This slot was just taken, pick another".
- The `findActiveForUpdate` lock on the resource row is optional; it simply serializes concurrent bookings per resource and reduces noisy unique-key errors. Skip it if you see no contention.

### 6.3 Pricing

Choose the rule for each slot cell like this:
1. Take all rules for the resource that match the day type (WEEKDAY or WEEKEND, otherwise ANY) and contain the cell's local start time.
2. Pick the highest `priority`; if tied, pick the most specific (WEEKDAY/WEEKEND over ANY, narrower time window over wider).
3. For `FIXED_SLOT`: sum `price_per_slot_paise` over cells.
4. For `TIME_PLAYED`: compute at session end (see 6.6). At booking time, show an estimate and optionally take an advance.

Then apply coupon (Phase 2), compute GST on the owner's configured rate, and store the final numbers on the booking. Never recompute historic bookings from current rules.

### 6.4 Payment and confirmation

Flow for online payment:

1. App calls `POST /bookings` and gets a `HELD` booking with `holdExpiresAt`.
2. App calls `POST /bookings/{id}/pay`. Server creates a Razorpay order for the amount (stores a `payments` row with status `CREATED` and the `gateway_order_id`) and returns the order id and key.
3. App opens the Razorpay checkout, the user pays.
4. Razorpay calls your webhook (`payment.captured`). This is the authority; the app's success callback only triggers a refresh.
5. Webhook handler:
   - Verify the signature.
   - Insert into `webhook_events` (unique key on event id). If it already exists, return 200 and stop (idempotent).
   - Load the payment by order id, mark `SUCCESS`, set `gateway_payment_id`.
   - Load the booking. If it is still `HELD` and not expired, set `CONFIRMED` and `paid_paise`.
   - If the booking has already `EXPIRED` (payment arrived late), the slot may be gone. Try to re-reserve the same cells; if that fails, auto-refund and notify the customer.
6. Send push and SMS confirmation after commit (use an outbox: write a `notifications` row in the same transaction, a scheduler sends it).

Hold expiry job (runs every minute):

```sql
UPDATE bookings SET status = 'EXPIRED'
WHERE status = 'HELD' AND hold_expires_at < UTC_TIMESTAMP();
-- then delete booking_slots for those bookings
```

Do it in one transaction per batch, selecting ids first with `FOR UPDATE SKIP LOCKED` so multiple instances do not collide.

### 6.5 Cancellation and refund

1. Find the matching `cancellation_policies` row: the one with the largest `hours_before` that is less than or equal to the time left before start.
2. Refund amount = `paid_paise * refund_percent / 100`.
3. Delete `booking_slots` rows so the slot becomes available again, set the status to `CANCELLED`.
4. Create a `refunds` row and call Razorpay refund; update on webhook `refund.processed`.
5. Write an audit entry. Staff-initiated cancellations require the permission set by the owner.

### 6.6 Time-played sessions and overtime

- Staff taps Start: create `play_sessions` with `started_at = now`, set the booking to `IN_PROGRESS`.
- Staff taps Stop: compute minutes = `ceil((ended - started) / rounding)` times rounding, apply `min_charge_minutes`, multiply by the rate (use the rule in force at session start), store `billed_minutes` and `amount_paise`.
- For a fixed-slot booking that runs over: when the slot ends, check whether the next cell exists in `booking_slots`. If it is free, the session may continue and the extra time is billed at the standard rate (insert additional `booking_slots` to claim it). If it is booked, the app alerts the staff and the owner's policy decides.
- Walk-in time-played sessions claim cells in advance up to a limit (for example, the next 2 hours or until the next confirmed booking), and extend as long as cells are free.
- A scheduler marks `CONFIRMED` bookings as `NO_SHOW` after a configurable grace period (for example, 15 minutes), releasing the slots, unless the owner turns it off.

## 7. Authentication

- `POST /auth/otp/request`: rate limit per phone and per IP (for example, 3 per 10 minutes), store a hash of the OTP, send via SMS provider.
- `POST /auth/otp/verify`: check hash, expiry and attempts (max 5), then issue a 15-minute access JWT and a 30-day refresh token (rotated on use).
- Create the user on first verify.
- Owners and staff are added by phone number from the owner panel; they log in with OTP like everyone else, and the token includes their tenant role.

## 8. API outline (REST, JSON, versioned `/api/v1`)

Customer
- `GET /venues?city=&sport=&q=`, `GET /venues/{id}`
- `GET /resources/{id}/availability?date=`
- `POST /bookings`, `POST /bookings/{id}/pay`, `POST /bookings/{id}/cancel`
- `GET /me/bookings`, `GET /me`, `PUT /me` (name, language, FCM token)

Staff
- `GET /staff/venues/{id}/timeline?date=`
- `POST /staff/bookings/walkin`
- `POST /staff/bookings/{id}/arrive`, `/start`, `/stop`, `/no-show`, `/cancel`
- `POST /staff/bookings/{id}/payments` (cash or UPI at counter)

Owner
- CRUD: `/owner/venues`, `/owner/resources`, `/owner/pricing-rules`, `/owner/policies`, `/owner/staff`, `/owner/blocks`
- `GET /owner/reports/revenue`, `/utilization`, `/peak-hours`, `/cancellations` (query by date range and venue)

Super admin
- `/admin/tenants`, `/admin/plans`, `/admin/metrics`

Webhooks
- `POST /webhooks/razorpay`

Conventions: error body `{ "code": "SLOT_TAKEN", "message": "..." }`; the message is localized from the `Accept-Language` header; every list endpoint is paginated.

## 9. Reports

Compute reports with SQL against `bookings`, `payments` and `play_sessions`. For the MVP, direct queries with the right indexes are enough. Examples:

```sql
-- Revenue per day
SELECT DATE(CONVERT_TZ(created_at,'+00:00','+05:30')) d, SUM(amount_paise) revenue
FROM payments
WHERE tenant_id = :t AND status = 'SUCCESS' AND created_at >= :from AND created_at < :to
GROUP BY d;

-- Utilization: booked slots / available slots per resource
SELECT resource_id, COUNT(*) booked_slots
FROM booking_slots bs JOIN bookings b ON b.id = bs.booking_id
WHERE b.tenant_id = :t AND b.status IN ('CONFIRMED','IN_PROGRESS','COMPLETED')
  AND bs.slot_start >= :from AND bs.slot_start < :to
GROUP BY resource_id;
```

If reports get slow later, add a nightly summary table (`daily_stats`) rather than a separate analytics system.

## 10. Internationalization

- Backend: `messages_en.properties`, `messages_mr.properties`, `messages_hi.properties` for errors and notification templates. Pick the language from the user record when sending notifications, and from `Accept-Language` for API responses.
- Flutter: ARB files with `flutter_localizations` and `intl`; Angular: `ngx-translate` or Angular i18n.
- Sport names carry translations in the `sports` table; venue and resource names stay as the owner typed them.
- Use UTF-8 everywhere, test Devanagari rendering in PDFs and invoices early (font choice matters).

## 11. Client structure

- **React Native (customer and staff):** TypeScript, with Expo (managed workflow with a dev build) to keep setup light for a solo developer. One app with role-based navigation (React Navigation), or two apps sharing a package. Server state with TanStack Query (caching, refetching availability, retry), small client state with Zustand. Axios client with an interceptor that attaches the JWT and refreshes it on 401. Handle the slot-taken error by refetching availability. Payments with the Razorpay React Native SDK (needs a dev build, it does not run in Expo Go). Push with `@react-native-firebase/messaging` or Expo Notifications. Localization with `i18next` and `react-i18next`.
- **React (owner and super admin):** TypeScript with Vite, React Router, TanStack Query, and a component library such as MUI or Ant Design for tables and forms. React Hook Form with Zod for validation. Server-side pagination on all lists. Same Axios setup as the mobile app.
- **Shared code:** put the API types, Zod schemas and the API client in a shared package (a monorepo with pnpm workspaces or Turborepo). Generate the types from the Spring OpenAPI spec (springdoc plus `openapi-typescript`) so the frontend and backend cannot drift.
- Suggested layout: `apps/mobile`, `apps/admin-web`, `packages/api-client`, `packages/shared`.

## 12. Non-functional checklist

- Rate limiting on OTP and booking endpoints (Bucket4j or at the reverse proxy).
- Flyway migrations for the schema, one file per change.
- Structured logs with a request id and tenant id; error tracking (Sentry).
- Health endpoint and uptime monitoring.
- Daily automated MySQL backups, tested by restoring once.
- Secrets in environment variables, not in the repo.
- Tests that matter most: concurrent booking of the same slot (many threads, only one wins), webhook idempotency (same event twice), hold expiry, refund calculation, tenant isolation.

## 13. Suggested MVP build order (12 weeks)

1. Weeks 1-2: project setup, Flyway, auth with OTP, tenant and member model, tenant filter and isolation test. Also set up Dockerfiles, Docker Compose, the pull request CI workflow and a first staging deploy, so every later feature ships through the pipeline.
2. Weeks 3-4: venues, resources, hours, pricing rules, owner panel CRUD.
3. Weeks 5-6: availability, booking hold, state machine, concurrency test, customer app booking screens.
4. Weeks 7-8: Razorpay order, webhook, confirmation, expiry job, cancellation and refund.
5. Week 9: staff panel (timeline, walk-ins, start/stop, counter payment).
6. Week 10: notifications (push and SMS), reminders, language files.
7. Week 11: basic reports, audit log.
8. Week 12: hardening, load test, backups, release to one pilot venue.

Run a real pilot with one venue as early as week 8 or 9; feedback from real staff will change priorities more than any document.

## 14. Deployment: Docker, Kubernetes, CI/CD

Assumptions: pipelines on Jenkins, a Docker registry for images (GitHub Container Registry, Docker Hub or your cloud registry), MySQL as a managed database outside the cluster. The structure stays the same if any of these change.

### 14.1 Environments

- **local:** Docker Compose (app, MySQL, optional Mailhog-style SMS stub).
- **staging:** a small Kubernetes cluster or namespace, Razorpay test keys, deployed automatically from `main`.
- **production:** separate namespace or cluster, deployed from a version tag after manual approval.

Keep one set of manifests and vary only the values per environment (Kustomize overlays or Helm values).

### 14.2 Repository layout

```
/apps/api                (Spring Boot)
/apps/admin-web          (React)
/apps/mobile             (React Native, Expo)
/packages/*              (shared types and API client)
/deploy/docker/          (Dockerfiles, compose)
/deploy/k8s/base/        (Deployments, Services, Ingress, HPA)
/deploy/k8s/overlays/staging, /production
/Jenkinsfile             (API pipeline), /apps/admin-web/Jenkinsfile, /apps/mobile/Jenkinsfile
```

### 14.3 Docker

Spring Boot API, multi-stage build with a non-root user:

```dockerfile
FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY apps/api/ .
RUN ./mvnw -q -DskipTests package

FROM eclipse-temurin:21-jre
RUN useradd -r -u 1001 app
WORKDIR /app
COPY --from=build /src/target/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","app.jar"]
```

React admin web, built then served by Nginx:

```dockerfile
FROM node:20 AS build
WORKDIR /src
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile && pnpm --filter admin-web build

FROM nginx:1.27-alpine
COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/apps/admin-web/dist /usr/share/nginx/html
```

Local `docker-compose.yml`: services `mysql` (with a volume and healthcheck), `api` (depends on a healthy MySQL, env from `.env`), and `admin-web`. Flyway runs inside the API at startup locally; see 14.5 for production.

### 14.4 Kubernetes

Objects for the API:

- `Deployment` with 2 replicas, resource requests and limits, readiness probe `/actuator/health/readiness`, liveness probe `/actuator/health/liveness`, and a rolling update strategy (`maxUnavailable: 0`).
- `Service` (ClusterIP) and an `Ingress` (Nginx ingress controller) with TLS from cert-manager (Let's Encrypt). Route `api.yourdomain.com` to the API and `admin.yourdomain.com` to the web app.
- `ConfigMap` for non-secret settings, `Secret` for the database password, JWT key, Razorpay keys, SMS key. Use External Secrets or Sealed Secrets rather than committing plain secrets.
- `HorizontalPodAutoscaler` on CPU (for example, 2 to 6 replicas).
- `PodDisruptionBudget` (minAvailable 1).

Skeleton for the API deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: api }
spec:
  replicas: 2
  strategy: { rollingUpdate: { maxUnavailable: 0, maxSurge: 1 } }
  selector: { matchLabels: { app: api } }
  template:
    metadata: { labels: { app: api } }
    spec:
      containers:
        - name: api
          image: ghcr.io/OWNER/venue-api:TAG
          ports: [{ containerPort: 8080 }]
          envFrom:
            - configMapRef: { name: api-config }
            - secretRef: { name: api-secrets }
          resources:
            requests: { cpu: 250m, memory: 512Mi }
            limits: { memory: 1Gi }
          readinessProbe:
            httpGet: { path: /actuator/health/readiness, port: 8080 }
          livenessProbe:
            httpGet: { path: /actuator/health/liveness, port: 8080 }
```

Things that change when you run more than one replica:

- **Scheduled jobs** (hold expiry, no-show, notification sender) would run on every pod. The hold-expiry query already uses `SKIP LOCKED`, but add ShedLock (a lock table in MySQL) so each job runs once per interval.
- **Rate limiting** must use a shared store (Redis) or the ingress, not in-memory counters.
- **Webhooks** can hit any pod; they are idempotent through `webhook_events`, so this is safe.
- The API is stateless (JWT), so no sticky sessions are needed.
- Add Redis only when needed (shared rate limits, caching). Do not add it on day one.

### 14.5 Database migrations

Run Flyway as a Kubernetes `Job` (or a Helm pre-upgrade hook) before the new API version rolls out, instead of every pod migrating at startup. Write migrations to be backward compatible (add columns before using them, remove them a release later), so the old pods keep working during the rolling update.

### 14.6 CI/CD pipeline (Jenkins)

Jenkins setup:
- Use a **Multibranch Pipeline** job per app. Jenkins discovers branches, pull requests and tags from your Git host and runs the `Jenkinsfile` in each. Trigger builds with a webhook from the Git host, not polling.
- Run builds on **ephemeral agents**: the Jenkins Kubernetes plugin starts a pod per build (with containers for Maven, Node, Docker build and kubectl) and removes it afterwards. This keeps the Jenkins controller clean. For image builds inside a pod use Kaniko or BuildKit rather than mounting the Docker socket.
- Store secrets in **Jenkins Credentials** (registry login, kubeconfig or service account token, Expo token) and use them only through `withCredentials`. Never print them.
- Keep common steps (build, scan, deploy) in a **shared library** so the three apps do not copy-paste pipeline code.
- Back up the Jenkins home (or define it as code with Configuration as Code) so a lost controller is not a lost pipeline.

**On every pull request:**
1. Check out code; cache Maven and pnpm directories.
2. Backend: build and run unit tests, then integration tests with Testcontainers (MySQL). The concurrent-booking, webhook-idempotency and tenant-isolation tests must be here.
3. Web and mobile: install, type-check, lint, unit tests.
4. Build the Docker images (no push) and scan them with Trivy.
5. Report the status back to the Git host and require it to pass before merge.

Pipeline skeleton for the API:

```groovy
pipeline {
  agent { kubernetes { yamlFile 'deploy/jenkins/agent-pod.yaml' } }
  environment {
    REGISTRY = 'registry.example.com/venue'
    IMAGE    = "${REGISTRY}/api:${env.GIT_COMMIT.take(8)}"
  }
  stages {
    stage('Test') {
      steps { container('maven') { sh './mvnw -B verify' } }
      post { always { junit '**/target/surefire-reports/*.xml' } }
    }
    stage('Build image') {
      steps { container('kaniko') {
        sh '''
          NOPUSH=true; [ "$BRANCH_NAME" = "main" ] && NOPUSH=false
          /kaniko/executor --context $WORKSPACE --dockerfile deploy/docker/api.Dockerfile \
            --destination $IMAGE --no-push=$NOPUSH
        '''
      } }
    }
    stage('Scan') {
      steps { container('trivy') { sh 'trivy image --exit-code 1 --severity HIGH,CRITICAL $IMAGE' } }
    }
    stage('Deploy staging') {
      when { branch 'main' }
      steps { container('kubectl') {
        withCredentials([file(credentialsId: 'k8s-staging', variable: 'KUBECONFIG')]) {
          sh '''
            kubectl apply -f deploy/k8s/overlays/staging/flyway-job.yaml
            kubectl wait --for=condition=complete job/flyway --timeout=180s
            kubectl set image deployment/api api=$IMAGE
            kubectl rollout status deployment/api --timeout=180s
          '''
        }
      } }
    }
    stage('Smoke test') {
      when { branch 'main' }
      steps { sh 'deploy/scripts/smoke.sh https://api-staging.example.com' }
    }
  }
  post { failure { echo 'Notify the team (email or chat webhook)' } }
}
```

This skeleton is a starting point; the exact container names, image build step and flags depend on your agent pod definition and registry.

What each branch and tag does:

**On merge to `main` (staging):**
1. Build and push images tagged with the commit SHA to the registry.
2. Update the staging image tag (Kustomize `edit set image`, or a commit to a deploy folder if you use GitOps).
3. Run the Flyway job, apply manifests, wait for the rollout (`kubectl rollout status`).
4. Run a smoke test against staging (health check, one login, one availability call).

**On a version tag like `v1.2.0` (production):**
1. Reuse the already-built, tested image (promote, do not rebuild).
2. Require manual approval with a Jenkins `input` step restricted to named approvers (the `submitter` option).
3. Same migration and rollout steps, with automatic rollback (`kubectl rollout undo`) if the rollout or smoke test fails.

**Mobile (separate Jenkinsfile):**
- Call EAS Build and EAS Submit from a Jenkins stage using an Expo token stored in Jenkins Credentials (`eas build --non-interactive`). Pull requests produce preview builds; version tags build store releases for Play Store and App Store. Use EAS Update for small JavaScript-only fixes. iOS builds run on Expo's cloud, so you do not need a Mac agent in Jenkins.

Authentication from Jenkins to the cluster: use a Kubernetes service account with a narrow role (deploy and rollout in one namespace) and store its token or kubeconfig in Jenkins Credentials, one per environment. Never use cluster-admin credentials in CI.

Optional later: move to GitOps with Argo CD (the cluster pulls from a Git repo) once you have more than one environment to manage.

### 14.7 Observability and operations

- Spring Boot Actuator plus Micrometer metrics, scraped by Prometheus, with Grafana dashboards (booking rate, payment failures, slot-taken errors, API latency).
- Logs in JSON to stdout, collected by Loki or your cloud's logging service. Include request id and tenant id.
- Error tracking with Sentry for API, web and mobile.
- Alerts: pod restarts, 5xx rate, failed webhook processing, expired-hold backlog, payment success rate drop.
- Managed MySQL with automated daily backups and point-in-time recovery; test a restore every month.

### 14.8 Practical advice

Kubernetes adds real operational work. For a solo developer, a managed cluster (for example GKE Autopilot, AWS EKS, or DigitalOcean Kubernetes) removes most of it. Start with one cluster and two namespaces (staging and production), a single Ingress, and managed MySQL. Skip service meshes, multi-cluster setups and Redis until you have a reason. The first goal is a pipeline that goes from a merged pull request to a safe staging deploy in a few minutes.

## 15. Decisions I need from you

1. Confirm the open questions in the requirements document (advance for pay-at-venue, guest booking, settlement model, tenant billing model).
2. Hosting choice (VPS, AWS, or similar) and budget, since it decides how I would set up backups and deployment.
3. Whether the staff app is a separate React Native app or a role inside the customer app.
4. Expo or bare React Native. I recommend Expo with a dev build.
