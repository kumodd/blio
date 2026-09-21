import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { updateLead } from "@/lib/data";

const patchSchema = z.object({
  status: z.enum(["new", "reviewed", "contacted", "replied", "interested", "meeting", "proposal", "won", "not_fit"]).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(5000).optional(),
  lastContactedAt: z.string().datetime().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const value = patchSchema.safeParse(await request.json());
    if (!value.success) return NextResponse.json({ error: "Invalid lead update" }, { status: 400 });
    const { id } = await context.params;
    const lead = await updateLead(user.id, id, value.data);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    return NextResponse.json({ lead });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update lead" }, { status: 500 });
  }
}
