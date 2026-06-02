import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getLeaveBalances } from "@/lib/leave-balance";

export async function GET() {
  const session = await getSession();
  if (!session?.employeeId) {
    return NextResponse.json({ error: "Employee profile required" }, { status: 403 });
  }

  try {
    const balances = await getLeaveBalances(session.employeeId);
    return NextResponse.json({ success: true, data: balances });
  } catch (e) {
    return NextResponse.json({ error: "Failed to load balances" }, { status: 500 });
  }
}
