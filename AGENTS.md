# Agent Instructions — sunity-api

This document is the **single source of truth** for coding standards, architecture conventions,
and workflows in this repository. All AI agents (Claude Code, Gemini Code Assist, Codex, etc.)
and human contributors MUST follow these instructions.

---

## Stack

| Layer             | Technology                                                                  |
| ----------------- | --------------------------------------------------------------------------- |
| Runtime           | Bun 1.1+ (primary), Node.js 20+ (compatibility)                             |
| Language          | TypeScript 6+ in ESM mode                                                   |
| Web framework     | Express 5                                                                   |
| Database ORM      | Drizzle ORM + PostgreSQL (via `postgres` / postgres.js)                     |
| Authentication    | Better Auth                                                                 |
| Validation        | Zod + `drizzle-zod`                                                         |
| OpenAPI spec      | `@asteasolutions/zod-to-openapi`                                            |
| API docs UI       | `@scalar/express-api-reference` (served at `/docs`)                         |
| FE SDK generation | `@hey-api/openapi-ts` — run from the **frontend repo** (not installed here) |
| Environment       | `dotenv` validated at startup in `src/env.ts`                               |
| Formatter         | `oxfmt` (80-char print width)                                               |
| Linter            | `oxlint` (strict rules)                                                     |
| Type checker      | `tsgo --noEmit`                                                             |
| CI sequence       | `bun run fl` → `bun run check` → `bun run build`                            |

---

## Architecture: Modular Monolith

The project uses a **modular monolith** — feature code is self-contained in vertical slices
(modules) rather than split by horizontal layer. Each module owns its own schema, service,
handlers, routes, and tests.

### Project Structure

```
src/
├── server.ts                  # Entry point — starts HTTP server
├── app.ts                     # Express app: CORS, auth handler, route mounting, error handler
├── auth.ts                    # Better Auth config (providers, hooks, RBAC)
├── env.ts                     # Environment variable validation (fail-fast on missing vars)
├── types/
│   └── express.d.ts           # Global Request augmentation (session, validatedBody, etc.)
├── db/
│   ├── index.ts               # Drizzle client (pg Pool)
│   └── schema/
│       ├── auth-schema.ts     # Better Auth generated tables
│       ├── *.schema.ts        # Domain-split table definitions
│       └── index.ts           # Re-exports all tables
├── lib/                       # Shared kernel — no business logic
│   ├── errors.ts              # Base AppError + common domain error classes
│   ├── openapi.ts             # OpenAPIRegistry singleton + generateOpenAPIDocument()
│   ├── pagination.ts          # Pagination Zod schemas + query helpers
│   ├── schemas.ts             # Shared Zod schemas (errorSchema, etc.)
│   └── validate.ts            # validateBody / validateQuery / validateParams factories
├── middleware/                # Global Express middleware
│   ├── auth.middleware.ts     # requireSession(), requirePermission(roles: string[])
│   └── error.middleware.ts    # Global error handler (500 fallback)
├── services/                  # Cross-module orchestration only
└── modules/                   # Feature verticals
    └── [module]/
        ├── [name].schema.ts   # Zod schemas with .openapi() metadata
        ├── [name].service.ts  # Pure business logic, domain errors
        ├── [name].handlers.ts # Thin HTTP glue (req → service → res)
        ├── [name].routes.ts   # Express Router + registry.registerPath()
        ├── [name].index.ts    # Re-exports router for mounting in app.ts
        └── __tests__/         # Co-located tests
```

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

When a module serves both authenticated and public routes, split them:

```
modules/achievements/
├── achievements.routes.ts            # Admin (requireSession + requirePermission)
├── public-achievements.routes.ts     # Public (no auth)
├── achievements.handlers.ts
├── public-achievements.handlers.ts
└── achievements.index.ts             # Exports both routers
```

```typescript
// app.ts
app.use("/api/admin/achievements", achievementsRouter);
app.use("/api/achievements", publicAchievementsRouter);
```

### Sub-Modules (Complex Domains)

Nest sub-modules for domains with multiple related resources:

```
modules/environmental/
├── oil-collections.{schema,service,handlers,routes,index}.ts
├── waste-collections/
│   └── waste-collections.{schema,service,handlers,routes,index}.ts
└── compost-activities/
    └── compost-activities.{schema,service,handlers,routes,index}.ts
```

### Import Direction Rules

```
Module A  ──NEVER──►  Module B internals
Module A  ──OK─────►  Module B via [name].index.ts re-exports only
Module A  ──OK─────►  lib/*, db/*, middleware/*, services/*
```

Direct imports of `*.service.ts`, `*.handlers.ts`, etc. from another module are forbidden.

---

## TypeScript Standards

### Request Augmentation

Extend `Express.Request` in `src/types/express.d.ts`. This is the **only** place where
request properties are declared. Never use `as` casts to pull data off `req` in handlers —
use the typed properties instead.

```typescript
// src/types/express.d.ts
import type { BetterAuthSession } from "better-auth";

declare global {
  namespace Express {
    interface Request {
      session?: BetterAuthSession;
      validatedBody?: unknown;
      validatedQuery?: unknown;
      validatedParams?: unknown;
    }
  }
}
```

Handlers cast from `unknown` to the specific schema type at the top of the function body:

```typescript
const body = req.validatedBody as z.infer<typeof approveUserBodySchema>;
```

### Single Source of Truth (SSOT)

Every type must trace back to exactly one canonical definition. Never hand-write a type
that can be derived or inferred.

**Derivation chain:**

| What                       | Source of Truth                  | Derived Via                                       |
| -------------------------- | -------------------------------- | ------------------------------------------------- |
| Row types                  | Drizzle table definition         | `typeof table.$inferSelect` / `$inferInsert`      |
| Zod schemas (response)     | Drizzle table                    | `createSelectSchema(table).pick().extend()`       |
| Zod schemas (request body) | Hand-written Zod (HTTP boundary) | —                                                 |
| Service input types        | Zod request body schema          | `z.infer<typeof bodySchema> & { serverField: T }` |
| Enums / union types        | `as const` arrays in schema file | `z.enum(values)`, `(typeof values)[number]`       |
| Shared schemas             | `src/lib/schemas.ts`             | Import, never redeclare                           |

```typescript
// Good: Row type derived from Drizzle
type User = typeof userTable.$inferSelect;

// Good: Service input derived from Zod schema
type ApproveUserInput = z.infer<typeof approveUserBodySchema> & {
  approvedBy: string;
};

// Bad: Hand-written type that duplicates DB columns
interface User {
  id: string;
  name: string;
  email: string;
}
```

### Type Safety Rules

- **Never use `any`** — enforced by oxlint `no-explicit-any: error`
- **Avoid non-null assertions (`!`)** — use optional chaining or guards
- **Avoid type assertions (`as`)** except for the single cast of `req.validatedBody/Query/Params`
- **Use `unknown`** when type is genuinely unknown, then narrow
- **Use `export type`** for type-only exports

---

## Express Patterns

### Router Pattern

Each module creates its own Express `Router`. No factory wrapper — `Router()` directly.
Mount it in `app.ts` via the module's `index.ts`.

```typescript
// modules/admin/admin.routes.ts
import { Router } from "express";
import { requireSession, requirePermission } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../lib/validate.js";
import { registry } from "../../lib/openapi.js";
import * as handlers from "./admin.handlers.js";
import { approveUserBodySchema, approveUserResponseSchema } from "./admin.schema.js";
import { errorSchema } from "../../lib/schemas.js";

export const adminRouter = Router();

registry.registerPath({
  method: "post",
  path: "/admin/approve-user",
  tags: ["Admin"],
  summary: "Approve a pending user",
  request: {
    body: { content: { "application/json": { schema: approveUserBodySchema } } },
  },
  responses: {
    200: {
      description: "User approved",
      content: { "application/json": { schema: approveUserResponseSchema } },
    },
    404: {
      description: "User not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

adminRouter.post(
  "/approve-user",
  requireSession,
  requirePermission(["admin"]),
  validateBody(approveUserBodySchema),
  handlers.postApproveUser,
);
```

### Middleware Order (Enforced)

```
requireSession → requirePermission → validate* → handler
```

Flag any route that places validation before auth, or a handler before its middleware.

### Handler Pattern (Thin Glue)

Handlers extract validated input, call one service function, and map the result to an HTTP
response. If a handler exceeds ~15 lines of logic, move the logic to the service.

Use **explicit `try/catch`** — not `.catch()` chaining. It is the Express industry standard,
predictable when handling multiple domain error types, and universally readable.

```typescript
// Good: Thin handler with explicit try/catch
export async function postApproveUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const body = req.validatedBody as z.infer<typeof approveUserBodySchema>;

  try {
    const updated = await approveUser(body.userId);
    res.json({ success: true, userId: updated.id });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    next(error); // Unknown errors → global error handler
  }
}

// Bad: Business logic in handler
export async function postApproveUser(req: Request, res: Response) {
  const user = await db.select().from(userTable).where(eq(userTable.id, req.body.userId));
  if (!user) { ... }
  await auth.api.adminUpdateUser({ ... });
  // ...20+ more lines
}
```

### Validation Middleware

Three factory functions in `src/lib/validate.ts` — one per input location. Use all three
as appropriate; never parse `req.body`, `req.query`, or `req.params` manually inside handlers.

```typescript
// src/lib/validate.ts
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

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

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({ error: result.error.flatten() });
      return;
    }
    req.validatedQuery = result.data;
    next();
  };
}

export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({ error: result.error.flatten() });
      return;
    }
    req.validatedParams = result.data;
    next();
  };
}
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
| Manual error JSON in services             | Throw domain error, catch in handler         |
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
export async function approveUser(
  userId: string,
  repo: AdminRepository = adminRepository,
): Promise<ExistingUser> {
  const user = await repo.findUserById(userId);
  if (!user) throw new UserNotFoundError(userId);

  const updated = await repo.approveUser(userId);
  if (!updated) throw new UserNotFoundError(userId);

  return updated;
}

// Bad: Service coupled to Express
export async function approveUser(req: Request, res: Response) {
  const { userId } = req.body;
  res.json({ success: true });
}
```

### Domain Errors

Services throw domain-specific error classes. Handlers catch them and map to HTTP status.

```typescript
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = "UserNotFoundError";
  }
}
```

### Dependency Injection

Use default parameters for testable DI without a framework:

```typescript
export async function listPendingUsers(
  repo: AdminRepository = adminRepository,
): Promise<PendingUser[]> {
  return repo.listPendingUsers();
}

// In tests:
const repo = createAdminRepositoryMock({ listPendingUsers: async () => users });
const result = await listPendingUsers(repo);
```

---

## Zod Schema Conventions

### Derivation

Derive Zod schemas from Drizzle tables using `drizzle-zod`, then `.pick()` / `.omit()` /
`.extend()`. Never hand-write schemas that duplicate DB column definitions.

```typescript
// Good
import { createSelectSchema } from "drizzle-zod";
import { userTable } from "../../db/schema/index.js";

const userSelectSchema = createSelectSchema(userTable);

export const userPublicSchema = userSelectSchema
  .pick({ id: true, name: true, email: true, role: true })
  .openapi("UserPublic"); // registers to OpenAPI components/schemas

// Bad: Duplicates what Drizzle already knows
export const userPublicSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});
```

### `.openapi()` Metadata

Add `.openapi()` to any schema that should appear in the OpenAPI spec:

- **Named schemas** (reused in multiple responses) — `.openapi("ModelName")` registers to
  `components/schemas`
- **Field-level metadata** — `.openapi({ example: "value", description: "..." })`

```typescript
export const approveUserBodySchema = z.object({
  userId: z.string().uuid().openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
});

export const userPublicSchema = userSelectSchema
  .pick({ id: true, name: true, email: true })
  .openapi("UserPublic");
```

### Shared Error Schema

Use the single shared `errorSchema` from `src/lib/schemas.ts`:

```typescript
// src/lib/schemas.ts
export const errorSchema = z
  .object({ error: z.union([z.string(), z.record(z.unknown())]) })
  .openapi("Error");
```

Never declare a local `errorSchema` per module.

---

## OpenAPI

### Registry — `src/lib/openapi.ts`

One central `OpenAPIRegistry` instance. Every module imports this singleton to register
its schemas and paths. The document is generated at runtime on first request to `/openapi.json`.

```typescript
// src/lib/openapi.ts
import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

export const registry = new OpenAPIRegistry();

export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: { title: "Sunity API", version: "1.0.0" },
    servers: [{ url: "/api" }],
  });
}
```

### Serving spec + docs — `src/app.ts`

```typescript
import { apiReference } from "@scalar/express-api-reference";
import { generateOpenAPIDocument } from "./lib/openapi.js";

// OpenAPI JSON spec — FE team points @hey-api/openapi-ts here
app.get("/openapi.json", (_req, res) => {
  res.json(generateOpenAPIDocument());
});

// Interactive API docs
app.use("/docs", apiReference({ url: "/openapi.json" }));
```

### Route registration

In each module's `[name].routes.ts`, call `registry.registerPath()` immediately before (or
after) the `router.*()` call for the same route. Both declarations must stay in sync.

### FE SDK generation (hey-api)

> **Note:** `@hey-api/openapi-ts` is a **frontend concern** — it is not installed in this repo.
> Run all SDK generation commands from the frontend repo, not here.

The frontend team runs this from their repo:

```bash
npx @hey-api/openapi-ts \
  --input https://api.sunity.com/openapi.json \
  --output src/client
```

Or via `openapi-ts.config.ts` in the FE repo:

```typescript
import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: process.env.API_URL + "/openapi.json",
  output: "src/client",
  plugins: ["@hey-api/client-fetch"],
});
```

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
import { env } from "../config/env.js";

// prepare: false required for edge/serverless environments
const client = postgres(env.databaseUrl, { prepare: false });
export const db = drizzle({ client });
```

### Schema Location

- Domain-split files in `src/db/schema/`, re-exported via `src/db/schema/index.ts`
- Flag any table definition outside `src/db/schema/`

### Query Patterns

```typescript
// Good: Selective column query
return db
  .select({ id: userTable.id, name: userTable.name, email: userTable.email })
  .from(userTable)
  .where(eq(userTable.approved, false));

// Good: Null coalescing for single-row results
const [user] = await db
  .select({ id: userTable.id })
  .from(userTable)
  .where(eq(userTable.id, userId));
return user ?? null;

// Good: Parallel reads
const [count, rows] = await Promise.all([countQuery, dataQuery]);

// Good: Atomic writes
await db.transaction(async (tx) => {
  await tx.insert(tableA).values(/* ... */);
  await tx.update(tableB).set(/* ... */).where(/* ... */);
});
```

---

## Authentication & Authorization

### Better Auth Conventions

- Import plugins from **dedicated paths**: `better-auth/plugins/two-factor`, NOT `better-auth/plugins`
- `defaultRole: "mentee"` for all new signups
- Include social providers conditionally based on env vars — no `!` assertions
- Session validation happens in `requireSession` middleware, not inside services

### Cross-Origin Setup

`trustedOrigins` must include `FRONTEND_URL` (frontend origin) in addition to `BETTER_AUTH_URL`
(backend URL). The frontend initiates Google OAuth by navigating to:

/api/auth/sign-in/social?provider=google&callbackURL=<frontend-redirect-url>

Better Auth handles the full OAuth flow. No custom OAuth wrapper routes are needed on the backend.

### Middleware

```typescript
// middleware/auth.middleware.ts
export const requireSession: RequestHandler = async (req, res, next) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session?.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.session = session;
  next();
};

export const requirePermission =
  (roles: string[]): RequestHandler =>
  async (req, res, next) => {
    // Check RBAC against req.session.user.role
    next();
  };
```

---

## Environment Variables

All environment variables validated at startup in `src/env.ts`. Fail fast if required vars
are missing.

```typescript
// Good
import { env } from "../../env.js";
const url = env.DATABASE_URL;

// Bad — anywhere outside src/env.ts
const url = process.env.DATABASE_URL;
```

### Key Variables

| Variable               | Description                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string                                                                   |
| `BETTER_AUTH_URL`      | Backend base URL — used by Better Auth for callback construction                               |
| `BETTER_AUTH_SECRET`   | Secret used to sign sessions                                                                   |
| `FRONTEND_URL`         | Frontend origin URL — added to Better Auth `trustedOrigins`                                    |
| `NODE_ENV`             | `"development" \| "production" \| "test"` — controls secure cookies and other runtime behavior |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID (optional — provider skipped if absent)                                 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (optional — provider skipped if absent)                             |

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
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
}
```

### Pattern

1. Services throw domain errors (e.g., `UserNotFoundError`)
2. Handlers catch known domain errors → specific HTTP status + JSON
3. Unknown errors → `next(error)` → global handler → 500

---

## Code Quality & Style

### File Size

- **Max 200 lines** per file (blank lines and comments excluded)
- Split by responsibility if approaching limit

### Naming Conventions

| Element                    | Convention                        | Example                                       |
| -------------------------- | --------------------------------- | --------------------------------------------- |
| Files                      | `kebab-case` with domain prefix   | `admin.service.ts`, `admin-errors.ts`         |
| Variables, functions       | `camelCase`                       | `listPendingUsers`, `approveUser`             |
| Types, interfaces, classes | `PascalCase`                      | `AdminRepository`, `UserNotFoundError`        |
| Constants                  | `camelCase` or `UPPER_SNAKE_CASE` | `roles`, `DEFAULT_PAGE_SIZE`                  |
| Zod schemas                | `camelCase` + `Schema` suffix     | `userPublicSchema`, `approveUserBodySchema`   |
| Route handlers             | HTTP verb + Noun                  | `getMe`, `postApproveUser`, `getPendingUsers` |

### Import Organization

```typescript
// 1. External packages
import { z } from "zod";
import { eq } from "drizzle-orm";
import { Router } from "express";

// 2. Internal shared
import { env } from "../../env.js";
import { db } from "../../db/index.js";
import { registry } from "../../lib/openapi.js";
import { requireSession } from "../../middleware/auth.middleware.js";

// 3. Module-local
import * as handlers from "./admin.handlers.js";
import { approveUserBodySchema } from "./admin.schema.js";
```

- Use path alias `@/` mapped to `src/` for cross-module imports
- Use relative imports for intra-module references
- Always include `.js` extension in ESM imports

---

## Common Workflows

### Add a new module

1. Create `src/modules/[name]/` directory
2. Create: `[name].schema.ts`, `[name].service.ts`, `[name].handlers.ts`,
   `[name].routes.ts`, `[name].index.ts`, `__tests__/`
3. Add `.openapi()` metadata to schemas; call `registry.registerPath()` in routes file
4. Mount the router in `src/app.ts`
5. Add DB table to `src/db/schema/` and re-export from `index.ts` if needed

### Add a new route to an existing module

1. Define Zod schemas in `[name].schema.ts` with `.openapi()` metadata
2. Write business logic in `[name].service.ts` (pure function, domain errors)
3. Write handler in `[name].handlers.ts` (thin glue, `try/catch`, <15 lines)
4. Register OpenAPI path and Express route in `[name].routes.ts`
5. Write tests in `__tests__/`

### Add or change a database table

1. Update/create schema file in `src/db/schema/`
2. Re-export from `src/db/schema/index.ts`
3. Run `bun run db:generate` and review the generated SQL
4. Run `bun run db:migrate`
5. Update any service/schema code that depends on the table

---

## Bun Command Reference

| Task                  | Command                |
| --------------------- | ---------------------- |
| Install dependencies  | `bun install`          |
| Dev server            | `bun run dev`          |
| Type check            | `bun run check`        |
| Build                 | `bun run build`        |
| Start built output    | `bun run start`        |
| Format + lint         | `bun run fl`           |
| Lint only             | `bun run lint`         |
| Lint fix              | `bun run lint:fix`     |
| Format check          | `bun run format:check` |
| Generate DB migration | `bun run db:generate`  |
| Apply DB migration    | `bun run db:migrate`   |

---

## Code Review Checklist

- [ ] Module structure follows `[name].{schema,service,handlers,routes,index}.ts` convention
- [ ] No cross-module imports bypassing `index.ts`
- [ ] Services take primitives/DTOs — no `req`/`res` inside services
- [ ] Handlers are thin (<15 lines of logic), use `try/catch`, forward unknown errors via `next(error)`
- [ ] Middleware order: `requireSession` → `requirePermission` → `validate*` → handler
- [ ] `validateBody` / `validateQuery` / `validateParams` used — no raw `req.body/query/params`
- [ ] `req.validatedBody/Query/Params` cast to schema type at top of handler (single `as` cast only)
- [ ] Schemas derived from Drizzle via `drizzle-zod` (no hand-written DB types)
- [ ] `.openapi()` metadata present on schemas; `registry.registerPath()` called in routes file
- [ ] No `any` types or `@ts-ignore`
- [ ] No `process.env` access outside `src/env.ts`
- [ ] Domain errors are classes, not inline objects
- [ ] File stays under 200 lines
- [ ] Tests exist for new service functions
- [ ] No unused variables or imports
- [ ] ESM imports include `.js` extension

---

## Skill References

Consult these skill files when working in their respective areas:

| Skill                              | Location                                                   | When to Use                       |
| ---------------------------------- | ---------------------------------------------------------- | --------------------------------- |
| Drizzle ORM best practices         | `.agents/skills/drizzle-best-practices/SKILL.md`           | Queries, schema, migrations       |
| Supabase/PostgreSQL best practices | `.agents/skills/supabase-postgres-best-practices/SKILL.md` | Indexes, RLS, performance         |
| Better Auth patterns               | `.agents/skills/better-auth-best-practices/SKILL.md`       | Auth flows, session config, RBAC  |
| Redis patterns                     | `.agents/skills/redis-patterns/SKILL.md`                   | Caching, session storage, pub/sub |
| Test-driven development            | `.agents/skills/test-driven-development/SKILL.md`          | Writing tests, TDD workflow       |

---

## General Working Rules

- Keep changes minimal and focused on the user request
- Preserve module boundaries and import direction rules
- Do not introduce abstractions unless they clearly reduce duplication
- Prefer updating existing code over creating new helper layers
- Do not use destructive git commands
- Favor clarity over cleverness
- If a change affects public behavior or setup, update README in the same pass
