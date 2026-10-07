"use client";

import { useState } from "react";
import type { Client, Data, Invoice } from "@/lib/types";
import { fmtDay, money } from "@/lib/dates";
import { Badge, Btn, Card, Field, inputCls } from "./ui";

export type EmailAccount = { provider: "Gmail" | "Outlook" | "Other"; address: string };
export type SentEmail = { id: string; invoiceId: string; clientId: string; to: string; at: string };

const BUSINESS = "Northern Edge Snow Services";

const subjectFor = (inv: Invoice) => `Invoice ${inv.id} from ${BUSINESS}`;
const bodyFor = (c: Client, inv: Invoice) =>
  `Hi ${c.name},\n\nThank you for choosing ${BUSINESS}. Your invoice ${inv.id} for ${money(inv.amount)} is ready.\n\nIssued: ${fmtDay(inv.issued)}\nDue: ${fmtDay(inv.due)}\n\nPlease let us know if you have any questions.\n\nThank you,\n${BUSINESS}`;

export default function OutreachTab({
  data,
  email,
  setEmail,
  sent,
  onSend,
}: {
  data: Data;
  email: EmailAccount | null;
  setEmail: (e: EmailAccount | null) => void;
  sent: SentEmail[];
  onSend: (inv: Invoice, to: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [composing, setComposing] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [provider, setProvider] = useState<EmailAccount["provider"]>("Gmail");
  const [address, setAddress] = useState("");

  const openInvoices = (cid: string) => data.invoices.filter((i) => i.clientId === cid && !i.paid);
  const wasSent = (invId: string) => sent.some((s) => s.invoiceId === invId);
  const name = (id: string) => data.clients.find((c) => c.id === id)?.name ?? "Unknown";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        <h2 className="mb-1 text-xl font-semibold tracking-tight">Customers</h2>
        <p className="mb-4 text-sm text-muted">Click a customer to see their details and send them an invoice.</p>

        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {data.clients.map((c) => {
              const isOpen = open === c.id;
              const invs = openInvoices(c.id);
              const owed = invs.reduce((s, i) => s + i.amount, 0);
              return (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      setOpen(isOpen ? null : c.id);
                      setComposing(null);
                    }}
                    aria-expanded={isOpen}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left hover:bg-soft"
                  >
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted">{c.kind}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {owed > 0 ? <Badge tone="solid">{money(owed)} due</Badge> : <Badge>Paid up</Badge>}
                      <span className={`text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="space-y-5 bg-soft px-5 pb-5 pt-1">
                      <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                        <Detail k="Address" v={c.address} />
                        <Detail k="Phone" v={c.phone} />
                        <Detail k="Email" v={c.email} />
                        <Detail k="Plan" v={c.plan} />
                        <Detail k="Client since" v={fmtDay(c.since)} />
                        <Detail k="Notes" v={c.notes || "—"} />
                      </dl>

                      <div>
                        <div className="mb-2 text-xs uppercase tracking-widest text-muted">Open invoices</div>
                        {invs.length === 0 && <p className="text-sm text-muted">Nothing to send. This customer is paid up.</p>}
                        <ul className="space-y-2">
                          {invs.map((inv) => (
                            <li key={inv.id} className="rounded-lg border border-line bg-white p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="text-sm">
                                  <span className="font-mono text-xs">{inv.id}</span> · {money(inv.amount)} · due {fmtDay(inv.due)}
                                </div>
                                <div className="flex items-center gap-2">
                                  {wasSent(inv.id) && <Badge tone="outline">Sent</Badge>}
                                  <Btn
                                    variant="ghost"
                                    className="!px-3 !py-1 !text-xs"
                                    onClick={() => {
                                      setComposing(composing === inv.id ? null : inv.id);
                                      setBody(bodyFor(c, inv));
                                    }}
                                  >
                                    {composing === inv.id ? "Close" : wasSent(inv.id) ? "Resend" : "Send invoice"}
                                  </Btn>
                                </div>
                              </div>

                              {composing === inv.id && (
                                <div className="mt-3 space-y-3 border-t border-line pt-3">
                                  <div className="text-xs text-muted">
                                    To: <span className="text-black">{c.email}</span> · Subject:{" "}
                                    <span className="text-black">{subjectFor(inv)}</span>
                                  </div>
                                  <textarea
                                    className={`${inputCls} h-44 font-sans`}
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                  />
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Btn
                                      onClick={() => {
                                        onSend(inv, c.email);
                                        setComposing(null);
                                      }}
                                      className={email ? "" : "pointer-events-none opacity-40"}
                                    >
                                      Send from {email ? email.address : "connected email"}
                                    </Btn>
                                    <a
                                      className="rounded-lg border border-line px-4 py-2 text-sm font-medium hover:border-black"
                                      href={`mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent(subjectFor(inv))}&body=${encodeURIComponent(body)}`}
                                    >
                                      Open in my email app
                                    </a>
                                  </div>
                                  {!email && <p className="text-xs text-muted">Connect your email on the right to send directly.</p>}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="h-fit p-5">
          <div className="text-xs uppercase tracking-widest text-muted">Email</div>
          {email ? (
            <>
              <h3 className="mt-1 text-lg font-semibold">Connected</h3>
              <p className="mt-1 text-sm">
                {email.address} <span className="text-muted">({email.provider})</span>
              </p>
              <Btn variant="ghost" className="mt-4" onClick={() => setEmail(null)}>Disconnect</Btn>
            </>
          ) : (
            <form
              className="mt-2 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!/^\S+@\S+\.\S+$/.test(address)) return;
                setEmail({ provider, address });
                setAddress("");
              }}
            >
              <h3 className="text-lg font-semibold">Connect your email</h3>
              <Field label="Provider">
                <select className={inputCls} value={provider} onChange={(e) => setProvider(e.target.value as EmailAccount["provider"])}>
                  <option>Gmail</option>
                  <option>Outlook</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Your email address">
                <input className={inputCls} type="email" placeholder="you@business.com" value={address} onChange={(e) => setAddress(e.target.value)} />
              </Field>
              <Btn type="submit" className="w-full">Connect</Btn>
            </form>
          )}
          <p className="mt-4 rounded-lg bg-soft p-3 text-xs leading-relaxed text-muted">
            Demo mode: connecting here saves your address in this browser and logs sends below. It does not send real
            email yet. “Open in my email app” does send for real from your own mail app.
          </p>
        </Card>

        <Card className="h-fit p-5">
          <div className="text-xs uppercase tracking-widest text-muted">Sent</div>
          <h3 className="mt-1 text-lg font-semibold">Invoice emails</h3>
          <ul className="mt-3 divide-y divide-line text-sm">
            {sent.length === 0 && <li className="py-4 text-muted">Nothing sent yet.</li>}
            {sent.map((s) => (
              <li key={s.id} className="py-3">
                <div className="font-medium">{name(s.clientId)}</div>
                <div className="text-xs text-muted">{s.invoiceId} · to {s.to} · {s.at}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted">{k}</dt>
      <dd className="mt-0.5 font-medium">{v}</dd>
    </div>
  );
}
