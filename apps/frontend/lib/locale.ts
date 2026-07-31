const LOCALE_KEY = "voya-locale";
const CURRENCY_KEY = "voya-currency";
const LOCALE_CHANGE_EVENT = "voya-locale-change";

export const SUPPORTED_LOCALES = ["en-US", "de-DE", "fr-FR", "ja-JP"] as const;
export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "JPY"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getLocale(): string {
  if (!isBrowser()) return "en-US";
  const stored = localStorage.getItem(LOCALE_KEY);
  if (stored) return stored;
  return navigator.language || "en-US";
}

export function setLocale(locale: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(LOCALE_KEY, locale);
  window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT));
}

export function getCurrency(): string {
  if (!isBrowser()) return "USD";
  return localStorage.getItem(CURRENCY_KEY) ?? "USD";
}

export function setCurrency(currency: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(CURRENCY_KEY, currency);
  window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT));
}

export function subscribeLocaleChange(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(LOCALE_CHANGE_EVENT, callback);
  return () => window.removeEventListener(LOCALE_CHANGE_EVENT, callback);
}
