import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const employee = await prisma.employee.findFirst({
  where: { email: "employee@nexushrms.com" },
});

if (!employee) {
  console.error("No employee found - run npm run db:seed");
  process.exit(1);
}

const r = new Date();
const today = new Date(Date.UTC(r.getFullYear(), r.getMonth(), r.getDate()));
const now = new Date();

const record = await prisma.attendance.create({
  data: {
    employeeId: employee.id,
    date: today,
    checkIn: now,
    status: "PRESENT",
    notes: "TEST",
  },
});

console.log("Created:", record.id, "for", employee.email);

const all = await prisma.attendance.findMany({
  where: { employeeId: employee.id },
});
console.log("Employee records:", all.length);

await prisma.$disconnect();
