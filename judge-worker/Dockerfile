# ── Stage 1: Build ─────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN pnpm run build

# ── Stage 2: Production ───────────────────────────────────
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install Docker CLI (needed to spawn sandbox containers)
RUN apk add --no-cache docker-cli

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy sandbox Dockerfiles for building sandbox images
COPY --from=builder /app/sandbox ./sandbox

EXPOSE 3000

CMD ["node", "dist/main"]
