# sunity-api

Backend API for Sunity, a platform for crowdfunding solar panel installations at worship places.
It serves public campaign pages and an admin panel for campaigns, worship places, expenses,
energy data, uploads, and activity logs.

Express 5 + Drizzle ORM on PostgreSQL. Runs on Bun locally and on Cloudflare Workers in
production. Coding conventions live in [`AGENTS.md`](./AGENTS.md); a day-to-day walkthrough is in
[`docs/engineering-guide.md`](./docs/engineering-guide.md).

## Quick Start

1. Install dependencies

```bash
bun install
```

2. Start a local PostgreSQL (optional, if you don't have one)

```bash
docker compose -f docker-compose.local.yml up -d   # port 5433, db sunity_dev
# or
docker compose up -d                               # port 5432, db sunity
```

3. Setup Environment Variables

- For **Bun** (local server, Drizzle Kit, seed script):
  ```bash
  cp .env.example .env
  ```
- For **Cloudflare Workers** (local `wrangler dev`):
  ```bash
  cp .dev.vars.example .dev.vars
  ```
- Tests load `.env.test` (`bun test` runs with `NODE_ENV=test`).

4. Apply migrations and seed data

```bash
bun run db:migrate
bun run db:seed
```

5. Run in development mode

```bash
bun run dev          # Bun with hot reload on PORT (default 3000)
bun run dev:worker   # Wrangler, Workers runtime
```

API docs: `GET /docs` (Scalar) backed by `GET /openapi.json`.

## Environment Variables

Validated at startup by `src/env.ts`; the process exits if a required value is missing.

| Variable                                                                                          | Required | Notes                                                     |
| ------------------------------------------------------------------------------------------------- | :------: | --------------------------------------------------------- |
| `DATABASE_URL`                                                                                    |   yes    | PostgreSQL connection string                              |
| `BETTER_AUTH_URL`                                                                                 |   yes    | Public base URL of this API                               |
| `BETTER_AUTH_SECRET`                                                                              |   yes    | Session signing secret                                    |
| `FRONTEND_URLS` / `FRONTEND_URL`                                                                  |  yes\*   | Allowed frontend origins (comma-separated for the plural) |
| `BETTER_AUTH_EXTRA_TRUSTED_ORIGINS`                                                               |    no    | Extra Better Auth trusted origins                         |
| `GOOGLE_CLIENT_ID`                                                                                |   yes    | Google OAuth                                              |
| `GOOGLE_CLIENT_SECRET`                                                                            |   yes    | Google OAuth                                              |
| `NODE_ENV`                                                                                        |    no    | `development` (default), `production`, `test`             |
| `PORT`                                                                                            |    no    | Local server port (default `3000`)                        |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_CUSTOM_DOMAIN` |    no    | Cloudflare R2 presigned uploads                           |
| `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`                                                      |    no    | Midtrans donations                                        |

\* At least one of the two.

## Infrastructure

- **Entry points**: `src/server.ts` (Bun/Node, `app.listen`) and `src/worker.ts` (Cloudflare
  Workers via `cloudflare:node` `httpServerHandler`). Both wrap the same `src/app.ts`.
- **Configuration**: `wrangler.jsonc` holds the Worker name, compatibility flags
  (`nodejs_compat`, `enable_nodejs_http_server_modules`) and non-secret `vars`. Set secrets with
  `wrangler secret put <KEY>`.
- **Environment Validation**: Zod-based validation at startup in `src/env.ts`.
- **Database**: Drizzle ORM with postgres.js (`src/db/client.ts`). Schema in `src/db/schema/`,
  migrations in `drizzle/`. Read `drizzle/MIGRATION_SAFETY.md` before risky migrations.
- **CI**: `.github/workflows/ci.yml` runs lint, format check, and typecheck in parallel, then
  build, on pushes and pull requests to `main`.
- **Pre-commit**: `.husky/pre-commit` runs `bun run format:check` and `bun run check`.

## Scripts

- `bun run dev` - run the Bun server with hot reload
- `bun run dev:worker` - run the Worker locally with Wrangler (`--env development`)
- `bun run build` - compile TypeScript to `dist`
- `bun run start` - run compiled server (`node dist/server.js`)
- `bun run deploy` - deploy the Worker with Wrangler
- `bun run db:generate` - generate Drizzle migration files
- `bun run db:migrate` - run migrations
- `bun run db:seed` - seed users, worship places, campaigns, donations, assets, expenses, activity logs, energy (idempotent upserts, reads `.env`)
- `bun run check` - run TypeScript type checks (via `tsgo`)
- `bun run lint` - lint project with oxlint
- `bun run lint:fix` - lint and auto-fix
- `bun run format` - format code with oxfmt
- `bun run format:check` - check formatting with oxfmt
- `bun run fl` - run formatter and linter (recommended before commit)
- `bun test` - run tests

## API Overview

All app routes are under `/api`. Admin routes require a Better Auth session with the `admin` role.

| Prefix                                | Module           | Access                                  |
| ------------------------------------- | ---------------- | --------------------------------------- |
| `/api/auth/*`                         | Better Auth      | Public                                  |
| `/api/campaigns`                      | `campaigns`      | Public reads, session for create/update |
| `/api/assets/assets/upload`\*\*       | `assets`         | Public (upload session)                 |
| `/api/admin/campaigns`                | `campaigns`      | Admin                                   |
| `/api/admin/campaigns/:id/expenses`   | `expenses`       | Admin                                   |
| `/api/admin/campaigns/:id/energy`     | `energy`         | Admin                                   |
| `/api/admin/campaigns/:id/activities` | `activity-logs`  | Admin                                   |
| `/api/admin/uploads/presign`          | `admin-uploads`  | Admin                                   |
| `/api/admin/worship-places`           | `worship-places` | Admin                                   |
| `/api/admin/dashboard`                | `dashboard`      | Admin                                   |

\*\* The router is mounted at `/api/assets` and declares `/assets/upload`, so the served path
repeats `assets`. The OpenAPI document lists it as `/assets/upload` (served as `/api/assets/upload`),
which does not match.

The `donations` module (Midtrans Snap checkout and webhook) exists in `src/modules/donations/`
but is not mounted in `src/app.ts`, so its routes are not served yet.

## Authentication (Better Auth + Google)

This API mounts Better Auth on:

- `ALL /api/auth/*`

Sign-in is Google only. The frontend starts the flow through Better Auth's social sign-in
endpoint with `provider=google` and a frontend `callbackURL`; Better Auth handles the OAuth
callback and sets the session cookie (prefix `sunity`, `SameSite=None`, `Secure`). On auth
errors Better Auth redirects to `<first FRONTEND_URLS entry>/admin/login`.

Admin access is checked by `requireSession` and `requirePermission` in
`src/middleware/auth.middleware.ts`: the user's `role` must include `admin`. The `users.role`
column defaults to `admin` (`src/db/schema/auth-schema.ts`), so every new Google sign-in gets
admin access unless the role is changed.
