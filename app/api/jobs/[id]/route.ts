import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getResearchJob } from "@/lib/data";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const job = await getResearchJob(user.id, id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json({ job }, { headers: { "cache-control": "no-store" } });
}
