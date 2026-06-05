import { deleteSupabaseAuthUser } from "@/lib/supabase/admin";

/** Permanently remove an employee row and every login tied to their work email */
export async function purgeEmployee(tx, employee) {
  const userId = employee.userId;
  const workEmail = employee.email?.trim().toLowerCase();

  await tx.employee.updateMany({
    where: { managerId: employee.id },
    data: { managerId: null },
  });

  await tx.activityLog.deleteMany({
    where: { employeeId: employee.id },
  });

  await tx.employee.delete({
    where: { id: employee.id },
  });

  if (userId) {
    try {
      await tx.user.delete({ where: { id: userId } });
    } catch {
      /* may already be removed */
    }
  }

  if (workEmail) {
    await tx.user.deleteMany({
      where: { email: { equals: workEmail, mode: "insensitive" } },
    });
  }
}

/** DB purge plus Supabase auth cleanup so work email is fully reusable */
export async function purgeEmployeeCompletely(prisma, employee) {
  const workEmail = employee.email;
  await prisma.$transaction(async (tx) => {
    await purgeEmployee(tx, employee);
  });
  await deleteSupabaseAuthUser(workEmail);
}
