"use client";

import * as React from "react";
import { getCurrency, getLocale, subscribeLocaleChange } from "../lib/locale";

export function useLocaleCurrency(): { locale: string; currency: string } {
  const [state, setState] = React.useState({
    locale: getLocale(),
    currency: getCurrency(),
  });

  React.useEffect(() => subscribeLocaleChange(() => {
    setState({ locale: getLocale(), currency: getCurrency() });
  }), []);

  return state;
}
