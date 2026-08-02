# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Linkfile production image
#
# Multi-stage so the final image contains only the standalone server output and
# its runtime dependencies — no source, no dev dependencies, no npm cache.
#
# Build:  docker build -t linkfile .
# Run:    docker run -p 3000:3000 -v linkfile-data:/app/.data linkfile
# ---------------------------------------------------------------------------

FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# --------------------------------------------------------------- dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --------------------------------------------------------------------- build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the build, so the public origin has to
# be known here — setting it only at runtime would leave canonical URLs, the
# sitemap and social previews pointing at localhost.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NODE_ENV=production

RUN npm run build

# ------------------------------------------------------------------- runtime
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as an unprivileged user. The click log directory is created up front and
# owned by that user so the volume mount is writable without a chown at boot.
RUN addgroup --system --gid 1001 linkfile \
  && adduser --system --uid 1001 --ingroup linkfile linkfile \
  && mkdir -p /app/.data \
  && chown -R linkfile:linkfile /app

COPY --from=builder --chown=linkfile:linkfile /app/public ./public
COPY --from=builder --chown=linkfile:linkfile /app/.next/standalone ./
COPY --from=builder --chown=linkfile:linkfile /app/.next/static ./.next/static

USER linkfile
EXPOSE 3000
VOLUME ["/app/.data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
