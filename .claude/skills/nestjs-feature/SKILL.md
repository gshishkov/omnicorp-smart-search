---
name: nestjs-feature
description: Add or change a feature in the NestJS API (backend/) — module, controller, service, DTOs, tests. Use for any backend endpoint, service, or integration work.
---

# NestJS feature

Structure per feature in `backend/src/<feature>/`:

```
<feature>.module.ts
<feature>.controller.ts      # HTTP only: routing, DTO in/out, no business logic
<feature>.service.ts         # business logic, injectable, unit-tested
dto/<action>-<feature>.dto.ts
<feature>.service.spec.ts
<feature>.controller.spec.ts
```

Rules:
- Validate input with `class-validator` DTOs (global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true, transform: true`), or zod schemas from `docs/api.md` (mirrored in `frontend/src/types/api.ts`) — this project uses class-validator.
- Response/request types shared with the web app live in `docs/api.md` (mirrored in `frontend/src/types/api.ts`).
- Config via `@nestjs/config` with a validated schema; never read `process.env` inside services.
- Depend on interfaces/injection tokens for external systems (AI, search, DB) so they can be mocked.
- Throw Nest HTTP exceptions (`NotFoundException`, etc.) from services only for domain-level errors; map unknown errors in a global filter.
- Add OpenAPI decorators (`@nestjs/swagger`) on controllers and DTOs.
- Tests: unit-test services with mocked providers (`Test.createTestingModule`); e2e tests in `backend/test/` with supertest for each new endpoint.

Done = `cd backend && npm run lint && npm run typecheck && npm test && npm run test:e2e` pass.
