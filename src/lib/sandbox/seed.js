import { Gender } from "@prisma/client";
import { SANDBOX_ORG_NAME, SANDBOX_ORG_SLUG } from "./constants.js";
import { DEMO_ACCOUNTS, DEMO_ACCOUNT_KEYS } from "../auth/demo-account-config.js";

const DEPARTMENTS = [
  { name: "Engineering", code: "ENG", designations: ["Software Engineer", "Senior Engineer", "Tech Lead"] },
  { name: "Development", code: "DEV", designations: ["AIML Engineer", "Full Stack Developer"] },
  { name: "Human Resources", code: "HR", designations: ["HR Executive", "HR Recruiter"] },
  { name: "Sales", code: "SALES", designations: ["Sales Executive", "Account Manager"] },
  { name: "Marketing", code: "MKT", designations: ["Marketing Specialist", "Content Strategist"] },
  { name: "Finance", code: "FIN", designations: ["Finance Analyst", "Payroll Specialist"] },
];

const INDIAN_EMPLOYEES = [
  { firstName: "Aarav", lastName: "Sharma", code: "SBX001", dept: "Engineering", designation: "Senior Engineer", gender: Gender.MALE, salary: 92000, city: "Bangalore", manager: "manager" },
  { firstName: "Vivaan", lastName: "Gupta", code: "SBX002", dept: "Development", designation: "Full Stack Developer", gender: Gender.MALE, salary: 78000, city: "Pune", manager: "manager" },
  { firstName: "Aditya", lastName: "Verma", code: "SBX003", dept: "Engineering", designation: "Software Engineer", gender: Gender.MALE, salary: 65000, city: "Hyderabad", manager: "aarav" },
  { firstName: "Arjun", lastName: "Mehta", code: "SBX004", dept: "Development", designation: "AIML Engineer", gender: Gender.MALE, salary: 88000, city: "Bangalore", manager: "manager" },
  { firstName: "Rahul", lastName: "Jain", code: "SBX005", dept: "Sales", designation: "Account Manager", gender: Gender.MALE, salary: 72000, city: "Delhi", manager: "manager" },
  { firstName: "Rohan", lastName: "Singh", code: "SBX006", dept: "Sales", designation: "Sales Executive", gender: Gender.MALE, salary: 48000, city: "Mumbai", manager: "rahul" },
  { firstName: "Priya", lastName: "Patel", code: "SBX007", dept: "Engineering", designation: "Software Engineer", gender: Gender.FEMALE, salary: 62000, city: "Bangalore", manager: "aarav" },
  { firstName: "Ananya", lastName: "Sharma", code: "SBX008", dept: "Marketing", designation: "Content Strategist", gender: Gender.FEMALE, salary: 55000, city: "Mumbai", manager: "manager" },
  { firstName: "Sneha", lastName: "Reddy", code: "SBX009", dept: "Human Resources", designation: "HR Executive", gender: Gender.FEMALE, salary: 58000, city: "Hyderabad", manager: "hr" },
  { firstName: "Kavya", lastName: "Nair", code: "SBX010", dept: "Finance", designation: "Finance Analyst", gender: Gender.FEMALE, salary: 60000, city: "Bangalore", manager: "manager" },
  { firstName: "Neha", lastName: "Kapoor", code: "SBX011", dept: "Marketing", designation: "Marketing Specialist", gender: Gender.FEMALE, salary: 52000, city: "Delhi", manager: "ananya" },
  { firstName: "Ishita", lastName: "Shah", code: "SBX012", dept: "Finance", designation: "Payroll Specialist", gender: Gender.FEMALE, salary: 54000, city: "Pune", manager: "kavya" },
  { firstName: "Akash", lastName: "Yadav", code: "SBX013", dept: "Development", designation: "Full Stack Developer", gender: Gender.MALE, salary: 70000, city: "Noida", manager: "vivaan" },
  { firstName: "Pooja", lastName: "Agarwal", code: "SBX014", dept: "Human Resources", designation: "HR Recruiter", gender: Gender.FEMALE, salary: 56000, city: "Mumbai", manager: "hr" },
  { firstName: "Karan", lastName: "Malhotra", code: "SBX015", dept: "Engineering", designation: "Tech Lead", gender: Gender.MALE, salary: 105000, city: "Bangalore", manager: "admin" },
];

function slugEmail(firstName, lastName) {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@sandbox.nexushrms.com`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dateOnly(date) {
  return new Date(date.toISOString().slice(0, 10));
}

async function upsertDepartmentTree(prisma, orgId) {
  const deptMap = {};
  const desigMap = {};

  for (const d of DEPARTMENTS) {
    const dept = await prisma.department.create({
      data: { name: d.name, code: d.code, organizationId: orgId },
    });
    deptMap[d.name] = dept;
    for (const [i, title] of d.designations.entries()) {
      const desig = await prisma.designation.create({
        data: { title, level: i + 1, departmentId: dept.id },
      });
      desigMap[`${d.name}::${title}`] = desig;
    }
  }

  return { deptMap, desigMap };
}

async function createDemoLoginUser(prisma, orgId, key, deptMap, desigMap, managerId = null) {
  const config = DEMO_ACCOUNTS[key];
  const dept = deptMap[config.departmentName];
  const desig = await prisma.designation.findFirst({
    where: { departmentId: dept.id, title: config.designationTitle },
  });

  const user = await prisma.user.create({
    data: {
      email: config.email,
      role: config.role,
      isDemoAccount: true,
      organizationId: orgId,
      canManageEmployees: key === "hr",
      canSubmitPerformanceReviews: false,
    },
  });

  const employee = await prisma.employee.create({
    data: {
      employeeCode: config.employeeCode,
      firstName: config.firstName,
      lastName: config.lastName,
      email: config.email,
      gender: config.gender,
      phone: "+91-9000000001",
      city: config.city,
      country: "India",
      dateOfJoining: new Date("2024-06-01"),
      organizationId: orgId,
      departmentId: dept.id,
      designationId: desig.id,
      userId: user.id,
      managerId,
      status: "ACTIVE",
      paymentMode: "Bank Transfer",
      bio: `Sandbox ${config.key} login for exploring Nexus HRMS.`,
      education: [{ degree: "B.Tech", branch: "Computer Science", cgpa: "8.4" }],
    },
  });

  await prisma.salaryStructure.create({
    data: {
      employeeId: employee.id,
      baseSalary: config.baseSalary,
      hra: Math.round(config.baseSalary * 0.2),
      allowances: Math.round(config.baseSalary * 0.1),
      deductions: Math.round(config.baseSalary * 0.05),
      taxRate: 0,
      currency: "INR",
    },
  });

  return { user, employee, key };
}

async function seedEmployeeHistory(prisma, employee, managerEmployeeId, baseSalary) {
  await prisma.salaryStructure.create({
    data: {
      employeeId: employee.id,
      baseSalary,
      hra: Math.round(baseSalary * 0.2),
      allowances: Math.round(baseSalary * 0.1),
      deductions: Math.round(baseSalary * 0.05),
      taxRate: 0,
      currency: "INR",
    },
  });

  const today = new Date();
  for (let i = 14; i >= 1; i--) {
    const day = dateOnly(addDays(today, -i));
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    await prisma.attendance.create({
      data: {
        employeeId: employee.id,
        date: day,
        status: isWeekend ? "ABSENT" : i % 7 === 0 ? "REMOTE" : "PRESENT",
        checkIn: isWeekend ? null : new Date(`${day.toISOString().slice(0, 10)}T09:30:00.000Z`),
        checkOut: isWeekend ? null : new Date(`${day.toISOString().slice(0, 10)}T18:00:00.000Z`),
      },
    });
  }

  const leaveSamples = [
    { type: "ANNUAL", start: -45, end: -43, status: "APPROVED" },
    { type: "SICK", start: -20, end: -20, status: "APPROVED" },
    { type: "CASUAL", start: 5, end: 6, status: "PENDING" },
  ];

  for (const leave of leaveSamples) {
    await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        type: leave.type,
        startDate: dateOnly(addDays(today, leave.start)),
        endDate: dateOnly(addDays(today, leave.end)),
        reason: `${leave.type} leave request`,
        status: leave.status,
        approvedAt: leave.status === "APPROVED" ? new Date() : null,
      },
    });
  }

  for (const [month, year] of [
    [3, 2026],
    [4, 2026],
  ]) {
    const base = baseSalary;
    const hra = Math.round(base * 0.2);
    const allowances = Math.round(base * 0.1);
    const gross = base + hra + allowances;
    const ded = Math.round(base * 0.05);
    await prisma.payslip.create({
      data: {
        employeeId: employee.id,
        month,
        year,
        baseSalary: base,
        bonuses: 0,
        deductions: ded,
        netPay: gross - ded,
        workingDays: 30,
        payableDays: 30,
        lossOfPayDays: 0,
        earningsDetail: {
          items: [
            { name: "Basic", amount: base },
            { name: "HRA", amount: hra },
            { name: "Allowances", amount: allowances },
          ],
          deductions: [{ name: "PF / Other", amount: ded }],
        },
        status: "PAID",
        processedAt: new Date(),
      },
    });
  }

  if (managerEmployeeId) {
    await prisma.performanceReview.create({
      data: {
        employeeId: employee.id,
        managerId: managerEmployeeId,
        period: "Q1 2026",
        rating: 4.2,
        strengths: "Consistent delivery and strong collaboration.",
        improvements: "Continue upskilling in cross-functional communication.",
        feedback: "Solid quarter with clear growth trajectory.",
      },
    });
  }

  await prisma.goal.create({
    data: {
      employeeId: employee.id,
      title: "Complete Q2 deliverables",
      progress: 55,
      status: "IN_PROGRESS",
      kpiMetric: "Sprint completion",
    },
  });
}

export async function seedSandboxOrganization(prisma) {
  const org = await prisma.organization.create({
    data: {
      name: SANDBOX_ORG_NAME,
      slug: SANDBOX_ORG_SLUG,
      timezone: "Asia/Kolkata",
    },
  });

  const { deptMap, desigMap } = await upsertDepartmentTree(prisma, org.id);

  const holidays2026 = [
    { name: "Republic Day", date: new Date("2026-01-26"), isOptional: false },
    { name: "Holi", date: new Date("2026-03-04"), isOptional: true },
    { name: "Independence Day", date: new Date("2026-08-15"), isOptional: false },
    { name: "Diwali", date: new Date("2026-11-08"), isOptional: true },
  ];
  for (const h of holidays2026) {
    await prisma.holiday.create({
      data: { organizationId: org.id, ...h },
    });
  }

  const demoAdmin = await createDemoLoginUser(prisma, org.id, "admin", deptMap, desigMap);
  const demoManager = await createDemoLoginUser(
    prisma,
    org.id,
    "manager",
    deptMap,
    desigMap,
    demoAdmin.employee.id
  );
  const demoHr = await createDemoLoginUser(
    prisma,
    org.id,
    "hr",
    deptMap,
    desigMap,
    demoAdmin.employee.id
  );
  await createDemoLoginUser(
    prisma,
    org.id,
    "employee",
    deptMap,
    desigMap,
    demoManager.employee.id
  );

  const managerRefs = {
    admin: demoAdmin.employee.id,
    manager: demoManager.employee.id,
    hr: demoHr.employee.id,
  };

  const employeeRefs = {};

  for (const row of INDIAN_EMPLOYEES) {
    const email = slugEmail(row.firstName, row.lastName);
    const dept = deptMap[row.dept];
    const desig = desigMap[`${row.dept}::${row.designation}`];
    const managerKey = row.manager;
    let managerId = null;
    if (managerKey === "aarav") managerId = employeeRefs.aarav;
    else if (managerKey === "rahul") managerId = employeeRefs.rahul;
    else if (managerKey === "ananya") managerId = employeeRefs.ananya;
    else if (managerKey === "kavya") managerId = employeeRefs.kavya;
    else if (managerKey === "vivaan") managerId = employeeRefs.vivaan;
    else managerId = managerRefs[managerKey] ?? demoManager.employee.id;

    const employee = await prisma.employee.create({
      data: {
        employeeCode: row.code,
        firstName: row.firstName,
        lastName: row.lastName,
        email,
        gender: row.gender,
        phone: `+91-98${String(row.code).slice(-7)}`,
        city: row.city,
        country: "India",
        dateOfJoining: new Date("2025-01-15"),
        organizationId: org.id,
        departmentId: dept.id,
        designationId: desig.id,
        managerId,
        status: "ACTIVE",
        paymentMode: "Bank Transfer",
        bio: `${row.firstName} ${row.lastName} — ${row.designation} at ${SANDBOX_ORG_NAME}.`,
        education: [{ degree: "B.Tech", branch: "Engineering", cgpa: "8.1" }],
      },
    });

    const refKey = row.firstName.toLowerCase();
    employeeRefs[refKey] = employee.id;

    const reviewManagerId =
      managerId && managerId !== employee.id ? managerId : demoManager.employee.id;
    await seedEmployeeHistory(prisma, employee, reviewManagerId, row.salary);
  }

  const jobPost = await prisma.jobPost.create({
    data: {
      organizationId: org.id,
      title: "Senior Full Stack Developer",
      department: "Engineering",
      description: "React, Node.js, PostgreSQL. 3+ years experience.",
      location: "Bangalore",
      isRemote: false,
    },
  });

  const candidate = await prisma.candidate.create({
    data: {
      jobPostId: jobPost.id,
      name: "Devika Menon",
      email: "devika.menon@example.com",
      phone: "+91-9988776655",
      skills: ["React", "Node.js", "PostgreSQL"],
      status: "INTERVIEW",
      aiSummary: "Strong React portfolio; scheduled for technical round.",
    },
  });

  await prisma.voiceInterview.create({
    data: {
      candidateId: candidate.id,
      questions: [
        { question: "Describe your experience building scalable React applications." },
        { question: "How do you approach database schema design in PostgreSQL?" },
      ],
    },
  });

  await prisma.announcement.create({
    data: {
      organizationId: org.id,
      authorId: demoAdmin.user.id,
      title: "Welcome to Nexus Sandbox",
      content:
        "This is an isolated demo environment. All data here is fictional and resets when your demo session ends.",
      priority: "normal",
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: employeeRefs.priya ?? demoManager.employee.id,
      type: "CASUAL",
      startDate: dateOnly(addDays(new Date(), 7)),
      endDate: dateOnly(addDays(new Date(), 8)),
      reason: "Family function",
      status: "PENDING",
    },
  });

  return { organization: org, demoAccounts: DEMO_ACCOUNT_KEYS };
}

/** Ensures sandbox exists; seeds fully only when the org is missing. */
export async function ensureSandboxReady(prisma) {
  const existing = await prisma.organization.findUnique({
    where: { slug: SANDBOX_ORG_SLUG },
  });
  if (!existing) {
    return seedSandboxOrganization(prisma);
  }
  return { organization: existing, alreadySeeded: true };
}
