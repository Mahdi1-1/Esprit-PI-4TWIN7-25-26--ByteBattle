# -------- BUILDER --------
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma

# ✅ Générer ici
RUN pnpm exec prisma generate

COPY . .
RUN pnpm run build


# -------- PRODUCTION --------
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# ❌ SUPPRIMER cette ligne
# RUN pnpm exec prisma generate

EXPOSE 4001

CMD ["node", "dist/main"]