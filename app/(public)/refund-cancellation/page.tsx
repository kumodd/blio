import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund and Cancellation Policy",
  description: "Refund, cancellation, and billing information for blio.",
};

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "kumod353@gmail.com";

export default function RefundCancellationPage() {
  return <article className="public-page legal-page"><p className="eyebrow">Legal</p><h1>Refund and Cancellation Policy</h1><p className="legal-updated">Last updated: September 22, 2026</p><p>blio is currently in early access. Paid subscription checkout is not active in the workspace at this time, so blio is not currently collecting recurring subscription charges through this website.</p><h2>When paid plans launch</h2><p>Before paid billing is activated, the applicable plan price, billing interval, usage limits, renewal terms, and cancellation method will be shown at checkout. This page will be updated if the billing process or plan terms change.</p><h2>Cancellation</h2><p>You may cancel a paid subscription using the billing controls provided in your account or by contacting us. Cancellation stops the next renewal; unless the checkout terms say otherwise, access normally remains available until the end of the paid billing period.</p><h2>Refund requests</h2><p>If you are charged because of a duplicate transaction, an incorrect amount, or an account or billing error, contact us promptly with the account email and transaction details. We will review the request and, when approved, return the applicable amount to the original payment method.</p><h2>Provider and usage charges</h2><p>Third-party providers used by a workspace may have separate pricing, quotas, or terms. Provider charges are not automatically refunded by blio and should be handled according to the relevant provider’s policy.</p><h2>Contact</h2><p>For cancellation or refund questions, email <a className="text-link" href={`mailto:${contactEmail}`}>{contactEmail}</a>. Do not include passwords, API keys, or sensitive customer information in your message.</p><p><Link className="text-link" href="/terms">Read the Terms and Conditions</Link> or <Link className="text-link" href="/privacy">Privacy Policy</Link>.</p></article>;
}
