ARG NODE_VERSION=22-alpine
ARG PNPM_VERSION=9

# ──────────────────────────────────────────────
# Stage 1: Dependencies (with dev deps for build)
# ──────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION}
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm install --frozen-lockfile

# ──────────────────────────────────────────────
# Stage 2: Builder
# ──────────────────────────────────────────────
FROM node:${NODE_VERSION} AS builder
ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION}
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm install --frozen-lockfile
COPY --from=deps /app/node_modules ./node_modules
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ──────────────────────────────────────────────
# Stage 3: Development (hot-reload)
# ──────────────────────────────────────────────
FROM node:${NODE_VERSION} AS development
ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION}
WORKDIR /app
RUN apk add --no-cache curl
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm install --frozen-lockfile
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
CMD ["pnpm", "dev"]

# ──────────────────────────────────────────────
# Stage 4: Production Runner
# ──────────────────────────────────────────────
FROM node:${NODE_VERSION} AS production
RUN corepack enable
WORKDIR /app
RUN apk add --no-cache curl ca-certificates tzdata \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && mkdir -p /app/.next /app/.next/cache \
  && chown -R nextjs:nodejs /app

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
