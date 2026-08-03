"use client";

import React from "react";
import { AccountLayout } from "../../../components/layout/AccountLayout";
import { useToast } from "../../../components/ui/Toast";

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
      style={{ backgroundColor: on ? "#c1440e" : "rgba(255,255,255,0.15)" }}
      aria-pressed={on}
      aria-label={label}
    >
      <span
        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
        style={{ transform: on ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

function Select({ value, options, onChange, label }: { value: string; options: string[]; onChange: (v: string) => void; label: string }) {
  return (
    <div>
      <label className="block text-xs text-[var(--voya-text-3)] mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded border border-[var(--voya-border)] px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--voya-border-sub)]"
        style={{ backgroundColor: "#2a1f18", colorScheme: "dark" }}
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function TravelPreferencesPage(): React.JSX.Element {
  const { addToast } = useToast();
  const [prefs, setPrefs] = React.useState({
    cabin: "Premium economy",
    stayType: "Homes & Villas",
    carClass: "Compact automatic",
    currency: "EUR — Euro",
    dietary: "Step-free access preferred; no shellfish",
    marriottOnly: true,
    priceAlerts: false,
  });

  function save() {
    addToast({ title: "Preferences saved", variant: "success" });
  }

  return (
    <AccountLayout>
      <div className="rounded-xl border border-[var(--voya-border)] p-6" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
        <h1 className="mb-1 text-lg font-semibold text-white">Travel preferences</h1>
        <p className="mb-5 text-xs text-[var(--voya-text-3)]">Used to pre-fill searches and to guide the assistant. Changing these never books anything.</p>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Preferred cabin" value={prefs.cabin} options={["Economy","Premium economy","Business","First"]} onChange={v => setPrefs(p => ({ ...p, cabin: v }))} />
            <Select label="Preferred stay type" value={prefs.stayType} options={["Homes & Villas","Marriott Hotels","Any"]} onChange={v => setPrefs(p => ({ ...p, stayType: v }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Car class" value={prefs.carClass} options={["Economy","Compact automatic","Standard SUV","Luxury"]} onChange={v => setPrefs(p => ({ ...p, carClass: v }))} />
            <Select label="Display currency" value={prefs.currency} options={["EUR — Euro","USD — US Dollar","GBP — Sterling","JPY — Yen"]} onChange={v => setPrefs(p => ({ ...p, currency: v }))} />
          </div>
          <p className="text-xs text-[var(--voya-text-3)]">Offers are always also shown in the supplier&apos;s own currency.</p>

          <div>
            <label className="block text-xs text-[var(--voya-text-3)] mb-1">Dietary and accessibility notes</label>
            <input
              value={prefs.dietary}
              onChange={e => setPrefs(p => ({ ...p, dietary: e.target.value }))}
              className="w-full rounded border border-[var(--voya-border)] px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--voya-border-sub)]"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            />
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Marriott inventory only</p>
                <p className="text-xs text-[var(--voya-text-3)]">Hide named-partner inventory from results</p>
              </div>
              <Toggle on={prefs.marriottOnly} onToggle={() => setPrefs(p => ({ ...p, marriottOnly: !p.marriottOnly }))} />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Email me price changes</p>
                <p className="text-xs text-[var(--voya-text-3)]">For saved offers, at most once a day</p>
              </div>
              <Toggle on={prefs.priceAlerts} onToggle={() => setPrefs(p => ({ ...p, priceAlerts: !p.priceAlerts }))} />
            </div>
          </div>
        </div>

        <div className="mt-5">
          <button type="button" onClick={save} className="rounded px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85" style={{ backgroundColor: "#c1440e" }}>
            Save preferences
          </button>
        </div>
      </div>
    </AccountLayout>
  );
}
