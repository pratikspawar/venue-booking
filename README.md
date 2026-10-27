# Venue Booking Platform (Multi-Tenant SaaS)

A cloud-ready multi-tenant SaaS platform tailored for gaming & sports lounges (PlayStation 5 consoles, snooker/pool, carrom, box turf, and tennis).

## Architecture Overview

```
.
├── apps/
│   ├── api/             # Legacy standalone backend; active backend lives in services/
│   ├── admin-web/       # React + Vite + TypeScript dashboard for Owners & Shift Staff
│   └── mobile/          # React Native customer slot booking app
├── services/            # Active Spring Boot microservices and API gateway
├── packages/
│   └── shared/          # Shared domain types, enums, and API interfaces
├── deploy/
│   ├── docker/          # Dockerfiles, docker-compose.yml, Nginx proxy configs
│   └── k8s/             # Kubernetes base manifests, overlays, and ingress
└── Jenkinsfile          # Multi-stage CI/CD pipeline (lint, test, build, scan, deploy)
```

## Tech Stack

| Component | Technology |
|---|---|
| **Backend** | Spring Boot 3.3.4 (Java 21), Hibernate / JPA, Flyway, JWT |
| **Database** | MySQL 8.0 (UTC timestamps, paise integer currency, `uq_slot` unique index) |
| **Web Admin** | React 18, TypeScript, Vite, Modern CSS Design System, Lucide Icons |
| **Mobile App** | React Native, Expo SDK 51, React Navigation, TanStack Query |
| **DevOps** | Docker, Docker Compose, Kubernetes, Jenkins, Kaniko, Trivy |

## Database & Concurrency Model

* **Double Booking Prevention**: Enforced at the database level by the `booking_slots` table:
  ```sql
  UNIQUE KEY uq_slot (resource_id, slot_start)
  ```
  Any concurrent booking collisions trigger a `DataIntegrityViolationException`, which the backend maps to HTTP `409 Conflict` (`SLOT_TAKEN`).
* **Multi-tenancy**: Handled via `tenant_id` on all tenant-scoped tables with a request-scoped `TenantContext`.
* **State Machine**: `HELD` (8 min hold) $\rightarrow$ `CONFIRMED` $\rightarrow$ `IN_PROGRESS` (live session timer) $\rightarrow$ `COMPLETED`.

## Quickstart

### 1. Run via Docker Compose

```bash
cd deploy/docker
Copy-Item .env.example .env
# Set unique local secrets in .env before starting
docker compose up --build
```
* **MySQL 8**: `localhost:3306` (Database: `venue_booking`; bound to loopback)
* **API Gateway**: `http://localhost:8080/api/v1`
* **Admin Web Portal**: `http://localhost:3000`

Compose starts the active gateway, auth, catalog, booking, and payment services. The backend containers are private to the Compose network. Flyway migrations run from the shared service migration resources; `apps/api` is retained as legacy code and is not started by Compose.

### 2. Mobile app

The customer app uses live API data and requires the backend to be running. Set `API_BASE_URL` in `apps/mobile/src/services/api.ts` for the target device (Android emulator uses `http://10.0.2.2:8080/api/v1`; a physical phone needs the development machine's LAN address). Razorpay checkout uses the native `react-native-razorpay` module, so use an Expo development build/prebuild rather than Expo Go. Configure Razorpay test credentials and webhook secret in the local Compose `.env` for online payments; pay-at-venue remains available when enabled by the venue.

### 3. Local Manual Development

#### Microservices Backend Stack (Java 21 / Spring Boot 3)
```bash
cd services
# Build shared common-library and all microservices
mvn clean install

# Or start services directly via Docker Compose or individual Spring Boot runners:
# docker compose -f deploy/docker/docker-compose.yml up --build
```

#### Admin Web Panel
```bash
cd apps/admin-web
npm install
npm run dev
# Running on http://localhost:5173
```
