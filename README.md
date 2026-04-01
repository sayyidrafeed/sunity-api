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

## Scripts

- `npm run dev` - run server in watch mode
- `npm run build` - compile TypeScript to `dist`
- `npm run start` - run compiled server
- `npm run db:generate` - generate Drizzle migration files
- `npm run db:migrate` - run migrations
- `npm run typecheck` - run TypeScript checks
