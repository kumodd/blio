/* eslint-disable @typescript-eslint/no-explicit-any */

import { extractSellerProfileFromWebsite, type SellerWebsiteSnapshot } from "../ai";
import type { SellerProfile } from "../types";

const maxHtmlCharacters = 450_000;

export function normalizeWebsiteUrl(raw?: string) {
  const value = raw?.trim();
  if (!value) return undefined;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(withProtocol);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Website URL must use http or https.");
  if (isPrivateHostname(url.hostname)) throw new Error("That website address cannot be fetched.");
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function isPrivateHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host === "::1") return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return true;
  const parts = host.split(".").map(Number);
  return parts.length === 4 && parts.every((part) => Number.isInteger(part)) && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31;
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => {
      const point = Number(code);
      return Number.isSafeInteger(point) && point >= 0 && point <= 0x10ffff ? String.fromCodePoint(point) : "";
    })
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => {
      const point = Number.parseInt(code, 16);
      return Number.isSafeInteger(point) && point >= 0 && point <= 0x10ffff ? String.fromCodePoint(point) : "";
    });
}

function attribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match?.[1]?.trim();
}

function tags(html: string, tagName: string) {
  return html.match(new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`, "gi")) ?? [];
}

function visibleText(html: string) {
  return decodeEntities(html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim())
    .slice(0, 16_000);
}

function structuredWebsiteFacts(html: string) {
  const facts: Record<string, string | string[]> = {};
  for (const script of tags(html, "script")) {
    if (!/type\s*=\s*["']application\/ld\+json/i.test(script)) continue;
    const raw = script.replace(/^<[\s\S]*?>|<\/script>$/gi, "").trim();
    try {
      const parsed = JSON.parse(raw) as any;
      const records = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.["@graph"]) ? parsed["@graph"] : [parsed];
      for (const record of records) {
        if (!record || typeof record !== "object") continue;
        for (const [target, source] of [["name", "name"], ["description", "description"], ["phone", "telephone"], ["email", "email"]] as const) {
          if (!facts[target] && typeof record[source] === "string") facts[target] = record[source];
        }
        const address = record.address;
        if (!facts.address && typeof address === "string") facts.address = address;
        if (!facts.address && address && typeof address === "object") {
          const parts = [address.streetAddress, address.addressLocality, address.addressRegion, address.postalCode].filter((part): part is string => typeof part === "string");
          if (parts.length) facts.address = parts.join(", ");
          if (!facts.city && typeof address.addressLocality === "string") facts.city = address.addressLocality;
        }
        if (!facts.city && typeof record.addressLocality === "string") facts.city = record.addressLocality;
        if (!facts.socialLinks && Array.isArray(record.sameAs)) facts.socialLinks = record.sameAs.filter((item: unknown): item is string => typeof item === "string");
      }
    } catch {
      // Some websites contain malformed JSON-LD. Visible HTML facts remain usable.
    }
  }
  return facts;
}

function parseSnapshot(url: string, html: string): SellerWebsiteSnapshot {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const meta = (key: string) => metaTags.find((tag) => attribute(tag, "name")?.toLowerCase() === key.toLowerCase() || attribute(tag, "property")?.toLowerCase() === key.toLowerCase());
  const title = decodeEntities(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/\s+/g, " ").trim();
  const description = decodeEntities(attribute(meta("description") ?? "", "content") ?? attribute(meta("og:description") ?? "", "content") ?? "");
  const headings = (html.match(/<h[1-3]\b[^>]*>[\s\S]*?<\/h[1-3]>/gi) ?? []).map((heading) => visibleText(heading)).filter(Boolean).slice(0, 20);
  const links = (html.match(/<a\b[^>]*>/gi) ?? []).map((tag) => attribute(tag, "href")).filter((href): href is string => Boolean(href)).map((href) => {
    try { return new URL(href, url).toString(); } catch { return href; }
  }).filter((href, index, all) => all.indexOf(href) === index).slice(0, 80);
  const structuredData = structuredWebsiteFacts(html);
  const text = visibleText(html);
  const siteName = attribute(meta("og:site_name") ?? "", "content");
  if (siteName && !structuredData.name) structuredData.name = siteName;
  return { url, title, description, headings, text, links, structuredData };
}

async function fetchPublicWebsite(url: string) {
  let currentUrl = url;
  const startedAt = Date.now();
  const requestBudgetMs = 10_000;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const remainingMs = requestBudgetMs - (Date.now() - startedAt);
    if (remainingMs <= 0) throw new Error("Website request timed out.");
    const response = await fetch(currentUrl, {
      headers: { accept: "text/html,application/xhtml+xml", "user-agent": "blio-business-profile/1.0" },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(remainingMs),
    });
    if (response.status < 300 || response.status >= 400) return { response, finalUrl: currentUrl };
    const location = response.headers.get("location");
    if (!location) throw new Error("Website redirect did not include a destination.");
    const nextUrl = normalizeWebsiteUrl(new URL(location, currentUrl).toString());
    if (!nextUrl) throw new Error("Website redirect was empty.");
    currentUrl = nextUrl;
  }
  throw new Error("Website redirected too many times.");
}

export async function scrapeSellerWebsite(rawUrl?: string): Promise<SellerProfile | undefined> {
  let url: string | undefined;
  try {
    url = normalizeWebsiteUrl(rawUrl);
  } catch (error) {
    console.error("Seller website URL could not be normalized:", error);
    return rawUrl?.trim() ? { websiteUrl: rawUrl.trim(), sourceUrl: rawUrl.trim(), scrapedAt: new Date().toISOString() } : undefined;
  }
  if (!url) return undefined;
  try {
    const { response, finalUrl } = await fetchPublicWebsite(url);
    if (!response.ok) throw new Error(`Website returned ${response.status}`);
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !/html|xhtml/i.test(contentType)) return { websiteUrl: finalUrl, sourceUrl: finalUrl, scrapedAt: new Date().toISOString() };
    const html = (await response.text()).slice(0, maxHtmlCharacters);
    return extractSellerProfileFromWebsite(parseSnapshot(finalUrl, html));
  } catch (error) {
    console.error("Seller website scraping failed; storing the supplied URL:", error);
    return { websiteUrl: url, sourceUrl: url, scrapedAt: new Date().toISOString() };
  }
}
