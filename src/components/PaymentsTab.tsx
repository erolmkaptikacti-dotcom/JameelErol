"use client";

import { useState } from "react";
import type { Data } from "@/lib/types";
import { fmtDay, iso, money, parse } from "@/lib/dates";
import type { Actions } from "./App";
import { Badge, Btn, Card, Field, Stat, inputCls } from "./ui";

type Filter = "all" | "open" | "overdue" | "paid";

export default function PaymentsTab({ data, today, actions }: { data: Data; today: Date; actions: Actions }) {
  const [filter, setFilter] = useState<Filter>("open");
  const [adding, setAdding] = useState(false);
  const [clientId, setClientId] = useState(data.clients[0].id);
  const [amount, setAmount] = useState("");
  const t = iso(today);
  const name = (id: string) => data.clients.find((c) => c.id === id)?.name ?? "Unknown";
  const overdue = (i: Data["invoices"][number]) => !i.paid && i.due < t;

  const open = data.invoices.filter((i) => !i.paid);
  const over = data.invoices.filter(overdue);
  const month = t.slice(0, 7);
  const collected = data.invoices.filter((i) => i.paid && i.paidOn?.startsWith(month)).reduce((s, i) => s + i.amount, 0);
  const sum = (a: typeof open) => a.reduce((s, i) => s + i.amount, 0);

  const rows = data.invoices
    .filter((i) => (filter === "all" ? true : filter === "paid" ? i.paid : filter === "overdue" ? overdue(i) : !i.paid))
    .sort((a, b) => b.issued.localeCompare(a.issued));

  const daysLate = (due: string) => Math.round((today.getTime() - parse(due).getTime()) / 86400000);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Outstanding" value={money(sum(open))} sub={`${open.length} open invoices`} />
        <Stat label="Overdue" value={money(sum(over))} sub={`${over.length} past due`} />
        <Stat label="Collected this month" value={money(collected)} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-soft p-1">
          {(["open", "overdue", "paid", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize ${
                filter === f ? "bg-black text-white" : "text-neutral-600 hover:text-black"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <Btn onClick={() => setAdding(!adding)}>{adding ? "Close" : "+ Invoice"}</Btn>
      </div>

      {adding && (
        <Card className="p-5">
          <form
            className="grid items-end gap-3 sm:grid-cols-[1fr_160px_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(amount);
              if (!n) return;
              actions.addInvoice(clientId, n);
              setAmount("");
              setAdding(false);
              setFilter("open");
            }}
          >
            <Field label="Client">
              <select className={inputCls} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Amount ($)"><input type="number" min="1" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
            <Btn type="submit">Create</Btn>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-soft text-left text-xs uppercase tracking-widest text-muted">
              <th className="px-4 py-3 font-medium">Invoice</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Due</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{i.id}</td>
                <td className="px-4 py-3 font-medium">{name(i.clientId)}</td>
                <td className="hidden px-4 py-3 text-muted sm:table-cell">{fmtDay(i.due)}</td>
                <td className="px-4 py-3">{money(i.amount)}</td>
                <td className="px-4 py-3">
                  {i.paid ? (
                    <Badge>Paid</Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge tone={overdue(i) ? "solid" : "outline"}>{overdue(i) ? `${daysLate(i.due)}d late` : "Open"}</Badge>
                      <Btn variant="ghost" className="!px-2.5 !py-1 !text-xs" onClick={() => actions.markPaid(i.id)}>Mark paid</Btn>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Nothing here.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
