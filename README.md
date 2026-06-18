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

## Deploying
See `DEPLOY.md` — Vercel + Neon, set up from the browser. Set a real `SESSION_SECRET`
in production.
