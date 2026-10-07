"use client";

import { useState } from "react";
import type { Data } from "@/lib/types";
import { addDays, fmtTime, iso, parse } from "@/lib/dates";
import type { Actions } from "./App";
import { Badge, Btn, Card, Field, inputCls } from "./ui";

// Neon green, orange, pink: client names on a day cycle through these.
const HIGHLIGHTS = [
  "bg-[#39ff14]/25 border-[#39ff14]/70",
  "bg-[#ff9500]/25 border-[#ff9500]/70",
  "bg-[#ff2d95]/25 border-[#ff2d95]/70",
];

export default function CalendarTab({ data, today, actions }: { data: Data; today: Date; actions: Actions }) {
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(iso(today));
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ clientId: data.clients[0].id, time: "06:00", service: "Driveway plow", price: "65" });

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  // Only as many weeks as the month needs (no trailing row of next-month days).
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const weeks = Math.ceil((first.getDay() + daysInMonth) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
  const byDate = (d: string) =>
    data.jobs.filter((j) => j.date === d && j.status !== "cancelled").sort((a, b) => a.time.localeCompare(b.time));
  const clientName = (id: string) => data.clients.find((c) => c.id === id)?.name ?? "Unknown";
  const dayJobs = data.jobs.filter((j) => j.date === selected).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            {cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>←</Btn>
            <Btn variant="ghost" onClick={() => { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(iso(today)); }}>Today</Btn>
            <Btn variant="ghost" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>→</Btn>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-line bg-line">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="bg-soft py-2 text-center text-xs uppercase tracking-widest text-muted">{d}</div>
          ))}
          {days.map((d) => {
            const key = iso(d);
            const jobs = byDate(key);
            const inMonth = d.getMonth() === cursor.getMonth();
            const isSel = key === selected;
            const isToday = key === iso(today);
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`flex min-h-32 cursor-pointer flex-col items-stretch justify-start p-2 text-left transition-colors ${
                  isSel
                    ? "bg-white outline-2 -outline-offset-2 outline-black"
                    : inMonth
                      ? "bg-white hover:bg-soft"
                      : "bg-soft text-neutral-400"
                }`}
              >
                <div className={`text-sm ${isToday && !isSel ? "font-bold underline underline-offset-4" : ""}`}>{d.getDate()}</div>
                {jobs.length > 0 && (
                  <div className="mt-1.5 flex flex-col gap-1">
                    {jobs.map((j, idx) => (
                      <span
                        key={j.id}
                        title={`${clientName(j.clientId)} · ${fmtTime(j.time)}`}
                        className={`block border px-1.5 py-0.5 text-[11px] font-semibold leading-tight text-black ${HIGHLIGHTS[idx % HIGHLIGHTS.length]}`}
                      >
                        {clientName(j.clientId)}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="h-fit p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted">Schedule</div>
            <h3 className="mt-1 text-lg font-semibold">
              {parse(selected).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </h3>
          </div>
          <Btn onClick={() => setAdding(!adding)}>{adding ? "Close" : "+ Job"}</Btn>
        </div>

        {adding && (
          <form
            className="mt-4 space-y-3 rounded-lg bg-soft p-4"
            onSubmit={(e) => {
              e.preventDefault();
              actions.addJob({ clientId: form.clientId, date: selected, time: form.time, service: form.service, price: Number(form.price) || 0 });
              setAdding(false);
            }}
          >
            <Field label="Client">
              <select className={inputCls} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Time"><input type="time" className={inputCls} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
              <Field label="Price ($)"><input type="number" min="0" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
            </div>
            <Field label="Service"><input className={inputCls} value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} /></Field>
            <Btn type="submit" className="w-full">Add to calendar</Btn>
          </form>
        )}

        <ul className="mt-4 divide-y divide-line">
          {dayJobs.length === 0 && <li className="py-6 text-sm text-muted">Nothing scheduled.</li>}
          {dayJobs.map((j) => (
            <li key={j.id} className="py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">{fmtTime(j.time)} · {clientName(j.clientId)}</div>
                <Badge tone={j.status === "completed" ? "solid" : j.status === "scheduled" ? "outline" : "plain"}>{j.status}</Badge>
              </div>
              <div className="mt-0.5 text-sm text-muted">{j.service} · ${j.price}</div>
              {j.status === "scheduled" && (
                <div className="mt-2 flex gap-2">
                  <Btn variant="ghost" className="!px-3 !py-1 !text-xs" onClick={() => actions.setJobStatus(j.id, "completed")}>Complete</Btn>
                  <Btn variant="ghost" className="!px-3 !py-1 !text-xs" onClick={() => actions.setJobStatus(j.id, "cancelled")}>Cancel</Btn>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
