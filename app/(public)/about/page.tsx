import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BrainCircuit, MessageSquareText, Search, Target } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "Learn how QuickLeads helps service businesses find, understand, and prioritize local prospects.",
};

export default function AboutPage() {
  return <div className="public-page"><section className="public-hero"><p className="eyebrow">About QuickLeads</p><h1>Better prospecting starts with a better reason to reach out.</h1><p className="public-lead">QuickLeads helps agencies, consultants, software companies, and local service providers turn a target market into an actionable prospect pipeline.</p><Link className="button button-primary" href="/login">Build your first campaign <ArrowRight /></Link></section><section className="public-section"><div className="public-section-heading"><p className="eyebrow">The product loop</p><h2>From market idea to meaningful conversation.</h2></div><div className="public-value-grid"><article><Search /><h3>Discover</h3><p>Find businesses by location, category, and search radius using public business information.</p></article><article><BrainCircuit /><h3>Understand</h3><p>AI turns ratings, websites, contact paths, and public signals into an opportunity profile.</p></article><article><Target /><h3>Prioritize</h3><p>Score the best-fit prospects, surface highlights, and keep the next sales action visible.</p></article><article><MessageSquareText /><h3>Reach out</h3><p>Generate editable email, WhatsApp, Instagram, SMS, and call drafts grounded in evidence.</p></article></div></section><section className="public-callout"><div><p className="eyebrow">Human-in-the-loop by design</p><h2>You bring the relationship. QuickLeads brings the context.</h2><p>Messages are always prepared for review. QuickLeads never sends outreach automatically.</p></div><Link className="button button-secondary" href="/terms">Read the terms <ArrowRight /></Link></section></div>;
}
