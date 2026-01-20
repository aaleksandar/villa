# syntax=docker/dockerfile:1.4
# Production Dockerfile for Villa Monorepo - Optimized for Turborepo + Bun

# Stage 1: Dependencies with bun
FROM oven/bun:1-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files for all workspaces
COPY package.json bun.lock ./
COPY apps/hub/package.json ./apps/hub/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/

# Install dependencies
RUN bun install --frozen-lockfile

# Stage 2: Build with Turborepo
FROM oven/bun:1-alpine AS builder
RUN apk add --no-cache nodejs npm
WORKDIR /app

# Copy all installed deps from deps stage
COPY --from=deps /app/node_modules ./node_modules/
COPY --from=deps /app/apps ./apps/
COPY --from=deps /app/packages ./packages/
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Next.js public env vars must be set at build time (inlined into client bundle)
ARG NEXT_PUBLIC_CHAIN_ID=84532
ENV NEXT_PUBLIC_CHAIN_ID=$NEXT_PUBLIC_CHAIN_ID

# Build with Turborepo (builds all dependencies first)
RUN bun --filter @villa/hub run build

# Stage 3: Production-optimized runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy entire standalone directory to preserve symlink structure
COPY --from=builder --chown=nextjs:nodejs /app/apps/hub/.next/standalone ./

# Copy static assets and public files into the correct location
COPY --from=builder --chown=nextjs:nodejs /app/apps/hub/.next/static ./apps/hub/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/hub/public ./apps/hub/public

USER nextjs
EXPOSE 3000

# Server.js is inside apps/hub/ in the monorepo structure
WORKDIR /app/apps/hub

# Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
