export type Client = {
  id: string;
  name: string;
  kind: "Residential" | "Commercial" | "HOA";
  phone: string;
  email: string;
  address: string;
  plan: string;
  notes: string;
  since: string; // YYYY-MM-DD
};

export type JobStatus = "scheduled" | "completed" | "cancelled" | "no-show";

export type Job = {
  id: string;
  clientId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  service: string;
  price: number;
  status: JobStatus;
};

export type Invoice = {
  id: string;
  clientId: string;
  amount: number;
  issued: string;
  due: string;
  paid: boolean;
  paidOn?: string;
};

export type Data = { clients: Client[]; jobs: Job[]; invoices: Invoice[] };
