import type { BusinessContact, Lead, ResearchCandidate } from "../types";

function compact(value?: string) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(road|rd)\b/g, " rd ")
    .replace(/\b(street|st)\b/g, " st ")
    .replace(/\b(avenue|ave)\b/g, " ave ")
    .replace(/\b(parkway|pkwy)\b/g, " pkwy ")
    .replace(/[^a-z0-9]+/g, "");
}

function phoneKey(value?: string) {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function websiteHost(value?: string) {
  if (!value) return "";
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function businessIdentityKeys(input: { providerId?: string; name?: string; address?: string; phone?: string; website?: string }) {
  const keys: string[] = [];
  const providerId = input.providerId?.trim();
  const name = compact(input.name);
  const address = compact(input.address);
  const phone = phoneKey(input.phone);
  const host = websiteHost(input.website);

  if (providerId && !/^external-/i.test(providerId)) keys.push(`provider:${providerId.toLowerCase()}`);
  if (name && address) keys.push(`name-address:${name}|${address}`);
  if (name && phone.length >= 7) keys.push(`name-phone:${name}|${phone}`);
  // Only use the website as a fallback when the address is unavailable. This
  // avoids merging separate branches that share one domain.
  if (name && !address && host) keys.push(`name-site:${name}|${host}`);
  return keys;
}

function mergeContacts(left: BusinessContact[] | undefined, right: BusinessContact[] | undefined) {
  return [...(left ?? []), ...(right ?? [])].filter((contact, index, all) => all.findIndex((item) => item.type === contact.type && item.value.trim().toLowerCase() === contact.value.trim().toLowerCase()) === index);
}

export function mergeResearchCandidates(left: ResearchCandidate, right: ResearchCandidate): ResearchCandidate {
  return {
    ...left,
    category: left.category || right.category,
    address: left.address.length >= right.address.length ? left.address : right.address,
    city: left.city ?? right.city,
    lat: left.lat ?? right.lat,
    lng: left.lng ?? right.lng,
    imageUrl: left.imageUrl ?? right.imageUrl,
    photos: [...(left.photos ?? []), ...(right.photos ?? [])].filter((photo, index, all) => all.indexOf(photo) === index),
    phone: left.phone ?? right.phone,
    website: left.website ?? right.website,
    rating: left.rating ?? right.rating,
    reviewCount: left.reviewCount ?? right.reviewCount,
    description: left.description ?? right.description,
    contacts: mergeContacts(left.contacts, right.contacts),
    sourceUrl: left.sourceUrl ?? right.sourceUrl,
    sourceProvider: left.sourceProvider ?? right.sourceProvider,
  };
}

export function deduplicateCandidates(candidates: ResearchCandidate[]) {
  const unique: ResearchCandidate[] = [];
  const keyToIndex = new Map<string, number>();
  let duplicateCount = 0;

  for (const candidate of candidates) {
    const keys = businessIdentityKeys(candidate);
    const existingIndex = keys.map((key) => keyToIndex.get(key)).find((index): index is number => index !== undefined);
    if (existingIndex === undefined) {
      const index = unique.push(candidate) - 1;
      keys.forEach((key) => keyToIndex.set(key, index));
      continue;
    }

    duplicateCount += 1;
    unique[existingIndex] = mergeResearchCandidates(unique[existingIndex], candidate);
    businessIdentityKeys(unique[existingIndex]).forEach((key) => keyToIndex.set(key, existingIndex));
  }

  return { candidates: unique, duplicateCount };
}

export function publicSourceLabel(value?: string) {
  if (!value) return "Public business listing";
  const normalized = value.toLowerCase();
  if (/(out scraper|outscraper|openai|gpt|discovery adapter|provider|scraper)/i.test(normalized)) return "Public business listing";
  return value;
}

export function deduplicateLeads(leads: Lead[]) {
  const unique: Lead[] = [];
  const keyToIndex = new Map<string, number>();

  for (const lead of leads) {
    const keys = businessIdentityKeys(lead.business);
    const existingIndex = keys.map((key) => keyToIndex.get(key)).find((index): index is number => index !== undefined);
    if (existingIndex === undefined) {
      const index = unique.push(lead) - 1;
      keys.forEach((key) => keyToIndex.set(key, index));
      continue;
    }

    const current = unique[existingIndex];
    const preferred = lead.score > current.score || (lead.score === current.score && lead.updatedAt > current.updatedAt) ? lead : current;
    unique[existingIndex] = preferred;
    businessIdentityKeys(preferred.business).forEach((key) => keyToIndex.set(key, existingIndex));
  }

  return unique;
}
