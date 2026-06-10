import { ensureAllDemoAccounts, PRESERVED_DEMO_ORG_EMAILS } from "@/lib/auth/demo-accounts";

/**
 * Reverts exploratory changes made during demo sessions.
 * Preserves seeded + demo system accounts; removes ad-hoc employees and pending requests.
 */
export async function resetDemoOrganization(prisma) {
  const org = await prisma.organization.findFirst({ where: { slug: "nexus-demo" } });
  if (!org) return;

  const preserved = PRESERVED_DEMO_ORG_EMAILS.map((e) => e.toLowerCase());

  const allEmployees = await prisma.employee.findMany({
    where: { organizationId: org.id },
    select: { id: true, email: true },
  });

  const removableIds = allEmployees
    .filter((e) => !preserved.includes(e.email.toLowerCase()))
    .map((e) => e.id);

  if (removableIds.length > 0) {
    await prisma.employee.deleteMany({ where: { id: { in: removableIds } } });
  }

  await prisma.leaveRequest.deleteMany({
    where: {
      employee: { organizationId: org.id },
      status: "PENDING",
    },
  });

  await ensureAllDemoAccounts(prisma);
}
