# ARCHIVED & RETIRED — Legacy Monolithic Backend (`apps/api`)

> [!WARNING]
> **This module (`apps/api`) is retired and archived.**
> It is retained solely for legacy code reference. Do not use, run, or deploy `apps/api`.

---

## Active Source of Truth

The active, production-grade venue booking backend is built as high-performance Spring Boot microservices under [`services/`](file:///d:/PlayStation/services):

1. **`services/common-library`** — Multi-tenant Flyway database migrations (V1 to V7), security filters, exceptions, and DTOs.
2. **`services/api-gateway`** (`:8080`) — Spring Cloud Gateway with JWT authentication, global rate limiting, and token revocation blacklist filters.
3. **`services/auth-service`** (`:8081`) — Multi-tenant authentication, staff RBAC, SMS verification webhook engine, and Super-Admin fleet governance.
4. **`services/catalog-service`** (`:8082`) — Venues, dynamic pricing rules, courts, sports, and canteen inventory stock ledger with low-stock alerts.
5. **`services/booking-service`** (`:8083`) — 24-hour slot schedule matrix, holds, push notification reminders, no-show auto-release, promotional coupons, prepaid hour packages, VIP memberships, and peak-hour heatmaps.
6. **`services/payment-service`** (`:8084`) — Razorpay payment orders, webhook verification, wallet top-ups, and automated merchant splits.

---

## Running the Platform

To build and run the backend, navigate to [`services/`](file:///d:/PlayStation/services):

```bash
cd services
mvn clean install
```

Or run using Docker Compose:

```bash
docker compose -f deploy/docker/docker-compose.yml up --build
```
