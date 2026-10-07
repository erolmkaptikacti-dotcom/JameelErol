"use client";

import { useState, type ReactNode } from "react";
import type { Data } from "@/lib/types";
import type { PaymentKind, PaymentMethod, Settings, ThemeChoice } from "@/lib/settings";
import { Badge, Btn, Card, Field, Toggle, inputCls } from "./ui";

export const SECTIONS = ["Business", "Account", "Payments", "Invoicing", "Notifications", "Appearance", "Data"] as const;
export type Section = (typeof SECTIONS)[number];

const SECTION_LABEL: Record<Section, string> = {
  Business: "Business",
  Account: "Account",
  Payments: "Payment methods",
  Invoicing: "Invoicing",
  Notifications: "Notifications",
  Appearance: "Appearance",
  Data: "Data",
};

type Update = (fn: (s: Settings) => Settings) => void;
type Props = { settings: Settings; update: Update };

export default function SettingsView({
  settings,
  update,
  initialSection,
  data,
  onResetData,
}: Props & { initialSection: Section; data: Data; onResetData: () => void }) {
  const [section, setSection] = useState<Section>(initialSection);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Settings sections">
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`cursor-pointer whitespace-nowrap rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors ${
              section === s ? "bg-black text-white" : "text-neutral-600 hover:bg-soft hover:text-black"
            }`}
          >
            {SECTION_LABEL[s]}
          </button>
        ))}
      </nav>

      <Card className="p-6 sm:p-8">
        {section === "Business" && <BusinessSection settings={settings} update={update} />}
        {section === "Account" && <AccountSection settings={settings} update={update} />}
        {section === "Payments" && <PaymentsSection settings={settings} update={update} />}
        {section === "Invoicing" && <InvoicingSection settings={settings} update={update} />}
        {section === "Notifications" && <NotificationsSection settings={settings} update={update} />}
        {section === "Appearance" && <AppearanceSection settings={settings} update={update} />}
        {section === "Data" && <DataSection data={data} onResetData={onResetData} />}
      </Card>
    </div>
  );
}

function Head({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-6 border-b border-line pb-5">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted">{sub}</p>
    </div>
  );
}

function SaveBar({ saved, error }: { saved: boolean; error?: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <Btn type="submit">Save changes</Btn>
      {saved && !error && <span className="text-sm text-muted">Saved ✓</span>}
      {error && <span className="text-sm font-medium">{error}</span>}
    </div>
  );
}

/* ---------------------------------- Business --------------------------------- */

function BusinessSection({ settings, update }: Props) {
  const [f, setF] = useState(settings.business);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof f, v: string) => {
    setF({ ...f, [k]: v });
    setSaved(false);
  };
  const emailOk = /^\S+@\S+\.\S+$/.test(f.email);
  const nameOk = f.name.trim().length > 0;
  const error = !nameOk ? "Business name can't be empty." : !emailOk ? "Enter a valid business email." : undefined;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (error) return;
        update((s) => ({ ...s, business: { ...f, name: f.name.trim() } }));
        setSaved(true);
      }}
    >
      <Head title="Business" sub="Shown in the header and on every invoice email you send." />
      <Field label="Business name"><input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="Business email"><input className={inputCls} type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone"><input className={inputCls} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Address"><input className={inputCls} value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
      </div>
      <SaveBar saved={saved} error={error} />
    </form>
  );
}

/* ---------------------------------- Account ---------------------------------- */

function AccountSection({ settings, update }: Props) {
  const [f, setF] = useState(settings.owner);
  const [saved, setSaved] = useState(false);
  const emailOk = /^\S+@\S+\.\S+$/.test(f.email);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const changePassword = () => {
    if (!pw.current) return setPwMsg({ ok: false, text: "Enter your current password." });
    if (pw.next.length < 8) return setPwMsg({ ok: false, text: "New password must be at least 8 characters." });
    if (pw.next === pw.current) return setPwMsg({ ok: false, text: "New password must be different from the current one." });
    if (pw.next !== pw.confirm) return setPwMsg({ ok: false, text: "New passwords don't match." });
    setPw({ current: "", next: "", confirm: "" });
    setPwMsg({ ok: true, text: "Password updated. (Demo only: there is no real login yet, so nothing was stored.)" });
  };

  return (
    <div className="space-y-10">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!f.name.trim() || !emailOk) return;
          update((s) => ({ ...s, owner: { name: f.name.trim(), email: f.email } }));
          setSaved(true);
        }}
      >
        <Head title="Account" sub="The person who signs in to this workspace." />
        <Field label="Your name"><input className={inputCls} value={f.name} onChange={(e) => { setF({ ...f, name: e.target.value }); setSaved(false); }} /></Field>
        <Field label="Login email"><input className={inputCls} type="email" value={f.email} onChange={(e) => { setF({ ...f, email: e.target.value }); setSaved(false); }} /></Field>
        <SaveBar saved={saved} error={!f.name.trim() ? "Name can't be empty." : !emailOk ? "Enter a valid email." : undefined} />
      </form>

      <form
        className="space-y-4 border-t border-line pt-8"
        onSubmit={(e) => {
          e.preventDefault();
          changePassword();
        }}
      >
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Change password</h3>
          <p className="mt-1 text-sm text-muted">Use at least 8 characters.</p>
        </div>
        <Field label="Current password"><input className={inputCls} type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New password"><input className={inputCls} type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
          <Field label="Confirm new password"><input className={inputCls} type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Btn type="submit">Update password</Btn>
          {pwMsg && <span className={`text-sm ${pwMsg.ok ? "text-muted" : "font-medium"}`}>{pwMsg.text}</span>}
        </div>
      </form>
    </div>
  );
}

/* ------------------------------- Payment methods ------------------------------ */

const KINDS: PaymentKind[] = ["Card", "Bank account", "Zelle", "Venmo", "PayPal", "Cash", "Check"];
const hasLast4 = (k: PaymentKind) => k === "Card" || k === "Bank account";

function PaymentsSection({ settings, update }: Props) {
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<PaymentKind>("Card");
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState("");
  const [err, setErr] = useState("");
  const methods = settings.paymentMethods;

  const reset = () => {
    setLabel("");
    setDetail("");
    setErr("");
    setAdding(false);
  };

  const add = () => {
    let m: Omit<PaymentMethod, "id" | "isDefault">;
    if (hasLast4(kind)) {
      if (!label.trim()) return setErr(kind === "Card" ? "Enter the card brand, e.g. Visa." : "Enter the bank name.");
      if (!/^\d{4}$/.test(detail)) return setErr("Enter only the last 4 digits.");
      m = { kind, label: label.trim(), detail: `•••• ${detail}` };
    } else {
      if (!detail.trim()) return setErr("Add the details customers need to pay you this way.");
      m = { kind, label: kind, detail: detail.trim() };
    }
    update((s) => ({
      ...s,
      paymentMethods: [
        ...s.paymentMethods,
        { ...m, id: Math.random().toString(36).slice(2, 9), isDefault: s.paymentMethods.length === 0 },
      ],
    }));
    reset();
  };

  const remove = (id: string) =>
    update((s) => {
      const rest = s.paymentMethods.filter((p) => p.id !== id);
      if (rest.length && !rest.some((p) => p.isDefault)) rest[0] = { ...rest[0], isDefault: true };
      return { ...s, paymentMethods: rest };
    });

  const makeDefault = (id: string) =>
    update((s) => ({ ...s, paymentMethods: s.paymentMethods.map((p) => ({ ...p, isDefault: p.id === id })) }));

  return (
    <div>
      <Head title="Payment methods" sub="How customers can pay you. These are listed on every invoice email." />

      <ul className="divide-y divide-line rounded-lg border border-line">
        {methods.length === 0 && <li className="px-4 py-6 text-sm text-muted">No payment methods yet.</li>}
        {methods.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                {p.kind === p.label ? p.kind : `${p.label} · ${p.kind}`}
                {p.isDefault && <Badge tone="solid">Default</Badge>}
              </div>
              <div className="text-sm text-muted">{p.detail}</div>
            </div>
            <div className="flex gap-2">
              {!p.isDefault && (
                <Btn variant="ghost" className="!px-3 !py-1 !text-xs" onClick={() => makeDefault(p.id)}>Make default</Btn>
              )}
              <Btn variant="ghost" className="!px-3 !py-1 !text-xs" onClick={() => remove(p.id)}>Remove</Btn>
            </div>
          </li>
        ))}
      </ul>

      {!adding ? (
        <Btn className="mt-4" onClick={() => setAdding(true)}>+ Add payment method</Btn>
      ) : (
        <form
          className="mt-4 space-y-4 rounded-lg bg-soft p-5"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <Field label="Type">
            <select
              className={inputCls}
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as PaymentKind);
                setLabel("");
                setDetail("");
                setErr("");
              }}
            >
              {KINDS.map((k) => <option key={k}>{k}</option>)}
            </select>
          </Field>
          {hasLast4(kind) ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={kind === "Card" ? "Card brand" : "Bank name"}>
                <input className={inputCls} placeholder={kind === "Card" ? "Visa" : "Chase"} value={label} onChange={(e) => setLabel(e.target.value)} />
              </Field>
              <Field label="Last 4 digits">
                <input
                  className={inputCls}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="1234"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value.replace(/\D/g, ""))}
                />
              </Field>
            </div>
          ) : (
            <Field label={kind === "Cash" || kind === "Check" ? "Instructions" : "Email, phone or handle"}>
              <input
                className={inputCls}
                placeholder={kind === "Check" ? "Payable to Northern Edge Snow Services" : kind === "Cash" ? "Pay the driver on completion" : "billing@yourbusiness.com"}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
              />
            </Field>
          )}
          <p className="text-xs text-muted">Never enter a full card or bank account number here. Only the last 4 digits are kept.</p>
          <div className="flex items-center gap-3">
            <Btn type="submit">Add</Btn>
            <Btn variant="ghost" onClick={reset}>Cancel</Btn>
            {err && <span className="text-sm font-medium">{err}</span>}
          </div>
        </form>
      )}

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Demo note: these are display details for your invoices. Plowline doesn&apos;t process card payments yet.
      </p>
    </div>
  );
}

/* ---------------------------------- Invoicing --------------------------------- */

function InvoicingSection({ settings, update }: Props) {
  const [f, setF] = useState(settings.invoicing);
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        update((s) => ({ ...s, invoicing: f }));
        setSaved(true);
      }}
    >
      <Head title="Invoicing" sub="Defaults for new invoices and invoice emails." />
      <Field label="Payment terms">
        <select
          className={inputCls}
          value={f.termsDays}
          onChange={(e) => { setF({ ...f, termsDays: Number(e.target.value) }); setSaved(false); }}
        >
          <option value={0}>Due on receipt</option>
          <option value={7}>Net 7 days</option>
          <option value={14}>Net 14 days</option>
          <option value={30}>Net 30 days</option>
          <option value={45}>Net 45 days</option>
        </select>
      </Field>
      <Field label="Invoice email footer">
        <textarea
          className={`${inputCls} h-24`}
          value={f.footer}
          onChange={(e) => { setF({ ...f, footer: e.target.value }); setSaved(false); }}
        />
      </Field>
      <SaveBar saved={saved} />
    </form>
  );
}

/* -------------------------------- Notifications ------------------------------- */

function NotificationsSection({ settings, update }: Props) {
  const n = settings.notifications;
  const set = (k: keyof typeof n) => (v: boolean) => update((s) => ({ ...s, notifications: { ...s.notifications, [k]: v } }));

  return (
    <div>
      <Head title="Notifications" sub="Choose what Plowline should tell you about. Changes save automatically." />
      <div className="divide-y divide-line">
        <Toggle label="Invoice paid" hint="Email me when a customer pays an invoice." checked={n.paid} onChange={set("paid")} />
        <Toggle label="Overdue reminders" hint="Remind me about invoices that are past due." checked={n.overdue} onChange={set("overdue")} />
        <Toggle label="Daily schedule digest" hint="A morning summary of today's jobs." checked={n.digest} onChange={set("digest")} />
        <Toggle label="Storm alerts" hint="Heads-up when heavy snow is forecast." checked={n.weather} onChange={set("weather")} />
      </div>
      <p className="mt-6 text-xs text-muted">Demo note: preferences are saved, but no notifications are sent yet.</p>
    </div>
  );
}

/* ---------------------------------- Appearance -------------------------------- */

function AppearanceSection({ settings, update }: Props) {
  const options: { value: ThemeChoice; label: string; bg: string; fg: string }[] = [
    { value: "light", label: "Light", bg: "#ffffff", fg: "#000000" },
    { value: "dark", label: "Dark", bg: "#0a0a0a", fg: "#ffffff" },
    { value: "system", label: "System", bg: "linear-gradient(90deg,#ffffff 50%,#0a0a0a 50%)", fg: "#808080" },
  ];

  return (
    <div>
      <Head title="Appearance" sub="Pick how Plowline looks. Changes apply right away." />
      <div className="grid gap-4 sm:grid-cols-3" role="radiogroup" aria-label="Theme">
        {options.map((o) => {
          const active = settings.theme === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => update((s) => ({ ...s, theme: o.value }))}
              className={`cursor-pointer rounded-xl border p-3 text-left transition-colors ${
                active ? "border-black outline outline-1 outline-black" : "border-line hover:border-black"
              }`}
            >
              <div className="grid h-20 place-items-center rounded-lg border border-line" style={{ background: o.bg }}>
                <span className="text-2xl" style={{ color: o.fg }}>Aa</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm font-medium">
                {o.label}
                {active && <span aria-hidden>✓</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------ Data ------------------------------------ */

// Spreadsheet apps run text that starts with these characters as a formula.
const safeCell = (v: string) => (/^[=+\-@]/.test(v) ? `'${v}` : v);

function DataSection({ data, onResetData }: { data: Data; onResetData: () => void }) {
  const [confirm, setConfirm] = useState(false);

  const exportClients = () => {
    const head = ["Name", "Type", "Phone", "Email", "Address", "Plan", "Notes", "Client since"];
    const rows = data.clients.map((c) => [c.name, c.kind, c.phone, c.email, c.address, c.plan, c.notes, c.since]);
    const csv = [head, ...rows]
      .map((r) => r.map((v) => `"${safeCell(String(v)).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "plowline-clients.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Head title="Data" sub="Take your data with you, or start the demo over." />
      <Row title="Export clients" sub={`Download all ${data.clients.length} clients as a CSV spreadsheet.`}>
        <Btn variant="ghost" onClick={exportClients}>Download CSV</Btn>
      </Row>
      <Row title="Reset demo data" sub="Replaces everything you added or changed with fresh sample data. Your settings are kept.">
        {confirm ? (
          <div className="flex gap-2">
            <Btn onClick={() => { onResetData(); setConfirm(false); }}>Yes, reset</Btn>
            <Btn variant="ghost" onClick={() => setConfirm(false)}>Cancel</Btn>
          </div>
        ) : (
          <Btn variant="ghost" onClick={() => setConfirm(true)}>Reset</Btn>
        )}
      </Row>
    </div>
  );
}

function Row({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-5 last:border-0">
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-0.5 max-w-md text-sm text-muted">{sub}</div>
      </div>
      {children}
    </div>
  );
}
