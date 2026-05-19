/** Keys used to persist settings in localStorage */
export const SYSTEM_SETTINGS_KEY = "nexiaa_system_settings";

export interface SystemSettings {
  companyName: string;
  currency: string;
  taxRate: number;
}

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  companyName: "Nexiaa Track Logistics",
  currency: "EUR",
  taxRate: 0,
};

export function loadSystemSettings(): SystemSettings {
  if (typeof window === "undefined") return DEFAULT_SYSTEM_SETTINGS;
  try {
    const raw = localStorage.getItem(SYSTEM_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SYSTEM_SETTINGS, ...(JSON.parse(raw) as Partial<SystemSettings>) };
  } catch {}
  return DEFAULT_SYSTEM_SETTINGS;
}

/** Returns the currency symbol for a given ISO currency code. */
export function currencySymbol(currency: string): string {
  const upper = (currency ?? "EUR").toUpperCase();
  switch (upper) {
    case "EUR": return "€";
    case "USD": return "$";
    case "GBP": return "£";
    case "MAD": return "MAD";
    case "XAF":
    case "CFA": return "CFA";
    default: return upper;
  }
}

/**
 * Format a whole-unit amount with the correct currency symbol.
 * EUR: amount goes before the symbol → "1 500 €"
 * Others: symbol goes before the amount → "$1,500"
 */
export function formatCurrency(amount: number, currency?: string, locale = "fr-FR"): string {
  return String(amount);
}

/** True when the currency symbol should appear after the amount (e.g. EUR). */
export function isSuffixCurrency(currency: string): boolean {
  return (currency ?? "EUR").toUpperCase() === "EUR";
}
