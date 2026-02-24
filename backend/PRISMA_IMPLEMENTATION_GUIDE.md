# 🔧 Guide d'implémentation Prisma + NestJS + MongoDB

## 📦 Étape 1 — Installation des packages

```bash
pnpm add @prisma/client
pnpm add -D prisma
```

---

## 🚀 Étape 2 — Initialiser Prisma

```bash
npx prisma init --datasource-provider mongodb
```

Cela crée :
- `prisma/schema.prisma`
- `.env` avec `DATABASE_URL`

---

## 🔑 Étape 3 — Configurer `.env`

```env
DATABASE_URL="mongodb://localhost:27017/nom-de-ta-base"
JWT_SECRET="change-moi-secret-key"
JWT_EXPIRES_IN="7d"
PORT=4000
NODE_ENV=development
```

---

## 📐 Étape 4 — Définir le schéma (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  email     String   @unique
  username  String   @unique
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  posts     Post[]
}

model Post {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  title     String
  content   String?
  authorId  String   @db.ObjectId
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}

enum Role {
  USER
  ADMIN
}
```

### ⚠️ Règles obligatoires pour MongoDB

| Règle | Exemple |
|-------|---------|
| Chaque `@id` doit avoir | `@id @default(auto()) @map("_id") @db.ObjectId` |
| Chaque FK (clé étrangère) doit avoir | `@db.ObjectId` |
| **Pas** de `@@map("table_name")` | MongoDB utilise le nom du model |
| **Pas** de `autoincrement()` | Utiliser `@default(auto())` |
| **Pas** de `migrate dev` | Utiliser `db push` uniquement |

---

## ⚙️ Étape 5 — Générer le Prisma Client

```bash
npx prisma generate
```

> ⚠️ **À relancer après chaque modification du schema.prisma**

---

## 📤 Étape 6 — Pousser le schéma vers MongoDB

```bash
npx prisma db push
```

---

## 🏗️ Étape 7 — Créer le PrismaService

**Fichier : `src/prisma/prisma.service.ts`**

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

---

## 📦 Étape 8 — Créer le PrismaModule

**Fichier : `src/prisma/prisma.module.ts`**

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

> `@Global()` = PrismaService disponible dans toute l'app sans ré-import

---

## 🔗 Étape 9 — Importer dans AppModule

**Fichier : `src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
```

---

## 🛠️ Étape 10 — Utiliser dans un Service

**Fichier : `src/users/users.service.ts`**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Lister tous les utilisateurs
  findAll() {
    return this.prisma.user.findMany();
  }

  // Trouver par ID
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // Trouver par email
  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // Créer
  create(data: { email: string; username: string; password: string }) {
    return this.prisma.user.create({ data });
  }

  // Mettre à jour
  update(id: string, data: { username?: string; email?: string }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  // Supprimer
  delete(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  // Avec relations
  findWithPosts(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { posts: true },
    });
  }

  // Pagination
  findPaginated(page: number = 1, limit: number = 20) {
    return this.prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

---

## 📋 Résumé des commandes (dans l'ordre)

```bash
# 1. Installer
pnpm add @prisma/client
pnpm add -D prisma

# 2. Initialiser
npx prisma init --datasource-provider mongodb

# 3. Éditer .env + schema.prisma

# 4. Générer le client
npx prisma generate

# 5. Pousser vers MongoDB
npx prisma db push

# 6. Visualiser les données (optionnel)
npx prisma studio

# 7. Build + Start
pnpm build
pnpm start:dev
```

---

## ⚠️ Erreurs fréquentes et solutions

| Problème | Solution |
|----------|----------|
| `Cannot find module '@prisma/client'` | Lancer `npx prisma generate` |
| `Environment variable not found: DATABASE_URL` | Vérifier que `.env` existe et contient `DATABASE_URL` |
| `PrismaClientInitializationError` | MongoDB n'est pas lancé → `docker start some-mongo` |
| `bcrypt MODULE_NOT_FOUND` | Remplacer `bcrypt` par `bcryptjs` (pure JS) |
| Schema modifié mais pas reflété | `npx prisma generate` puis `npx prisma db push` |
| `Unique constraint failed` | Le champ `@unique` a un doublon dans la base |
| `.env` vide malgré l'édition dans VS Code | Écrire via terminal : `cat > .env << 'EOF' ... EOF` |

---

## 🐳 Lancer MongoDB avec Docker

```bash
# Créer et démarrer le conteneur
docker run -d --name some-mongo -p 27017:27017 mongo:latest

# Vérifier qu'il tourne
docker ps | grep mongo

# Redémarrer un conteneur existant
docker start some-mongo
```

---

## 📂 Structure de fichiers finale

```
backend/
├── .env
├── package.json
├── prisma/
│   └── schema.prisma
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── prisma/
    │   ├── prisma.module.ts
    │   └── prisma.service.ts
    ├── auth/
    │   ├── auth.module.ts
    │   ├── auth.controller.ts
    │   └── auth.service.ts
    └── users/
        ├── users.module.ts
        ├── users.controller.ts
        └── users.service.ts
```
