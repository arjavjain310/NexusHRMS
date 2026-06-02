/**
 * Arjav Jain (founder) → EMP001; everyone else FCFS by createdAt → EMP002+.
 *   npm run db:renumber-employees
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const FOUNDER_EMAIL = "arjav@nexushrms.com";

async function main() {
  const org = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!org) throw new Error("No organization found.");

  const all = await prisma.employee.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "asc" },
  });

  if (all.length === 0) {
    console.log("No employees to renumber.");
    return;
  }

  // Clear unique conflicts with temporary codes
  for (const emp of all) {
    await prisma.employee.update({
      where: { id: emp.id },
      data: { employeeCode: `TMP-${emp.id.slice(-8)}` },
    });
  }

  const founder = all.find(
    (e) => e.email.toLowerCase() === FOUNDER_EMAIL.toLowerCase()
  );
  const others = all
    .filter((e) => e.id !== founder?.id)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  let seq = 2;
  if (founder) {
    await prisma.employee.update({
      where: { id: founder.id },
      data: { employeeCode: "EMP001" },
    });
    console.log(`EMP001 → ${founder.firstName} ${founder.lastName} (founder)`);
  } else {
    console.warn(`No employee found for ${FOUNDER_EMAIL}; numbering from EMP001 for FCFS list.`);
    seq = 1;
  }

  for (const emp of founder ? others : all.sort((a, b) => a.createdAt - b.createdAt)) {
    const code = `EMP${String(seq).padStart(3, "0")}`;
    await prisma.employee.update({
      where: { id: emp.id },
      data: { employeeCode: code },
    });
    console.log(`${code} → ${emp.firstName} ${emp.lastName}`);
    seq += 1;
  }

  console.log("\nEmployee codes updated (founder EMP001, others FCFS).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
