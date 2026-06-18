# Deploying LWTS (Vercel + Neon)

The app runs on Vercel with a Neon (Postgres) database. Both have free tiers, and the
whole thing is set up from the browser — no CLI, no Docker.

## 1. Push to GitHub
```bash
git add -A
git commit -m "LWTS"
# create a repo and push (or use github.com)
```

## 2. Import the repo on Vercel
1. vercel.com → **Add New → Project** → import the repo.
2. Framework is auto-detected (Next.js). Click **Deploy** (the first build may fail
   because there's no database yet — that's fine, fix it in step 3).

## 3. Add the database (Neon)
1. In the Vercel project → **Storage** tab → **Create Database → Neon** → follow the
   prompts. Vercel automatically sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
2. Create the tables + seed the first invite code. Easiest from your machine:
   ```bash
   # paste your Neon connection strings (from the Neon/Vercel dashboard)
   export DATABASE_URL="postgresql://...-pooler.../lwts?sslmode=require"
   export DATABASE_URL_UNPOOLED="postgresql://...direct.../lwts?sslmode=require"
   npx prisma db push
   node prisma/seed.mjs
   ```
3. Add one more env var in Vercel → **Settings → Environment Variables**:
   - `SESSION_SECRET` = a long random string
4. **Redeploy** (Deployments tab → ⋯ → Redeploy).

## 4. Connect lwts.site
Vercel project → **Settings → Domains** → add `lwts.site`. Vercel shows one DNS record
to add at your registrar (or, if you put the domain on Cloudflare first, add it there).
SSL is automatic.

Done — https://lwts.site. Sign up with `11xwillwin`.

## Local dev
Put your Neon connection strings in `.env` (see `.env.example`) and run:
```bash
npm install
npm run setup   # prisma db push + seed
npm run dev
```
You can use the same Neon database for local dev, or create a separate Neon branch.

## Notes
- Schema changes: edit `prisma/schema.prisma`, then `npm run db:push`.
- `npm run smoke` runs a quick end-to-end check against whatever `DATABASE_URL` points to.
