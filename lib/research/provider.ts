/* eslint-disable @typescript-eslint/no-explicit-any */

import type { BusinessContact, Campaign, ResearchCandidate } from "../types";
import { candidatesForCampaign } from "../data";

const OUTSCRAPER_URL = "https://api.outscraper.com/maps/search";

function socialType(value: string): BusinessContact["type"] | undefined {
  const url = value.toLowerCase();
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("facebook.com")) return "facebook";
  if (url.includes("linkedin.com")) return "linkedin";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  return undefined;
}

function contactsFromOutscraper(value: any): BusinessContact[] {
  const contacts: BusinessContact[] = [];
  const phoneValues = [value.phone, value.mobile, value.telephone].filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  for (const phone of phoneValues) contacts.push({ type: "phone", value: phone, verified: Boolean(value.verified) });
  const whatsappValues = [value.whatsapp, value.whatsapp_url, value.whatsapp_link].filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  for (const whatsapp of whatsappValues) contacts.push({ type: "whatsapp", value: whatsapp, verified: false });
  const emails = [
    ...(Array.isArray(value.emails) ? value.emails : []),
    value.email,
    value.email_address,
  ];
  for (const email of emails) {
    const address = typeof email === "string" ? email : email?.value;
    if (typeof address === "string") contacts.push({ type: "email", value: address, verified: false });
  }
  const socialLinks = [
    ...(Array.isArray(value.social_links) ? value.social_links : []),
    ...(Array.isArray(value.socials) ? value.socials : []),
    ...[value.instagram, value.facebook, value.linkedin, value.youtube].filter(Boolean),
  ];
  for (const link of socialLinks) {
    const url = typeof link === "string" ? link : link?.url ?? link?.value;
    const type = typeof url === "string" ? socialType(url) : undefined;
    if (type && typeof url === "string") contacts.push({ type, value: url, verified: false });
  }
  const website = value.site ?? value.website ?? value.website_url;
  if (typeof website === "string" && /^https?:\/\//i.test(website)) contacts.push({ type: "website", value: website, verified: false });
  return contacts.filter((contact, index, all) => all.findIndex((item) => item.type === contact.type && item.value === contact.value) === index);
}

function normalizeCandidate(value: any, index: number, sourceProvider = "Discovery adapter"): ResearchCandidate | null {
  const address = value?.full_address ?? value?.address;
  if (!value || typeof value.name !== "string" || typeof address !== "string") return null;
  const contacts = contactsFromOutscraper(value);
  const imageValues = [value.image, value.image_url, value.photo, value.photo_url, value.cover_photo, value.thumbnail, value.logo, value.logo_url, ...(Array.isArray(value.photos) ? value.photos : [])];
  const photos = imageValues.map((photo) => typeof photo === "string" ? photo : photo?.url ?? photo?.src).filter((photo): photo is string => typeof photo === "string" && /^https?:\/\//i.test(photo)).filter((photo, photoIndex, all) => all.indexOf(photo) === photoIndex);
  return {
    providerId: String(value.place_id ?? value.google_id ?? value.cid ?? value.providerId ?? value.id ?? `external-${index + 1}`),
    name: value.name,
    category: String(value.category ?? value.type ?? "Business"),
    address,
    city: value.city ? String(value.city) : undefined,
    lat: typeof value.latitude === "number" ? value.latitude : typeof value.lat === "number" ? value.lat : undefined,
    lng: typeof value.longitude === "number" ? value.longitude : typeof value.lng === "number" ? value.lng : undefined,
    imageUrl: photos[0],
    photos,
    phone: value.phone ?? value.mobile ?? value.telephone ? String(value.phone ?? value.mobile ?? value.telephone) : undefined,
    website: value.site ?? value.website ?? value.website_url ? String(value.site ?? value.website ?? value.website_url) : undefined,
    rating: typeof value.rating === "number" ? value.rating : undefined,
    reviewCount: typeof value.reviews === "number" ? value.reviews : typeof value.reviewCount === "number" ? value.reviewCount : undefined,
    description: value.description ? String(value.description) : undefined,
    contacts: contacts.length ? contacts : undefined,
    sourceUrl: value.location_link ?? value.sourceUrl ?? value.reviews_link,
    sourceProvider,
  };
}

async function discoverWithOutscraper(campaign: Campaign): Promise<ResearchCandidate[]> {
  const params = new URLSearchParams();
  const radius = Math.max(1, campaign.radiusKm ?? 10);
  const queries = campaign.locations.map((location) => `${campaign.category}, within ${radius} km of ${location}, India`);
  for (const query of queries) params.append("query", query);
  const requestedLimit = Math.max(5, campaign.leadLimit ?? 50);
  const configuredLimit = Math.min(500, Math.max(1, Number.parseInt(process.env.OUTSCRAPER_LIMIT ?? String(requestedLimit), 10) || requestedLimit));
  const perQueryLimit = Math.min(configuredLimit, Math.max(1, Math.ceil(requestedLimit / Math.max(1, campaign.locations.length))));
  params.set("limit", String(perQueryLimit));
  params.set("dropDuplicates", "true");
  params.set("async", "false");
  params.set("language", "en");
  params.set("region", "IN");
  if (process.env.OUTSCRAPER_ENRICH_CONTACTS === "true") params.append("enrichment", "contacts_n_leads");

  const timeoutMs = Number.parseInt(process.env.OUTSCRAPER_TIMEOUT_MS ?? "35000", 10) || 35000;
  let response: Response;
  try {
    response = await fetch(`${OUTSCRAPER_URL}?${params.toString()}`, {
      headers: { "X-API-KEY": process.env.OUTSCRAPER_API_KEY! },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error(`Google Maps discovery timed out after ${Math.round(timeoutMs / 1000)} seconds. Try fewer prospects or a smaller search radius.`);
    }
    throw error;
  }
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Outscraper returned ${response.status}: ${detail.slice(0, 220)}`);
  }
  const payload = await response.json();
  if (payload.status === "Failure") throw new Error("Outscraper reported a failed Google Maps task.");
  const rows = Array.isArray(payload.data) ? payload.data.flat(Infinity) : [];
  return rows.map((row: any, index: number) => normalizeCandidate(row, index, "Outscraper Google Maps")).filter((value: ResearchCandidate | null): value is ResearchCandidate => Boolean(value));
}

async function discoverWithCustomAdapter(campaign: Campaign): Promise<ResearchCandidate[]> {
  const response = await fetch(process.env.DISCOVERY_API_URL!, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.DISCOVERY_API_KEY ? { authorization: `Bearer ${process.env.DISCOVERY_API_KEY}` } : {}),
    },
    body: JSON.stringify({ category: campaign.category, locations: campaign.locations, radiusKm: campaign.radiusKm, filters: campaign.filters }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Discovery provider returned ${response.status}`);
  const payload = await response.json();
  const values = Array.isArray(payload) ? payload : payload.businesses;
  if (!Array.isArray(values)) throw new Error("Discovery provider returned an invalid response");
  return values.map((value, index) => normalizeCandidate(value, index)).filter((value: ResearchCandidate | null): value is ResearchCandidate => Boolean(value));
}

export async function discoverBusinesses(campaign: Campaign) {
  if (process.env.OUTSCRAPER_API_KEY) return discoverWithOutscraper(campaign);
  if (process.env.DISCOVERY_API_URL) return discoverWithCustomAdapter(campaign);
  return candidatesForCampaign(campaign);
}

export function passesFilters(candidate: ResearchCandidate, campaign: Campaign) {
  const filters = campaign.filters;
  if (filters.minRating && (candidate.rating ?? 0) < filters.minRating) return false;
  if (filters.minReviews && (candidate.reviewCount ?? 0) < filters.minReviews) return false;
  if (filters.websiteRequired && !candidate.website) return false;
  if (filters.whatsappRequired && !candidate.contacts?.some((contact) => contact.type === "whatsapp")) return false;
  if (filters.socialRequired && !candidate.contacts?.some((contact) => ["instagram", "facebook", "linkedin", "youtube"].includes(contact.type))) return false;
  return true;
}
