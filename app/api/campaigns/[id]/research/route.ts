import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { createResearchJob, getCampaign } from "@/lib/data";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!(await getCampaign(user.id, id))) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    const job = await createResearchJob(user.id, id);
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create research job" }, { status: 500 });
  }
}
