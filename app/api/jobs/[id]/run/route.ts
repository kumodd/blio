import { after, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/config";
import { getResearchJob } from "@/lib/data";
import { runResearchJob } from "@/lib/research/worker";

export const maxDuration = 60;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const current = await getResearchJob(user.id, id);
    if (!current) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (["complete", "running"].includes(current.status)) return NextResponse.json({ job: current });
    if (isDemoMode()) {
      const job = await runResearchJob(user.id, id);
      return NextResponse.json({ job }, { status: 200 });
    }
    after(async () => {
      try {
        await runResearchJob(user.id, id);
      } catch {
        // The worker persists the failure state; the polling UI surfaces it.
      }
    });
    return NextResponse.json({ job: current }, { status: 202 });
  } catch (error) {
    console.error("Research run request failed:", error);
    return NextResponse.json({ error: "Research could not be completed. Review your campaign settings and try again." }, { status: 500 });
  }
}
