# Degenerates

A lightweight friends bet tracker built with Next.js App Router, Prisma, and PostgreSQL for Vercel deployment.

## Features

- Create 1v1 or group bets with custom descriptions, dates, side labels, and notes
- Support even, American, and decimal odds with payout previews
- Edit, delete, cancel, and resolve bets without authentication
- Browse open bets, history/results, dashboard activity, and participant stats
- View leaderboard, net profit/loss chart, and money-flow network
- Refresh results and stats manually
- Export filtered results as CSV
- Seeded with sample participants and sample bets

## Stack

- Next.js 16 App Router
- TypeScript
- Prisma ORM
- PostgreSQL
- Tailwind CSS v4
- Recharts plus a custom SVG network graph
- Vercel Route Handlers / Functions

## Local Setup

### Prerequisites

- Node.js 20+
- PostgreSQL database

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env` from `.env.example`.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public&pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
```

Use the pooled connection for `DATABASE_URL` and the direct or non-pooled connection for `DIRECT_URL`.

### 3. Create the schema

For a fresh local database:

```bash
npx prisma migrate dev
```

For an existing database you just want to sync:

```bash
npm run db:push
```

### 4. Seed sample data

```bash
npm run db:seed
```

The seed includes Austin, Kevin, Hal, Jason, Vamshee, a mix of open and resolved bets, sports-style bets, and custom personal bets.

### 5. Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## API Endpoints

- `GET /api/dashboard`
- `GET /api/participants`
- `GET /api/bets`
- `POST /api/bets`
- `GET /api/bets/:id`
- `PUT /api/bets/:id`
- `DELETE /api/bets/:id`
- `POST /api/bets/:id/resolve`
- `GET /api/results`
- `GET /api/results/export`
- `GET /api/stats`
- `GET /api/stats/money-flow`

## Vercel Deployment

### 1. Push to GitHub

```bash
git add .
git commit -m "Build friends bet tracker"
git push origin main
```

### 2. Create the database

Neon is the simplest fit for Vercel. Create a PostgreSQL project there and copy both connection strings.

### 3. Import into Vercel

- Create a new Vercel project from this GitHub repo
- Framework preset should auto-detect as Next.js
- Keep the default install command

### 4. Add environment variables in Vercel

Add exactly these variables:

- `DATABASE_URL`
  Use your pooled PostgreSQL connection string
- `DIRECT_URL`
  Use your direct PostgreSQL connection string

No other app-specific environment variables are required.

### 5. Set the build command

Either leave Vercel's default build alone and run migrations separately, or set the build command to:

```bash
npx prisma migrate deploy && next build
```

### 6. Run production migrations

If you did not include migration deploy in the build command, run:

```bash
npx prisma migrate deploy
```

### 7. Seed production data if desired

```bash
npm run db:seed
```

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | App runtime database connection |
| `DIRECT_URL` | Yes | Prisma migration connection |

## Useful Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run production migrations |
| `npm run db:push` | Push schema without migrations |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio |
