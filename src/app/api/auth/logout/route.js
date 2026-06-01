import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  await clearSession();

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = await createClient();
      await supabase.auth.signOut();
    }
  } catch (e) {
    // ignore
  }

  return NextResponse.json({ success: true });
}
