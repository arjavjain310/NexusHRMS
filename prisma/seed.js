import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "nexus-demo" },
    update: { name: "Nexus Technologies Pvt Ltd" },
    create: {
      name: "Nexus Technologies Pvt Ltd",
      slug: "nexus-demo",
      timezone: "Asia/Kolkata",
    },
  });

  const deptEngineering = await prisma.department.upsert({
    where: {
      organizationId_name: { organizationId: org.id, name: "Engineering" },
    },
    update: {},
    create: {
      name: "Engineering",
      code: "ENG",
      organizationId: org.id,
    },
  });

  const deptHR = await prisma.department.upsert({
    where: {
      organizationId_name: { organizationId: org.id, name: "Human Resources" },
    },
    update: {},
    create: {
      name: "Human Resources",
      code: "HR",
      organizationId: org.id,
    },
  });

  let desigSenior = await prisma.designation.findFirst({
    where: { departmentId: deptEngineering.id, title: "Senior Engineer" },
  });
  if (!desigSenior) {
    desigSenior = await prisma.designation.create({
      data: { title: "Senior Engineer", level: 3, departmentId: deptEngineering.id },
    });
  }

  let desigIntern = await prisma.designation.findFirst({
    where: { departmentId: deptEngineering.id, title: "Software Engineer" },
  });
  if (!desigIntern) {
    desigIntern = await prisma.designation.create({
      data: { title: "Software Engineer", level: 1, departmentId: deptEngineering.id },
    });
  }

  let desigHR = await prisma.designation.findFirst({ where: { departmentId: deptHR.id } });
  if (!desigHR) {
    desigHR = await prisma.designation.create({
      data: { title: "HR Recruiter", level: 2, departmentId: deptHR.id },
    });
  }

  const demoUsers = [
    {
      email: "admin@nexushrms.com",
      role: UserRole.ADMIN,
      firstName: "Alex",
      lastName: "Admin",
      code: "EMP001",
      phone: "+91-9876543210",
      city: "Bangalore",
    },
    {
      email: "manager@nexushrms.com",
      role: UserRole.SENIOR_MANAGER,
      firstName: "Sarah",
      lastName: "Chen",
      code: "EMP002",
      phone: "+91-9876543211",
      city: "Bangalore",
    },
    {
      email: "recruiter@nexushrms.com",
      role: UserRole.HR_RECRUITER,
      firstName: "Jordan",
      lastName: "Lee",
      code: "EMP003",
      phone: "+91-9876543212",
      city: "Mumbai",
    },
    {
      email: "employee@nexushrms.com",
      role: UserRole.EMPLOYEE,
      firstName: "Maya",
      lastName: "Patel",
      code: "EMP004",
      phone: "+91-8472835345",
      city: "Bangalore",
      pan: "CKGPJ4208M",
      stipend: 15000,
    },
  ];

  let managerEmployeeId;

  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role },
      create: {
        email: u.email,
        role: u.role,
        organizationId: org.id,
      },
    });

    const employee = await prisma.employee.upsert({
      where: {
        organizationId_email: { organizationId: org.id, email: u.email },
      },
      update: {
        phone: u.phone,
        city: u.city,
        country: "India",
        panNumber: "pan" in u ? u.pan : undefined,
        businessUnit: "Technology",
        subDepartment: u.role === UserRole.HR_RECRUITER ? "HR Ops" : "Product",
        paymentMode: "Bank Transfer",
        bio: `${u.firstName} is a key member of ${org.name}.`,
        education: [
          {
            degree: "B.Tech",
            branch: "Computer Science",
            cgpa: "8.5",
          },
        ],
        managerId: u.role === UserRole.EMPLOYEE ? managerEmployeeId : undefined,
      },
      create: {
        employeeCode: u.code,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone,
        city: u.city,
        country: "India",
        dateOfJoining: new Date("2025-03-05"),
        organizationId: org.id,
        departmentId: u.role === UserRole.HR_RECRUITER ? deptHR.id : deptEngineering.id,
        designationId:
          u.role === UserRole.HR_RECRUITER
            ? desigHR.id
            : u.role === UserRole.EMPLOYEE
              ? desigIntern.id
              : desigSenior.id,
        userId: user.id,
        panNumber: "pan" in u ? u.pan : `PAN${u.code}`,
        businessUnit: "Technology",
        subDepartment: u.role === UserRole.HR_RECRUITER ? "HR Ops" : "Product",
        paymentMode: "Bank Transfer",
        bio: `${u.firstName} works with ${org.name} driving HR and product excellence.`,
        education: [
          { degree: "B.Tech", branch: "Computer Science", cgpa: "8.2" },
        ],
        managerId: u.role === UserRole.EMPLOYEE ? managerEmployeeId : undefined,
      },
    });

    if (u.role === UserRole.SENIOR_MANAGER) managerEmployeeId = employee.id;

    const baseSalary = "stipend" in u ? u.stipend : u.role === UserRole.ADMIN ? 120000 : 85000;

    await prisma.salaryStructure.upsert({
      where: { employeeId: employee.id },
      update: { baseSalary },
      create: {
        employeeId: employee.id,
        baseSalary,
        hra: Math.round(baseSalary * 0.2),
        allowances: Math.round(baseSalary * 0.1),
        deductions: Math.round(baseSalary * 0.05),
        taxRate: 0,
        currency: "INR",
      },
    });

    for (const [month, year] of [
      [4, 2026],
      [3, 2026],
    ] ) {
      const base = baseSalary;
      const hra = Math.round(base * 0.2);
      const allowances = Math.round(base * 0.1);
      const gross = base + hra + allowances;
      await prisma.payslip.upsert({
        where: {
          employeeId_month_year: { employeeId: employee.id, month, year },
        },
        update: {},
        create: {
          employeeId: employee.id,
          month,
          year,
          baseSalary: base,
          bonuses: 0,
          deductions: Math.round(base * 0.05),
          netPay: gross - Math.round(base * 0.05),
          workingDays: 30,
          payableDays: 30,
          lossOfPayDays: 0,
          earningsDetail: {
            items: [
              { name: "Basic / Stipend", amount: base },
              { name: "HRA", amount: hra },
              { name: "Allowances", amount: allowances },
            ],
            deductions: [{ name: "PF / Other", amount: Math.round(base * 0.05) }],
          },
          status: "PAID",
          processedAt: new Date(),
        },
      });
    }

    const existingGoal = await prisma.goal.findFirst({ where: { employeeId: employee.id } });
    if (!existingGoal) {
      await prisma.goal.create({
        data: {
          employeeId: employee.id,
          title: "Complete Q2 deliverables",
          progress: 65,
          status: "IN_PROGRESS",
          kpiMetric: "Sprint completion",
        },
      });
    }
  }

  const holidays = [
    { name: "Republic Day", date: new Date("2026-01-26") },
    { name: "Independence Day", date: new Date("2026-08-15") },
  ];

  for (const h of holidays) {
    await prisma.holiday.create({
      data: { organizationId: org.id, name: h.name, date: h.date },
    }).catch(() => {});
  }

  await prisma.jobPost.create({
    data: {
      organizationId: org.id,
      title: "Full Stack Developer",
      department: "Engineering",
      description: "React, TypeScript, Node.js, PostgreSQL.",
      location: "Bangalore",
      isRemote: false,
    },
  }).catch(() => {});

  console.log("Seed completed for", org.name);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
