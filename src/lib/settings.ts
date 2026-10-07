export type ThemeChoice = "light" | "dark" | "system";

export type PaymentKind = "Card" | "Bank account" | "Zelle" | "Venmo" | "PayPal" | "Cash" | "Check";

export type PaymentMethod = {
  id: string;
  kind: PaymentKind;
  label: string; // card brand, bank name, or the kind itself
  detail: string; // "•••• 4242", a handle, or instructions. Never a full card number.
  isDefault: boolean;
};

export type Settings = {
  theme: ThemeChoice;
  business: { name: string; email: string; phone: string; address: string };
  owner: { name: string; email: string };
  invoicing: { termsDays: number; footer: string };
  notifications: { paid: boolean; overdue: boolean; digest: boolean; weather: boolean };
  paymentMethods: PaymentMethod[];
};

export const SETTINGS_KEY = "plowline.settings";

export const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  business: {
    name: "Northern Edge Snow Services",
    email: "billing@northernedge.example",
    phone: "(555) 010-0100",
    address: "100 Plow Rd, Frostville",
  },
  owner: { name: "Business Owner", email: "owner@northernedge.example" },
  invoicing: { termsDays: 14, footer: "Thank you for your business. Stay warm!" },
  notifications: { paid: true, overdue: true, digest: false, weather: true },
  paymentMethods: [
    { id: "pm1", kind: "Card", label: "Visa", detail: "•••• 4242", isDefault: true },
    { id: "pm2", kind: "Check", label: "Check", detail: "Payable to Northern Edge Snow Services", isDefault: false },
  ],
};

// Merge saved values over the defaults so older saved shapes never break the app.
export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const s = JSON.parse(raw) as Partial<Settings>;
    return {
      theme: s.theme ?? DEFAULT_SETTINGS.theme,
      business: { ...DEFAULT_SETTINGS.business, ...s.business },
      owner: { ...DEFAULT_SETTINGS.owner, ...s.owner },
      invoicing: { ...DEFAULT_SETTINGS.invoicing, ...s.invoicing },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...s.notifications },
      paymentMethods: Array.isArray(s.paymentMethods) ? s.paymentMethods : DEFAULT_SETTINGS.paymentMethods,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // storage unavailable (private window): settings just won't persist
  }
}
