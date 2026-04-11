# Agent Instructions for sunity-api

This repository is a Express API scaffold with Drizzle ORM and PostgreSQL. Follow these instructions when working in this repo. The instructions are intended for a single developer, but can be adapted for larger teams.

## Project Shape

- Runtime: Bun 1.1+ (primary), Node.js 20+ (compatibility)
- Language: TypeScript in ESM mode
- Web layer: Express
- Database layer: Drizzle ORM + PostgreSQL
- Current API prefix: `/api`

## Working Rules

- Keep changes minimal and focused on the user request.
- Preserve the existing file layout and module boundaries.
- Do not introduce extra abstractions unless they clearly reduce duplication.
- Prefer updating existing code over creating new helper layers.
- Use `apply_patch` for manual edits.
- Do not use destructive git commands.
- Prefer Bun commands by default for install, run, and checks.

## Code Style

- Keep TypeScript strict and explicit.
- Preserve ESM imports and `.js` extensions in local imports.
- Match the existing formatting style in each file.
- Prefer small, readable functions and modules.

## API Conventions

- Put HTTP routes in `src/routes/`.
- Mount new routes from `src/app.ts`.
- Keep health and operational endpoints simple and fast.
- Return JSON responses with consistent status codes.
- If route paths change, update the README usage notes too.

## Scalability Guardrails

- Keep route handlers thin; move business logic into small service modules when complexity grows.
- Add route groups by domain (`src/routes/users.ts`, `src/routes/auth.ts`) instead of growing one large router.
- Centralize request validation and response error shape to avoid inconsistent API behavior.
- Use explicit pagination/filter/query patterns for list endpoints before adding many records.
- Add a shared error middleware once there are multiple non-trivial endpoints.
- Add simple request logging and latency measurement early to help operational debugging.
- Keep database access behind focused query functions when table usage expands across modules.

## Environment Handling

- Validate required environment variables in `src/config/env.ts`.
- Keep startup failures explicit when required config is missing.
- Add new env values in one place first, then consume them downstream.

## Database Conventions

- Keep the Drizzle client in `src/db/client.ts`.
- Keep table schemas in `src/db/schema/`.
- If a schema changes, generate the migration and verify the generated SQL.
- Prefer schema-first updates over ad hoc SQL changes.

## Common Workflows

### Add a new route

1. Create a router under `src/routes/`.
2. Register it in `src/app.ts`.
3. Keep the route path under `/api` unless the request says otherwise.
4. Update `README.md` if the public surface changed.

### Add or change a database table

1. Update the schema in `src/db/schema/`.
2. Run `bun run db:generate`.
3. Review the generated migration SQL before using it.
4. Run `bun run db:migrate`.
5. Adjust any route or service code that depends on the table shape.

### Change runtime configuration

1. Update `src/config/env.ts`.
2. Thread the value into the code that uses it.
3. Document the change in `README.md` when it affects setup.

## Verification

- Prefer Bun commands from `package.json` scripts.
- Run `bun check` for fast TypeScript diagnostics.
- Run `bun run check` for project type checks via configured script.
- Run `bun run build` to validate production compilation output.
- Run `bun run lint` (or `bun run lint:fix`) for lint quality.
- Run `bun run format:check` before finalizing larger changes.
- For database changes, run `bun run db:generate` then `bun run db:migrate`.

## Bun-First Command Quick List

- Install: `bun install`
- Dev server: `bun run dev`
- Type check: `bun check` and `bun run check`
- Build: `bun run build`
- Start build output: `bun run start`
- Lint: `bun run lint`
- Format check: `bun run format:check`
- Generate migration: `bun run db:generate`
- Apply migration: `bun run db:migrate`

## When in Doubt

- Favor clarity over cleverness.
- Keep public behavior stable unless the request explicitly asks for a change.
- If a change affects setup or usage, update the README in the same pass.