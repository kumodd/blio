export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand ${light ? "login-brand" : ""}`}>
      <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 36 36" focusable="false"><circle cx="16.5" cy="16.5" r="8.5" fill="none" stroke="currentColor" strokeWidth="3" /><path d="m22.5 22.5 6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" /></svg></span>
      <span>QuickLeads</span>
    </div>
  );
}
