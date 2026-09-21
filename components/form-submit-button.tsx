"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function FormSubmitButton({ children, pendingLabel, className = "button button-primary", style, ...props }: { children: React.ReactNode; pendingLabel: string; className?: string; style?: React.CSSProperties } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className" | "style">) {
  const { pending } = useFormStatus();
  return <button {...props} className={className} style={style} type="submit" disabled={pending || props.disabled} aria-busy={pending}>{pending ? <><Loader2 className="spin" /> {pendingLabel}</> : children}</button>;
}
