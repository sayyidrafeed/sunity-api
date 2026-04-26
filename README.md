# sunity-api

Express + Drizzle ORM scaffold using PostgreSQL. Optimized for Bun and Cloudflare Workers.

## Quick Start

1. Install dependencies

```bash
bun install
```

2. Setup Environment Variables

- For **Node.js/Bun** (Local Server):
  ```bash
  cp .env.example .env
  ```
- For **Cloudflare Workers** (Local Dev):
  ```bash
  cp .dev.vars.example .dev.vars
  ```

3. Generate migration files

```bash
bun run db:generate
```

4. Run in development mode

```bash
bun run dev
```

## Infrastructure

- **Configuration**: Migrated to `wrangler.jsonc` (Cloudflare's recommended format).
- **Environment Validation**: Zod-based validation at startup in `src/env.ts`.

## Scripts

- `bun run dev` - run server in watch mode
- `bun run build` - compile TypeScript to `dist`
- `bun run start` - run compiled server
- `bun run db:generate` - generate Drizzle migration files
- `bun run db:migrate` - run migrations
- `bun run check` - run TypeScript type checks (via `tsgo`)
- `bun run lint` - lint project with oxlint
- `bun run format` - format code with oxfmt
- `bun run format:check` - check formatting with oxfmt
- `bun run fl` - run formatter and linter (recommended before commit)

## Authentication (Better Auth + Google)

This API mounts Better Auth on:

- `ALL /api/auth/*`

### Admin Redirect Flow:

1. Start Google sign-in with Better Auth `callbackURL` set to:
   - `/api/admin/auth/callback?redirect=/admin/dashboard`

2. Better Auth completes OAuth callback and sets session cookie.

3. Success callback validates session and redirects to `/admin/dashboard`.
