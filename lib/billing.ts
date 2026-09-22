/* eslint-disable @typescript-eslint/no-explicit-any */

import { createHmac, timingSafeEqual } from "node:crypto";

import { isDemoMode } from "./config";
import { createSupabaseAdminClient } from "./supabase/admin";
import { createSupabaseServerClient } from "./supabase/server";

export type BillingPlanKey = "growth";

export const billingPlans = {
  growth: {
    key: "growth" as const,
    name: "Growth",
    description: "For agencies and service businesses running prospecting every week.",
    price: "₹1,999",
    detail: "per month",
    features: ["10 active campaigns", "Up to 500 prospects per month", "Website and contact enrichment", "AI prospect analysis", "Priority research runs", "Exportable lead data"],
  },
} as const;

export type BillingSubscription = {
  id: string;
  userId: string;
  provider: string;
  providerSubscriptionId: string;
  providerPlanId: string;
  providerCustomerId?: string;
  providerPaymentId?: string;
  planKey: string;
  status: string;
  currentStart?: string;
  currentEnd?: string;
  chargeAt?: string;
  endedAt?: string;
  cancelAtCycleEnd: boolean;
  createdAt: string;
  updatedAt: string;
};

type RazorpaySubscription = {
  id: string;
  plan_id?: string;
  customer_id?: string | null;
  status?: string;
  current_start?: number | null;
  current_end?: number | null;
  charge_at?: number | null;
  ended_at?: number | null;
  cancel_at_cycle_end?: boolean;
  remaining_count?: number | null;
  notes?: Record<string, string>;
  [key: string]: unknown;
};

function requiredRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  return { keyId, keySecret };
}

export function isRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_GROWTH_PLAN_ID && process.env.RAZORPAY_WEBHOOK_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function toIso(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? new Date(value * 1000).toISOString() : null;
}

function mapBillingSubscription(row: any): BillingSubscription {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerSubscriptionId: row.provider_subscription_id,
    providerPlanId: row.provider_plan_id,
    providerCustomerId: row.provider_customer_id ?? undefined,
    providerPaymentId: row.provider_payment_id ?? undefined,
    planKey: row.plan_key,
    status: row.status,
    currentStart: row.current_start ?? undefined,
    currentEnd: row.current_end ?? undefined,
    chargeAt: row.charge_at ?? undefined,
    endedAt: row.ended_at ?? undefined,
    cancelAtCycleEnd: Boolean(row.cancel_at_cycle_end),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function subscriptionRow(userId: string, subscription: RazorpaySubscription, planKey: BillingPlanKey, rawJson: Record<string, unknown>, providerPaymentId?: string) {
  return {
    user_id: userId,
    provider: "razorpay",
    provider_subscription_id: subscription.id,
    provider_plan_id: subscription.plan_id ?? process.env.RAZORPAY_GROWTH_PLAN_ID!,
    provider_customer_id: subscription.customer_id ?? null,
    provider_payment_id: providerPaymentId ?? null,
    plan_key: planKey,
    status: subscription.status ?? "created",
    current_start: toIso(subscription.current_start),
    current_end: toIso(subscription.current_end),
    charge_at: toIso(subscription.charge_at),
    ended_at: toIso(subscription.ended_at),
    cancel_at_cycle_end: Boolean(subscription.cancel_at_cycle_end),
    raw_json: rawJson,
  };
}

async function razorpayRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { keyId, keySecret } = requiredRazorpayConfig();
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const description = payload?.error?.description ?? payload?.description ?? "Razorpay request failed.";
    throw new Error(description);
  }
  return payload as T;
}

export async function getBillingSubscription(userId: string) {
  if (isDemoMode()) return undefined;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return undefined;
  const { data, error } = await supabase.from("billing_subscriptions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapBillingSubscription(data) : undefined;
}

export function hasPaidAccess(subscription?: BillingSubscription) {
  return Boolean(subscription && ["authenticated", "active"].includes(subscription.status));
}

async function saveBillingSubscription(userId: string, subscription: RazorpaySubscription, planKey: BillingPlanKey, rawJson: Record<string, unknown>, providerPaymentId?: string, admin = false) {
  const supabase = admin ? createSupabaseAdminClient() : await createSupabaseServerClient();
  if (!supabase) throw new Error(admin ? "SUPABASE_SERVICE_ROLE_KEY is not configured." : "Supabase is not configured.");
  const row = subscriptionRow(userId, subscription, planKey, rawJson, providerPaymentId);
  const { data, error } = await supabase.from("billing_subscriptions").upsert(row, { onConflict: "provider_subscription_id" }).select("*").single();
  if (error) throw new Error(error.message);
  return mapBillingSubscription(data);
}

export async function createBillingSubscription(userId: string, email: string, planKey: BillingPlanKey) {
  if (isDemoMode()) throw new Error("Billing requires Supabase production mode.");
  if (planKey !== "growth") throw new Error("That billing plan is not available.");
  const planId = process.env.RAZORPAY_GROWTH_PLAN_ID;
  if (!planId) throw new Error("Growth billing is not configured. Add RAZORPAY_GROWTH_PLAN_ID.");
  const current = await getBillingSubscription(userId);
  if (current && ["created", "authenticated", "active", "pending"].includes(current.status)) return current;
  const totalCount = Math.max(1, Number.parseInt(process.env.RAZORPAY_SUBSCRIPTION_TOTAL_COUNT ?? "120", 10) || 120);
  const subscription = await razorpayRequest<RazorpaySubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: planId,
      total_count: totalCount,
      quantity: 1,
      customer_notify: true,
      notes: { blio_user_id: userId, blio_plan_key: planKey, blio_email: email },
    }),
  });
  return saveBillingSubscription(userId, subscription, planKey, subscription);
}

export async function fetchRazorpaySubscription(subscriptionId: string) {
  return razorpayRequest<RazorpaySubscription>(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

export function verifySubscriptionSignature(subscriptionId: string, paymentId: string, signature: string) {
  const { keySecret } = requiredRazorpayConfig();
  const expected = createHmac("sha256", keySecret).update(`${paymentId}|${subscriptionId}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(signature, "utf8");
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function saveVerifiedSubscription(userId: string, subscriptionId: string, paymentId: string) {
  const subscription = await fetchRazorpaySubscription(subscriptionId);
  const saved = await saveBillingSubscription(userId, subscription, "growth", subscription, paymentId);
  return { ...saved, providerPaymentId: paymentId };
}

export async function cancelBillingSubscription(userId: string, cancelAtCycleEnd = true) {
  const current = await getBillingSubscription(userId);
  if (!current || !["created", "authenticated", "active", "pending"].includes(current.status)) throw new Error("No active subscription was found.");
  const subscription = await razorpayRequest<RazorpaySubscription>(`/subscriptions/${encodeURIComponent(current.providerSubscriptionId)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0 }),
  });
  return saveBillingSubscription(userId, { ...subscription, cancel_at_cycle_end: cancelAtCycleEnd }, "growth", subscription);
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured.");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(signature, "utf8");
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

function webhookSubscription(payload: any): { subscription?: RazorpaySubscription; paymentId?: string } {
  const subscription = payload?.payload?.subscription?.entity;
  const payment = payload?.payload?.payment?.entity;
  const paymentSubscriptionId = payment?.subscription_id;
  if (subscription) return { subscription, paymentId: payment?.id };
  if (paymentSubscriptionId) return { subscription: { id: paymentSubscriptionId, status: "active" }, paymentId: payment?.id };
  return {};
}

function webhookStatus(event: string, currentStatus?: string) {
  const statusByEvent: Record<string, string> = {
    "subscription.authenticated": "authenticated",
    "subscription.activated": "active",
    "subscription.charged": "active",
    "subscription.pending": "pending",
    "subscription.halted": "halted",
    "subscription.cancelled": "cancelled",
    "subscription.completed": "completed",
    "subscription.expired": "expired",
    "subscription.paused": "paused",
    "subscription.resumed": "active",
  };
  return statusByEvent[event] ?? currentStatus;
}

export async function processRazorpayWebhook(eventId: string, eventType: string, payload: any) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  const { data: inserted, error: eventError } = await supabase.from("billing_webhook_events").insert({ event_id: eventId, event_type: eventType, payload_json: payload }).select("event_id").maybeSingle();
  if (eventError && eventError.code !== "23505") throw new Error(eventError.message);
  if (!inserted && eventError?.code === "23505") return false;
  const { subscription, paymentId } = webhookSubscription(payload);
  if (!subscription?.id) return true;
  const { data: current } = await supabase.from("billing_subscriptions").select("*").eq("provider_subscription_id", subscription.id).maybeSingle();
  const status = webhookStatus(eventType, current?.status);
  const notes = subscription.notes ?? {};
  const userId = current?.user_id ?? notes.blio_user_id;
  if (!userId || !status) return true;
  await saveBillingSubscription(String(userId), { ...subscription, status }, "growth", payload, paymentId ?? current?.provider_payment_id, true);
  await supabase.from("billing_webhook_events").update({ processed_at: new Date().toISOString() }).eq("event_id", eventId);
  return true;
}
