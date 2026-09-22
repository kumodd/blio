import type { NextConfig } from "next";

function deploymentId() {
  const value = process.env.NEXT_DEPLOYMENT_ID ?? process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA;
  if (!value) return undefined;
  // Vercel deployment IDs use the reserved `dpl_` prefix. Next.js custom
  // deployment IDs must not use it and must be at most 32 characters.
  const normalized = value.replace(/^dpl_/i, "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
  return normalized || undefined;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  deploymentId: deploymentId(),
};

export default nextConfig;
