# Missing Features and Required Changes

This document is the implementation backlog for taking the venue-booking platform from its current prototype state to a reliable MVP and then to production readiness.

## Current architecture summary

- **Backend:** Spring Boot microservices: API Gateway, Auth, Catalog, Booking, Payment, and a shared library.
- **Clients:** React/Vite admin web application and Expo/React Native customer mobile application.
- **Infrastructure:** Docker Compose is set up for local services. Kubernetes manifests currently describe an older single-API deployment and must be updated to match the microservices.
- **Data:** MySQL with tenant-scoped entities and booking-slot uniqueness intended to protect against double booking.

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
- Confirmed webhook retry and idempotency behaviour.
- Payment-failure and late-payment handling.
- Refund status tracking and customer notification.
- Reconciliation view for failed or unmatched payments.

**Required changes**

- Verify the Razorpay webhook signature before processing its payload.
- Keep a unique record for every provider event and safely return success for duplicate events.
- Confirm bookings only from the server-side webhook or permitted pay-at-venue policy.
- Store all money as paise and calculate refunds only on the server.

**Done when:** processing the same payment webhook repeatedly does not create duplicate payments, confirmations, or refunds.

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

### 5. Staff desk operations

- Complete walk-in creation, check-in, session start/stop, counter payment, and shift close against the backend.
- Persist live timer/session data; do not keep it only in the browser store.
- Add no-show handling and permission-controlled staff cancellation.
- Implement daily cash summary and staff-wise collection records.

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

The owner dashboard should provide useful decisions, not only a raw booking list.

**Required dashboard charts**

- Revenue by day, week, month, sport area, venue, and payment method.
- Booking count and GMV trend.
- Resource utilization percentage and free-versus-booked time.
- Peak-hour heat map by weekday and time.
- Cancellations, refunds, no-shows, and their value.
- Revenue split by online payment, cash, counter UPI, wallet, membership, and canteen.
- Canteen sales, stock value, and low-stock items.
- Staff-wise collections, discounts, refunds, and shift-close variance.
- Equipment rental income and equipment maintenance cost, when enabled.

**Required report actions**

- Select venue, sport area, resource, date range, and timezone.
- View summary cards, chart, and detailed transaction table together.
- Export CSV and PDF.
- Schedule a daily/weekly owner report by email or WhatsApp in a later phase.
- Restrict report visibility and export permissions by role.

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
