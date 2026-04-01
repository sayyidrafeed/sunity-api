# sunity-api

Express + Drizzle ORM scaffold using PostgreSQL.

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Copy environment file and adjust values

```bash
cp .env.example .env
```

3. Generate migration files

```bash
npm run db:generate
```

4. Run in development mode

```bash
npm run dev
```

Health endpoint:

- `GET /api/health`

## Optional: Use Bun

If you prefer Bun, you can run this project with Bun as package manager/runtime.

1. Install dependencies

```bash
bun install
```

2. Copy environment file and adjust values

```bash
cp .env.example .env
```

3. Generate migration files

```bash
bun run db:generate
```

4. Run in development mode

```bash
bun run dev
```

5. Other common commands

```bash
bun run db:migrate
bun run typecheck
bun run lint
bun run format:check
```

## Scripts

- `npm run dev` - run server in watch mode
- `npm run build` - compile TypeScript to `dist`
- `npm run start` - run compiled server
- `npm run db:generate` - generate Drizzle migration files
- `npm run db:migrate` - run migrations
- `npm run typecheck` - run TypeScript checks
- `npm run lint` - lint project with oxlint
- `npm run lint:fix` - auto-fix lint issues with oxlint
- `npm run format` - format code with oxfmt
- `npm run format:check` - check formatting with oxfmt
