# Venue Booking Platform (Multi-Tenant SaaS)

A cloud-ready multi-tenant SaaS platform tailored for gaming & sports lounges (PlayStation 5 consoles, snooker/pool, carrom, box turf, and tennis).

## Architecture Overview

```
.
├── apps/
│   ├── api/             # Spring Boot 3 modular monolith (Java 21, MySQL 8, JPA, Flyway)
│   ├── admin-web/       # React + Vite + TypeScript dashboard for Owners & Shift Staff
│   └── mobile/          # React Native (Expo) customer slot booking & wallet app
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
docker-compose up --build
```
* **MySQL 8**: `localhost:3306` (Database: `venue_booking`)
* **Spring Boot API**: `http://localhost:8080/api/v1`
* **Admin Web Portal**: `http://localhost:3000`

### 2. Local Manual Development

#### Backend API
```bash
cd apps/api
# Uses Java 21
mvn spring-boot:run
```

#### Admin Web Panel
```bash
cd apps/admin-web
npm install
npm run dev
# Running on http://localhost:5173
```
