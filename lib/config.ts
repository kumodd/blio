export function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isDemoMode() {
  // Prefer the server-only flag so a production build can switch modes at
  // runtime without Next.js inlining a NEXT_PUBLIC_* value at build time.
  const configuredMode = process.env.BLIO_DEMO_MODE ?? process.env.NEXT_PUBLIC_DEMO_MODE;
  return configuredMode !== "false" || !hasSupabaseConfig();
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
