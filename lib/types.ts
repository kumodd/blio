export type LeadStatus =
  | "new"
  | "reviewed"
  | "contacted"
  | "replied"
  | "interested"
  | "meeting"
  | "proposal"
  | "won"
  | "not_fit";

export type JobStatus =
  | "queued"
  | "running"
  | "partially_complete"
  | "complete"
  | "failed"
  | "cancelled";

export type OutreachChannel = "whatsapp" | "email" | "sms" | "phone" | "website" | "instagram" | "facebook" | "linkedin" | "youtube";

export interface CampaignContext {
  offer: string;
  targetCustomer: string;
  painPoint: string;
  valueProposition: string;
  cta: string;
  tone: string;
}

export interface CampaignFilters {
  minRating?: number;
  minReviews?: number;
  websiteRequired?: boolean;
  whatsappRequired?: boolean;
  socialRequired?: boolean;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  category: string;
  locations: string[];
  radiusKm: number;
  leadLimit: number;
  context: CampaignContext;
  filters: CampaignFilters;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface BusinessSource {
  id?: string;
  provider: string;
  providerId?: string;
  sourceUrl?: string;
  observedAt: string;
}

export interface BusinessContact {
  type: OutreachChannel;
  value: string;
  label?: string;
  verified?: boolean;
  source?: string;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  address: string;
  city?: string;
  lat?: number;
  lng?: number;
  imageUrl?: string;
  photos?: string[];
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  description?: string;
  contacts: BusinessContact[];
  sources: BusinessSource[];
}

export interface Lead {
  id: string;
  campaignId: string;
  business: Business;
  score: number;
  reasoning: string[];
  signals: { label: string; value: string; positive: boolean }[];
  status: LeadStatus;
  tags: string[];
  notes?: string;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachDraft {
  id: string;
  leadId: string;
  channel: OutreachChannel;
  body: string;
  subject?: string;
  model: string;
  promptVersion: string;
  createdAt: string;
  editedAt?: string;
}

export interface ResearchJob {
  id: string;
  campaignId: string;
  status: JobStatus;
  progress: number;
  totalFound: number;
  totalProcessed: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface DashboardStats {
  campaigns: number;
  discovered: number;
  saved: number;
  contacted: number;
  replied: number;
  meetings: number;
}

export interface ResearchCandidate {
  providerId: string;
  name: string;
  category: string;
  address: string;
  city?: string;
  lat?: number;
  lng?: number;
  imageUrl?: string;
  photos?: string[];
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  description?: string;
  contacts?: BusinessContact[];
  sourceUrl?: string;
  sourceProvider?: string;
}

export interface LeadIntelligence {
  score: number;
  reasoning: string[];
  signals: { label: string; value: string; positive: boolean }[];
}
