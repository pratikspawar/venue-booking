# Current Features and Project Structure

This document describes what is currently present in the repository. It is an implementation inventory, not a list of planned features.

## Project purpose

Venue Booking Platform is a multi-tenant SaaS application for gaming and sports venues. It supports resources such as PlayStation consoles, pool/snooker tables, carrom boards, turf grounds, tennis courts, badminton courts, and similar bookable facilities.

The intended user roles are:

- **Customer:** discover venues, view availability, book slots, and manage bookings.
- **Staff:** run the venue desk, create walk-ins, manage sessions, collect payments, and add canteen items.
- **Owner:** configure venues, resources, sports, prices, staff, reports, and policies.
- **Super admin:** manage tenants and platform-level settings. This role is planned but does not yet have a dedicated completed UI.

## Repository layout

```text
PlayStation/
├─ apps/
│  ├─ admin-web/                 React + Vite web dashboard
│  ├─ mobile/                    Expo + React Native customer application
│  └─ api/                       Older standalone Spring Boot API (still present)
├─ services/                     Active Spring Boot microservice backend
│  ├─ api-gateway/               Public API entry point and request routing
│  ├─ auth-service/              OTP, users, tenants, members, JWT
│  ├─ catalog-service/           Venues, sports, resources, pricing, canteen catalog
│  ├─ booking-service/           Availability, holds, bookings, sessions, wallet, reports
│  ├─ payment-service/           Payment orders, Razorpay webhooks, refunds
│  └─ common-library/            Shared backend context, errors, correlation ID helpers
├─ packages/
│  └─ shared/                    Shared TypeScript types and enums
├─ deploy/
│  ├─ docker/                    Dockerfiles, Nginx configuration, Docker Compose
│  ├─ jenkins/                   Jenkins agent-pod configuration
│  ├─ k8s/                       Kubernetes base manifests
│  └─ scripts/                   Smoke-test script
├─ README.md
├─ venue-booking-requirements.md
├─ venue-booking-technical-design.md
├─ CURRENT_FEATURES_AND_PROJECT_STRUCTURE.md
└─ MISSING_FEATURES_AND_REQUIRED_CHANGES.md
```

## Important architecture note

Two backend approaches exist in the repository:

1. `apps/api` is an older standalone Spring Boot API.
2. `services/` is the newer microservice backend used by the current Docker Compose setup.

The active local architecture is the microservice version. The older `apps/api` and current Kubernetes manifests should be reviewed and either aligned with the microservices or explicitly retired, so there is one clear production source of truth.

## Backend services

### API Gateway (`services/api-gateway`)

Current responsibilities:

- Listens on port `8080`.
- Routes `/api/v1/auth/**` and `/api/v1/me/**` to Auth Service.
- Routes venue, sport, and owner catalog endpoints to Catalog Service.
- Routes resources, bookings, and staff endpoints to Booking Service.
- Routes payments and Razorpay webhooks to Payment Service.
- Validates JWTs at the edge.
- Exposes Spring Boot health, info, and metrics endpoints.

### Auth Service (`services/auth-service`)

Current responsibilities:

- OTP request and verification flow.
- User records and profile updates.
- Tenant and tenant-member records.
- Owner, manager, and staff membership roles.
- JWT issuance and validation support.
- Mock SMS service for development.

### Catalog Service (`services/catalog-service`)

Current responsibilities:

- Venue management.
- Venue operating hours.
- Sports catalog.
- Venue resources, including capacity, slot duration, billing mode, and status.
- Resource blocks for maintenance or private events.
- Pricing rules.
- Cancellation policies.
- Canteen item catalog.
- Public catalog and owner catalog controller endpoints.

### Booking Service (`services/booking-service`)

Current responsibilities:

- Slot availability lookup.
- Booking creation and temporary holds.
- Booking-slot records with a unique slot constraint intended to prevent double booking.
- Hold-expiry scheduled job.
- Booking cancellation logic.
- Staff desk operations and live play sessions.
- Wallet, wallet transaction, membership, coupon, booking item, and report domain models/services.

### Payment Service (`services/payment-service`)

Current responsibilities:

- Payment order creation.
- Razorpay webhook endpoint.
- Razorpay signature validation helper.
- Payment records.
- Refund requests and refund records.
- Webhook event persistence for idempotency.

### Common Library (`services/common-library`)

Current shared functionality:

- Tenant context.
- Common API and error response models.
- Global exception handler.
- Business exception type.
- Correlation-ID logging filter.

## Current admin web application

Location: `apps/admin-web`

Technology:

- React 18
- TypeScript
- Vite
- Zustand
- Lucide icons

Current UI modules:

- Main application shell with header and sidebar.
- Live desk screen for active resources/sessions.
- Walk-in booking modal.
- Session timer card.
- Settlement/payment modal.
- Shift-summary modal.
- Canteen item modal.
- Booking ledger.
- Refund-policy modal.
- Resource catalog and add-resource modal.
- Sports management and add-sport modal.
- Reports dashboard and CSV export fallback.
- API service that communicates with the API gateway.

Current state approach:

- A Zustand store holds active tab, filters, modal state, resource sessions, booking data, canteen data, timers, and report date range.
- The store includes initial/demo data and invokes API calls for selected actions.
- The UI remains partly prototype-driven because calls can fail while local state still changes.

## Current mobile application

Location: `apps/mobile`

Technology:

- Expo SDK 51
- React Native
- React Navigation
- Zustand
- Axios
- TanStack Query dependency is installed
- i18next dependencies are installed

Current UI modules:

- Explore screen.
- My Bookings screen.
- Profile screen.
- OTP authentication modal.
- Venue card and sport filter pills.
- Slot matrix.
- Checkout modal.
- Booking ticket card.
- Mobile API service.

Current user flows represented in the UI:

- Browse sports and venues.
- Select a venue and resource.
- Request slot availability.
- Select available slots.
- Create a local booking representation for online or pay-at-venue payment.
- View and locally cancel bookings.
- OTP verification flow.
- Change language preference.

The mobile application currently contains sample user, booking, and sports data. TanStack Query and i18n packages are present but are not yet the primary server-state and translation implementation.

## Shared TypeScript package

Location: `packages/shared`

Current contents:

- Shared TypeScript enums.
- Shared TypeScript domain types.
- Package entry point exports.

This package should eventually also contain generated API types or be complemented by a dedicated typed API-client package.

## Current database and service connectivity

### Database

- Local development uses one MySQL 8 database named `venue_booking`.
- Auth, catalog, booking, and payment services connect to that database.
- Tenant-owned records are designed to include a tenant identifier.
- Booking-slot entities use a unique constraint intended to prevent a resource from being booked twice for the same slot.
- Services currently use Hibernate schema updates; production Flyway migrations are not yet present.

### Service communication

```text
Admin web / Mobile app
  -> API Gateway :8080
  -> Auth Service :8081
  -> Catalog Service :8082
  -> Booking Service :8083
  -> Payment Service :8084
  -> MySQL :3306
```

The gateway routes HTTP requests to individual services using configured hostnames and ports. Docker Compose provides these hostnames locally. There is not yet a production service-discovery, multi-replica load-balancing, or asynchronous-worker implementation.

## Local deployment and development

Location: `deploy/docker`

Docker Compose currently starts:

- MySQL 8
- API Gateway (`8080`)
- Auth Service (`8081`)
- Catalog Service (`8082`)
- Booking Service (`8083`)
- Payment Service (`8084`)
- Admin web application (`3000`)

The gateway is the intended public API endpoint for local clients:

```text
http://localhost:8080/api/v1
```

The admin web application is exposed locally at:

```text
http://localhost:3000
```

### Docker Compose connectivity

All containers are started by `deploy/docker/docker-compose.yml` on the Compose network. Containers address each other by service name, not by `localhost`.

```text
Browser / mobile emulator
  -> http://localhost:3000                 Admin web
  -> http://localhost:8080/api/v1          API Gateway

API Gateway
  -> http://auth-service:8081
  -> http://catalog-service:8082
  -> http://booking-service:8083
  -> http://payment-service:8084

Backend services
  -> mysql:3306 / venue_booking
```

The gateway receives service host and port values through environment variables such as `AUTH_SERVICE_HOST` and `BOOKING_SERVICE_HOST`. Backend services receive database connection values through `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`.

Docker Compose is intended for local development only. Its current credentials and JWT secret are development values and must not be deployed to staging or production.

### Jenkins connectivity

The repository contains a root `Jenkinsfile`, a Jenkins Kubernetes-agent definition at `deploy/jenkins/agent-pod.yaml`, and a smoke-test script at `deploy/scripts/smoke-test.sh`.

The intended CI/CD connection is:

```text
Git push / pull request
  -> Jenkins
  -> build and test services and web app
  -> build container images
  -> container registry
  -> Kubernetes staging or production cluster
  -> smoke test through public ingress URL
```

Jenkins should receive registry credentials, Kubernetes access, and provider tokens from its credential store. It should use a namespace-scoped Kubernetes service account, not cluster-admin access.

## Kubernetes and deployment status

Existing Kubernetes files include:

- A `venue-api` deployment with two replicas.
- A ClusterIP service for that deployment.
- An Nginx ingress with TLS configuration for API and admin domains.

These manifests target the older standalone API image rather than the active microservices. They are useful as a starting point but do not yet deploy the gateway, auth, catalog, booking, payment, and admin applications individually.

### Target Kubernetes connectivity

```text
Internet
  -> DNS
  -> Ingress controller / TLS certificate
  -> Gateway Service
  -> Gateway pods
  -> Auth, Catalog, Booking, Payment Kubernetes Services
  -> Service pods
  -> Managed MySQL on private network
```

Each microservice needs its own Kubernetes `Deployment` and internal `ClusterIP Service`. The gateway should use Kubernetes Service DNS, for example `http://auth-service:8081`, so Kubernetes balances requests across available service replicas. Only the gateway and admin web should be reachable from the public ingress; MySQL and internal services should remain private.

## Existing strengths

- Clear domain service separation in the active backend.
- Database-level unique booking-slot design for concurrency protection.
- Gateway-based public API boundary.
- Docker-based local environment containing all major backend services.
- Admin and mobile UI component separation by feature.
- Core domain models for bookings, payment/refunds, catalog, sessions, wallets, memberships, coupons, and canteen items.
- Basic health endpoints, correlation IDs, and Kubernetes ingress/probe scaffolding.

## Current prototype limitations

- Some interfaces and stores use mock data.
- UI and backend contracts are not yet consistently shared/generated.
- Kubernetes configuration is not synchronized with the microservice setup.
- No complete test suite is currently present for the critical business flows.
- Migration, observability, secrets, scaling, and notification systems need production hardening.

For the remediation plan and feature backlog, see [MISSING_FEATURES_AND_REQUIRED_CHANGES.md](MISSING_FEATURES_AND_REQUIRED_CHANGES.md).
