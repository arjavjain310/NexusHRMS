import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { assertEmployeeInOrg } from "@/lib/auth/org-scope";
import { buildPayslipFromStructure, serializePayslip } from "@/lib/payroll/payslip";

const employeeInclude = {
  department: true,
  designation: true,
  organization: { select: { name: true } },
};
export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  const {
    searchParams
  } = new URL(request.url);
  const payslipId = searchParams.get("id");
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  const employeeId = searchParams.get("employeeId") || session.employeeId;

  try {
    if (monthParam && yearParam && employeeId) {
      const month = parseInt(monthParam, 10);
      const year = parseInt(yearParam, 10);
      if (!month || month < 1 || month > 12 || !year) {
        return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
      }

      const targetId =
        hasPermission(session.role, "managePayroll") && searchParams.get("employeeId")
          ? searchParams.get("employeeId")
          : session.employeeId;

      if (!targetId) {
        return NextResponse.json(
          { error: "No employee profile linked to your account." },
          { status: 403 }
        );
      }
      if (targetId !== session.employeeId && !hasPermission(session.role, "managePayroll")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      let payslip = await prisma.payslip.findFirst({
        where: { employeeId: targetId, month, year },
        include: { employee: { include: employeeInclude } },
      });

      const employee = payslip?.employee ??
        (await prisma.employee.findFirst({
          where: { id: targetId, organizationId: session.organizationId },
          include: employeeInclude,
        }));

      if (!employee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }

      if (!payslip) {
        const structure = await prisma.salaryStructure.findUnique({
          where: { employeeId: targetId },
        });
        if (!structure) {
          return NextResponse.json(
            {
              error:
                "No payslip for this period. Ask HR to set up your salary structure or process payroll.",
            },
            { status: 404 }
          );
        }

        const built = buildPayslipFromStructure(structure, employee, month, year);
        try {
          const saved = await prisma.payslip.upsert({
            where: {
              employeeId_month_year: { employeeId: targetId, month, year },
            },
            create: {
              employeeId: targetId,
              month,
              year,
              baseSalary: built.baseSalary,
              bonuses: built.bonuses,
              deductions: built.deductions,
              netPay: built.netPay,
              workingDays: built.workingDays,
              payableDays: built.payableDays,
              lossOfPayDays: built.lossOfPayDays,
              earningsDetail: built.earningsDetail,
              status: "PAID",
              processedAt: new Date(),
            },
            update: {
              netPay: built.netPay,
              deductions: built.deductions,
              earningsDetail: built.earningsDetail,
              status: "PAID",
              processedAt: new Date(),
            },
            include: { employee: { include: employeeInclude } },
          });
          payslip = saved;
        } catch {
          payslip = { ...built, employee };
        }
      }

      return NextResponse.json({
        success: true,
        data: serializePayslip(payslip),
        generatedAt: new Date().toISOString(),
      });
    }

    if (payslipId) {
      const payslip = await prisma.payslip.findFirst({
        where: {
          id: payslipId,
          employee: {
            organizationId: session.organizationId
          }
        },
        include: {
          employee: { include: employeeInclude },
        },
      });
      if (!payslip) return NextResponse.json({
        error: "Payslip not found"
      }, {
        status: 404
      });
      return NextResponse.json({
        success: true,
        data: serializePayslip(payslip)
      });
    }
    const targetId = hasPermission(session.role, "managePayroll") ? employeeId : session.employeeId;
    if (!targetId) {
      return NextResponse.json({
        error: "Employee required"
      }, {
        status: 400
      });
    }
    const [payslips, structure, employee, org] = await Promise.all([prisma.payslip.findMany({
      where: {
        employeeId: targetId
      },
      orderBy: [{
        year: "desc"
      }, {
        month: "desc"
      }],
      take: 24,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    }), prisma.salaryStructure.findUnique({
      where: {
        employeeId: targetId
      }
    }), prisma.employee.findUnique({
      where: {
        id: targetId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        dateOfJoining: true
      }
    }), prisma.organization.findUnique({
      where: {
        id: session.organizationId
      },
      select: {
        name: true
      }
    })]);
    const taxSummary = structure ? {
      netTaxableIncome: Number(structure.baseSalary) * 12,
      grossIncomeTax: 0,
      netIncomeTaxPayable: 0,
      taxPaid: 0,
      remainingTax: 0,
      regime: "New Tax Regime"
    } : null;
    return NextResponse.json({
      success: true,
      data: {
        payslips: payslips.map(serializePayslip),
        structure: structure ? {
          ...structure,
          baseSalary: Number(structure.baseSalary),
          hra: Number(structure.hra),
          allowances: Number(structure.allowances),
          deductions: Number(structure.deductions),
          taxRate: Number(structure.taxRate)
        } : null,
        employee,
        organizationName: org?.name ?? "Organization",
        taxSummary
      }
    });
  } catch (error) {
    console.error("[payroll GET]", error);
    return NextResponse.json({
      error: "Failed to load payroll"
    }, {
      status: 500
    });
  }
}
export async function POST(request) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "managePayroll")) {
    return NextResponse.json({
      error: "Forbidden"
    }, {
      status: 403
    });
  }
  const {
    employeeId,
    month,
    year
  } = await request.json();

  const scope = await assertEmployeeInOrg(prisma, employeeId, session.organizationId);
  if (!scope.ok) return scope.response;

  try {
    const structure = await prisma.salaryStructure.findUnique({
      where: {
        employeeId
      }
    });
    if (!structure) {
      return NextResponse.json({
        error: "Salary structure not found"
      }, {
        status: 404
      });
    }
    const base = Number(structure.baseSalary);
    const hra = Number(structure.hra);
    const allowances = Number(structure.allowances);
    const deductions = Number(structure.deductions);
    const gross = base + hra + allowances;
    const tax = gross * (Number(structure.taxRate) / 100);
    const netPay = gross - deductions - tax;
    const earningsDetail = {
      items: [{
        name: "Basic Salary",
        amount: base
      }, {
        name: "HRA",
        amount: hra
      }, {
        name: "Allowances",
        amount: allowances
      }],
      deductions: [{
        name: "PF / Deductions",
        amount: deductions
      }, {
        name: "Income Tax",
        amount: tax
      }]
    };
    const payslip = await prisma.payslip.upsert({
      where: {
        employeeId_month_year: {
          employeeId,
          month,
          year
        }
      },
      create: {
        employeeId,
        month,
        year,
        baseSalary: base,
        bonuses: 0,
        deductions: deductions + tax,
        netPay,
        workingDays: 30,
        payableDays: 30,
        lossOfPayDays: 0,
        earningsDetail,
        status: "PAID",
        processedAt: new Date()
      },
      update: {
        netPay,
        deductions: deductions + tax,
        earningsDetail,
        status: "PAID",
        processedAt: new Date()
      }
    });
    return NextResponse.json({
      success: true,
      data: serializePayslip(payslip)
    });
  } catch (e) {
    return NextResponse.json({
      error: "Payroll processing failed"
    }, {
      status: 500
    });
  }
}