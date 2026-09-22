import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the blio team about access, partnerships, support, or pricing.",
};

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "kumod353@gmail.com";

export default function ContactPage() {
  return <div className="public-page contact-page"><section className="public-hero"><p className="eyebrow">Contact blio</p><h1>Have a question about finding better-fit clients?</h1><p className="public-lead">Email is the best way to reach us for workspace support, pricing questions, partnerships, feedback, or account help.</p><a className="button button-primary" href={`mailto:${contactEmail}`}><Mail /> Email {contactEmail} <ArrowRight /></a></section><section className="contact-grid"><article className="contact-card"><div className="contact-icon"><Mail size={19} /></div><h2>General and support</h2><p>Tell us what you are trying to sell, where you are prospecting, or what is not working in your workspace.</p><a className="text-link" href={`mailto:${contactEmail}`}>{contactEmail} <ArrowRight size={13} style={{ verticalAlign: "-2px" }} /></a></article><article className="contact-card"><div className="contact-icon"><MessageCircle size={19} /></div><h2>What to include</h2><p>Include your account email, campaign name, and a short description of the issue. Please do not send API keys, passwords, or private customer data.</p><Link className="text-link" href="/privacy">Review privacy details <ArrowRight size={13} style={{ verticalAlign: "-2px" }} /></Link></article></section><section className="public-callout"><div><p className="eyebrow">Before you write</p><h2>Most questions start with your target market.</h2><p>See how blio moves from offer and location to scored prospects and editable outreach.</p></div><Link className="button button-secondary" href="/about">See how it works <ArrowRight /></Link></section></div>;
}
