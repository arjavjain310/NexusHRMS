import { PrismaClient } from "@prisma/client";
import { seedSandboxOrganization } from "../src/lib/sandbox/seed.js";
import { DEMO_ACCOUNTS } from "../src/lib/auth/demo-account-config.js";

const prisma = new PrismaClient();

async function main() {
  for (const account of Object.values(DEMO_ACCOUNTS)) {
    const stale = await prisma.user.findUnique({ where: { email: account.email } });
    if (stale) {
      await prisma.user.delete({ where: { id: stale.id } });
      console.log("Removed stale demo user:", account.email);
    }
  }

  const existing = await prisma.organization.findUnique({
    where: { slug: "nexus-sandbox" },
  });
  if (existing) {
    await prisma.organization.delete({ where: { id: existing.id } });
    console.log("Removed existing sandbox org");
  }
  await seedSandboxOrganization(prisma);
  console.log("Sandbox org seeded (nexus-sandbox)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
