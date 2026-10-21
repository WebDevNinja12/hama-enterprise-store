# HAMA ENTERPRISE NG — E-Commerce Store

Official store for **HAMA ENTERPRISE NG**.

Next.js · Prisma · NextAuth · OPay-ready · Vercel

## Security notice

- **Never commit** `.env` or real API keys, database passwords, or tokens.
- Only `.env.example` (empty placeholders) belongs in Git.
- Put real secrets only in **Vercel → Settings → Environment Variables**.
- If a secret was ever shared in chat or a screenshot, **rotate it** (create a new key and revoke the old one).

## Local development

```bash
git clone https://github.com/WebDevNinja12/hama-enterprise-store.git
cd hama-enterprise-store
npm install
cp .env.example .env
# Edit .env with YOUR values only on your machine
npx prisma db push
npm run dev
```

## Required environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Postgres connection string |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Yes | Random session secret |
| `NEXTAUTH_URL` | Yes in prod | Full site URL |
| `RESEND_API_KEY` | For email | OTP, order updates |
| `BLOB_READ_WRITE_TOKEN` | For uploads | Vercel Blob |
| `OPAY_*` | For OPay pay | Merchant ID, public + secret keys |
| `GOOGLE_CLIENT_*` | Optional | Google login |

## Deploy on Vercel

1. Import this GitHub repo
2. Add environment variables (never in the repo)
3. Deploy
4. Run schema push if needed (`npx prisma db push` against production DB)

© HAMA ENTERPRISE NG
