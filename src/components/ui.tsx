import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-white ${className}`}>{children}</div>;
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-widest text-muted">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
    </Card>
  );
}

export function Btn({
  children,
  onClick,
  variant = "solid",
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "ghost";
  type?: "button" | "submit";
  className?: string;
}) {
  const base = "rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer";
  const v =
    variant === "solid"
      ? "bg-black text-white hover:bg-neutral-800"
      : "border border-line bg-white text-black hover:border-black";
  return (
    <button type={type} onClick={onClick} className={`${base} ${v} ${className}`}>
      {children}
    </button>
  );
}

export function Badge({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "solid" | "outline" }) {
  const t =
    tone === "solid"
      ? "bg-black text-white"
      : tone === "outline"
        ? "border border-black text-black"
        : "bg-soft text-neutral-700";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${t}`}>{children}</span>;
}

export const inputCls =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-black";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-muted">{label}</span>
      {children}
    </label>
  );
}
