# ============================================
# HeizPro KI – Dockerfile fuer Dokploy
# ============================================

FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Dependencies stage
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# Build stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV WS_PORT=3001
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy DB migrations and seed scripts
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src/lib/db ./src/lib/db
COPY --from=builder /app/src/lib/mock-data.ts ./src/lib/mock-data.ts
COPY --from=builder /app/src/lib/sales-scripts.ts ./src/lib/sales-scripts.ts
COPY --from=builder /app/src/types ./src/types

# Copy WebSocket server + speech engine (for optional Speech Engine mode)
COPY --from=builder /app/ws-server.ts ./ws-server.ts
COPY --from=builder /app/src/lib/speech-engine.ts ./src/lib/speech-engine.ts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

USER nextjs

# Next.js app on 3000, optional WS server on 3001
EXPOSE 3000 3001

# Start Next.js. WS server can be run separately with: node --import tsx ws-server.ts
# Run migrations + seed on first deploy: pnpm run db:migrate && pnpm run db:seed
CMD ["node", "server.js"]
