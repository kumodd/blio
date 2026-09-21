/* eslint-disable @next/next/no-img-element */

import type { Business } from "@/lib/types";
import { initials } from "@/lib/utils";

export function LeadMedia({ business, className = "" }: { business: Business; className?: string }) {
  const image = business.imageUrl && /^https?:\/\//i.test(business.imageUrl) ? business.imageUrl : undefined;
  return <div className={`lead-image ${className}`}>{image ? <img src={image} alt={`${business.name} preview`} loading="lazy" /> : <span>{initials(business.name)}</span>}</div>;
}
