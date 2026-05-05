# ── Stage 1: Build ─────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
RUN pnpm exec prisma generate

COPY . .
RUN pnpm run build

# ── Stage 2: Production ───────────────────────────────────
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install Docker CLI (needed to spawn sandbox containers)
RUN apk add --no-cache docker-cli

WORKDIR /app
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/sandbox ./sandbox
RUN pnpm exec prisma generate

EXPOSE 3000

CMD ["node", "dist/main.js"]
