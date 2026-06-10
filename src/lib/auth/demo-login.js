/**
 * Quick demo login is enabled by default when a database is configured.
 * Set ENABLE_DEMO_LOGIN=false to disable on production deployments.
 */
export function isDemoLoginEnabled() {
  if (process.env.ENABLE_DEMO_LOGIN === "false") return false;
  if (process.env.DEMO_MODE === "true") return true;
  if (process.env.ENABLE_DEMO_LOGIN === "true") return true;
  return Boolean(process.env.DATABASE_URL);
}
