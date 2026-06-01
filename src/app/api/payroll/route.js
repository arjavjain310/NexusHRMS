import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
function serializePayslip(p) {
  return {
    ...p,
    baseSalary: Number(p.baseSalary),
    bonuses: Number(p.bonuses),
    deductions: Number(p.deductions),
    netPay: Number(p.netPay)
  };
}
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
  const employeeId = searchParams.get("employeeId") || session.employeeId;
  try {
    if (payslipId) {
      const payslip = await prisma.payslip.findFirst({
        where: {
          id: payslipId,
          employee: {
            organizationId: session.organizationId
          }
        },
        include: {
          employee: {
            include: {
              department: true,
              designation: true,
              organization: true
            }
          }
        }
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
        organizationName: org.name,
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