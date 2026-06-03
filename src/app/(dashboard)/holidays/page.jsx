import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { HolidaysClient } from "@/components/modules/holidays-client";
import { getOrganizationHolidays2026 } from "@/lib/holidays-server";

export const dynamic = "force-dynamic";

export default async function HolidaysPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const initialHolidays = await getOrganizationHolidays2026(session.organizationId);

  return <HolidaysClient initialHolidays={initialHolidays} year={2026} />;
}
