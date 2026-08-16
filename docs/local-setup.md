# HR Recruitment System local setup

Product overview is in the root [README](../README.md). Repo name stays HR-Recruitement-System.

## Stack

- Next.js 16 / React 19 / TypeScript
- NextAuth, next-intl (en, ar, de, fr; Arabic is RTL)
- Prisma on PostgreSQL
- Node.js 22.12+

## Env

Copy `.env.example` to `.env`. Set `DATABASE_URL`, `AUTH_URL`, `AUTH_SECRET`, and the `SUPER_ADMIN_*` seed fields. Do not commit real secrets.

## Local run

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

App: http://localhost:3000 — login if signed out, dashboard if signed in.

## What is in the app

- Recruiters and super-admins: dashboard, leads, offers, commissions, analytics
- Super-admins also: post generator, campaigns, Facebook groups, user settings
- Lead pipeline: sourced → contacted → voice note → validated → interview → accepted/rejected → training → commission
- Voice notes can be assessed (transcription, English level, pass/fail)
- Offers import via xlsx; Facebook groups import via CSV or URL
