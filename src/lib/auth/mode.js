/** Server: demo cookie auth (local testing only). */
export function isDemoMode() {
  return process.env.DEMO_MODE === "true";
}

/** Server: Supabase email/password auth (production). */
export function isSupabaseAuthEnabled() {
  return !isDemoMode() && !!process.env.NEXT_PUBLIC_SUPABASE_URL;
}
