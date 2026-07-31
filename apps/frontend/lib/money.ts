export function formatMoney(amount: number | string, currency: string, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(Number(amount));
}
