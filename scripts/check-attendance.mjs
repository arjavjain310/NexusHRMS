import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const r = new Date();
const today = new Date(Date.UTC(r.getFullYear(), r.getMonth(), r.getDate()));
console.log("today:", today.toISOString());

const count = await prisma.attendance.count();
const latest = await prisma.attendance.findMany({
  take: 5,
  orderBy: { createdAt: "desc" },
  include: { employee: { select: { email: true, firstName: true } } },
});

console.log("total:", count);
console.log(JSON.stringify(latest, null, 2));

await prisma.$disconnect();
