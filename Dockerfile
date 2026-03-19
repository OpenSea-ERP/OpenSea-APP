# ===============================================
# OpenSea-APP Dockerfile
# Multi-stage build for optimized Next.js production
# ===============================================

# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Install dependencies only
COPY package*.json ./
RUN npm ci --ignore-scripts && npm cache clean --force

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_EXTERNAL_API_BASE_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_EXTERNAL_API_BASE_URL=${NEXT_PUBLIC_EXTERNAL_API_BASE_URL}

# Build the application
RUN npm run build

# Stage 3: Runner (production)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# Next.js 16 standalone output nests files under a project-name subdirectory.
# We flatten it so server.js lives at /app/server.js.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Copy standalone — try nested path first (Next.js 16+), fall back to flat (Next.js 14/15)
RUN --mount=from=builder,source=/app/.next/standalone,target=/tmp/standalone \
    if [ -f /tmp/standalone/server.js ]; then \
      cp -r /tmp/standalone/. ./; \
    else \
      dir=$(ls -d /tmp/standalone/*/server.js 2>/dev/null | head -1 | xargs dirname); \
      cp -r "$dir"/. ./; \
      cp -r /tmp/standalone/node_modules ./node_modules; \
    fi

# Set correct ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
