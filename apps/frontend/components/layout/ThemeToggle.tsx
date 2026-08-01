"use client";

import * as React from "react";
import { getTheme, setTheme, subscribeThemeChange, type ThemePreference } from "../../lib/theme";

const OPTIONS: { value: ThemePreference; icon: string; label: string }[] = [
  { value: "light",  icon: "☀",  label: "Light" },
  { value: "dark",   icon: "☾",  label: "Dark"  },
  { value: "system", icon: "◐",  label: "Auto"  },
];

export function ThemeToggle(): React.JSX.Element {
  const [theme, setThemeState] = React.useState<ThemePreference>(getTheme);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => subscribeThemeChange(() => setThemeState(getTheme())), []);

  // Close dropdown on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const current = OPTIONS.find(o => o.value === theme) ?? OPTIONS[1]!;

  const pick = (v: ThemePreference) => {
    setTheme(v);
    setThemeState(v);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={`Theme: ${current.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 20,
          border: "1px solid var(--voya-border)",
          background: "var(--voya-accent-f1)",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--voya-accent-f2)")}
        onMouseLeave={e => (e.currentTarget.style.background = "var(--voya-accent-f1)")}
      >
        <span style={{ fontSize: 13, color: "var(--voya-accent)" }} aria-hidden>{current.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--voya-text-2)" }}>{current.label}</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Choose theme"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            background: "var(--voya-surface)",
            border: "1px solid var(--voya-border)",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            minWidth: 130,
            zIndex: 100,
          }}
        >
          {OPTIONS.map(o => (
            <button
              key={o.value}
              role="option"
              aria-selected={theme === o.value}
              type="button"
              onClick={() => pick(o.value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "8px 14px",
                background: theme === o.value ? "var(--voya-accent-f2)" : "transparent",
                border: "none",
                cursor: "pointer",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => { if (theme !== o.value) (e.currentTarget as HTMLButtonElement).style.background = "var(--voya-accent-f1)"; }}
              onMouseLeave={e => { if (theme !== o.value) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <span style={{ fontSize: 14, color: "var(--voya-accent)" }}>{o.icon}</span>
              <span style={{ fontSize: 12, fontWeight: theme === o.value ? 600 : 400, color: theme === o.value ? "var(--voya-accent)" : "var(--voya-text-2)" }}>
                {o.label}
              </span>
              {theme === o.value && (
                <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--voya-accent)" }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
