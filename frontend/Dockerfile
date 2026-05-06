# ── Stage 1: Build ─────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_FETCH_RETRIES=5 \
    PNPM_FETCH_RETRY_FACTOR=2 \
    PNPM_FETCH_RETRY_MINTIMEOUT=10000 \
    PNPM_FETCH_RETRY_MAXTIMEOUT=120000 \
    PNPM_NETWORK_CONCURRENCY=8

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN for attempt in 1 2 3; do pnpm install --frozen-lockfile && exit 0; echo "pnpm install failed on attempt ${attempt}, retrying..."; sleep $((attempt * 15)); done; exit 1

COPY . .
RUN pnpm run build

# ── Stage 2: Serve with Nginx ──────────────────────────────
FROM nginx:alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
