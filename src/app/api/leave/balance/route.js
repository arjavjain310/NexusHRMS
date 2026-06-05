import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { getLeaveBalances } from "@/lib/leave-balance";
import { getEligibleLeaveTypes } from "@/lib/leave-eligibility";

export async function GET() {
  const session = await getSession();
  if (!session?.employeeId) {
    return NextResponse.json({ error: "Employee profile required" }, { status: 403 });
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: session.employeeId },
      select: { gender: true },
    });

    const gender = employee?.gender ?? null;
    const balances = await getLeaveBalances(session.employeeId, gender);
    const eligibleTypes = getEligibleLeaveTypes(gender);

    return NextResponse.json({
      success: true,
      data: balances,
      meta: {
        gender,
        eligibleTypes,
        genderRequired: !gender,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to load balances" }, { status: 500 });
  }
}
