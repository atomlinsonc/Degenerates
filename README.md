# Degenerates 🎲

A simple, beautiful friends bet tracker. Record bets, resolve outcomes, and track who owes whom.

## Features

- Create custom bets with even odds, American odds, or decimal odds
- Resolve bets and auto-calculate settlements
- Full history with filters by participant, status, and date
- Stats page with leaderboard, per-player breakdown, net P/L chart, and money flow network graph
- Dark-mode UI optimized for mobile and desktop
- No auth — anyone with the link can use it

---

## Local Setup

### Prerequisites

- Node.js 18+
- A PostgreSQL database (Neon, Supabase, Railway, or local)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env` and fill in your database URLs:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Pooled connection (used by the app)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public&pgbouncer=true&connect_timeout=15"

# Direct connection (used by Prisma migrations)
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
```

> **Neon users:** Use the pooled connection string for `DATABASE_URL` and the direct/non-pooled string for `DIRECT_URL`.

### 3. Run database migrations

```bash
npx prisma migrate dev --name init
```

Or if you're connecting to an existing DB and just want to push the schema:

```bash
npm run db:push
```

### 4. Seed sample data

```bash
npm run db:seed
```

This creates 5 participants (Austin, Kevin, Hal, Jason, Vamshee), 6 resolved bets, and 5 open bets so you can see the app working immediately.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Setup (Neon — Recommended)

Neon is a free serverless PostgreSQL provider that works great with Vercel.

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the **pooled connection string** → use as `DATABASE_URL`
4. Copy the **direct connection string** (or the same string without `?pgbouncer=true`) → use as `DIRECT_URL`
5. Run `npx prisma migrate deploy` (or `npm run db:push`) to set up the schema

---

## Vercel Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select your repo
3. Framework preset: **Next.js** (auto-detected)

### 3. Set environment variables in Vercel

In your Vercel project → Settings → Environment Variables, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your pooled PostgreSQL connection string |
| `DIRECT_URL` | Your direct (non-pooled) PostgreSQL connection string |

### 4. Run migrations on first deploy

After deploying, run migrations against your production DB:

```bash
npx prisma migrate deploy
```

Or add this to your Vercel build command:

```
npx prisma migrate deploy && next build
```

### 5. Seed production (optional)

```bash
DATABASE_URL="your-prod-url" DIRECT_URL="your-direct-url" npm run db:seed
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (pooled for Neon/Supabase) |
| `DIRECT_URL` | Yes | Direct PostgreSQL connection (for migrations) |

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run db:push` | Push Prisma schema to DB (no migration history) |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:seed` | Seed with sample data |
| `npm run db:studio` | Open Prisma Studio |

---

## Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL via Prisma ORM
- **Styling:** Tailwind CSS v4
- **Charts:** Recharts
- **Icons:** Lucide React
- **Deployment:** Vercel
