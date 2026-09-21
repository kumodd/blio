import Link from "next/link";

import { verifyOtpAction } from "@/app/login/actions";
import { FormSubmitButton } from "@/components/form-submit-button";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ email?: string; next?: string; error?: string }> }) {
  const params = await searchParams;
  const email = params.email ?? "";
  return (
    <main className="login-page">
      <section className="login-art">
        <Link href="/login"><span className="brand login-brand"><span className="brand-mark">B</span><span>blio</span></span></Link>
        <div className="login-copy"><p className="eyebrow" style={{ color: "var(--lime)" }}>One small step</p><h1>Your workspace is waiting.</h1><p>Enter the six-digit code to continue. No password to remember, no onboarding maze.</p></div>
        <div className="login-proof"><div><strong>Secure</strong>email OTP access</div><div><strong>Private</strong>workspace isolation</div></div>
      </section>
      <section className="login-form-wrap">
        <div className="login-form">
          <h2>Check your inbox</h2>
          <p className="subtitle">We sent a one-time code to <strong>{email}</strong>.</p>
          {params.error ? <div className="alert alert-error">{params.error}</div> : null}
          <form action={verifyOtpAction}>
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="next" value={params.next ?? "/dashboard"} />
            <div className="form-field"><label className="label" htmlFor="token">One-time code</label><input className="input" id="token" name="token" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="123456" required autoFocus /></div>
            <FormSubmitButton className="button button-primary" style={{ width: "100%", marginTop: 7 }} pendingLabel="Verifying code…">Enter workspace</FormSubmitButton>
          </form>
          <p className="login-footer"><Link href={`/login?next=${encodeURIComponent(params.next ?? "/dashboard")}`}>Use a different email</Link></p>
        </div>
      </section>
    </main>
  );
}
