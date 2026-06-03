import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOrganizationHolidays2026 } from "@/lib/holidays-server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getOrganizationHolidays2026(session.organizationId);
  return NextResponse.json({ success: true, data, year: 2026 });
}
