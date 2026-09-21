import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseConfig, isDemoMode } from "./lib/config";

export async function proxy(request: NextRequest) {
  if (isDemoMode() || !hasSupabaseConfig()) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  const isProtected = request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/campaigns") || request.nextUrl.pathname.startsWith("/leads") || request.nextUrl.pathname.startsWith("/jobs") || request.nextUrl.pathname.startsWith("/settings");
  if (isProtected && !data.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
