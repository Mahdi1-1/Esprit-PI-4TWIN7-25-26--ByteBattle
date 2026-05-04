import { PrismaClient, CompanySize, CompanyRole, CompanyMembershipStatus, ChallengeKind } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du remplissage de données de test (Company, Duels, Submissions)...');

  // 1. Récupérer quelques utilisateurs existants
  const owner = await prisma.user.findUnique({ where: { username: 'mahdimasmoudi' } });
  const member1 = await prisma.user.findUnique({ where: { username: 'AliceCodes' } });
  
  if (!owner || !member1) {
    throw new Error("L'utilisateur 'mahdimasmoudi' ou 'AliceCodes' est introuvable. Veuillez d'abord les créer.");
  }

  // 2. Création de l'entreprise
  console.log('🏢 Création de l\'entreprise...');
  const company = await prisma.company.upsert({
    where: { slug: 'tech-innovators' },
    update: {},
    create: {
      name: 'Tech Innovators',
      slug: 'tech-innovators',
      description: 'Entreprise leader dans l\'innovation des technologies web et IA.',
      industry: 'Technology',
      size: 'SIZE_11_50' as CompanySize,
      joinCode: 'TECH-2026',
      verified: true,
      ownerId: owner.id,
    }
  });

  // 3. Ajouter les membres à l'entreprise
  // On met le owner dans CompanyMembership et on met à jour le profil User
  console.log('👥 Ajout des membres...');
  await prisma.companyMembership.upsert({
    where: { companyId_userId: { companyId: company.id, userId: owner.id } },
    update: {},
    create: {
      companyId: company.id,
      userId: owner.id,
      role: 'owner' as CompanyRole,
      status: 'active' as CompanyMembershipStatus,
    }
  });
  
  await prisma.user.update({
    where: { id: owner.id },
    data: { companyId: company.id, companyRole: 'owner' }
  });

  await prisma.companyMembership.upsert({
    where: { companyId_userId: { companyId: company.id, userId: member1.id } },
    update: {},
    create: {
      companyId: company.id,
      userId: member1.id,
      role: 'member' as CompanyRole,
      status: 'active' as CompanyMembershipStatus,
    }
  });
  
  await prisma.user.update({
    where: { id: member1.id },
    data: { companyId: company.id, companyRole: 'member' }
  });

  // 4. Récupérer des challenges existants pour générer Submissions et Duels
  const challenges = await prisma.challenge.findMany({ take: 2, where: { kind: 'CODE' } });
  if (challenges.length > 0) {
    const challenge = challenges[0];

    // Submissions
    console.log('💻 Création de quelques submissions...');
    await prisma.submission.create({
      data: {
        userId: owner.id,
        challengeId: challenge.id,
        kind: challenge.kind,
        context: 'PRACTICE',
        language: 'javascript',
        code: 'function solve() { return "ok"; }',
        verdict: 'ACCEPTED',
        score: 100,
        testsPassed: 4,
        testsTotal: 4,
        timeMs: 12.5,
        memMb: 32.1,
      }
    });

    await prisma.submission.create({
      data: {
        userId: member1.id,
        challengeId: challenge.id,
        kind: challenge.kind,
        context: 'PRACTICE',
        language: 'python',
        code: 'def solve(): return "ok"',
        verdict: 'WRONG_ANSWER',
        score: 0,
        testsPassed: 1,
        testsTotal: 4,
        timeMs: 25.0,
        memMb: 45.0,
      }
    });

    // Duels
    console.log('⚔️ Création d\'un duel...');
    await prisma.duel.create({
      data: {
        player1Id: owner.id,
        player2Id: member1.id,
        challengeId: challenge.id,
        status: 'waiting',
        startedAt: new Date(),
        difficulty: challenge.difficulty,
        player1Score: 0,
        player2Score: 0,
      }
    });
  } else {
    console.log('⚠️ Aucun challenge de type CODE trouvé, impossible de créer les submissions et les duels.');
  }

  console.log('✅ Base de données mise à jour avec l\'entreprise, les membres, les submissions et les duels !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
