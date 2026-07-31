"use client";

import React from "react";
import Link from "next/link";
import { AccountLayout } from "../../../components/layout/AccountLayout";

const RETENTION = [
  { category: "Diagnostic logs",           classification: "Internal",      retention: "30 days" },
  { category: "Journey analytics (non-personal)", classification: "Internal", retention: "13 months" },
  { category: "Booking & payment audit records", classification: "Confidential", retention: "7 years (regulatory)" },
  { category: "Travel document numbers",   classification: "Restricted",    retention: "Until trip completion + 90 days" },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
      style={{ backgroundColor: on ? "#c1440e" : "rgba(255,255,255,0.15)" }}
      aria-pressed={on}
    >
      <span className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform" style={{ transform: on ? "translateX(18px)" : "translateX(2px)" }} />
    </button>
  );
}

export default function PrivacyPage(): React.JSX.Element {
  const [analytics, setAnalytics] = React.useState(true);

  return (
    <AccountLayout>
      <div className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
        <h1 className="mb-1 text-lg font-semibold text-white">Privacy &amp; my data</h1>
        <p className="mb-5 text-xs text-white/35">Your rights of access, rectification, erasure and portability are all actionable from this screen.</p>

        <div className="space-y-4">
          {[
            { label: "Download my data",  desc: "Machine-readable export of profile, preferences, bookings and itineraries.", btn: "Request export", btnAction: () => alert("Export requested") },
            { label: "Correct my details", desc: "Fix a name, date of birth or document number.", btn: "Open profile", btnHref: "/profile" },
            { label: "Delete my account",  desc: "Permanent. Records required for financial audit are retained under law.", btn: "Delete account", danger: true, btnAction: () => alert("Confirm in the modal") },
          ].map(item => (
            <div key={item.label} className="flex items-start justify-between gap-4 border-b border-white/8 pb-4">
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-white/35">{item.desc}</p>
              </div>
              {item.btnHref ? (
                <Link href={item.btnHref} className="rounded border border-white/15 px-3 py-1.5 text-xs text-white/55 hover:text-white transition-colors whitespace-nowrap">
                  {item.btn}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={item.btnAction}
                  className="rounded border border-white/15 px-3 py-1.5 text-xs text-white/55 hover:text-white transition-colors whitespace-nowrap"
                  style={item.danger ? { borderColor: "rgba(239,68,68,0.4)", color: "#f87171" } : undefined}
                >
                  {item.btn}
                </button>
              )}
            </div>
          ))}

          <div className="flex items-start justify-between gap-4 pb-4">
            <div>
              <p className="text-sm font-medium text-white">Product analytics</p>
              <p className="text-xs text-white/35">Named journey events only — never your name, email, date of birth or document numbers.</p>
            </div>
            <Toggle on={analytics} onToggle={() => setAnalytics(v => !v)} />
          </div>
        </div>

        <div className="mt-2">
          <h2 className="mb-3 text-sm font-semibold text-white">How long we keep things</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {["Category","Classification","Retention"].map(h => (
                  <th key={h} className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-white/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RETENTION.map(r => (
                <tr key={r.category} className="border-b border-white/6">
                  <td className="py-2.5 text-sm text-white/70">{r.category}</td>
                  <td className="py-2.5 text-sm text-white/45">{r.classification}</td>
                  <td className="py-2.5 text-sm text-white/45">{r.retention}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-white/20">Deletion is a cryptographic erasure, not a hidden record.</p>
        </div>
      </div>
    </AccountLayout>
  );
}
