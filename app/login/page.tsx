import Link from "next/link";

import { requestOtpAction } from "./actions";
import { isDemoMode } from "@/lib/config";
import { Logo } from "@/components/logo";
import { FormSubmitButton } from "@/components/form-submit-button";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const params = await searchParams;
  return (
    <main className="login-page">
      <section className="login-art">
        <Logo light />
        <div className="login-copy">
          <p className="eyebrow" style={{ color: "var(--lime)" }}>Business lead intelligence</p>
          <h1>Know who to reach. Know why.</h1>
          <p>Turn a market idea into a researched, actionable local lead list—with the context and first message to make outreach feel human.</p>
        </div>
        <div className="login-proof"><div><strong>50–200</strong>prospects per campaign</div><div><strong>1 workspace</strong>from research to reach-out</div></div>
      </section>
      <section className="login-form-wrap">
        <div className="login-form">
          <h2>Welcome to QuickLeads</h2>
          <p className="subtitle">Sign in to your prospecting workspace with a one-time code.</p>
          {params.error ? <div className="alert alert-error">{params.error}</div> : null}
          {isDemoMode() ? <div className="demo-code"><strong>Demo mode</strong><br />Use any email address. We’ll give you code <strong>123456</strong> on the next step.</div> : null}
          <form action={requestOtpAction}>
            <input type="hidden" name="next" value={params.next ?? "/dashboard"} />
            <div className="form-field">
              <label className="label" htmlFor="email">Work email</label>
              <input className="input" id="email" name="email" type="email" placeholder="you@company.com" required autoComplete="email" autoFocus />
            </div>
            <FormSubmitButton className="button button-primary" style={{ width: "100%", marginTop: 7 }} pendingLabel="Sending code…">Continue with email</FormSubmitButton>
          </form>
          <p className="login-footer">By continuing, you agree to use public business information responsibly. QuickLeads prepares outreach for your review; it never sends messages automatically.</p>
          <Link href="/" className="login-footer" style={{ display: "inline-block", marginTop: 20 }}>← Back to start</Link>
        </div>
      </section>
    </main>
  );
}
