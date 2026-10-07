"use client";

import { useEffect, useRef, useState } from "react";

export type MenuTarget = "settings" | "account";

export default function BrandMenu({
  businessName,
  ownerEmail,
  onSelect,
}: {
  businessName: string;
  ownerEmail: string;
  onSelect: (t: MenuTarget) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const pick = (t: MenuTarget) => {
    setOpen(false);
    onSelect(t);
  };

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex cursor-pointer items-center gap-3 rounded-lg text-left"
      >
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-black text-lg text-white">❄</div>
        <div>
          <div className="flex items-center gap-1.5 text-lg font-semibold leading-none tracking-tight">
            Plowline
            <span className={`text-xs text-muted transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
          </div>
          <div className="mt-1 text-xs text-muted">Demo workspace · {businessName}</div>
        </div>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 pt-2">
          <div role="menu" className="w-64 rounded-xl border border-line bg-white p-1.5 shadow-xl">
            <div className="border-b border-line px-3 pb-3 pt-2">
              <div className="truncate text-sm font-semibold">{businessName}</div>
              <div className="truncate text-xs text-muted">{ownerEmail}</div>
            </div>
            <div className="pt-1.5">
              <MenuItem label="Settings" hint="Payments, appearance, invoicing" onClick={() => pick("settings")} />
              <MenuItem label="Account" hint="Profile, email, password" onClick={() => pick("account")} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, hint, onClick }: { label: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left hover:bg-soft"
    >
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-muted">{hint}</div>
    </button>
  );
}
