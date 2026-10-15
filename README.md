# HAMA ENTERPRISE NG — E-Commerce Store

Official online store for **HAMA ENTERPRISE NG** (RC: 8827959).

Dark cyberpunk UI · Next.js 15 · Prisma + Vercel Postgres · NextAuth (Email + Google) · Stripe (Cards + QR)

## Features

- Product catalog with filters
- Shopping cart & multi-step checkout
- Stripe Checkout (cards, Apple Pay, Google Pay) + QR code payment support
- Email/password + Google authentication
- Admin inventory & order dashboard
- Fully responsive dark theme matching the provided UI designs

## Tech Stack

| Layer      | Technology                            |
|------------|---------------------------------------|
| Frontend   | Next.js 15 (App Router) + Tailwind    |
| Auth       | NextAuth.js v5 (Auth.js)              |
| Database   | PostgreSQL (Vercel Postgres) + Prisma |
| Payments   | Stripe Checkout + Payment Links       |
| Deployment | Vercel                                |

## Getting Started

```bash
git clone https://github.com/WebDevNinja12/hama-enterprise-store.git
cd hama-enterprise-store
npm install
cp .env.example .env
# fill in env vars
npx prisma db push
npm run dev
```

## Deploy to Vercel

1. Import the GitHub repo in Vercel
2. Create a Vercel Postgres database
3. Add all environment variables from `.env.example`
4. Deploy

© HAMA ENTERPRISE NG. All rights reserved.
