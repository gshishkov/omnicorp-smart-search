---
name: nestjs-feature
description: Add or change a feature in the NestJS API (apps/api) — module, controller, service, DTOs, tests. Use for any backend endpoint, service, or integration work.
---

# NestJS feature

Structure per feature in `apps/api/src/<feature>/`:

```
<feature>.module.ts
<feature>.controller.ts      # HTTP only: routing, DTO in/out, no business logic
<feature>.service.ts         # business logic, injectable, unit-tested
dto/<action>-<feature>.dto.ts
<feature>.service.spec.ts
<feature>.controller.spec.ts
```

Rules:
- Validate input with `class-validator` DTOs (global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true, transform: true`), or zod schemas from `packages/shared` via a zod pipe — pick one per ADR and stay consistent.
- Response/request types shared with the web app live in `packages/shared`.
- Config via `@nestjs/config` with a validated schema; never read `process.env` inside services.
- Depend on interfaces/injection tokens for external systems (AI, search, DB) so they can be mocked.
- Throw Nest HTTP exceptions (`NotFoundException`, etc.) from services only for domain-level errors; map unknown errors in a global filter.
- Add OpenAPI decorators (`@nestjs/swagger`) on controllers and DTOs.
- Tests: unit-test services with mocked providers (`Test.createTestingModule`); e2e tests in `apps/api/test/` with supertest for each new endpoint.

Done = `pnpm --filter api lint && pnpm --filter api typecheck && pnpm --filter api test` pass.
