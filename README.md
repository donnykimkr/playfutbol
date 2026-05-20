# Skyline Dash

Skyline Dash is an ad-free browser game inspired by 3D tile runners. A ball moves forward automatically through a neon path while the player moves left and right, avoids gaps and moving obstacles, collects gems, and tries to reach the finish.

Brave Browser is recommended for testing and playing because it is fast, Chromium-based, and good for modern web games.

## Tech Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Three.js
- Supabase leaderboard with graceful local fallback
- Vercel deployment-ready

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Make sure the app runs locally before deploying. Supabase is optional for local play: if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing, the game still works and the UI shows that the online leaderboard is disabled.

## Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Then fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Only use the Supabase anon key on the client. Do not expose service role keys.

## Supabase Setup

Create a Supabase project, open the SQL editor, and run the SQL below. The same SQL is also saved in `supabase/leaderboard.sql`.

```sql
create extension if not exists pgcrypto;

create table if not exists leaderboard (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  score integer not null,
  gems integer not null default 0,
  level integer not null default 1,
  created_at timestamptz default now(),
  constraint leaderboard_nickname_length check (char_length(nickname) between 2 and 16),
  constraint leaderboard_positive_score check (score > 0),
  constraint leaderboard_nonnegative_gems check (gems >= 0),
  constraint leaderboard_positive_level check (level > 0)
);

alter table leaderboard enable row level security;

drop policy if exists "Anyone can read leaderboard" on leaderboard;
create policy "Anyone can read leaderboard"
on leaderboard
for select
using (true);

drop policy if exists "Anyone can submit leaderboard scores" on leaderboard;
create policy "Anyone can submit leaderboard scores"
on leaderboard
for insert
with check (
  char_length(nickname) between 2 and 16
  and score > 0
  and gems >= 0
  and level > 0
);

create index if not exists leaderboard_score_idx
on leaderboard (score desc, created_at asc);
```

The app validates nicknames as 2-16 characters and only submits positive integer scores.

## Connect Supabase To Vercel

The project is prepared for the simplest Vercel connection path:

1. Push this repo to GitHub.
2. Create or open a Supabase project and run `supabase/leaderboard.sql`.
3. In Vercel, import the GitHub repo as a new project.
4. Add these Environment Variables in Vercel Project Settings for Production, Preview, and Development:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy.

If you use the Supabase integration from Vercel Marketplace, Supabase can synchronize environment variables to Vercel for connected projects. Confirm the public client variables above exist with the `NEXT_PUBLIC_` prefix, because Next.js only exposes client-side variables with that prefix.

For local development after linking Vercel:

```bash
npx vercel link
npx vercel env pull .env.local
npm run dev
```

## Controls

- Desktop: `A` / `Left Arrow` moves left, `D` / `Right Arrow` moves right.
- Mobile: tap the left/right buttons or swipe horizontally.

## Deploy On Vercel

1. Push to GitHub.
2. Import the repo in Vercel.
3. Set the Supabase environment variables listed above.
4. Run the default build command: `npm run build`.
5. Deploy the app.

Vercel detects Next.js automatically. This repo also includes `vercel.json` with the Next.js framework setting.
