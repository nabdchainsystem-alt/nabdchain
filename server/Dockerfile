# =============================================================================
# NABD Backend — Multi-stage Production Build
# =============================================================================

# Stage 1: Build
FROM node:20-alpine AS builder
RUN corepack enable pnpm

WORKDIR /app

# Install dependencies first (cache layer)
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile
RUN npx prisma generate

# Copy source and compile TypeScript
COPY . .
RUN pnpm tsc

# Stage 2: Production
FROM node:20-alpine AS production

# Security: run as non-root
RUN addgroup -S nabd && adduser -S nabd -G nabd

WORKDIR /app

# Copy package files and install production dependencies only
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN corepack enable pnpm && pnpm install --frozen-lockfile --prod
RUN npx prisma generate

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Set ownership
RUN chown -R nabd:nabd /app
USER nabd

# Environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
