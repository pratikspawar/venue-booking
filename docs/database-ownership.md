# Database ownership and migrations

The active application backend is the Spring Boot services under `services/`. `apps/api` is retained as legacy reference code and is not part of the Docker or Kubernetes deployment.

The services use one MySQL schema. Flyway migrations are stored in `services/common-library/src/main/resources/db/migration` and are packaged with every service. Flyway's schema-history lock ensures only one service applies a pending migration when several start together. Hibernate validates mappings and does not change the schema.

| Table group | Owning service | Other service access |
|---|---|---|
| `users`, `otp_requests`, `tenants`, `tenant_members` | Auth | Booking and catalog use read-only identity/tenant references where needed |
| `venues`, `venue_hours`, `sports`, `resources`, `resource_blocks`, `pricing_rules`, `cancellation_policies`, `canteen_items` | Catalog | Booking reads catalog data for slot validation and price quotes |
| `bookings`, `booking_slots`, `play_sessions`, wallets, memberships, coupons, booking items | Booking | Payment reads booking identity and amount to validate orders; payment state changes return to Booking through the internal API |
| `payments`, `refunds`, `webhook_events` | Payment | Booking does not write payment records |
| `notifications`, `audit_log`, `reviews` | Platform schema; service ownership is assigned when their API modules are activated | No service should write another module's tables |

Changes must be additive or use a reviewed forward migration. Do not edit a migration after it has been applied. Existing databases without Flyway history are baselined at version 1, then receive later migrations. New empty databases execute the full migration sequence.
