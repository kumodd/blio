import Link from "next/link";

import { Logo } from "@/components/logo";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="public-site"><header className="public-header"><Link href="/" aria-label="blio home"><Logo /></Link><nav className="public-nav"><Link href="/about">About</Link><Link href="/pricing">Pricing</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link className="button button-primary" href="/login">Open workspace</Link></nav></header><main>{children}</main><footer className="public-footer"><span>© {new Date().getFullYear()} blio</span><div><Link href="/about">About</Link><Link href="/pricing">Pricing</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/refund-cancellation">Refunds</Link><Link href="/login">Sign in</Link></div></footer></div>;
}
