"use client";

import { useState, useSyncExternalStore } from "react";
import { buildDemo } from "@/lib/demo";
import { iso } from "@/lib/dates";
import type { Client, Data, Job, JobStatus } from "@/lib/types";
import CalendarTab from "./CalendarTab";
import ClientsTab from "./ClientsTab";
import PaymentsTab from "./PaymentsTab";
import InsightsTab from "./InsightsTab";

const TABS = ["Calendar", "Clients", "Payments", "Insights"] as const;
type Tab = (typeof TABS)[number];

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
        due.setDate(due.getDate() + 14);
        return {
          ...d,
          invoices: [{ id: `INV-${next}-${uid().slice(0, 2)}`, clientId, amount, issued: todayIso, due: iso(due), paid: false }, ...d.invoices],
        };
      }),
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-20">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-black text-lg text-white">❄</div>
          <div>
            <div className="text-lg font-semibold leading-none tracking-tight">Plowline</div>
            <div className="mt-1 text-xs text-muted">Demo workspace · Northern Edge Snow Services</div>
          </div>
        </div>
        <nav className="flex gap-1 rounded-xl bg-soft p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t ? "bg-black text-white" : "text-neutral-600 hover:text-black"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main className="pt-8">
        {tab === "Calendar" && <CalendarTab data={data} today={today} actions={actions} />}
        {tab === "Clients" && <ClientsTab data={data} actions={actions} />}
        {tab === "Payments" && <PaymentsTab data={data} today={today} actions={actions} />}
        {tab === "Insights" && <InsightsTab data={data} today={today} />}
      </main>
    </div>
  );
}
