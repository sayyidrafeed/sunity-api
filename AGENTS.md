# Agent Instructions — sunity-api

This document is the **single source of truth** for coding standards, architecture conventions,
and workflows in this repository. All AI agents (Claude Code, Gemini Code Assist, Codex, etc.)
and human contributors MUST follow these instructions. `docs/engineering-guide.md` walks through
the same conventions as a ticket-by-ticket tutorial.

---

## Stack

| Layer             | Technology                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------- |
| Runtime           | Bun 1.1+ for local dev (`src/server.ts`), Cloudflare Workers in production (`src/worker.ts`) |
| Language          | TypeScript 6+ in ESM mode (`module: NodeNext`)                                               |
| Web framework     | Express 5                                                                                    |
| Database ORM      | Drizzle ORM + PostgreSQL (via `postgres` / postgres.js)                                      |
| Authentication    | Better Auth (Google OAuth)                                                                   |
| Validation        | Zod + `drizzle-zod`                                                                          |
| OpenAPI spec      | `@asteasolutions/zod-to-openapi` + Better Auth `openAPI()` plugin                            |
| API docs UI       | `@scalar/express-api-reference` (served at `/docs`, backed by `/openapi.json`)               |
| File storage      | Cloudflare R2 via `@aws-sdk/client-s3` presigned URLs                                        |
| Payments          | Midtrans Snap (`midtrans-client`)                                                            |
| FE SDK generation | `@hey-api/openapi-ts` — configured and run in the **frontend repo** (not installed here)     |
| Environment       | `dotenv` + Zod validated at startup in `src/env.ts`                                          |
| Formatter         | `oxfmt`                                                                                      |
| Linter            | `oxlint` (`correctness` category set to `error`)                                             |
| Type checker      | `tsgo --noEmit`                                                                              |
| Test runner       | `bun test`                                                                                   |
| CI                | `lint`, `format:check`, `check` in parallel, then `build` (`.github/workflows/ci.yml`)       |

---

## Architecture: Modular Monolith

The project uses a **modular monolith** — feature code is self-contained in vertical slices
(modules) rather than split by horizontal layer. Each module owns its own schema, service,
handlers, routes, and tests.

### Project Structure

```
src/
├── server.ts                  # Bun/Node entry point — app.listen(env.port)
├── worker.ts                  # Cloudflare Workers entry point (cloudflare:node httpServerHandler)
├── app.ts                     # Express app: CORS, auth handler, unified OpenAPI, route mounting
├── auth.ts                    # Better Auth config (Google provider, cookies, session)
├── env.ts                     # Environment variable validation (fail-fast on missing vars)
├── types/
│   ├── express.d.ts           # Global Request augmentation (session, validatedBody, etc.)
│   └── bun-test.d.ts          # Type declarations for bun:test
├── db/
│   ├── client.ts              # Drizzle client (postgres.js, prepare: false)
│   └── schema/
│       ├── auth-schema.ts     # Better Auth tables (users, sessions, accounts, verification)
│       ├── enums.schema.ts    # Native PostgreSQL enums
│       ├── *.schema.ts        # Domain-split table definitions
│       └── index.ts           # Re-exports all tables
├── lib/                       # Shared kernel — no business logic
│   ├── errors.ts              # DomainError base + NotFound/Validation/Forbidden/Conflict errors
│   ├── openapi.ts             # OpenAPIRegistry singleton, generateOpenAPIDocument(), mergeOpenAPIDocuments()
│   ├── schemas.ts             # Shared Zod schemas (errorSchema) + extendZodWithOpenApi
│   ├── validate.ts            # validateBody / validateQuery / validateParams factories
│   └── db-seed.ts             # Upsert helpers used by the seed script
├── middleware/                # Global Express middleware
│   ├── auth.middleware.ts     # requireSession, requirePermission(resource, actions)
│   └── error.middleware.ts    # Global error handler (DomainError → status, else 500)
├── scripts/                   # Seed script (index.ts) + *.data.ts fixtures
└── modules/                   # Feature verticals
    └── [module]/
        ├── [name].schema.ts   # Zod schemas with .openapi() metadata
        ├── [name].service.ts  # Pure business logic, domain errors
        ├── [name].handlers.ts # Thin HTTP glue (req → service → res)
        ├── [name].routes.ts   # Express Router + registry.registerPath()
        ├── [name].index.ts    # Re-exports router for mounting in app.ts
        └── __tests__/         # Co-located tests
```

Current modules: `activity-logs`, `admin-uploads`, `assets`, `campaigns`, `dashboard`,
`donations`, `energy`, `expenses`, `worship-places`.

> `donations` (Midtrans checkout + webhook) has routes and tests but `donationsRouter` is not
> mounted in `src/app.ts` yet, so its endpoints are not served and not in `/openapi.json`.

### Module File Roles

| File                 | Responsibility                                                   |
| -------------------- | ---------------------------------------------------------------- |
| `[name].schema.ts`   | Zod schemas derived from Drizzle + `.openapi()` metadata         |
| `[name].service.ts`  | Pure business logic, throws domain errors                        |
| `[name].handlers.ts` | Thin HTTP glue — extract input, call service, map HTTP           |
| `[name].routes.ts`   | Express Router with middleware chain + OpenAPI path registration |
| `[name].index.ts`    | Re-exports the router for mounting in `app.ts`                   |
| `__tests__/`         | Co-located tests for this module                                 |

### Admin / Public Route Split

When a module serves both authenticated and public routes, split the routers. `campaigns` is
the reference:

```
modules/campaigns/
├── campaigns.routes.ts          # Public (+ a few session-only routes)
├── admin-campaigns.routes.ts    # Admin (requireSession + requirePermission)
├── campaigns.handlers.ts
├── campaigns.service.ts
├── campaigns.mappers.ts         # DB rows → response DTOs
└── campaigns.index.ts           # Exports both routers
```

```typescript
// app.ts
app.use("/api/campaigns", campaignsRouter);
app.use("/api/admin/campaigns", adminCampaignsRouter);
```

Modules that are admin-only (`expenses`, `energy`, `activity-logs`, `admin-uploads`) are mounted
at `/api/admin` and declare full sub-paths such as `/campaigns/:id/expenses` in their router.

### OpenAPI / Scalar

- `GET /openapi.json` is the single public OpenAPI source for the backend.
- `app.ts` merges the app registry output with `auth.api.generateOpenAPISchema()` via
  `mergeOpenAPIDocuments()` and caches the result in memory.
- `/docs` serves Scalar from that unified document.
- Re-check the unified schema whenever Better Auth plugins or auth routes change.

### Sub-Modules (Complex Domains)

No module uses sub-modules yet. If a domain grows several related resources, nest them:

```
modules/[domain]/
├── [resource-a].{schema,service,handlers,routes,index}.ts
└── [resource-b]/
    └── [resource-b].{schema,service,handlers,routes,index}.ts
```

### Import Direction Rules

```
Module A  ──NEVER──►  Module B internals
Module A  ──OK─────►  Module B via [name].index.ts re-exports only
Module A  ──OK─────►  lib/*, db/*, middleware/*
```

Direct imports of `*.service.ts`, `*.handlers.ts`, etc. from another module are forbidden.

> Known exception: `campaigns`, `expenses`, and `energy` handlers import `logActivity` directly
> from `../activity-logs/activity-logs.service.js`. Do not add new cross-module imports like this;
> re-export from `activity-logs.index.ts` when the code is next touched.

---

## TypeScript Standards

### Request Augmentation

Extend `Express.Request` in `src/types/express.d.ts`. This is the **only** place where
request properties are declared. Never use `as` casts to pull data off `req` in handlers —
use the typed properties instead.

```typescript
// src/types/express.d.ts
import type { auth } from "../auth.js";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

declare global {
  namespace Express {
    interface Request {
      session?: Session;
      validatedBody?: unknown;
      validatedQuery?: unknown;
      validatedParams?: unknown;
    }
  }
}
```

Handlers cast from `unknown` to the specific schema type at the top of the function body:

```typescript
const body = req.validatedBody as z.infer<typeof createExpenseSchema>;
```

### Single Source of Truth (SSOT)

Every type must trace back to exactly one canonical definition. Never hand-write a type
that can be derived or inferred.

**Derivation chain:**

| What                       | Source of Truth                                                      | Derived Via                                                         |
| -------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Row types                  | Drizzle table definition                                             | `typeof table.$inferSelect` / `$inferInsert`                        |
| Zod schemas (response)     | Drizzle table                                                        | `createSelectSchema(table).pick().extend()`                         |
| Zod schemas (request body) | Hand-written Zod (HTTP boundary)                                     | —                                                                   |
| Service input types        | Zod request body schema                                              | `z.infer<typeof bodySchema> & { serverField: T }`                   |
| Enums / union types        | `as const` arrays in `enums.schema.ts` (e.g. `campaignStatusValues`) | `pgEnum(name, values)`, `z.enum(values)`, `(typeof values)[number]` |
| Shared schemas             | `src/lib/schemas.ts`                                                 | Import, never redeclare                                             |

```typescript
// Good: Row type derived from Drizzle
type WorshipPlace = typeof worshipPlaces.$inferSelect;

// Bad: Hand-written type that duplicates DB columns
interface WorshipPlace {
  id: string;
  name: string;
  city: string;
}
```

### Type Safety Rules

- **Never use `any`** — `.oxlintrc.json` only enables the `correctness` category, so this is
  enforced in review, not by the linter
- **Avoid non-null assertions (`!`)** — use optional chaining or guards
- **Avoid type assertions (`as`)** except for the single cast of `req.validatedBody/Query/Params`
- **Use `unknown`** when type is genuinely unknown, then narrow
- **Use `export type`** for type-only exports

---

## Testing & TDD

- Use `bun test` for all repository tests. `bun test` sets `NODE_ENV=test`, so `src/env.ts`
  loads `.env.test` instead of `.env`.
- Run a single file with `bun test src/modules/[module]/__tests__/[file].test.ts`.
- Follow TDD for features, bug fixes, and refactors:
  - write the failing test first
  - verify it fails for the right reason
  - implement the minimal code to pass
  - rerun the test before refactoring
- Keep tests co-located under `src/modules/[module]/__tests__/` (`energy` currently uses
  `__test__/`; use `__tests__/` for new folders). Shared-kernel tests live in
  `src/lib/__tests__/` and `src/middleware/__tests__/`.

---

## Express Patterns

### Router Pattern

Each module creates its own Express `Router`. No factory wrapper — `Router()` directly.
Mount it in `app.ts` via the module's `index.ts`.

```typescript
// modules/worship-places/worship-places.routes.ts
import { Router } from "express";
import { requirePermission, requireSession } from "../../middleware/auth.middleware.js";
import { validateQuery } from "../../lib/validate.js";
import { registry } from "../../lib/openapi.js";
import {
  listWorshipPlacesQuerySchema,
  worshipPlaceListResponseSchema,
} from "./worship-places.schema.js";
import * as handlers from "./worship-places.handlers.js";

export const worshipPlacesRouter = Router();

registry.registerPath({
  method: "get",
  path: "/admin/worship-places",
  tags: ["Admin Worship Places"],
  summary: "List worship places",
  security: [{ bearerAuth: [] }],
  request: { query: listWorshipPlacesQuerySchema },
  responses: {
    200: {
      description: "List of worship places",
      content: { "application/json": { schema: worshipPlaceListResponseSchema } },
    },
  },
});

worshipPlacesRouter.get(
  "/",
  requireSession,
  requirePermission("admin", ["read", "write"]),
  validateQuery(listWorshipPlacesQuerySchema),
  handlers.getListWorshipPlaces,
);
```

OpenAPI paths are written without the `/api` prefix because the document declares
`servers: [{ url: "/api" }]`.

### Middleware Order (Enforced)

```
requireSession → requirePermission → validate* → handler
```

Flag any route that places validation before auth, or a handler before its middleware.

### CORS

`app.ts` configures `cors()` with `origin: env.frontendUrls`, `credentials: true`, and an explicit
`methods` list. When a route uses an HTTP method that is not in that list, add it there too, or
browsers will block the cross-origin request at preflight.

### Handler Pattern (Thin Glue)

Handlers extract validated input, call one service function, and map the result to an HTTP
response. If a handler exceeds ~15 lines of logic, move the logic to the service.

Use **explicit `try/catch`** — not `.catch()` chaining. Forward errors with `next(error)`; the
global handler turns any `DomainError` into its status code and `{ error: { code, message } }`.
Catch a specific error in the handler only when it needs a different response.

```typescript
// Good: Thin handler with explicit try/catch
export async function getListWorshipPlaces(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.validatedQuery as z.infer<typeof listWorshipPlacesQuerySchema>;
    const result = await service.listWorshipPlaces(query);
    res.json({
      data: result.data,
      pagination: { page: result.page, limit: result.limit, total: result.total },
    });
  } catch (error) {
    next(error); // DomainError → mapped status, unknown → 500
  }
}

// Bad: Business logic in handler
export async function getListWorshipPlaces(req: Request, res: Response) {
  const rows = await db.select().from(worshipPlaces).where(ilike(worshipPlaces.name, req.query.q));
  // ...20+ more lines
}
```

Response shape conventions: single resources as `{ data }`, lists as `{ data, pagination }`.

### Validation Middleware

Three factory functions in `src/lib/validate.ts` — one per input location. Use all three
as appropriate; never parse `req.body`, `req.query`, or `req.params` manually inside handlers.

```typescript
// src/lib/validate.ts
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.flatten() });
      return;
    }
    req.validatedBody = result.data;
    next();
  };
}

// validateQuery and validateParams follow the same shape for req.query / req.params
```

| Middleware       | Use for                                           |
| ---------------- | ------------------------------------------------- |
| `validateBody`   | POST / PUT / PATCH request bodies                 |
| `validateQuery`  | GET list endpoints — pagination, filters, search  |
| `validateParams` | Route params — UUIDs, slugs, any `:param` segment |

### Anti-Patterns

| Don't                                     | Do                                           |
| ----------------------------------------- | -------------------------------------------- |
| `req.body` directly in handler            | `req.validatedBody` from `validateBody()`    |
| `req.query` / `req.params` directly       | `req.validatedQuery` / `req.validatedParams` |
| Business logic in handler (>15 lines)     | Move to service                              |
| `req` / `res` passed into services        | Pass primitives or DTOs only                 |
| `modules/A` imports `modules/B` internals | Import only via `modules/B/[name].index.ts`  |
| Manual error JSON in services             | Throw a `DomainError` subclass               |
| Magic number status codes                 | Named constants or inline comments           |
| `process.env.*` outside `src/env.ts`      | `import { env } from "../../env.js"`         |
| `.catch()` chaining in handlers           | Explicit `try/catch`                         |

---

## Service Layer

### Service Purity

Services take primitives or DTOs — **never** `req`, `res`, or Express `Request`. They
return data and throw domain errors. HTTP shape decisions live in handlers only.

```typescript
// Good: Pure service
export async function listWorshipPlaces(query: z.infer<typeof listWorshipPlacesQuerySchema>) {
  const { page, limit, search, city } = query;
  // ...query db, return { data, page, limit, total }
}

// Bad: Service coupled to Express
export async function listWorshipPlaces(req: Request, res: Response) {
  res.json(await db.select().from(worshipPlaces));
}
```

### Domain Errors

Services throw subclasses of the errors in `src/lib/errors.ts` (`NotFoundError` 404,
`ValidationError` 400, `ForbiddenError` 403, `ConflictError` 409). Each carries a user-facing
message and an error code.

```typescript
import { NotFoundError } from "../../lib/errors.js";

export class WorshipPlaceNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Worship place not found", "WORSHIP_PLACE_NOT_FOUND", id ? `id=${id}` : undefined);
  }
}
```

### Dependency Injection

Use default parameters for testable DI without a framework:

```typescript
// dashboard.service.ts
export async function getAdminDashboard(campaignId: string, drizzleDb = db) {
  // ...
}

// In tests: pass a stub in place of db
const result = await getAdminDashboard(campaignId, fakeDb);
```

---

## Zod Schema Conventions

### Derivation

Derive Zod schemas from Drizzle tables using `drizzle-zod`, then `.pick()` / `.omit()` /
`.extend()`. Never hand-write schemas that duplicate DB column definitions.

```typescript
// Good
import { createSelectSchema } from "drizzle-zod";
import { worshipPlaces } from "../../db/schema/index.js";

export const worshipPlaceSchema = createSelectSchema(worshipPlaces)
  .pick({ id: true, name: true, city: true })
  .openapi("WorshipPlace"); // registers to OpenAPI components/schemas

// Bad: Duplicates what Drizzle already knows
export const worshipPlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
});
```

### `.openapi()` Metadata

Add `.openapi()` to any schema that should appear in the OpenAPI spec. `src/lib/schemas.ts`
calls `extendZodWithOpenApi(z)`, so `.openapi()` is available on every Zod schema.

- **Named schemas** (reused in multiple responses) — `.openapi("ModelName")` registers to
  `components/schemas`
- **Field-level metadata** — `.openapi({ example: "value", description: "..." })`

### Shared Error Schema

Use the single shared `errorSchema` from `src/lib/schemas.ts`. It matches the body the global
error handler returns for a `DomainError`:

```typescript
// src/lib/schemas.ts
export const errorSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
  })
  .openapi("Error", {});
```

Never declare a local `errorSchema` per module.

---

## OpenAPI

### Registry — `src/lib/openapi.ts`

One central `OpenAPIRegistry` instance. Every module imports this singleton to register
its schemas and paths. `generateOpenAPIDocument()` builds the document once (OpenAPI 3.0.0,
`servers: [{ url: "/api" }]`), adds a `bearerAuth` security scheme, and caches it.
`mergeOpenAPIDocuments()` merges in the Better Auth document.

### Serving spec + docs — `src/app.ts`

```typescript
app.get("/openapi.json", async (_req, res, next) => {
  try {
    if (!cachedMergedOpenApi) {
      const appSchema = generateOpenAPIDocument();
      const authSchema = await auth.api.generateOpenAPISchema();
      cachedMergedOpenApi = mergeOpenAPIDocuments(appSchema, authSchema);
    }
    res.json(cachedMergedOpenApi);
  } catch (error) {
    next(error);
  }
});

app.use("/docs", apiReference({ pageTitle: "Sunity API Reference", url: "/openapi.json" }));
```

### Route registration

In each module's `[name].routes.ts`, call `registry.registerPath()` immediately before the
`router.*()` call for the same route. Both declarations must stay in sync. Admin routes add
`security: [{ bearerAuth: [] }]`.

### FE SDK generation (hey-api)

> **Note:** `@hey-api/openapi-ts` is a **frontend concern** — it is not installed in this repo.

The frontend repo (`sunity-web`) has its own `openapi-ts.config.ts` that reads this backend's
`/openapi.json` and writes the generated client to `src/lib/api/generated`. After changing a
route or schema here, regenerate the SDK from the frontend repo.

---

## Database (Drizzle ORM)

### Driver

- **Always use `postgres` (postgres.js)** with `prepare: false`
  - Required for CF Workers compatibility (no dynamic require issues)
  - Required for Bun compatibility
  - **Never use `pg` (node-postgres)** — incompatible with CF Workers runtime due to `pg-native` dynamic require ([drizzle-orm #5107](https://github.com/drizzle-team/drizzle-orm/issues/5107))
- Keep the Drizzle client in `src/db/client.ts`

```typescript
// src/db/client.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "../env.js";

// prepare: false required for edge/serverless environments (CF Workers, Bun)
const client = postgres(env.databaseUrl, { prepare: false });

export const db = drizzle({ client });
```

### Schema Location

- Domain-split files in `src/db/schema/`, re-exported via `src/db/schema/index.ts`
- Domain enums are native PostgreSQL enums in `src/db/schema/enums.schema.ts`; import the
  exported `*Values` arrays in Zod schemas instead of repeating the literals
- Flag any table definition outside `src/db/schema/`

### Migrations

- `drizzle.config.ts` reads `DATABASE_URL` from `.env` and writes migrations to `drizzle/`.
- Read `drizzle/MIGRATION_SAFETY.md` before writing a migration that changes column types or
  enums; it lists past risky migrations and the policy going forward.

### Query Patterns

```typescript
// Good: Selective column query
return db
  .select({ id: worshipPlaces.id, name: worshipPlaces.name })
  .from(worshipPlaces)
  .where(eq(worshipPlaces.city, city));

// Good: Null coalescing for single-row results
const [place] = await db
  .select({ id: worshipPlaces.id })
  .from(worshipPlaces)
  .where(eq(worshipPlaces.id, id));
return place ?? null;

// Good: Parallel reads
const [count, rows] = await Promise.all([countQuery, dataQuery]);

// Good: Atomic writes
await db.transaction(async (tx) => {
  await tx.insert(tableA).values(/* ... */);
  await tx.update(tableB).set(/* ... */).where(/* ... */);
});

// Good: Guard empty IN clauses and always order list queries
if (ids.length === 0) return [];
```

---

## Authentication & Authorization

### Better Auth Conventions

- Better Auth is mounted at `app.all("/api/auth/*splat", toNodeHandler(auth))`, **before**
  `express.json()`.
- The only sign-in method is Google (`socialProviders.google`); `GOOGLE_CLIENT_ID` and
  `GOOGLE_CLIENT_SECRET` are required by `src/env.ts`.
- Cookies use the `sunity` prefix, `sameSite: "none"`, `secure: true`, and cross-subdomain
  cookies, because the frontend and API live on different origins.
- Auth errors redirect to `${frontendUrls[0]}/admin/login` (`onAPIError.errorURL`).
- Session validation happens in `requireSession` middleware, not inside services.

### Cross-Origin Setup

`trustedOrigins` is `FRONTEND_URLS` (or `FRONTEND_URL`) + `BETTER_AUTH_URL` +
`BETTER_AUTH_EXTRA_TRUSTED_ORIGINS`. The frontend starts Google OAuth through Better Auth
(`/api/auth/sign-in/social` with `provider=google` and a frontend `callbackURL`). Better Auth
handles the full OAuth flow. No custom OAuth wrapper routes are needed on the backend.

### Middleware

```typescript
// middleware/auth.middleware.ts
export const requireSession = createRequireSession(); // 401 { error: "Unauthorized" } without a session

export function requirePermission(_resource: string, _actions: string[]) {
  // Today: allows the request only if the user's role list contains "admin", else 403.
  // The resource/actions arguments are reserved for a fuller RBAC check.
}
```

Call it as `requirePermission("admin", ["read", "write"])`, matching existing routes.
`createRequireSession(getSession)` exists so tests can inject a fake session getter.

---

## Environment Variables

All environment variables are validated at startup in `src/env.ts` (loads `.env`, or `.env.test`
when `NODE_ENV=test`). Fail fast if required vars are missing. Import the parsed `env` object;
its keys are camelCase (`env.databaseUrl`, `env.frontendUrls`).

```typescript
// Good
import { env } from "../../env.js";
const url = env.databaseUrl;

// Bad — anywhere outside src/env.ts
const url = process.env.DATABASE_URL;
```

### Key Variables

| Variable                            | Required | Description                                                       |
| ----------------------------------- | :------: | ----------------------------------------------------------------- |
| `DATABASE_URL`                      |   yes    | PostgreSQL connection string                                      |
| `BETTER_AUTH_URL`                   |   yes    | Backend base URL — used by Better Auth for callback construction  |
| `BETTER_AUTH_SECRET`                |   yes    | Secret used to sign sessions                                      |
| `FRONTEND_URLS`                     |  yes\*   | Comma-separated frontend origins (CORS + `trustedOrigins`)        |
| `FRONTEND_URL`                      |  yes\*   | Single frontend origin, used when `FRONTEND_URLS` is empty        |
| `BETTER_AUTH_EXTRA_TRUSTED_ORIGINS` |    no    | Extra comma-separated origins for Better Auth only                |
| `GOOGLE_CLIENT_ID`                  |   yes    | Google OAuth client ID                                            |
| `GOOGLE_CLIENT_SECRET`              |   yes    | Google OAuth client secret                                        |
| `NODE_ENV`                          |    no    | `"development" \| "production" \| "test"` (default `development`) |
| `PORT`                              |    no    | Port for `src/server.ts` (default `3000`)                         |
| `R2_ACCOUNT_ID`                     |    no    | Cloudflare account for R2 presigned uploads                       |
| `R2_ACCESS_KEY_ID`                  |    no    | R2 access key                                                     |
| `R2_SECRET_ACCESS_KEY`              |    no    | R2 secret key                                                     |
| `R2_BUCKET_NAME`                    |    no    | R2 bucket                                                         |
| `R2_CUSTOM_DOMAIN`                  |    no    | Public domain for uploaded files                                  |
| `MIDTRANS_SERVER_KEY`               |    no    | Midtrans server key (donations)                                   |
| `MIDTRANS_CLIENT_KEY`               |    no    | Midtrans client key (donations)                                   |

\* At least one of `FRONTEND_URLS` / `FRONTEND_URL` must be set.

Local Bun dev reads `.env` (`.env.example`); `wrangler dev` reads `.dev.vars`
(`.dev.vars.example`). Production non-secret vars live in `wrangler.jsonc` `vars`; secrets go
through `wrangler secret put <KEY>`.

---

## Error Handling

### Global Error Handler

Registered as the last middleware in `app.ts` (4-argument signature required by Express):

```typescript
// middleware/error.middleware.ts
export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof DomainError) {
    res.status(err.statusCode).json({ error: { code: err.errorCode, message: err.userMessage } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
}
```

### Pattern

1. Services throw `DomainError` subclasses (e.g., `WorshipPlaceNotFoundError`)
2. Handlers forward with `next(error)`; catch a specific error only when it needs a custom response
3. `DomainError` → its `statusCode`; anything else → 500

---

## Code Quality & Style

### File Size

- **Max 200 lines** per file (blank lines and comments excluded). This is a review rule; oxlint
  does not enforce it here.
- Split by responsibility if approaching limit

### Naming Conventions

| Element                    | Convention                        | Example                                             |
| -------------------------- | --------------------------------- | --------------------------------------------------- |
| Files                      | `kebab-case` with domain prefix   | `campaigns.service.ts`, `admin-campaigns.routes.ts` |
| Variables, functions       | `camelCase`                       | `listWorshipPlaces`, `getAdminDashboard`            |
| Types, interfaces, classes | `PascalCase`                      | `WorshipPlaceNotFoundError`, `AppOpenAPIDocument`   |
| Constants                  | `camelCase` or `UPPER_SNAKE_CASE` | `registry`, `DEFAULT_PAGE_SIZE`                     |
| Zod schemas                | `camelCase` + `Schema` suffix     | `createExpenseSchema`, `campaignIdParamSchema`      |
| Route handlers             | HTTP verb + Noun                  | `getListExpenses`, `postCreateExpense`              |

### Import Organization

```typescript
// 1. External packages
import { z } from "zod";
import { eq } from "drizzle-orm";
import { Router } from "express";

// 2. Internal shared
import { env } from "../../env.js";
import { db } from "../../db/client.js";
import { registry } from "../../lib/openapi.js";
import { requireSession } from "../../middleware/auth.middleware.js";

// 3. Module-local
import * as handlers from "./worship-places.handlers.js";
import { createWorshipPlaceSchema } from "./worship-places.schema.js";
```

- Use relative imports everywhere (no path alias is configured in `tsconfig.json`)
- Always include `.js` extension in ESM imports

---

## Common Workflows

### Add a new module

1. Create `src/modules/[name]/` directory
2. Create: `[name].schema.ts`, `[name].service.ts`, `[name].handlers.ts`,
   `[name].routes.ts`, `[name].index.ts`, `__tests__/`
3. Add `.openapi()` metadata to schemas; call `registry.registerPath()` in routes file
4. Mount the router in `src/app.ts` (an unmounted router is neither served nor documented)
5. Add DB table to `src/db/schema/` and re-export from `index.ts` if needed

### Add a new route to an existing module

1. Define Zod schemas in `[name].schema.ts` with `.openapi()` metadata
2. Write business logic in `[name].service.ts` (pure function, domain errors)
3. Write handler in `[name].handlers.ts` (thin glue, `try/catch`, <15 lines)
4. Register OpenAPI path and Express route in `[name].routes.ts`
5. Write tests in `__tests__/`
6. Regenerate the frontend SDK from the frontend repo

### Add or change a database table

1. Update/create schema file in `src/db/schema/`
2. Re-export from `src/db/schema/index.ts`
3. Run `bun run db:generate` and review the generated SQL (see `drizzle/MIGRATION_SAFETY.md`)
4. Run `bun run db:migrate`
5. Update any service/schema code that depends on the table
6. Update `src/scripts/*.data.ts` if seed data depends on the table

---

## Bun Command Reference

| Task                       | Command                |
| -------------------------- | ---------------------- |
| Install dependencies       | `bun install`          |
| Dev server (Bun, hot)      | `bun run dev`          |
| Dev server (Wrangler)      | `bun run dev:worker`   |
| Type check                 | `bun run check`        |
| Build (`tsc` → `dist/`)    | `bun run build`        |
| Start built output         | `bun run start`        |
| Deploy to Workers          | `bun run deploy`       |
| Format + lint              | `bun run fl`           |
| Format                     | `bun run format`       |
| Format check               | `bun run format:check` |
| Lint only                  | `bun run lint`         |
| Lint fix                   | `bun run lint:fix`     |
| Generate DB migration      | `bun run db:generate`  |
| Apply DB migration         | `bun run db:migrate`   |
| Seed database (idempotent) | `bun run db:seed`      |
| Tests                      | `bun test`             |

The pre-commit hook (`.husky/pre-commit`) runs `bun run format:check` and `bun run check`.

---

## Code Review Checklist

- [ ] Module structure follows `[name].{schema,service,handlers,routes,index}.ts` convention
- [ ] New router is mounted in `src/app.ts`
- [ ] No cross-module imports bypassing `index.ts`
- [ ] Services take primitives/DTOs — no `req`/`res` inside services
- [ ] Handlers are thin (<15 lines of logic), use `try/catch`, forward errors via `next(error)`
- [ ] Middleware order: `requireSession` → `requirePermission` → `validate*` → handler
- [ ] `validateBody` / `validateQuery` / `validateParams` used — no raw `req.body/query/params`
- [ ] `req.validatedBody/Query/Params` cast to schema type at top of handler (single `as` cast only)
- [ ] Schemas derived from Drizzle via `drizzle-zod` (no hand-written DB types)
- [ ] `.openapi()` metadata present on schemas; `registry.registerPath()` called in routes file
- [ ] Domain errors extend a class from `src/lib/errors.ts`
- [ ] No `any` types or `@ts-ignore` (except the documented one in `src/worker.ts`)
- [ ] No `process.env` access outside `src/env.ts`
- [ ] HTTP method is in the `cors()` `methods` list in `src/app.ts`
- [ ] File stays under 200 lines
- [ ] Tests exist for new service functions
- [ ] No unused variables or imports
- [ ] ESM imports include `.js` extension

---

## Skill References

Consult these skill files when working in their respective areas:

| Skill                              | Location                                                   | When to Use                      |
| ---------------------------------- | ---------------------------------------------------------- | -------------------------------- |
| Drizzle ORM best practices         | `.agents/skills/drizzle-best-practices/SKILL.md`           | Queries, schema, migrations      |
| Supabase/PostgreSQL best practices | `.agents/skills/supabase-postgres-best-practices/SKILL.md` | Indexes, RLS, performance        |
| Better Auth patterns               | `.agents/skills/better-auth-best-practices/SKILL.md`       | Auth flows, session config, RBAC |
| Test-driven development            | `.agents/skills/test-driven-development/SKILL.md`          | Writing tests, TDD workflow      |

---

## General Working Rules

- Keep changes minimal and focused on the user request
- Preserve module boundaries and import direction rules
- Do not introduce abstractions unless they clearly reduce duplication
- Prefer updating existing code over creating new helper layers
- Do not use destructive git commands
- Favor clarity over cleverness
- If a change affects public behavior or setup, update README in the same pass
