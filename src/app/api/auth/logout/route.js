import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { resetDemoOrganization } from "@/lib/auth/demo-reset";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getSession();
  const wasDemoSession = session?.isDemoSession === true;

  await clearSession();

  if (wasDemoSession) {
    try {
      await resetDemoOrganization(prisma);
    } catch (e) {
      console.error("[logout] demo reset failed:", e);
    }
  }

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !wasDemoSession) {
      const supabase = await createClient();
      await supabase.auth.signOut();
    }
  } catch (e) {
    // ignore
  }

  return NextResponse.json({ success: true });
}
