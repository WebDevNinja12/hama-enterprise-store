# HAMA ENTERPRISE NG — E-Commerce Store

Official store for **HAMA ENTERPRISE NG** (RC: 8827959).

Dark cyberpunk UI · Next.js 15 · Prisma · NextAuth · Stripe-ready

## Local development

```bash
git clone https://github.com/WebDevNinja12/hama-enterprise-store.git
cd hama-enterprise-store
npm install

# Create env file
cp .env.example .env
# Edit .env — set DATABASE_URL and AUTH_SECRET / NEXTAUTH_SECRET

npx prisma db push
npm run dev
```

Open http://localhost:3000

## Required environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Postgres connection string |
| `AUTH_SECRET` or `NEXTAUTH_SECRET` | Yes | Random secret for sessions |
| `NEXTAUTH_URL` | Yes in prod | Full site URL |
| `GOOGLE_CLIENT_ID` / `SECRET` | Optional | Google login |
| `STRIPE_*` | Optional | Payments |

## Deploy on Vercel

1. Import this GitHub repo in Vercel
2. Add **Vercel Postgres** (Storage → Create → Postgres)
3. Copy `DATABASE_URL` into Environment Variables
4. Add `AUTH_SECRET` and `NEXTAUTH_SECRET` (same value from `openssl rand -base64 32`)
5. Set `NEXTAUTH_URL` to your Vercel domain
6. Deploy

After first deploy, run in Vercel → Storage → Postgres, or locally:

```bash
npx prisma db push
```

© HAMA ENTERPRISE NG
