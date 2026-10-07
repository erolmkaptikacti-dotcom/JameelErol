"use client";

import { useState } from "react";
import type { Client, Data } from "@/lib/types";
import { fmtDay, money } from "@/lib/dates";
import type { Actions } from "./App";
import { Badge, Btn, Card, Field, inputCls } from "./ui";

const blank = { name: "", kind: "Residential" as Client["kind"], phone: "", email: "", address: "", plan: "Per push", notes: "" };

export default function ClientsTab({ data, actions }: { data: Data; actions: Actions }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blank);

  const stats = (id: string) => {
    const jobs = data.jobs.filter((j) => j.clientId === id);
    const done = jobs.filter((j) => j.status === "completed");
    const owed = data.invoices.filter((i) => i.clientId === id && !i.paid).reduce((s, i) => s + i.amount, 0);
    const last = done.map((j) => j.date).sort().pop();
    return { jobs: jobs.length, revenue: done.reduce((s, j) => s + j.price, 0), owed, last };
  };

  const list = data.clients.filter((c) => (c.name + c.address + c.kind).toLowerCase().includes(q.toLowerCase()));
  const selected = data.clients.find((c) => c.id === open);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="mb-4 flex gap-3">
          <input className={inputCls} placeholder="Search clients…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Btn onClick={() => setAdding(!adding)} className="whitespace-nowrap">{adding ? "Close" : "+ Client"}</Btn>
        </div>

        {adding && (
          <Card className="mb-4 p-5">
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.name.trim()) return;
                actions.addClient(form);
                setForm(blank);
                setAdding(false);
              }}
            >
              <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Type">
                <select className={inputCls} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Client["kind"] })}>
                  <option>Residential</option><option>Commercial</option><option>HOA</option>
                </select>
              </Field>
              <Field label="Phone"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label="Email"><input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
              <Field label="Address"><input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
              <Field label="Plan"><input className={inputCls} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} /></Field>
              <div className="sm:col-span-2"><Field label="Notes"><input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
              <div className="sm:col-span-2"><Btn type="submit">Save client</Btn></div>
            </form>
          </Card>
        )}

        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-soft text-left text-xs uppercase tracking-widest text-muted">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Jobs</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
                <th className="px-4 py-3 font-medium">Owes</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const s = stats(c.id);
                return (
                  <tr
                    key={c.id}
                    onClick={() => setOpen(c.id)}
                    className={`cursor-pointer border-b border-line last:border-0 hover:bg-soft ${open === c.id ? "bg-soft" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted">{c.kind} · {c.address}</div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">{s.jobs}</td>
                    <td className="px-4 py-3">{money(s.revenue)}</td>
                    <td className="px-4 py-3">{s.owed ? <Badge tone="solid">{money(s.owed)}</Badge> : <span className="text-muted">—</span>}</td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">No clients match.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <Card className="h-fit p-5">
        {!selected ? (
          <p className="text-sm text-muted">Select a client to see their profile.</p>
        ) : (
          <>
            <Badge>{selected.kind}</Badge>
            <h3 className="mt-2 text-xl font-semibold tracking-tight">{selected.name}</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <Row k="Phone" v={selected.phone} />
              <Row k="Email" v={selected.email} />
              <Row k="Address" v={selected.address} />
              <Row k="Plan" v={selected.plan} />
              <Row k="Client since" v={fmtDay(selected.since)} />
              <Row k="Last service" v={stats(selected.id).last ? fmtDay(stats(selected.id).last!) : "—"} />
            </dl>
            <div className="mt-4 rounded-lg bg-soft p-3 text-sm">
              <div className="mb-1 text-xs uppercase tracking-widest text-muted">Notes</div>
              {selected.notes || "No notes."}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
