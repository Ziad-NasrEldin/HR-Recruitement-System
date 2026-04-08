# ─── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:22.12-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile=false

# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:22.12-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (custom output path: src/generated/prisma)
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ─── Stage 3: Production runner ───────────────────────────────────────────────
FROM node:22.12-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache dumb-init
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone Next.js output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma schema + migrations for prisma migrate deploy
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Generated Prisma client (needed by seed script)
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

# Full node_modules needed for prisma CLI (WASM files, engines, etc.)
COPY --from=builder /app/node_modules ./node_modules

# Entrypoint
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["./docker-entrypoint.sh"]
