import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Database State ---');
  
  const usersCount = await prisma.user.count();
  const companiesCount = await prisma.company.count();
  const companyMembershipsCount = await prisma.companyMembership.count();
  const submissionsCount = await prisma.submission.count();
  const duelsCount = await prisma.duel.count();
  const challengesCount = await prisma.challenge.count();
  
  console.log(`Users: ${usersCount}`);
  console.log(`Companies: ${companiesCount}`);
  console.log(`Company Memberships: ${companyMembershipsCount}`);
  console.log(`Submissions: ${submissionsCount}`);
  console.log(`Duels: ${duelsCount}`);
  console.log(`Challenges: ${challengesCount}`);
  
  if (usersCount > 0) {
    const users = await prisma.user.findMany({ take: 3 });
    console.log('\nSample Users:', users.map(u => u.username).join(', '));
  }
  
  if (companiesCount > 0) {
    const companies = await prisma.company.findMany({ take: 3 });
    console.log('\nSample Companies:', companies.map(c => c.name).join(', '));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
