"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { setDemoSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const emailSchema = z.string().email("Enter a valid email address.");

export async function requestOtpAction(formData: FormData) {
  const emailResult = emailSchema.safeParse(formData.get("email"));
  if (!emailResult.success) redirect(`/login?error=${encodeURIComponent(emailResult.error.issues[0]?.message ?? "Enter a valid email.")}`);
  const email = emailResult.data;
  const next = typeof formData.get("next") === "string" ? String(formData.get("next")) : "/dashboard";
  if (isDemoMode()) redirect(`/auth/verify?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(`/login?error=${encodeURIComponent("Authentication is not configured.")}`);
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect(`/auth/verify?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
}

export async function verifyOtpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const token = String(formData.get("token") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");
  if (isDemoMode()) {
    if (token !== "123456") redirect(`/auth/verify?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}&error=${encodeURIComponent("Use the demo code 123456.")}`);
    await setDemoSession(email);
    redirect(next.startsWith("/") ? next : "/dashboard");
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(`/login?error=${encodeURIComponent("Authentication is not configured.")}`);
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) redirect(`/auth/verify?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}&error=${encodeURIComponent(error.message)}`);
  redirect(next.startsWith("/") ? next : "/dashboard");
}
