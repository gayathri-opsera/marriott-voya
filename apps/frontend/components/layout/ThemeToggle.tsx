"use client";

import * as React from "react";
import { getTheme, setTheme, subscribeThemeChange, type ThemePreference } from "../../lib/theme";

const THEMES: { value: ThemePreference; label: string; icon: string }[] = [
  { value: "light", label: "Light mode", icon: "☀" },
  { value: "dark", label: "Dark mode", icon: "☾" },
  { value: "system", label: "System theme", icon: "◐" },
];

export function ThemeToggle(): React.JSX.Element {
  const [theme, setThemeState] = React.useState<ThemePreference>(getTheme);

  React.useEffect(() => subscribeThemeChange(() => setThemeState(getTheme())), []);

  const cycleTheme = (): void => {
    const order: ThemePreference[] = ["light", "dark", "system"];
    const next = order[(order.indexOf(theme) + 1) % order.length]!;
    setTheme(next);
    setThemeState(next);
  };

  const current = THEMES.find((t) => t.value === theme) ?? THEMES[0]!;

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={current.label}
      className="rounded-md p-2 text-text-secondary hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
    >
      <span aria-hidden className="text-base">
        {current.icon}
      </span>
    </button>
  );
}
