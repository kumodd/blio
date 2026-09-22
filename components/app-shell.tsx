"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, LayoutDashboard, LogOut, Plus, Search, Settings, Users } from "lucide-react";

import { signOutAction } from "@/app/actions";
import { FormSubmitButton } from "./form-submit-button";
import { Logo } from "./logo";
import { initials } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: Search },
  { href: "/leads", label: "All leads", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

export function AppShell({ children, user }: { children: React.ReactNode; user: { email: string; name: string } }) {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <div className="mobile-nav"><Logo /><Link className="button button-primary" href="/campaigns/new"><Plus /></Link></div>
      <aside className="sidebar">
        <Logo />
        <div className="nav-label">Workspace</div>
        <nav className="nav-list">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return <Link key={item.href} href={item.href} className={`nav-link ${active ? "active" : ""}`}><Icon />{item.label}</Link>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/settings" className={`nav-link ${pathname.startsWith("/settings") ? "active" : ""}`}><Settings />Settings</Link>
          <div className="mode-note"><strong>Human-in-the-loop</strong>Review every message before you contact a lead.</div>
          <div className="profile-mini">
            <div className="avatar">{initials(user.name || user.email)}</div>
            <div className="profile-mini-text"><strong>{user.name}</strong><span>{user.email}</span></div>
            <form action={signOutAction} style={{ marginLeft: "auto" }}><FormSubmitButton aria-label="Sign out" className="button button-ghost" pendingLabel="Signing out…"><LogOut /></FormSubmitButton></form>
          </div>
        </div>
      </aside>
      <main className="main-content"><div className="main-inner">{children}</div></main>
    </div>
  );
}
