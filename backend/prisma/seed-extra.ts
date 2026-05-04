import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function ensureUsers() {
  const users = [
    { email: 'demo1@bytebattle.local', username: 'demo_user_1', firstName: 'Demo', lastName: 'One' },
    { email: 'demo2@bytebattle.local', username: 'demo_user_2', firstName: 'Demo', lastName: 'Two' },
    { email: 'demo3@bytebattle.local', username: 'demo_user_3', firstName: 'Demo', lastName: 'Three' },
  ];

  const passwordHash = await bcrypt.hash('Demo1234!', 10);
  const created: Array<{ id: string; email: string }> = [];

  for (const u of users) {
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          ...u,
          passwordHash,
          provider: 'local',
          isOAuthUser: false,
          emailVerified: true,
          role: 'user',
          status: 'active',
        },
      });
      console.log(`  ✅ User créé: ${u.email}`);
    } else {
      console.log(`  ⏭️  User existe: ${u.email}`);
    }
    created.push({ id: user.id, email: user.email });
  }

  return created;
}

async function ensureCompanies(ownerId: string) {
  const companies = [
    { name: 'ByteLabs', slug: 'bytelabs-demo', industry: 'Software' },
    { name: 'AlgoForge', slug: 'algoforge-demo', industry: 'Education' },
    { name: 'CloudSprint', slug: 'cloudsprint-demo', industry: 'Cloud' },
  ];

  const created: Array<{ id: string; slug: string }> = [];

  for (const c of companies) {
    let company = await prisma.company.findUnique({ where: { slug: c.slug } });
    if (!company) {
      company = await prisma.company.create({
        data: {
          ...c,
          ownerId,
          verified: true,
          status: 'active',
          joinPolicy: 'approval',
        },
      });
      console.log(`  ✅ Company créée: ${c.slug}`);
    } else {
      console.log(`  ⏭️  Company existe: ${c.slug}`);
    }
    created.push({ id: company.id, slug: company.slug });
  }

  return created;
}

async function ensureMemberships(companyIds: string[], userIds: string[]) {
  let idx = 0;
  for (const companyId of companyIds) {
    for (const userId of userIds) {
      const exists = await prisma.companyMembership.findUnique({
        where: { companyId_userId: { companyId, userId } },
      });
      if (!exists) {
        await prisma.companyMembership.create({
          data: {
            companyId,
            userId,
            role: idx % 3 === 0 ? 'owner' : 'member',
            status: 'active',
          },
        });
      }
      idx += 1;
    }
  }
  console.log('  ✅ Memberships synchronisées');
}

async function ensureHackathons(challengeIds: string[], createdById: string) {
  const now = Date.now();
  const defs = [
    { title: 'Hackathon Spring', offset: 24 },
    { title: 'Hackathon Summer', offset: 48 },
    { title: 'Hackathon Autumn', offset: 72 },
  ];

  const created: Array<{ id: string; title: string }> = [];

  for (const d of defs) {
    let hack = await prisma.hackathon.findFirst({ where: { title: d.title } });
    if (!hack) {
      const start = new Date(now + d.offset * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
      hack = await prisma.hackathon.create({
        data: {
          title: d.title,
          description: `Demo event: ${d.title}`,
          startTime: start,
          endTime: end,
          status: 'lobby',
          challengeIds,
          scope: 'public',
          createdById,
          teamPolicy: { minSize: 1, maxSize: 3, autoAssign: false },
        },
      });
      console.log(`  ✅ Hackathon créé: ${d.title}`);
    } else {
      console.log(`  ⏭️  Hackathon existe: ${d.title}`);
    }
    created.push({ id: hack.id, title: hack.title });
  }

  return created;
}

async function ensureTeams(hackathons: Array<{ id: string }>, userIds: string[]) {
  const defs = [
    { name: 'Team Alpha', type: 'open' },
    { name: 'Team Beta', type: 'open' },
    { name: 'Team Gamma', type: 'open' },
  ];

  for (let i = 0; i < defs.length; i += 1) {
    const hackathonId = hackathons[i % hackathons.length].id;
    const teamName = defs[i].name;
    const exists = await prisma.team.findFirst({
      where: { name: teamName, hackathonId },
    });
    if (!exists) {
      await prisma.team.create({
        data: {
          hackathonId,
          name: teamName,
          type: defs[i].type,
          members: [{ userId: userIds[i % userIds.length], role: 'captain' }],
        },
      });
      console.log(`  ✅ Team créée: ${teamName}`);
    } else {
      console.log(`  ⏭️  Team existe: ${teamName}`);
    }
  }
}

async function ensureDiscussions(authorIds: string[], challengeIds: string[]) {
  const defs = [
    { title: 'Astuces pour les défis medium', tag: 'tips' },
    { title: 'Stratégie pour optimiser le temps', tag: 'strategy' },
    { title: 'Bonnes pratiques de code review', tag: 'review' },
  ];

  for (let i = 0; i < defs.length; i += 1) {
    const d = defs[i];
    const exists = await prisma.discussion.findFirst({ where: { title: d.title } });
    if (!exists) {
      await prisma.discussion.create({
        data: {
          title: d.title,
          content: `Discussion démo: ${d.title}`,
          category: 'general',
          authorId: authorIds[i % authorIds.length],
          tags: [d.tag, 'demo'],
          challengeId: challengeIds[i % challengeIds.length],
          upvotes: [],
          downvotes: [],
          flags: [],
        },
      });
      console.log(`  ✅ Discussion créée: ${d.title}`);
    } else {
      console.log(`  ⏭️  Discussion existe: ${d.title}`);
    }
  }
}

async function ensureNotifications(recipientIds: string[]) {
  const defs = [
    { title: 'Bienvenue sur ByteBattle', message: 'Ton compte est prêt.', type: 'system.welcome', category: 'system' },
    { title: 'Nouveau challenge dispo', message: 'Un challenge medium a été publié.', type: 'challenge.new', category: 'submission' },
    { title: 'Hackathon bientôt', message: 'Le prochain hackathon démarre bientôt.', type: 'hackathon.reminder', category: 'hackathon' },
  ];

  for (let i = 0; i < defs.length; i += 1) {
    const n = defs[i];
    const recipientId = recipientIds[i % recipientIds.length];
    const exists = await prisma.notification.findFirst({
      where: { recipientId, title: n.title },
    });
    if (!exists) {
      await prisma.notification.create({
        data: {
          recipientId,
          type: n.type,
          category: n.category,
          priority: 'medium',
          title: n.title,
          message: n.message,
          isRead: false,
          isArchived: false,
        },
      });
      console.log(`  ✅ Notification créée: ${n.title}`);
    } else {
      console.log(`  ⏭️  Notification existe: ${n.title}`);
    }
  }
}

async function main() {
  console.log('🌱 Seed extra (3 objets par entité principale)...');

  const users = await ensureUsers();
  const challenges = await prisma.challenge.findMany({ take: 3, orderBy: { createdAt: 'asc' } });
  if (challenges.length === 0) {
    throw new Error('Aucun challenge trouvé. Lance d’abord prisma:seed.');
  }

  const companies = await ensureCompanies(users[0].id);
  await ensureMemberships(companies.map((c) => c.id), users.map((u) => u.id));

  const hackathons = await ensureHackathons(challenges.map((c) => c.id), users[0].id);
  await ensureTeams(hackathons, users.map((u) => u.id));
  await ensureDiscussions(users.map((u) => u.id), challenges.map((c) => c.id));
  await ensureNotifications(users.map((u) => u.id));

  console.log('\n✅ Seed extra terminé.');
}

main()
  .catch((err) => {
    console.error('❌ Erreur seed-extra:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
