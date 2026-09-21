export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand ${light ? "login-brand" : ""}`}>
      <span className="brand-mark">B</span>
      <span>blio</span>
    </div>
  );
}
