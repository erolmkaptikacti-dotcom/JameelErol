"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { buildDemo } from "@/lib/demo";
import { iso } from "@/lib/dates";
import { loadSettings, saveSettings, type Settings } from "@/lib/settings";
import type { Client, Data, Job, JobStatus } from "@/lib/types";
import BrandMenu from "./BrandMenu";
import CalendarTab from "./CalendarTab";
import ClientsTab from "./ClientsTab";
import PaymentsTab from "./PaymentsTab";
import InsightsTab from "./InsightsTab";
import OutreachTab, { type EmailAccount, type SentEmail } from "./OutreachTab";
import SettingsView, { type Section } from "./SettingsView";

const TABS = ["Calendar", "Clients", "Payments", "Outreach", "Insights"] as const;
const EMAIL_KEY = "plowline.email";
type Tab = (typeof TABS)[number];
type View = { kind: "tab" } | { kind: "settings"; section: Section; n: number };

export type Actions = {
  addJob: (j: Omit<Job, "id" | "status">) => void;
  setJobStatus: (id: string, s: JobStatus) => void;
  addClient: (c: Omit<Client, "id" | "since">) => void;
  markPaid: (id: string) => void;
  addInvoice: (clientId: string, amount: number) => void;
};

const noop = () => () => {};

// Render only on the client so "today" is the visitor's real date (no hydration mismatch).
export default function App() {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  if (!mounted) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted">Loading…</div>;
  }
  return <Workspace />;
}

function Workspace() {
  const [today] = useState(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  });
  const [data, setData] = useState<Data>(() => buildDemo(today));
  const [tab, setTab] = useState<Tab>("Calendar");
  const [view, setView] = useState<View>({ kind: "tab" });
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [email, setEmailState] = useState<EmailAccount | null>(() => {
    try {
      const raw = localStorage.getItem(EMAIL_KEY);
      return raw ? (JSON.parse(raw) as EmailAccount) : null;
    } catch {
      return null;
    }
  });
  const [sent, setSent] = useState<SentEmail[]>([]);

  const updateSettings = (fn: (s: Settings) => Settings) => {
    const next = fn(settings);
    setSettings(next);
    saveSettings(next);
  };

  // Keep the page theme in sync with the setting (and with the OS when set to "system").
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      root.dataset.theme = settings.theme === "system" ? (mq.matches ? "dark" : "light") : settings.theme;
    };
    apply();
    if (settings.theme !== "system") return;
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [settings.theme]);

  const setEmail = (e: EmailAccount | null) => {
    setEmailState(e);
    try {
      if (e) localStorage.setItem(EMAIL_KEY, JSON.stringify(e));
      else localStorage.removeItem(EMAIL_KEY);
    } catch {
      // storage unavailable (private window): connection just won't persist
    }
  };

  const todayIso = iso(today);
  const uid = () => Math.random().toString(36).slice(2, 9);

  const actions: Actions = {
    addJob: (j) => setData((d) => d && { ...d, jobs: [...d.jobs, { ...j, id: uid(), status: "scheduled" }] }),
    setJobStatus: (id, status) =>
      setData((d) => d && { ...d, jobs: d.jobs.map((j) => (j.id === id ? { ...j, status } : j)) }),
    addClient: (c) =>
      setData((d) => d && { ...d, clients: [{ ...c, id: uid(), since: todayIso }, ...d.clients] }),
    markPaid: (id) =>
      setData(
        (d) =>
          d && { ...d, invoices: d.invoices.map((i) => (i.id === id ? { ...i, paid: true, paidOn: todayIso } : i)) },
      ),
    addInvoice: (clientId, amount) =>
      setData((d) => {
        if (!d) return d;
        const next = 1001 + d.invoices.length + 50;
        const due = new Date(today);
        due.setDate(due.getDate() + settings.invoicing.termsDays);
        return {
          ...d,
          invoices: [{ id: `INV-${next}-${uid().slice(0, 2)}`, clientId, amount, issued: todayIso, due: iso(due), paid: false }, ...d.invoices],
        };
      }),
  };

  const openSettings = (section: Section) =>
    setView((v) => ({ kind: "settings", section, n: v.kind === "settings" ? v.n + 1 : 0 }));

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-20">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-6">
        <BrandMenu
          businessName={settings.business.name}
          ownerEmail={settings.owner.email}
          onSelect={(t) => openSettings(t === "account" ? "Account" : "Business")}
        />
        <nav className="flex gap-1 rounded-xl bg-soft p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setView({ kind: "tab" });
              }}
              className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                view.kind === "tab" && tab === t ? "bg-black text-white" : "text-neutral-600 hover:text-black"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main className="pt-8">
        {view.kind === "settings" ? (
          <>
            <h1 className="mb-6 text-2xl font-semibold tracking-tight">Settings</h1>
            <SettingsView
              key={view.n}
              settings={settings}
              update={updateSettings}
              initialSection={view.section}
              data={data}
              onResetData={() => {
                setData(buildDemo(today));
                setSent([]);
              }}
            />
          </>
        ) : (
          <>
            {tab === "Calendar" && <CalendarTab data={data} today={today} actions={actions} />}
            {tab === "Clients" && <ClientsTab data={data} actions={actions} />}
            {tab === "Payments" && <PaymentsTab data={data} today={today} actions={actions} />}
            {tab === "Outreach" && (
              <OutreachTab
                data={data}
                email={email}
                setEmail={setEmail}
                sent={sent}
                settings={settings}
                onSend={(inv, to) =>
                  setSent((s) => [
                    {
                      id: uid(),
                      invoiceId: inv.id,
                      clientId: inv.clientId,
                      to,
                      at: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
                    },
                    ...s,
                  ])
                }
              />
            )}
            {tab === "Insights" && <InsightsTab data={data} today={today} />}
          </>
        )}
      </main>
    </div>
  );
}
