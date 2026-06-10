import { SANDBOX_ORG_SLUG } from "./constants.js";
import { seedSandboxOrganization } from "./seed.js";
import { DEMO_ACCOUNTS } from "../auth/demo-account-config.js";

async function removeStaleDemoLoginUsers(prisma) {
  for (const account of Object.values(DEMO_ACCOUNTS)) {
    const stale = await prisma.user.findUnique({
      where: { email: account.email },
      include: { organization: { select: { slug: true } } },
    });
    if (stale && stale.organization?.slug !== SANDBOX_ORG_SLUG) {
      await prisma.user.delete({ where: { id: stale.id } });
    }
  }
}

/**
 * Wipes the sandbox org and re-seeds to the original demo dataset.
 * Called on demo logout / session expiry so exploratory changes do not persist.
 */
export async function resetSandboxOrganization(prisma) {
  const existing = await prisma.organization.findUnique({
    where: { slug: SANDBOX_ORG_SLUG },
  });

  if (existing) {
    await prisma.organization.delete({ where: { id: existing.id } });
  } else {
    await removeStaleDemoLoginUsers(prisma);
  }

  return seedSandboxOrganization(prisma);
}

/** @deprecated use resetSandboxOrganization */
export async function resetDemoOrganization(prisma) {
  return resetSandboxOrganization(prisma);
}
