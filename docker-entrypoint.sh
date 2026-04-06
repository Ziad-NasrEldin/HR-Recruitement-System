#!/bin/sh
set -e

echo "→ Pushing database schema..."
DATABASE_URL="$DATABASE_URL" ./node_modules/.bin/prisma db push --skip-generate

echo "→ Seeding database..."
DATABASE_URL="$DATABASE_URL" ./node_modules/.bin/tsx prisma/seed.ts || true

echo "→ Starting Next.js..."
exec node server.js
