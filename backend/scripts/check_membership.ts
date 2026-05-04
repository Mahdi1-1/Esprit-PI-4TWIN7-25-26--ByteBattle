import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const u = await prisma.user.findUnique({where: {username: "mahdimasmoudi"}, include: {companyMemberships: true}});
  console.log(JSON.stringify(u?.companyMemberships, null, 2));
}
main().finally(() => prisma.$disconnect());
