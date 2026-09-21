import { cookies } from "next/headers";

import { isDemoMode } from "./config";
import { createSupabaseServerClient } from "./supabase/server";

const DEMO_COOKIE = "blio_demo_session";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (isDemoMode()) {
    const session = (await cookies()).get(DEMO_COOKIE)?.value;
    if (!session) return null;
    return { id: "demo-user", email: decodeURIComponent(session), name: "Demo workspace" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    name: (data.user.user_metadata?.full_name as string | undefined) ?? data.user.email?.split("@")[0] ?? "Workspace",
  };
}

export async function setDemoSession(email: string) {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_COOKIE, encodeURIComponent(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function clearDemoSession() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
