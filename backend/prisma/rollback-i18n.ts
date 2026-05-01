/**
 * Script de ROLLBACK — i18n Stratégie A
 * Convertit les champs Json { fr, en, ar } → String simple (valeur fr ou première disponible)
 *
 * Usage :
 *   cd backend
 *   ts-node prisma/rollback-i18n.ts
 *
 * ⚠️  Ce script annule la migration i18n.
 *     À exécuter AVANT de retirer les champs Json du schema.prisma.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function extractString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const t = value as Record<string, any>;
    // Cas spécial : { set: { fr, en, ar } } — artefact du bug de migration
    if (t['set'] && typeof t['set'] === 'object') {
      return extractString(t['set']);
    }
    return t['fr'] || t['en'] || t['ar'] || Object.values(t).find(v => typeof v === 'string') || '';
  }
  return '';
}

function isTranslatable(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as Record<string, any>;
  // Cas normal { fr, en, ar } ou cas bugué { set: { fr, en, ar } }
  return 'fr' in t || 'en' in t || 'ar' in t || ('set' in t && typeof t['set'] === 'object');
}

async function rollbackChallenges() {
  console.log('\n📦 Rollback: Challenge.title + Challenge.descriptionMd');
  const challenges = await (prisma as any).challenge.findMany();
  let done = 0;

  for (const c of challenges) {
    if (!isTranslatable(c.title) && !isTranslatable(c.descriptionMd)) continue;

    await (prisma as any).challenge.update({
      where: { id: c.id },
      data: {
        title: { set: extractString(c.title) },
        descriptionMd: { set: extractString(c.descriptionMd) },
      },
    });
    done++;
    process.stdout.write(`\r  ${done}/${challenges.length} challenges rollbackés`);
  }
  console.log(`\n  ✅ ${done} traités`);
}

async function rollbackBadges() {
  console.log('\n🏅 Rollback: Badge.name + Badge.ruleText');
  const badges = await (prisma as any).badge.findMany();
  let done = 0;

  for (const b of badges) {
    if (!isTranslatable(b.name) && !isTranslatable(b.ruleText)) continue;

    await (prisma as any).badge.update({
      where: { id: b.id },
      data: {
        name: { set: extractString(b.name) },
        ruleText: { set: extractString(b.ruleText) },
      },
    });
    done++;
    process.stdout.write(`\r  ${done}/${badges.length} badges rollbackés`);
  }
  console.log(`\n  ✅ ${done} traités`);
}

async function rollbackHackathons() {
  console.log('\n🚀 Rollback: Hackathon.title + Hackathon.description');
  const hackathons = await (prisma as any).hackathon.findMany();
  let done = 0;

  for (const h of hackathons) {
    const needsRollback = isTranslatable(h.title) || (h.description && isTranslatable(h.description));
    if (!needsRollback) continue;

    await (prisma as any).hackathon.update({
      where: { id: h.id },
      data: {
        title: { set: extractString(h.title) },
        ...(h.description != null && {
          description: { set: extractString(h.description) },
        }),
      },
    });
    done++;
    process.stdout.write(`\r  ${done}/${hackathons.length} hackathons rollbackés`);
  }
  console.log(`\n  ✅ ${done} traités`);
}

async function rollbackNotifications() {
  console.log('\n🔔 Rollback: Notification.message');
  const notifications = await (prisma as any).notification.findMany();
  let done = 0;

  for (const n of notifications) {
    if (!isTranslatable(n.message)) continue;

    await (prisma as any).notification.update({
      where: { id: n.id },
      data: {
        message: { set: extractString(n.message) },
      },
    });
    done++;
    if (done % 50 === 0) {
      process.stdout.write(`\r  ${done}/${notifications.length} notifications rollbackées`);
    }
  }
  console.log(`\n  ✅ ${done} traitées`);
}

async function main() {
  console.log('⏪ Démarrage du ROLLBACK i18n (Json → String)');
  console.log('='.repeat(60));

  try {
    await rollbackChallenges();
    await rollbackBadges();
    await rollbackHackathons();
    await rollbackNotifications();

    console.log('\n' + '='.repeat(60));
    console.log('✅ Rollback terminé avec succès !');
    console.log('   Vous pouvez maintenant utiliser le schéma avec String.');
  } catch (error) {
    console.error('\n❌ Erreur durant le rollback :', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
