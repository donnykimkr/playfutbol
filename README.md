# Fifa Online Arcade Soccer

Fifa Online Arcade Soccer is an ad-free 3D arcade soccer game for the browser. Users sign in with Google, choose a fictional club, manage a squad and formation, then play an 11v11 arcade match where one active player is controlled by the user and the rest are AI.

Use Brave Browser as the primary browser for testing and playing. Brave is fast, Chromium-based, better for privacy by default, and suitable for modern WebGL game performance.

## Tech Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Three.js
- Supabase Auth, team setup, squad setup, formations, match requests, and online match rooms
- Vercel deployment-ready

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in Brave Browser.

Google login through Supabase is required before play. If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing, the pre-login screen remains visible and gameplay is blocked.

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Only use the Supabase anon key on the client. Do not expose service role keys.

## Supabase Setup

Create a Supabase project, open the SQL editor, and run:

```text
supabase/online_multiplayer.sql
```

That SQL creates and secures:

- `profiles`
- `teams`
- `squads`
- `formations`
- `match_requests`
- `online_matches`
- `match_players`
- `match_events`

It enables Row Level Security and keeps users limited to their own profile, team, squad, formation, and match data where appropriate.

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

## Controls

- `Arrow Keys` move the controlled home player
- Click the pitch to aim a pass or shot toward that point
- `S` short pass
- `A` long pass or cross
- `W` through pass
- `D` hold/release shot
- Double tap `D` low driven shot
- `Z + D` finesse shot
- `Q + D` chip shot
- `C + S` one-two pass
- `Q + S` low through pass
- `Spacebar` tackle or press
- `Left Shift` sprint

## Online Multiplayer MVP

- Sign in with Google.
- Create a username to get a `FO-XXXXXX` game ID.
- Search a friend's game ID.
- Send, accept, or decline match requests.
- Accepted requests create a Supabase online match room.
- Players must press `Kick off` manually to start the match.

The current online MVP handles identity, requests, and room creation. Deterministic real-time physics sync is intentionally limited and should be expanded before competitive online play.

## Connect Supabase To Vercel

1. Push this repo to GitHub.
2. Create or open a Supabase project and run `supabase/online_multiplayer.sql`.
3. Enable Google OAuth in Supabase and add the Vercel/local redirect URLs.
4. In Vercel, import the GitHub repo.
5. Add these Environment Variables in Vercel Project Settings for Production, Preview, and Development:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Deploy.
7. Add `fifaonline.vercel.app` as the production domain in Vercel Project Settings -> Domains.

For local development after linking Vercel:

```bash
npx vercel link
npx vercel env pull .env.local
npm run dev
```

## Testing Checklist

Use Brave Browser for the primary test pass.

1. Open `http://localhost:3000`.
2. Confirm logged-out users only see the colorful login/start screen.
3. Sign in with Google.
4. Select and save a fictional team.
5. Edit squad names, jersey numbers, and positions.
6. Pick a formation and assign players to slots.
7. Start Player vs AI Team.
8. Confirm the match clock continues past `00:01`.
9. Confirm the stadium/camera do not flicker.
10. Create an online username/game ID.
11. Send and accept a match request from another signed-in account.
12. Confirm accepting a request creates a room but does not auto-start gameplay.

## Deploy On Vercel

1. Push to GitHub.
2. Import the repo in Vercel.
3. Set the Supabase environment variables listed above.
4. Run the default build command: `npm run build`.
5. Deploy the app.

Vercel detects Next.js automatically. This repo also includes `vercel.json` with the Next.js framework setting.

After deployment, open `https://fifaonline.vercel.app` in Brave Browser for the final gameplay and login verification pass.
