"use client";

import type { Data } from "@/lib/types";
import { addDays, iso, money } from "@/lib/dates";
import { Card, Stat } from "./ui";

export default function InsightsTab({ data, today }: { data: Data; today: Date }) {
  const done = data.jobs.filter((j) => j.status === "completed");
  const past = data.jobs.filter((j) => j.status !== "scheduled");
  const noShows = data.jobs.filter((j) => j.status === "no-show").length;
  const revenue = done.reduce((s, j) => s + j.price, 0);
  const name = (id: string) => data.clients.find((c) => c.id === id)?.name ?? "Unknown";

  // Weekly revenue, last 10 weeks.
  const weeks = Array.from({ length: 10 }, (_, k) => {
    const end = addDays(today, -7 * (9 - k));
    const start = addDays(end, -6);
    const total = done.filter((j) => j.date >= iso(start) && j.date <= iso(end)).reduce((s, j) => s + j.price, 0);
    return { label: `${end.getMonth() + 1}/${end.getDate()}`, total };
  });
  const maxWeek = Math.max(...weeks.map((w) => w.total), 1);

  // Top clients by revenue.
  const byClient = new Map<string, number>();
  done.forEach((j) => byClient.set(j.clientId, (byClient.get(j.clientId) ?? 0) + j.price));
  const top = [...byClient.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxClient = top[0]?.[1] ?? 1;

  // Revenue by client type.
  const byKind = new Map<string, number>();
  done.forEach((j) => {
    const k = data.clients.find((c) => c.id === j.clientId)?.kind ?? "Other";
    byKind.set(k, (byKind.get(k) ?? 0) + j.price);
  });

  // Clients who haven't been served in 30+ days: reach out.
  const cutoff = iso(addDays(today, -30));
  const quiet = data.clients
    .filter((c) => !done.some((j) => j.clientId === c.id && j.date >= cutoff))
    .map((c) => c.name);

  const unpaidByClient = new Map<string, number>();
  data.invoices.filter((i) => !i.paid && i.due < iso(today)).forEach((i) => unpaidByClient.set(i.clientId, (unpaidByClient.get(i.clientId) ?? 0) + i.amount));
  const slowPayers = [...unpaidByClient.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue (75 days)" value={money(revenue)} />
        <Stat label="Jobs completed" value={String(done.length)} />
        <Stat label="Avg job value" value={money(revenue / Math.max(done.length, 1))} />
        <Stat label="No-show rate" value={`${((noShows / Math.max(past.length, 1)) * 100).toFixed(1)}%`} sub={`${noShows} of ${past.length} jobs`} />
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold tracking-tight">Weekly revenue</h3>
        <div className="mt-6 flex gap-3">
          {weeks.map((w) => (
            <div key={w.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="text-xs text-muted">{money(w.total)}</div>
              <div className="flex h-40 w-full items-end">
                <div className="w-full rounded-t-md bg-black" style={{ height: `${Math.max((w.total / maxWeek) * 100, 1)}%` }} />
              </div>
              <div className="text-xs text-muted">{w.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold tracking-tight">Top clients</h3>
          <ul className="mt-4 space-y-4">
            {top.map(([id, v]) => (
              <li key={id}>
                <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{name(id)}</span><span>{money(v)}</span></div>
                <div className="h-2 rounded-full bg-soft"><div className="h-2 rounded-full bg-black" style={{ width: `${(v / maxClient) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold tracking-tight">Revenue by client type</h3>
          <ul className="mt-4 space-y-4">
            {[...byKind.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <li key={k}>
                <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{k}</span><span>{((v / revenue) * 100).toFixed(0)}% · {money(v)}</span></div>
                <div className="h-2 rounded-full bg-soft"><div className="h-2 rounded-full bg-black" style={{ width: `${(v / revenue) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold tracking-tight">Needs a follow-up</h3>
          <p className="mt-1 text-sm text-muted">No completed service in the last 30 days.</p>
          <ul className="mt-4 space-y-2 text-sm">
            {quiet.length === 0 ? <li className="text-muted">Everyone has been served recently.</li> : quiet.map((n) => <li key={n} className="rounded-lg bg-soft px-3 py-2">{n}</li>)}
          </ul>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold tracking-tight">Slowest payers</h3>
          <p className="mt-1 text-sm text-muted">Past-due balances by client.</p>
          <ul className="mt-4 space-y-2 text-sm">
            {slowPayers.length === 0 ? <li className="text-muted">No overdue balances.</li> : slowPayers.map(([id, v]) => (
              <li key={id} className="flex justify-between rounded-lg bg-soft px-3 py-2"><span>{name(id)}</span><span className="font-medium">{money(v)}</span></li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
