import { prisma } from "./db.mjs";

async function main() {
  const code = "11xwillwin";
  const existing = await prisma.inviteCode.findUnique({ where: { code } });
  if (existing) {
    console.log(`Seed code "${code}" already exists (uses ${existing.uses}/${existing.maxUses}).`);
    return;
  }
  await prisma.inviteCode.create({
    data: { code, ownerId: null, maxUses: 1000, uses: 0 },
  });
  console.log(`Created root invite code "${code}" (1000 uses).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
