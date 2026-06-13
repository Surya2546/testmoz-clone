# TestMoz — Full-Stack Next.js App

A full-stack test creation and taking platform built with **Next.js 14 App Router**, **Prisma ORM**, and **Neon (PostgreSQL)**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via **Neon** (serverless) |
| ORM | Prisma 5 |
| Auth | NextAuth.js v4 (JWT + Credentials) |
| Passwords | bcryptjs |
| Styling | Inline styles (no Tailwind required) |

---

## Project Structure

```
testmoz/
├── prisma/
│   └── schema.prisma          # All DB models
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts   # NextAuth handler
│   │   │   │   └── register/route.ts        # User registration
│   │   │   └── tests/
│   │   │       ├── route.ts                 # GET all tests, POST new
│   │   │       └── [id]/
│   │   │           ├── route.ts             # GET, PUT, DELETE single test
│   │   │           ├── attempt/route.ts     # Public: GET test to take, POST submit
│   │   │           └── results/route.ts     # Owner: GET all attempts
│   │   ├── dashboard/page.tsx   # Test list (auth required)
│   │   ├── test/[id]/page.tsx   # Test editor (auth required)
│   │   ├── take/[id]/page.tsx   # Public test-taking page
│   │   ├── login/page.tsx       # Login + register
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Redirects to /dashboard
│   │   └── globals.css
│   ├── components/
│   │   ├── ui.tsx               # Shared UI primitives (Btn, Card, Input…)
│   │   ├── Navbar.tsx
│   │   └── QuestionCard.tsx     # Question editor card
│   └── lib/
│       ├── prisma.ts            # Prisma singleton
│       ├── auth.ts              # NextAuth config
│       └── next-auth.d.ts       # Session type extension
├── .env.example
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## Step 1 — Create a Neon Database (free)

1. Go to **https://neon.tech** and click **Sign up** (free, no credit card).
2. Click **New Project**. Give it a name (e.g. `testmoz`). Choose the region closest to you.
3. Neon creates a database automatically. On the project dashboard, click **Connection Details**.
4. In the dropdown, select **Prisma** as the connection type.
5. Copy the connection string. It looks like:
   ```
   postgresql://alex:AbcDefGhi123@ep-cool-forest-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
6. *(Optional but recommended)* Also enable **Connection Pooling** in Neon → Connection Details → toggle "Pooled connection". Copy that string too as `DIRECT_URL`.

---

## Step 2 — Clone / scaffold the project

If you have this folder already, skip to Step 3. Otherwise:

```bash
# Place the project folder wherever you like
cd ~/projects   # or wherever
# The folder 'testmoz' is your project root
```

---

## Step 3 — Create your .env.local

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

# Only needed if you enabled connection pooling in Neon:
# DIRECT_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

To generate `NEXTAUTH_SECRET`, run in your terminal:
```bash
openssl rand -base64 32
```

---

## Step 4 — Install dependencies

```bash
npm install
```

---

## Step 5 — Push the schema to Neon

This creates all the tables in your Neon database:

```bash
# For development (runs migrations and generates client):
npx prisma migrate dev --name init

# OR if you just want to push the schema without migration history:
npx prisma db push
```

Then generate the Prisma client:
```bash
npx prisma generate
```

---

## Step 6 — Run the dev server

```bash
npm run dev
```

Open **http://localhost:3000**. You'll be redirected to `/login`. Register a new account and start creating tests.

---

## Deploying to Production (Vercel)

1. Push your code to GitHub (make sure `.env.local` is in `.gitignore`).
2. Go to **https://vercel.com** → Import your repo.
3. In Vercel's Environment Variables, add the same keys from `.env.local`:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` → set to your Vercel deployment URL (e.g. `https://testmoz.vercel.app`)
4. Deploy. Vercel runs `npm run build` automatically.
5. After first deploy, run migrations against production:
   ```bash
   npx prisma migrate deploy
   ```

---

## Available npm scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start local dev server at http://localhost:3000 |
| `npm run build` | Build for production |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:migrate` | Create + apply a new migration (dev only) |
| `npm run db:push` | Sync schema to DB without migration history |
| `npm run db:studio` | Open Prisma Studio to browse your data |

---

## How the app works

### For test creators (requires login)
- Register/login at `/login`
- Dashboard at `/dashboard` — see all your tests
- Click **Edit** to open the test editor: add questions, configure settings, publish
- Once published, share the link `/take/<test-id>` with your students
- View submissions in the **Results** tab of the editor

### For test takers (no login required)
- Visit `/take/<test-id>`
- Enter your name (+ passcode if set)
- Take the test
- See your score and answer breakdown immediately (if allowed by settings)

### Question types supported
- Multiple choice (auto-graded)
- True / False (auto-graded)
- Fill in the blank (exact match, auto-graded)
- Short answer (exact match, auto-graded)
- Essay (submitted, marked as "Manual grade")

---

## Troubleshooting

**`Error: Can't reach database server`**
→ Check your `DATABASE_URL` in `.env.local`. Make sure `?sslmode=require` is at the end.

**`PrismaClientInitializationError`**
→ Run `npx prisma generate` to regenerate the client.

**`NEXTAUTH_SECRET` errors in production**
→ Make sure `NEXTAUTH_URL` matches your actual deployment URL exactly (no trailing slash).

**Neon connection timeouts in serverless**
→ Enable connection pooling in Neon dashboard and uncomment `directUrl` in `prisma/schema.prisma`.
