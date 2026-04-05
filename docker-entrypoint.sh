#!/bin/sh
set -e

echo "→ Running database migrations..."
DATABASE_URL="$DATABASE_URL" ./node_modules/.bin/prisma migrate deploy

echo "→ Starting Next.js..."
exec node server.js
