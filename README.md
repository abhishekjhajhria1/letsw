# LWTS

Invite-only accountability app. You pair up with one person for a season, you each
pick a goal, and you check in every day. Your partner has to verify your check-in,
you verify theirs. Streaks, a leaderboard, and a focus timer on top.

Live at [lwts.site](https://lwts.site).

## Stack
- Next.js (App Router) + TypeScript
- Tailwind v4
- Prisma + Postgres (Neon)
- Cookie sessions, bcrypt passwords

## Local setup

```bash
npm install
cp .env.example .env   # then paste your Neon connection strings
npm run setup          # creates the tables + the first invite code
npm run dev
```

Sign up with the code `11xwillwin`. After that, members generate their own codes.

## Scripts
- `npm run dev` / `npm run build` / `npm run start`
- `npm run setup` — db push + seed
- `npm run db:studio` — browse the db
- `npm run smoke` / `node prisma/smoke-counters.mjs` — quick checks

## Notes
- User stats are cached on the row and updated on write, so the leaderboard/crew
  pages stay cheap. Run `npm run db:backfill` once if you change how those are computed.
- It's a PWA (installable, works offline-ish via `public/sw.js`).
- Light/dark theme, sound effects, all client-side.
- **Notifications:** Web Push (VAPID) + an in-app feed/bell. Partners get pinged on
  check-in, verify, invite/accept, nudge, focus-session-started, and daily reminders.
  Needs the `VAPID_*` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` env vars (see `.env.example`).
- **Focus tools** (on `/app/timer`): co-focus/body-doubling sessions with live partner
  presence, synthesized white/brown/rain sounds, and per-season daily intentions.
- **Reminders:** `GET /api/cron/reminders` (protected by `CRON_SECRET`) — drive it from a
  free external cron every ~15 min. See `DEPLOY.md`.

## Deploying
See `DEPLOY.md` — Vercel + Neon, set up from the browser. Set a real `SESSION_SECRET`
in production.
