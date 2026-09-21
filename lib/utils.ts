import type { LeadStatus } from "./types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value?: string, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", options ?? { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(value),
  );
}

export function formatRelativeDate(value?: string) {
  if (!value) return "Never";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value, { month: "short", day: "numeric" });
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: value > 999 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

export function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function statusLabel(status: LeadStatus) {
  return {
    new: "New",
    reviewed: "Qualified",
    contacted: "Contacted",
    replied: "Replied",
    interested: "Interested",
    meeting: "Meeting",
    proposal: "Proposal",
    won: "Won",
    not_fit: "Lost",
  }[status];
}

export function safeUrl(value?: string) {
  if (!value) return undefined;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function phoneUrl(value?: string) {
  return value ? `tel:${value.replace(/[^+\d]/g, "")}` : undefined;
}

export function whatsappUrl(value?: string, body?: string) {
  if (!value) return undefined;
  const phone = value.replace(/[^\d]/g, "");
  return `https://wa.me/${phone}${body ? `?text=${encodeURIComponent(body)}` : ""}`;
}

export function smsUrl(value?: string, body?: string) {
  if (!value) return undefined;
  const phone = value.replace(/[^+\d]/g, "");
  return `sms:${phone}${body ? `?body=${encodeURIComponent(body)}` : ""}`;
}
