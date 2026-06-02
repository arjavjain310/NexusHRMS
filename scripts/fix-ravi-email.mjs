import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const emp = await prisma.employee.findFirst({
    where: {
      OR: [
        { email: { contains: "admin", mode: "insensitive" } },
        { AND: [{ firstName: "Ravi" }, { lastName: "Kumar" }] },
        { email: { equals: "ravi@nexushrms.com", mode: "insensitive" } },
      ],
    },
    include: { user: true },
  });

  if (!emp) {
    console.log("No Ravi/admin employee found");
    return;
  }

  const newEmail = "ravi@nexushrms.com";
  if (emp.user) {
    await prisma.user.update({
      where: { id: emp.user.id },
      data: { email: newEmail },
    });
  }
  await prisma.employee.update({
    where: { id: emp.id },
    data: { email: newEmail },
  });
  console.log("Updated to", newEmail, "from", emp.email);
}

main().finally(() => prisma.$disconnect());
