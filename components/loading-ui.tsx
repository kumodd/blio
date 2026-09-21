import type { CSSProperties } from "react";

function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <span className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

function TopbarSkeleton({ narrow = false }: { narrow?: boolean }) {
  return <div className="topbar loading-topbar"><div><Skeleton className="skeleton-eyebrow" /><Skeleton className="skeleton-title" style={{ width: narrow ? 220 : 310 }} /><Skeleton className="skeleton-subtitle" style={{ width: narrow ? 300 : 440 }} /></div><Skeleton className="skeleton-button" /></div>;
}

function StatSkeletons() {
  return <div className="stat-grid">{[1, 2, 3, 4].map((item) => <div className="card stat-card loading-card" key={item}><Skeleton style={{ width: 105, height: 12 }} /><Skeleton className="skeleton-stat" /><Skeleton style={{ width: 125, height: 10 }} /></div>)}</div>;
}

function RowsSkeleton({ count = 5 }: { count?: number }) {
  return <div className="card section-card loading-rows">{Array.from({ length: count }, (_, index) => <div className="loading-row" key={index}><Skeleton className="skeleton-avatar" /><div className="loading-row-copy"><Skeleton style={{ width: `${42 + (index % 3) * 13}%`, height: 13 }} /><Skeleton style={{ width: `${28 + (index % 4) * 9}%`, height: 10 }} /></div><Skeleton style={{ width: 55, height: 22 }} /></div>)}</div>;
}

function TableSkeleton() {
  return <div className="card section-card loading-table"><div className="loading-toolbar"><Skeleton style={{ width: 280, height: 38 }} /><Skeleton style={{ width: 145, height: 38 }} /></div>{Array.from({ length: 6 }, (_, index) => <div className="loading-table-row" key={index}><Skeleton className="skeleton-avatar" /><div className="loading-row-copy"><Skeleton style={{ width: `${34 + (index % 3) * 12}%`, height: 13 }} /><Skeleton style={{ width: 120, height: 10 }} /></div><Skeleton style={{ width: 45, height: 13 }} /><Skeleton style={{ width: 72, height: 22 }} /></div>)}</div>;
}

export function WorkspaceLoading({ variant = "dashboard" }: { variant?: "dashboard" | "list" | "table" | "detail" | "job" }) {
  return <div className="loading-page" role="status" aria-label="Loading workspace"><TopbarSkeleton narrow={variant === "job"} />{variant === "dashboard" ? <><StatSkeletons /><div className="split-grid"><RowsSkeleton count={4} /><RowsSkeleton count={4} /></div></> : null}{variant === "list" ? <RowsSkeleton count={6} /> : null}{variant === "table" ? <TableSkeleton /> : null}{variant === "detail" ? <><StatSkeletons /><div className="split-grid"><RowsSkeleton count={5} /><RowsSkeleton count={4} /></div></> : null}{variant === "job" ? <div className="card job-card loading-job"><Skeleton className="skeleton-job-icon" /><Skeleton className="skeleton-eyebrow" style={{ margin: "0 auto 12px" }} /><Skeleton className="skeleton-job-title" /><Skeleton className="skeleton-job-copy" /><Skeleton className="skeleton-progress" /></div> : null}<span className="loading-label">Loading your workspace…</span></div>;
}

export function AuthLoading() {
  return <main className="login-page" role="status" aria-label="Loading"><section className="login-art" /><section className="login-form-wrap"><div className="login-form"><Skeleton className="skeleton-title" style={{ width: 210 }} /><Skeleton className="skeleton-subtitle" style={{ width: 300 }} /><Skeleton className="skeleton-input" /><Skeleton className="skeleton-button skeleton-button-wide" /></div></section></main>;
}

export function FormLoading() {
  return <div className="loading-page" role="status" aria-label="Loading form"><TopbarSkeleton narrow /><div className="card form-card loading-form"><Skeleton style={{ width: 180, height: 18 }} /><Skeleton className="skeleton-input" /><Skeleton style={{ width: 180, height: 18, marginTop: 18 }} /><Skeleton className="skeleton-input" /><Skeleton style={{ width: 180, height: 18, marginTop: 18 }} /><Skeleton className="skeleton-input" /><div className="loading-form-actions"><Skeleton className="skeleton-button" /><Skeleton className="skeleton-button" style={{ width: 88 }} /></div></div></div>;
}
