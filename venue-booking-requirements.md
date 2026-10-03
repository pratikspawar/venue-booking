# Venue Booking Platform: Requirements

Version 0.1 (draft), 3 Oct 2026

## 1. Overview

A multi-tenant SaaS platform for indoor and outdoor game venues: pool, carrom, PlayStation, turf, tennis and similar. Each venue owner is a tenant. Customers find and book slots, staff run the day-to-day desk, and owners manage resources, pricing and reports. The platform owner (super admin) onboards tenants and manages subscriptions.

Build constraints: solo developer, MVP in 2-3 months. Stack: Spring Boot, React (web panels), React Native (mobile), MySQL, Firebase for push.

## 2. Confirmed decisions

| Topic | Decision |
|---|---|
| Business model | SaaS for many owners, each a separate tenant |
| Booking confirmation | Auto-confirmed when the slot is available, no staff approval |
| Payments | Online plus pay at venue |
| Pricing | Both fixed slots and actual time played |
| Languages | Multi-language (English, Marathi, Hindi to start) |
| Branding | Owner logo only (no custom colors or themes) |
| V1 scope | Booking and payment, reports, wallet/membership/coupons, canteen/inventory, plus standard features for this business |

## 3. Roles

- **Super admin:** platform owner. Manages tenants, subscription plans, platform settings.
- **Owner:** runs one or more venues. Configures resources, pricing, staff, offers. Sees reports.
- **Staff:** works at the venue desk. Handles walk-ins, sessions, payments, canteen.
- **Customer:** books slots, pays, manages wallet and bookings.

## 4. Multi-tenancy

- Shared database with a `tenant_id` on every tenant-owned table.
- Tenant resolved from the authenticated user's token; every query filtered by it.
- A tenant can have multiple venues (branches). Staff are assigned to specific venues.
- A customer account is global (one phone number), and can book at any tenant's venue. Wallet balance is per tenant.
- Tenant logo shown in the customer app and on invoices.

## 5. Functional requirements

### 5.1 Customer app (React Native, Android and iOS)

- Sign up and log in with mobile number and OTP.
- Browse venues, filter by sport, location and price.
- See live slot availability per resource and date.
- Book a slot; booking is confirmed automatically once payment succeeds (or pay-at-venue rules are met, see 5.6).
- Pay online by UPI, card or wallet; apply coupon.
- View upcoming and past bookings, cancel, reschedule within policy.
- Receive confirmation, reminder and cancellation notifications.
- Rate a venue after a visit.
- Wallet: add money, see transactions, pay from balance.
- View membership plans and buy one.
- Change app language.

**User stories**
- As a customer, I want to see which slots are free so that I can pick a time without calling the venue.
- As a customer, I want my booking confirmed instantly so that I don't have to wait for approval.
- As a customer, I want a reminder before my slot so that I don't miss it.
- As a customer, I want refunds to follow a clear policy so that I know what I get back if I cancel.

### 5.2 Staff panel (React Native app, or React web for desk use)

- See today's bookings by resource in a timeline view.
- Create a walk-in booking.
- Start and stop a session with a timer for time-based games.
- Mark a customer as arrived or no-show.
- Collect payment: cash, UPI at counter, or from wallet; record it against the booking.
- Add canteen items to a booking or session.
- Close the day: cash summary for the shift.
- Cancel or modify a booking within permissions the owner allows.

**User stories**
- As staff, I want to start a timer on a table so that billing is accurate when the customer leaves.
- As staff, I want to add a walk-in without a phone number so that I can serve people quickly.
- As staff, I want a shift cash summary so that I can reconcile at the end of the day.

### 5.3 Owner panel (React web)

- Onboarding: create venue, upload logo, set opening hours and holidays.
- Manage resources: add tables, grounds and games (name, sport, capacity, status).
- Configure slot length per resource and pricing (see 5.5).
- Manage staff: create accounts, assign venues, set roles and permissions.
- Define cancellation and refund policy, advance payment rules.
- Create coupons, membership plans and packages.
- Manage canteen items and stock.
- Reports: revenue, bookings, utilization, peak hours, cancellations, no-shows, canteen sales, staff-wise collection. Export to CSV or PDF.
- View and respond to customer reviews.
- Block a resource for maintenance or private events.

**User stories**
- As an owner, I want to add a new game and set its price so that it appears for customers immediately.
- As an owner, I want to see utilization by hour so that I can decide where to offer discounts.
- As an owner, I want to block a table for maintenance so that nobody can book it.

### 5.4 Super admin panel (React web)

- Create and suspend tenants.
- Define subscription plans (limits on venues, staff, resources) and track tenant billing.
- View platform-level metrics: tenants, bookings, GMV.
- Manage SMS and payment configuration, supported languages and default templates.
- Impersonate-for-support with a full audit trail.

### 5.5 Booking and pricing rules

- A resource has an opening schedule and a base slot length (30, 60 minutes, etc.).
- **Fixed-slot pricing:** price per slot, with peak/off-peak and weekday/weekend rates.
- **Time-played pricing:** per-minute or per-hour rate; billed from session start to stop, with a minimum charge and rounding rule (for example, round up to the nearest 5 minutes).
- A booking reserves a slot. For time-based games, the session may run over the slot: overtime is billed at the standard rate if the next slot is free, and staff are alerted if it clashes with the next booking.
- Double booking is prevented at the database level (unique constraint on resource, date and start time).
- A slot is held for 5 to 10 minutes while payment is in progress, then released automatically.
- Taxes (GST) configurable per tenant; invoice generated for each paid booking.

### 5.6 Payments

- Online via Razorpay (UPI, cards, netbanking, wallets). Webhooks confirm payment; the booking is only confirmed after a successful payment event.
- Pay at venue: allowed per owner setting. To limit no-shows, owners can require a small advance, or limit how many unpaid bookings a customer can hold.
- Refunds follow the owner's cancellation policy (full, partial, none by time window). Refunds go to the original method or to the wallet.
- Settlement: each owner's funds settle to their own bank account (Razorpay Route or similar); platform commission handled at settlement. To be confirmed with the payment provider.
- Wallet top-ups, membership purchases and canteen payments use the same payment layer.
- All payment events logged for reconciliation.

### 5.7 Wallet, membership and coupons

- Wallet balance per customer per tenant; top-up, spend, refund, with a transaction ledger.
- Membership plans: monthly pass, discount percentage, or prepaid hours.
- Coupons: percentage or fixed amount, validity dates, usage limits, minimum amount, applicable sports or time windows.
- Packages: for example, 10 hours at a bundled price.

### 5.8 Canteen and inventory

- Item catalog with price and stock count.
- Staff add items to a session or walk-in bill.
- Stock decreases on sale; low-stock alert for the owner.
- Canteen sales included in reports and daily cash close.

### 5.9 Notifications and messaging

- OTP by SMS for login (MSG91 or Twilio; DLT registration required in India).
- Push notifications (Firebase Cloud Messaging): booking confirmed, reminder, cancelled, refund processed, offers.
- SMS or WhatsApp fallback for booking confirmation and reminders.
- Message templates are translated per language.
- Owner-facing alerts: new booking, cancellation, low stock, daily summary.

### 5.10 Language support

- UI strings externalized and translated: English, Marathi, Hindi at launch.
- Customer picks a language; the choice is remembered.
- Notifications sent in the customer's language.
- Venue and resource names remain as entered by the owner.

## 6. Non-functional requirements

- **Security:** JWT with short-lived access tokens, role-based access control, tenant isolation tests, HTTPS everywhere, OTP rate limiting.
- **Concurrency:** two customers trying to book the same slot must never both succeed.
- **Performance:** slot availability loads in under 2 seconds on a mobile connection.
- **Availability:** daily database backups, health monitoring, error tracking.
- **Audit:** log refunds, price changes, cancellations, staff actions and impersonation.
- **Privacy:** store only needed personal data; payment card data is never stored by the platform.
- **Time zone:** all times stored in UTC, displayed in the venue's time zone (IST at launch).

## 7. Integrations

| Purpose | Suggested provider |
|---|---|
| Payments and refunds | Razorpay |
| OTP and SMS | MSG91 or Twilio |
| Push notifications | Firebase Cloud Messaging |
| WhatsApp (optional) | Meta WhatsApp Cloud API or a BSP |
| Maps and location | Google Maps |
| File storage (logos, invoices) | Firebase Storage or S3 |

## 8. Phasing

The full scope above is too large for one person in 2-3 months, so here is a suggested split.

**MVP (months 1-3)**
- OTP login, tenant and venue setup, resource management
- Slot engine, auto-confirmed booking, double-booking protection
- Razorpay payment, cancellation and refund, pay at venue
- Staff panel: timeline, walk-ins, session timer, collect payment
- Owner reports: revenue, bookings, utilization
- Push and SMS notifications
- English plus Marathi/Hindi string setup
- Tenant logo

**Phase 2**
- Wallet, membership, coupons, packages
- GST invoices and daily cash close
- Super admin subscription billing

**Phase 3**
- Canteen and inventory
- Reviews, tournaments and leaderboards
- WhatsApp notifications, multi-branch refinements

## 9. Open questions

1. Should pay-at-venue bookings be auto-confirmed with no advance, or require a small token amount? This affects no-show risk.
2. Can customers book without an account (guest) or is OTP login mandatory?
3. Does the owner need to take online payment settled to their own bank account from day one, or can you collect and pay out later in the MVP?
4. What is the tenant subscription model: flat monthly fee, per-venue, or commission per booking?
5. Are recurring bookings (same slot every week) needed?
6. Any need for an offline mode for staff when the internet is down?
7. Which regions or cities at launch? (This affects SMS, language and tax setup.)

## 10. Out of scope for now

- Custom colors or themes per owner (logo only)
- Customer-to-customer matchmaking or social features
- Hardware integrations (smart locks, light control, QR gate entry)
- Marketplace-style cross-venue search ranking and ads
