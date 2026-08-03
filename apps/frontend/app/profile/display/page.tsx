"use client";

import React from "react";
import { AccountLayout } from "../../../components/layout/AccountLayout";

export default function DisplayAccessibilityPage(): React.JSX.Element {
  const [theme, setTheme]           = React.useState<"light"|"dark"|"system">("dark");
  const [density, setDensity]       = React.useState<"compact"|"comfortable">("compact");
  const [reduceMotion, setReduce]   = React.useState(true);
  const [fullFreshness, setFull]    = React.useState(true);

  function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
        style={{ backgroundColor: on ? "#c1440e" : "rgba(255,255,255,0.15)" }}
        aria-pressed={on}
      >
        <span
          className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
          style={{ transform: on ? "translateX(18px)" : "translateX(2px)" }}
        />
      </button>
    );
  }

  function SegmentGroup<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (v: T) => void }) {
    return (
      <div className="inline-flex overflow-hidden rounded border border-[var(--voya-border)]">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="px-4 py-1.5 text-sm capitalize transition-colors"
            style={{
              backgroundColor: value === opt ? "#c1440e" : "rgba(255,255,255,0.04)",
              color: value === opt ? "white" : "rgba(255,255,255,0.5)",
            }}
          >
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        ))}
      </div>
    );
  }

  return (
    <AccountLayout>
      <div className="rounded-xl border border-[var(--voya-border)] p-6" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
        <h1 className="mb-5 text-lg font-semibold text-white">Display &amp; accessibility</h1>

        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">Theme</p>
              <p className="text-xs text-[var(--voya-text-3)]">Light and dark are fully theme-painted; contrast is verified in both.</p>
            </div>
            <SegmentGroup value={theme} options={["light","dark","system"] as const} onChange={setTheme} />
          </div>

          <div className="border-t border-[var(--voya-border)] pt-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">Result density</p>
              <p className="text-xs text-[var(--voya-text-3)]">Compact fits roughly 40% more offers per screen.</p>
            </div>
            <SegmentGroup value={density} options={["compact","comfortable"] as const} onChange={setDensity} />
          </div>

          <div className="border-t border-[var(--voya-border)] pt-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">Reduce motion</p>
              <p className="text-xs text-[var(--voya-text-3)]">Removes streaming and skeleton animation.</p>
            </div>
            <Toggle on={reduceMotion} onToggle={() => setReduce(v => !v)} />
          </div>

          <div className="border-t border-[var(--voya-border)] pt-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">Always show price freshness in full</p>
              <p className="text-xs text-[var(--voya-text-3)]">Shows the exact refresh time rather than a relative age.</p>
            </div>
            <Toggle on={fullFreshness} onToggle={() => setFull(v => !v)} />
          </div>

          <div className="border-t border-[var(--voya-border)] pt-6 rounded border border-sky-500/20 p-4" style={{ backgroundColor: "rgba(14,165,233,0.07)" }}>
            <p className="text-xs text-sky-300">
              Every journey on Voya — entry, search, assistant, checkout and trips — is completable with a keyboard and a screen reader.
              Read our <a href="#" className="underline">accessibility statement</a>.
            </p>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
