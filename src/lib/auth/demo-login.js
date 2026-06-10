/** Server: one-click demo login enabled (local DEMO_MODE or production flag). */
export function isDemoLoginEnabled() {
  return (
    process.env.DEMO_MODE === "true" || process.env.ENABLE_DEMO_LOGIN === "true"
  );
}
