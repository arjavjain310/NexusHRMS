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

  const deptDevelopment = await prisma.department.upsert({
    where: {
      organizationId_name: { organizationId: org.id, name: "Development" },
    },
    update: {},
    create: {
      name: "Development",
      code: "DEV",
      organizationId: org.id,
    },
  });

  let desigAiml = await prisma.designation.findFirst({
    where: { departmentId: deptDevelopment.id, title: "AIML Engineer" },
  });
  if (!desigAiml) {
    desigAiml = await prisma.designation.create({
      data: { title: "AIML Engineer", level: 4, departmentId: deptDevelopment.id },
    });
  }

  const extraDepartments = [
    { name: "Finance", code: "FIN", designation: "Finance Analyst" },
    { name: "Operations", code: "OPS", designation: "Operations Associate" },
    { name: "Data Analytics", code: "DATA", designation: "Data Analyst" },
    { name: "Product Management", code: "PM", designation: "Product Manager" },
    { name: "Sales", code: "SALES", designation: "Sales Executive" },
    { name: "Customer Support", code: "CS", designation: "Support Specialist" },
  ];
  for (const d of extraDepartments) {
    const dept = await prisma.department.upsert({
      where: {
        organizationId_name: { organizationId: org.id, name: d.name },
      },
      update: { code: d.code },
      create: { name: d.name, code: d.code, organizationId: org.id },
    });
    const hasDesig = await prisma.designation.findFirst({
      where: { departmentId: dept.id, title: d.designation },
    });
    if (!hasDesig) {
      await prisma.designation.create({
        data: { title: d.designation, level: 2, departmentId: dept.id },
      });
    }
  }

  const demoUsers = [
    {
      email: "arjav@nexushrms.com",
      role: UserRole.ADMIN,
      firstName: "Arjav",
      lastName: "Jain",
      code: "EMP001",
      phone: "8472835345",
      city: "Bangalore",
      pan: "ARJAV4208M",
      isFounder: true,
    },
    {
      email: "saakshi@nexushrms.com",
      role: UserRole.SENIOR_MANAGER,
      firstName: "Saakshi",
      lastName: "Sinha",
      code: "EMP002",
      phone: "+91-9876543211",
      city: "Bangalore",
    },
    {
      email: "harshit@nexushrms.com",
      role: UserRole.HR_RECRUITER,
      firstName: "Harshit",
      lastName: "Raj",
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

    const isFounder = "isFounder" in u && u.isFounder;
    const deptId = isFounder
      ? deptDevelopment.id
      : u.role === UserRole.HR_RECRUITER
        ? deptHR.id
        : deptEngineering.id;
    const designationId = isFounder
      ? desigAiml.id
      : u.role === UserRole.HR_RECRUITER
        ? desigHR.id
        : u.role === UserRole.EMPLOYEE
          ? desigIntern.id
          : desigSenior.id;

    const employee = await prisma.employee.upsert({
      where: {
        organizationId_email: { organizationId: org.id, email: u.email },
      },
      update: {
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        city: u.city,
        country: "India",
        panNumber: "pan" in u ? u.pan : undefined,
        businessUnit: "Technology",
        subDepartment: isFounder ? "Product" : u.role === UserRole.HR_RECRUITER ? "HR Ops" : "Product",
        paymentMode: "Bank Transfer",
        departmentId: deptId,
        designationId,
        managerId: isFounder ? null : u.role === UserRole.EMPLOYEE ? managerEmployeeId : undefined,
        bio: isFounder
          ? "Founder & Administrator at Nexus Technologies Pvt Ltd."
          : `${u.firstName} is a key member of ${org.name}.`,
        education: [
          {
            degree: "B.Tech",
            branch: "Computer Science",
            cgpa: "8.5",
          },
        ],
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
        departmentId: deptId,
        designationId,
        userId: user.id,
        panNumber: "pan" in u ? u.pan : `PAN${u.code}`,
        businessUnit: "Technology",
        subDepartment: isFounder ? "Product" : u.role === UserRole.HR_RECRUITER ? "HR Ops" : "Product",
        paymentMode: "Bank Transfer",
        bio: isFounder
          ? "Founder & Administrator at Nexus Technologies Pvt Ltd."
          : `${u.firstName} works with ${org.name} driving HR and product excellence.`,
        education: [
          { degree: "B.Tech", branch: "Computer Science", cgpa: "8.2" },
        ],
        managerId: isFounder ? null : u.role === UserRole.EMPLOYEE ? managerEmployeeId : undefined,
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

  const holidays2026 = [
    { name: "New Year's Day", date: new Date("2026-01-01"), isOptional: false },
    { name: "Republic Day", date: new Date("2026-01-26"), isOptional: false },
    { name: "Holi", date: new Date("2026-03-04"), isOptional: true },
    { name: "Eid-ul-Fitr", date: new Date("2026-03-21"), isOptional: true },
    { name: "Ram Navami", date: new Date("2026-03-26"), isOptional: true },
    { name: "Mahavir Jayanti", date: new Date("2026-03-31"), isOptional: true },
    { name: "Good Friday", date: new Date("2026-04-03"), isOptional: true },
    { name: "Buddha Purnima", date: new Date("2026-05-01"), isOptional: true },
    { name: "Bakrid (Eid-ul-Zuha)", date: new Date("2026-05-27"), isOptional: true },
    { name: "Muharram", date: new Date("2026-06-26"), isOptional: true },
    { name: "Independence Day", date: new Date("2026-08-15"), isOptional: false },
    { name: "Milad-un-Nabi", date: new Date("2026-08-26"), isOptional: true },
    { name: "Janmashtami", date: new Date("2026-09-04"), isOptional: true },
    { name: "Gandhi Jayanti", date: new Date("2026-10-02"), isOptional: false },
    { name: "Dussehra", date: new Date("2026-10-20"), isOptional: true },
    { name: "Diwali", date: new Date("2026-11-08"), isOptional: true },
    { name: "Guru Nanak Jayanti", date: new Date("2026-11-24"), isOptional: true },
    { name: "Christmas", date: new Date("2026-12-25"), isOptional: true },
  ];

  for (const h of holidays2026) {
    const existing = await prisma.holiday.findFirst({
      where: {
        organizationId: org.id,
        name: h.name,
        date: h.date,
      },
    });
    if (!existing) {
      await prisma.holiday.create({
        data: {
          organizationId: org.id,
          name: h.name,
          date: h.date,
          isOptional: h.isOptional,
        },
      }).catch(() => {});
    }
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

  const demoUserRows = await prisma.user.findMany({
    where: { organizationId: org.id },
    include: { employee: { select: { firstName: true, lastName: true } } },
  });

  const admin = demoUserRows.find((u) => u.email === "arjav@nexushrms.com");
  const manager = demoUserRows.find((u) => u.email === "saakshi@nexushrms.com");
  const employee = demoUserRows.find((u) => u.email === "employee@nexushrms.com");

  if (employee) {
    await prisma.notification.createMany({
      data: [
        {
          userId: employee.id,
          type: "PAYROLL_PUBLISHED",
          title: "Payslip published",
          message: "Your April 2026 payslip is ready to download.",
          href: "/payroll/payslips",
          read: false,
        },
        {
          userId: employee.id,
          type: "LEAVE_APPROVED",
          title: "Leave approved",
          message: "Your casual leave for 12 Jun was approved by Saakshi Sinha.",
          href: "/leave",
          read: true,
        },
        {
          userId: employee.id,
          type: "POLICY_UPDATE",
          title: "Policy update",
          message: "Updated remote work policy — review in Documents.",
          href: "/me/profile",
          read: false,
        },
        {
          userId: employee.id,
          type: "INTERVIEW_SCHEDULED",
          title: "Interview scheduled",
          message: "Technical round scheduled for Full Stack Developer role.",
          href: "/recruitment",
          read: false,
        },
      ],
    }).catch(() => {});
  }

  if (manager) {
    await prisma.notification.createMany({
      data: [
        {
          userId: manager.id,
          type: "LEAVE_PENDING",
          title: "Leave pending approval",
          message: "Maya Patel requested casual leave — review in Approvals.",
          href: "/approvals",
          read: false,
        },
      ],
    }).catch(() => {});
  }

  const activitySeed = [
    {
      action: "payroll_published",
      metadata: { employeeName: "Maya Patel", month: "April", year: 2026 },
    },
    {
      action: "leave_approved",
      metadata: { employeeName: "Maya Patel" },
    },
    {
      action: "policy_update",
      metadata: { title: "Remote work policy v2" },
    },
    {
      action: "interview_scheduled",
      metadata: { role: "Full Stack Developer" },
    },
  ];

  for (const a of activitySeed) {
    await prisma.activityLog.create({
      data: {
        organizationId: org.id,
        userId: admin?.id ?? null,
        action: a.action,
        metadata: a.metadata,
      },
    }).catch(() => {});
  }

  console.log("Seed completed for", org.name);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
