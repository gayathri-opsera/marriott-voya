"use client";

import * as React from "react";
import {
  getCurrency,
  getLocale,
  setCurrency,
  setLocale,
  SUPPORTED_CURRENCIES,
  SUPPORTED_LOCALES,
} from "../../lib/locale";

export function LocaleCurrencyPicker(): React.JSX.Element {
  const [locale, setLocaleState] = React.useState(getLocale);
  const [currency, setCurrencyState] = React.useState(getCurrency);

  return (
    <div className="flex items-center gap-2" aria-label="Locale and currency settings">
      <label htmlFor="locale-picker" className="sr-only">
        Language
      </label>
      <select
        id="locale-picker"
        value={locale}
        onChange={(e) => {
          setLocale(e.target.value);
          setLocaleState(e.target.value);
        }}
        className="h-8 rounded-md border border-border-default bg-surface-default px-2 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        {SUPPORTED_LOCALES.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>

      <label htmlFor="currency-picker" className="sr-only">
        Currency
      </label>
      <select
        id="currency-picker"
        value={currency}
        onChange={(e) => {
          setCurrency(e.target.value);
          setCurrencyState(e.target.value);
        }}
        className="h-8 rounded-md border border-border-default bg-surface-default px-2 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
