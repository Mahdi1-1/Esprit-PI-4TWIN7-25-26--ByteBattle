/**
 * Script de correction raw MongoDB
 * Corrige les champs qui contiennent { set: "valeur" } ou { set: { fr, en, ar } }
 * en les remplaçant par la string simple.
 *
 * Usage : node prisma/fix-mongo-raw.js
 */

// Utilise Prisma $runCommandRaw — pas besoin du driver mongodb séparé
const { PrismaClient } = require('../node_modules/.pnpm/@prisma+client@6.19.2_prisma@6.19.2_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client');
const prisma = new PrismaClient();

function extractString(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    // { set: "string" }  ← le cas actuel
    if ('set' in value && typeof value['set'] === 'string') return value['set'];
    // { set: { fr, en, ar } }
    if ('set' in value && typeof value['set'] === 'object') return extractString(value['set']);
    // { fr, en, ar }
    return value['fr'] || value['en'] || value['ar'] ||
      Object.values(value).find(v => typeof v === 'string') || '';
  }
  return '';
}

function needsFix(value) {
  if (typeof value !== 'object' || value === null) return false;
  return true; // Si c'est un objet quelconque à la place d'une string → à corriger
}

async function main() {
  // ── Challenges ─────────────────────────────────────────────
  console.log('\n📦 Fix: Challenge.title + Challenge.descriptionMd');
  const chResult = await prisma.$runCommandRaw({ find: 'Challenge', filter: {}, limit: 1000 });
  const challenges = chResult.cursor.firstBatch;
  let count = 0;
  for (const c of challenges) {
    const update = {};
    if (needsFix(c.title))         update.title         = extractString(c.title);
    if (needsFix(c.descriptionMd)) update.descriptionMd = extractString(c.descriptionMd);
    if (Object.keys(update).length > 0) {
      await prisma.$runCommandRaw({
        update: 'Challenge',
        updates: [{ q: { _id: c._id }, u: { $set: update } }]
      });
      console.log(`  ✅ Challenge "${update.title || c.title}"`);
      count++;
    }
  }
  console.log(`  ${count} challenges corrigés`);

  // ── Hackathons ──────────────────────────────────────────────
  console.log('\n🚀 Fix: Hackathon.title + Hackathon.description');
  const hkResult = await prisma.$runCommandRaw({ find: 'Hackathon', filter: {}, limit: 1000 });
  const hackathons = hkResult.cursor.firstBatch;
  count = 0;
  for (const h of hackathons) {
    const update = {};
    if (needsFix(h.title))       update.title       = extractString(h.title);
    if (h.description && needsFix(h.description)) update.description = extractString(h.description);
    if (Object.keys(update).length > 0) {
      await prisma.$runCommandRaw({
        update: 'Hackathon',
        updates: [{ q: { _id: h._id }, u: { $set: update } }]
      });
      console.log(`  ✅ Hackathon "${update.title || h.title}"`);
      count++;
    }
  }
  console.log(`  ${count} hackathons corrigés`);

  // ── Notifications ───────────────────────────────────────────
  console.log('\n🔔 Fix: Notification.message');
  const ntResult = await prisma.$runCommandRaw({ find: 'Notification', filter: {}, limit: 10000 });
  const notifications = ntResult.cursor.firstBatch;
  count = 0;
  for (const n of notifications) {
    if (needsFix(n.message)) {
      const fixed = extractString(n.message);
      await prisma.$runCommandRaw({
        update: 'Notification',
        updates: [{ q: { _id: n._id }, u: { $set: { message: fixed } } }]
      });
      count++;
    }
  }
  console.log(`  ${count} notifications corrigées`);

  // ── Badges ──────────────────────────────────────────────────
  console.log('\n🏅 Fix: Badge.name + Badge.ruleText');
  const bgResult = await prisma.$runCommandRaw({ find: 'Badge', filter: {}, limit: 1000 });
  const badges = bgResult.cursor.firstBatch;
  count = 0;
  for (const b of badges) {
    const update = {};
    if (needsFix(b.name))     update.name     = extractString(b.name);
    if (needsFix(b.ruleText)) update.ruleText = extractString(b.ruleText);
    if (Object.keys(update).length > 0) {
      await prisma.$runCommandRaw({
        update: 'Badge',
        updates: [{ q: { _id: b._id }, u: { $set: update } }]
      });
      console.log(`  ✅ Badge "${update.name || b.name}"`);
      count++;
    }
  }
  console.log(`  ${count} badges corrigés`);

  await prisma.$disconnect();
  console.log('\n✅ Terminé — toutes les données sont des strings simples.');
}

main().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
