# Fifa Online Arcade Soccer

Fifa Online Arcade Soccer is an ad-free 3D arcade soccer game for the browser. You control one active player while AI teammates and opponents play around you. It supports Player vs AI Team, an online match-request lobby for signed-in users, Google login through Supabase Auth, and an optional online leaderboard.

Use Brave Browser as the primary browser for testing and playing. Brave is fast, Chromium-based, better for privacy by default, and suitable for modern WebGL game performance.

## Tech Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Three.js
- Supabase Auth and leaderboard with graceful local fallback
- Supabase online profiles, match requests, match rooms, and realtime-ready state
- Vercel deployment-ready

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in Brave Browser.

Supabase is optional for local play. If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing, matches still work and online login/leaderboard saving are disabled.

## Controls

Player 1:

- `Arrow Keys` move the cyan player
- Click the pitch to aim a pass or shot toward that point
- `S` makes a short pass
- `A` makes a long pass or cross
- `W` sends a through pass
- `D` shoots; double tap `D` quickly for a low driven shot
- `Z + D` curls a finesse shot
- `Q + D` chips the ball
- `C + S` starts a one-two pass and sends the original passer forward
- `Q + S` sends a low through pass
- `Spacebar` attempts a tackle or press when defending
- `Left Shift` sprints

Online Multiplayer MVP:

- Sign in with Google.
- Create a username to get a `FO-XXXXXX` game ID.
- Search a friend's game ID, send a match request, and accept/decline incoming requests.
- Accepted requests create a Supabase match room and start an online 1v1 session shell. The current MVP syncs lobby/request/room state; deterministic real-time physics input sync is intentionally limited and should be expanded before competitive play.

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

Create a Supabase project, open the SQL editor, and run the full SQL saved in `supabase/leaderboard.sql`. The excerpt below shows the leaderboard core; the file also includes the exact online multiplayer tables, RLS policies, and realtime publication setup.

```sql
create extension if not exists pgcrypto;

create table if not exists leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null,
  score integer not null,
  goals_scored integer not null default 0,
  result text not null default 'draw',
  gems integer not null default 0,
  level integer not null default 1,
  created_at timestamptz default now(),
  constraint leaderboard_nickname_length check (char_length(nickname) between 2 and 16),
  constraint leaderboard_positive_score check (score > 0),
  constraint leaderboard_nonnegative_goals check (goals_scored >= 0),
  constraint leaderboard_valid_result check (result in ('win', 'lose', 'draw')),
  constraint leaderboard_nonnegative_gems check (gems >= 0),
  constraint leaderboard_positive_level check (level > 0)
);

alter table leaderboard
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table leaderboard
add column if not exists goals_scored integer not null default 0;

alter table leaderboard
add column if not exists result text not null default 'draw';

alter table leaderboard
drop constraint if exists leaderboard_nonnegative_goals;

alter table leaderboard
add constraint leaderboard_nonnegative_goals check (goals_scored >= 0);

alter table leaderboard
drop constraint if exists leaderboard_valid_result;

alter table leaderboard
add constraint leaderboard_valid_result check (result in ('win', 'lose', 'draw'));

alter table leaderboard enable row level security;

drop policy if exists "Anyone can read leaderboard" on leaderboard;
create policy "Anyone can read leaderboard"
on leaderboard
for select
using (true);

drop policy if exists "Anyone can submit leaderboard scores" on leaderboard;
drop policy if exists "Authenticated users can submit their own scores" on leaderboard;
create policy "Authenticated users can submit their own scores"
on leaderboard
for insert
to authenticated
with check (
  auth.uid() is not null
  and user_id = auth.uid()
  and char_length(nickname) between 2 and 16
  and score > 0
  and goals_scored >= 0
  and result in ('win', 'lose', 'draw')
  and gems >= 0
  and level > 0
);

create index if not exists leaderboard_score_idx
on leaderboard (score desc, created_at asc);
```

The app validates nicknames as 2-16 characters and only submits positive integer scores. Guests can play, but only authenticated users can upload online scores.

The SQL file also creates:

- `profiles` for usernames and game IDs
- `match_requests` for friend challenges
- `matches` for accepted online rooms and realtime-ready JSON match state
- RLS policies so authenticated users can only create/update their own profile, their own requests, and rooms they participate in

## Google OAuth Setup

1. In Supabase, go to Authentication -> Providers.
2. Enable Google.
3. Create OAuth credentials in Google Cloud Console.
4. Add the Google Client ID and Client Secret to the Supabase Google provider.
5. In Supabase Authentication -> URL Configuration, set:
   - Site URL for local testing: `http://localhost:3000`
   - Site URL for production: `https://fifaonline.vercel.app`
   - Redirect URLs:
     - `http://localhost:3000`
     - `http://localhost:3000/**`
     - `https://fifaonline.vercel.app`
     - `https://fifaonline.vercel.app/**`

If you deploy to a different Vercel domain, add that exact domain and wildcard redirect URL too.

## Connect Supabase To Vercel

1. Push this repo to GitHub.
2. Create or open a Supabase project and run `supabase/leaderboard.sql`.
3. Enable Google OAuth in Supabase and add the Vercel/local redirect URLs.
4. In Vercel, import the GitHub repo as a new project.
5. Add these Environment Variables in Vercel Project Settings for Production, Preview, and Development:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Deploy.
7. Add `fifaonline.vercel.app` as the production domain in Vercel Project Settings -> Domains. If Vercel reports the subdomain is taken, choose the closest available `fifaonline-*` alternative and add that exact URL to Supabase Auth redirects.

If you use the Supabase integration from Vercel Marketplace, Supabase can synchronize environment variables to Vercel for connected projects. Confirm the public client variables above exist with the `NEXT_PUBLIC_` prefix.

For local development after linking Vercel:

```bash
npx vercel link
npx vercel env pull .env.local
npm run dev
```

## Testing Checklist

Use Brave Browser for the primary test pass.

1. Open `http://localhost:3000` in Brave Browser.
2. Test Player vs AI Team: kickoff, movement, shooting, scoring, kickoff reset, timer, and end screen.
3. Confirm Guest mode can play without crashing and cannot upload an online score.
4. Sign in with Google through Supabase Auth.
5. Confirm the signed-in display name or email appears.
6. Create an online username/game ID.
7. Send and accept a match request from another signed-in account.
8. Confirm an online room appears and can start the match shell.
9. Save a Player vs AI score and confirm it appears in the leaderboard.
10. Use the logout button and confirm the UI returns to Guest mode.

## Deploy On Vercel

1. Push to GitHub.
2. Import the repo in Vercel.
3. Set the Supabase environment variables listed above.
4. Run the default build command: `npm run build`.
5. Deploy the app.

Vercel detects Next.js automatically. This repo also includes `vercel.json` with the Next.js framework setting.

After deployment, open `https://fifaonline.vercel.app` in Brave Browser for the final gameplay and login verification pass. If Vercel cannot assign that exact domain, use the closest available Vercel domain shown in the deployment output and update Supabase redirects to match.
