import { addDays, iso } from "./dates";
import type { Client, Data, Invoice, Job, JobStatus } from "./types";

// Demo business: a snow plowing & ice management company.
const clients: Client[] = [
  { id: "c1", name: "Maple Ridge HOA", kind: "HOA", phone: "(555) 010-2211", email: "board@mapleridge.example", address: "100 Maple Ridge Dr", plan: "Seasonal contract", notes: "Plow before 6 AM. Salt the clubhouse lot.", since: "2023-11-02" },
  { id: "c2", name: "Northside Dental", kind: "Commercial", phone: "(555) 010-3320", email: "office@northsidedental.example", address: "42 Commerce Way", plan: "Per push", notes: "Open at 7:30. Keep the ramp clear.", since: "2024-12-10" },
  { id: "c3", name: "The Hendersons", kind: "Residential", phone: "(555) 010-4418", email: "p.henderson@example.com", address: "9 Birch Lane", plan: "Seasonal contract", notes: "Steep driveway. Gate code 4471.", since: "2022-11-20" },
  { id: "c4", name: "Lakeview Market", kind: "Commercial", phone: "(555) 010-5503", email: "manager@lakeviewmarket.example", address: "310 Lake St", plan: "Per push + salt", notes: "Pile snow at the back lot only.", since: "2024-01-15" },
  { id: "c5", name: "Okafor Residence", kind: "Residential", phone: "(555) 010-6672", email: "d.okafor@example.com", address: "27 Elm Court", plan: "Per push", notes: "Text before arriving.", since: "2025-12-01" },
  { id: "c6", name: "Summit Storage", kind: "Commercial", phone: "(555) 010-7794", email: "ops@summitstorage.example", address: "800 Industrial Pkwy", plan: "Seasonal contract", notes: "Large lot. Two trucks needed.", since: "2023-10-28" },
  { id: "c7", name: "Rosa & Dale Whitfield", kind: "Residential", phone: "(555) 010-8836", email: "whitfields@example.com", address: "55 Orchard Rd", plan: "Per push", notes: "Prefers a call after storms.", since: "2025-01-08" },
  { id: "c8", name: "Cedar Park Apartments", kind: "HOA", phone: "(555) 010-9047", email: "mgmt@cedarpark.example", address: "1200 Cedar Park Blvd", plan: "Seasonal contract", notes: "Clear fire lanes first.", since: "2022-11-03" },
  { id: "c9", name: "Gus's Auto Repair", kind: "Commercial", phone: "(555) 010-1195", email: "gus@gusauto.example", address: "17 Route 9", plan: "Per push", notes: "Often forgets to pay. Send reminders.", since: "2025-02-14" },
  { id: "c10", name: "Linden Church", kind: "Commercial", phone: "(555) 010-1278", email: "office@lindenchurch.example", address: "6 Church St", plan: "Sunday service push", notes: "Must be clear by Saturday night.", since: "2023-12-05" },
];

const services: Record<string, [string, number]> = {
  c1: ["Lot plow + salt", 420], c2: ["Lot plow", 180], c3: ["Driveway plow", 65], c4: ["Lot plow + salt", 310],
  c5: ["Driveway plow", 55], c6: ["Large lot plow", 640], c7: ["Driveway plow", 60], c8: ["Lot plow + fire lanes", 520],
  c9: ["Lot plow", 140], c10: ["Lot plow", 200],
};

// Deterministic pseudo-random so the demo looks the same on every load.
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

export function buildDemo(today: Date): Data {
  const rand = rng(7);
  const jobs: Job[] = [];
  const times = ["05:00", "05:30", "06:00", "07:00", "08:30", "10:00", "13:00", "15:30"];
  let n = 1;

  // Past 75 days (completed, a few cancelled/no-show) + next 14 days (scheduled).
  for (let off = -75; off <= 14; off++) {
    const perDay = off < 0 ? (rand() < 0.45 ? 0 : 1 + Math.floor(rand() * 3)) : 1 + Math.floor(rand() * 3);
    for (let k = 0; k < perDay; k++) {
      const c = clients[Math.floor(rand() * clients.length)];
      const [service, price] = services[c.id];
      let status: JobStatus = "scheduled";
      if (off < 0) {
        const r = rand();
        status = r < 0.06 ? "no-show" : r < 0.12 ? "cancelled" : "completed";
      }
      jobs.push({
        id: `j${n++}`,
        clientId: c.id,
        date: iso(addDays(today, off)),
        time: times[Math.floor(rand() * times.length)],
        service,
        price,
        status,
      });
    }
  }

  // One invoice per client per ~2 week billing period, based on completed jobs.
  const invoices: Invoice[] = [];
  let inv = 1001;
  for (const c of clients) {
    for (let period = 0; period < 5; period++) {
      const end = -period * 14;
      const start = end - 14;
      const done = jobs.filter(
        (j) => j.clientId === c.id && j.status === "completed" && j.date > iso(addDays(today, start)) && j.date <= iso(addDays(today, end)),
      );
      const amount = done.reduce((s, j) => s + j.price, 0);
      if (!amount) continue;
      const issued = iso(addDays(today, end));
      const due = iso(addDays(today, end + 14));
      // Older invoices are mostly paid; Gus pays late; recent ones are open.
      const paid = period >= 2 ? c.id !== "c9" || rand() < 0.5 : period === 1 ? rand() < 0.7 : rand() < 0.15;
      invoices.push({
        id: `INV-${inv++}`,
        clientId: c.id,
        amount,
        issued,
        due,
        paid,
        paidOn: paid ? iso(addDays(today, end + 3 + Math.floor(rand() * 9))) : undefined,
      });
    }
  }

  return { clients, jobs, invoices };
}
