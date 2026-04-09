# syntax=docker.io/docker/dockerfile:1
FROM node:lts-alpine AS base

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

# Install dependencies only when needed
FROM base AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files needed for deterministic installs
COPY package.json pnpm-lock.yaml .npmrc* ./

RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Optional: disable Next.js telemetry
# ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Optional: disable Next.js telemetry at runtime
# ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

# 🚀 Clean, fresh builds every time. Rebuild your future, one container at a time 😄
