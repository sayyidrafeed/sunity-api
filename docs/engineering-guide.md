# Sunity Backend — Engineering Guide

This guide covers how to work in this codebase day-to-day. For full rules and conventions, see
[`AGENTS.md`](../AGENTS.md). This guide focuses on **how**, not **what**.

---

## Mental Model

The backend is a **modular monolith**. All code lives in one process, but each domain (e.g.
`users`, `achievements`, `admin`) is a self-contained vertical slice. Modules never reach into
each other's internals — they communicate only through public `index.ts` re-exports.

```
Request → Express middleware → Module Router → Handler → Service → DB
                                    ↑
                         registry.registerPath()
                                    ↓
                              /openapi.json → Scalar docs → hey-api SDK
```

---

## Entry Points

```
src/app.ts      Express app — wires middleware, mounts routes, serves /openapi.json
src/server.ts   Bun/Node.js runtime — calls app.listen()
src/worker.ts   Cloudflare Workers runtime — wraps app with httpServerHandler
```

`app.ts` is runtime-agnostic. `server.ts` and `worker.ts` are thin adapters. You never touch
those two files unless you're changing how the server boots.

---

## OpenAPI Pipeline (end-to-end)

Understanding this flow prevents confusion. There are **two OpenAPI sources** that get merged:

| Source       | What it covers             | How it's registered                                |
| ------------ | -------------------------- | -------------------------------------------------- |
| App registry | All `/api/*` module routes | `registry.registerPath()` in each `*.routes.ts`    |
| Better Auth  | All `/api/auth/*` routes   | Auto-generated via `openAPI()` plugin in `auth.ts` |

On the first request to `GET /openapi.json`:

```
generateOpenAPIDocument()          ← collects all registry.registerPath() calls
auth.api.generateOpenAPISchema()   ← Better Auth generates its own schema
mergeOpenAPIDocuments(app, auth)   ← merged into one document, then cached
```

`GET /docs` serves Scalar UI pointing at `/openapi.json`.

The frontend runs `@hey-api/openapi-ts` against `/openapi.json` to generate the TypeScript SDK.
**This command runs from the frontend repo**, not here.

**Implication:** Every time you add a `registry.registerPath()` call and restart the server, the
endpoint automatically appears in `/docs` and in the frontend SDK after the next SDK generation.

---

## Happy Path: Implementing a Ticket

For a ticket like "implement `GET /api/users` and `POST /api/users`":

```
1. Add DB table (if new domain)
2. Create module directory + 5 files
3. Write schema (Zod + .openapi())
4. Write service (pure business logic)
5. Write handlers (thin HTTP glue)
6. Write routes (register OpenAPI paths + Express routes)
7. Mount router in app.ts
8. Write tests
9. bun run fl        ← format + lint
10. bun run check    ← type check
11. bun test         ← run tests
12. push
```

After push, hit `GET /openapi.json` on the deployed server — the new endpoints are live in the
spec immediately.

---

## Module Structure

Every feature lives in `src/modules/[name]/`:

```
src/modules/users/
├── users.schema.ts      Zod schemas derived from Drizzle + .openapi() metadata
├── users.service.ts     Pure business logic — no req/res, throws domain errors
├── users.handlers.ts    HTTP glue — extract input, call service, map response
├── users.routes.ts      Express Router + registry.registerPath() for each route
├── users.index.ts       Re-exports the router for mounting in app.ts
└── __tests__/
    └── users.service.test.ts
```

### File responsibilities in detail

**`users.schema.ts`** — derive from Drizzle, never hand-write DB types:

```typescript
import { createSelectSchema } from "drizzle-zod";
import { usersTable } from "../../db/schema/index.js";

const userSelectSchema = createSelectSchema(usersTable);

export const userPublicSchema = userSelectSchema
  .pick({ id: true, name: true, email: true, role: true })
  .openapi("UserPublic");

export const createUserBodySchema = z.object({
  name: z.string().min(1).openapi({ example: "Alice" }),
  email: z.string().email().openapi({ example: "alice@example.com" }),
});
```

**`users.service.ts`** — pure functions, no Express types:

```typescript
import { db } from "../../db/client.js";
import { usersTable } from "../../db/schema/index.js";
import { NotFoundError } from "../../lib/errors.js";
import type { z } from "zod";
import type { createUserBodySchema } from "./users.schema.js";

export async function getUserById(id: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) throw new NotFoundError("User not found", id);
  return user;
}

export async function createUser(input: z.infer<typeof createUserBodySchema>) {
  const [created] = await db.insert(usersTable).values(input).returning();
  return created;
}
```

**`users.handlers.ts`** — thin HTTP glue, max ~15 lines of logic per handler:

```typescript
import type { NextFunction, Request, Response } from "express";
import { getUserById, createUser } from "./users.service.js";
import { createUserBodySchema } from "./users.schema.js";
import { NotFoundError } from "../../lib/errors.js";
import type { z } from "zod";

export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { id } = req.validatedParams as { id: string };
  try {
    const user = await getUserById(id);
    res.json(user);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.userMessage });
      return;
    }
    next(error);
  }
}

export async function postUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const body = req.validatedBody as z.infer<typeof createUserBodySchema>;
  try {
    const user = await createUser(body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}
```

**`users.routes.ts`** — register OpenAPI path and Express route together:

```typescript
import { Router } from "express";
import { registry } from "../../lib/openapi.js";
import { requireSession } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams } from "../../lib/validate.js";
import { errorSchema } from "../../lib/schemas.js";
import * as handlers from "./users.handlers.js";
import { userPublicSchema, createUserBodySchema } from "./users.schema.js";
import { z } from "zod";

export const usersRouter = Router();

// GET /api/users/:id
registry.registerPath({
  method: "get",
  path: "/users/{id}",
  tags: ["Users"],
  summary: "Get a user by ID",
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: "User found",
      content: { "application/json": { schema: userPublicSchema } },
    },
    404: { description: "Not found", content: { "application/json": { schema: errorSchema } } },
  },
});
usersRouter.get(
  "/:id",
  requireSession,
  validateParams(z.object({ id: z.string().uuid() })),
  handlers.getUser,
);

// POST /api/users
registry.registerPath({
  method: "post",
  path: "/users",
  tags: ["Users"],
  summary: "Create a user",
  request: { body: { content: { "application/json": { schema: createUserBodySchema } } } },
  responses: {
    201: { description: "Created", content: { "application/json": { schema: userPublicSchema } } },
  },
});
usersRouter.post("/", requireSession, validateBody(createUserBodySchema), handlers.postUser);
```

**`users.index.ts`** — the only file other modules and `app.ts` should import from:

```typescript
export { usersRouter } from "./users.routes.js";
```

**Mount in `app.ts`:**

```typescript
import { usersRouter } from "./modules/users/users.index.js";

app.use("/api/users", usersRouter);
// ... other modules
app.use(globalErrorHandler); // always last
```

---

## Middleware Order (enforced)

```
requireSession → requirePermission → validate* → handler
```

Never put validation before auth. Never put a handler before its validation.

```typescript
// Authenticated + role-gated route
router.post(
  "/approve",
  requireSession,
  requirePermission(["admin"]),
  validateBody(approveBodySchema),
  handlers.postApprove,
);

// Public route — no auth, still validate
router.get("/", validateQuery(listQuerySchema), handlers.getList);
```

---

## Error Handling

Services throw, handlers catch known errors and map to HTTP:

```typescript
// lib/errors.ts — use these, don't create inline error objects
NotFoundError    → 404
ValidationError  → 400
ForbiddenError   → 403
ConflictError    → 409

// In handler
} catch (error) {
  if (error instanceof NotFoundError) {
    res.status(404).json({ error: error.userMessage });
    return;
  }
  next(error); // unknown → globalErrorHandler → 500
}
```

If you need a new error type, add it to `src/lib/errors.ts` — never create a one-off error class
in a module.

---

## Database: Adding a Table

1. Create or update a file in `src/db/schema/` (e.g. `users.schema.ts`)
2. Re-export from `src/db/schema/index.ts`
3. Run `bun run db:generate` — review the generated SQL in `drizzle/` folder
4. Run `bun run db:migrate`

```typescript
// src/db/schema/users.schema.ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Derive Zod schemas from this table in the module's `*.schema.ts` — never hand-write a type that
duplicates DB columns.

---

## Admin vs Public Route Split

When a module serves both authenticated admin routes and public routes:

```
modules/achievements/
├── achievements.routes.ts         # Admin (requireSession + requirePermission)
├── public-achievements.routes.ts  # Public (no auth)
├── achievements.handlers.ts
├── public-achievements.handlers.ts
└── achievements.index.ts          # Exports both routers
```

```typescript
// app.ts
app.use("/api/admin/achievements", achievementsAdminRouter);
app.use("/api/achievements", achievementsPublicRouter);
```

---

## Sub-Modules (Complex Domains)

For large domains with multiple related resources, nest sub-modules:

```
modules/mentoring/
├── sessions/
│   └── sessions.{schema,service,handlers,routes,index}.ts
├── goals/
│   └── goals.{schema,service,handlers,routes,index}.ts
└── mentoring.index.ts   # re-exports all sub-routers
```

---

## Validation Reference

| Middleware               | When to use                             |
| ------------------------ | --------------------------------------- |
| `validateBody(schema)`   | POST / PUT / PATCH — parse `req.body`   |
| `validateQuery(schema)`  | GET lists — pagination, filters, search |
| `validateParams(schema)` | Route params — `:id`, `:slug`           |

In the handler, cast `validatedBody/Query/Params` once at the top:

```typescript
const body = req.validatedBody as z.infer<typeof createUserBodySchema>;
const query = req.validatedQuery as z.infer<typeof listUsersQuerySchema>;
const params = req.validatedParams as z.infer<typeof userParamsSchema>;
```

---

## Environment Variables

Never use `process.env` outside `src/config/env.ts`. Always import:

```typescript
import { env } from "../../config/env.js";
```

If you add a new required var, add it to `env.ts` with a `throw` guard so the server fails fast
at startup rather than at runtime.

---

## Commands Reference

| Task                  | Command                                   |
| --------------------- | ----------------------------------------- |
| Dev server            | `bun run dev`                             |
| Format + lint         | `bun run fl`                              |
| Type check            | `bun run check`                           |
| Run tests             | `bun test`                                |
| Full CI check         | `bun run fl && bun run check && bun test` |
| Generate DB migration | `bun run db:generate`                     |
| Apply DB migration    | `bun run db:migrate`                      |

---

## Ticket Checklist

When implementing any ticket:

- [ ] DB table created/updated and migrated
- [ ] Module files created: `schema`, `service`, `handlers`, `routes`, `index`
- [ ] Schemas derived from Drizzle via `drizzle-zod`, not hand-written
- [ ] `.openapi()` metadata on all schemas used in responses
- [ ] `registry.registerPath()` called for every route in `*.routes.ts`
- [ ] Router mounted in `app.ts` before `globalErrorHandler`
- [ ] Middleware order: `requireSession` → `requirePermission` → `validate*` → handler
- [ ] Domain errors thrown from service, caught in handler
- [ ] Tests in `__tests__/` covering service functions
- [ ] `bun run fl && bun run check && bun test` all pass
