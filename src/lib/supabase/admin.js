import { createClient } from "@supabase/supabase-js";
import { DEFAULT_COMPANY_PASSWORD } from "@/lib/auth/default-password";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Create or update Supabase auth user with the company default password */
export async function syncSupabaseAuthUser(email, password = DEFAULT_COMPANY_PASSWORD) {
  const admin = getSupabaseAdmin();
  if (!admin) return { supabaseId: null, skipped: true };

  const normalized = email.trim().toLowerCase();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: normalized,
    password,
    email_confirm: true,
  });

  if (!createError && created?.user?.id) {
    return { supabaseId: created.user.id, created: true };
  }

  if (!/already|exists|registered/i.test(createError?.message || "")) {
    console.error("[syncSupabaseAuthUser create]", createError?.message);
  }

  const { data: list, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) {
    console.error("[syncSupabaseAuthUser list]", listError.message);
    return { supabaseId: null, error: listError.message };
  }

  const existing = list.users.find(
    (u) => u.email?.toLowerCase() === normalized
  );
  if (!existing) {
    return { supabaseId: null, error: "User not found in Supabase" };
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
    email: normalized,
    password,
    email_confirm: true,
  });
  if (updateError) {
    console.error("[syncSupabaseAuthUser update]", updateError.message);
    return { supabaseId: null, error: updateError.message };
  }

  return { supabaseId: existing.id, updated: true };
}
