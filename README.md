# Fifa Online Arcade Soccer

Fifa Online Arcade Soccer is an ad-free 3D browser football game. It focuses on fast local play: one active player, AI teammates, AI opponents, ball physics, goal kicks, throw-ins, corners, and a side broadcast camera.

Use Brave Browser as the primary browser for testing and playing. Brave is fast, Chromium-based, better for privacy by default, and suitable for modern WebGL game performance.

## Tech Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Three.js
- Supabase anon client for anonymous analytics and room-code multiplayer MVP
- Vercel deployment-ready

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in Brave Browser. No account is required. If Supabase environment variables are missing, single-player gameplay still works and analytics/room codes are disabled.

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Only use the Supabase anon key on the client. Do not expose service role keys.

## Supabase Setup

Create a Supabase project, open the SQL editor, and run:

```text
supabase/anonymous_analytics.sql
```

That SQL creates:

- `visitors`
- `page_views`
- `game_sessions`
- `rooms`
- `analytics_summary`

Tracked analytics are anonymous only:

- unique visitors
- page views
- matches started
- matches completed
- average match duration

The app generates a `visitor_id` with `crypto.randomUUID()` on first visit and stores it in `localStorage`. It does not collect names, email addresses, account identifiers, or other personal data.

## Controls

- `Arrow Keys` move the controlled home player
- Click the pitch to aim a pass or shot toward that point
- `S` switches controlled player in manual mode
- `A` long pass or cross
- `W` through pass
- `D` hold/release shot
- Double tap `D` low driven shot
- `Z + D` finesse shot
- `Spacebar` tackle or press
- `U` toggles AI/autopilot mode

Mobile and iPad controls show a joystick plus action buttons for Pass, Through, Shoot, and AI ON/OFF.

## Room-Code Multiplayer MVP

- No account is required.
- Create a room to get a short room code.
- Another player can join with that code.
- Supabase Realtime listens for room status updates.

Current limitation: the MVP syncs room presence and readiness. Full deterministic real-time gameplay/physics sync is intentionally limited and should be added later before competitive online play.

## Connect Supabase To Vercel

1. Create or open a Supabase project.
2. Run `supabase/anonymous_analytics.sql` in the Supabase SQL editor.
3. In Vercel Project Settings, add these Environment Variables for Production, Preview, and Development:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy the Vercel project.

For local development after linking Vercel:

```bash
npx vercel link
npx vercel env pull .env.local
npm run dev
```

## Testing Checklist

Use Brave Browser for the primary test pass.

1. Open `http://localhost:3000`.
2. Confirm there is no account gate.
3. Start Player vs AI.
4. Confirm the match clock continues past `00:01`.
5. Confirm the stadium/camera do not flicker or spin in the menu.
6. Confirm `End game` returns to the menu.
7. Confirm goal kicks choose short/medium/long options instead of always full power.
8. Confirm room-code UI works when Supabase env vars are configured.
9. Open `http://localhost:3000/?perf=1` and confirm FPS/frame time.

## Deploy On Vercel

1. Push the repo to GitHub.
2. Import or connect the repo in Vercel.
3. Set the Supabase environment variables listed above if you want analytics/room-code multiplayer.
4. Run the default build command: `npm run build`.
5. Deploy.
6. Add `fifaonline.vercel.app` as the production domain in Vercel Project Settings -> Domains.

After deployment, open `https://fifaonline.vercel.app` in Brave Browser for the final gameplay verification pass.
