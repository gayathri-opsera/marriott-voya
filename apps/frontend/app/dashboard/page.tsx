"use client";

import React from "react";
import Link from "next/link";
import { fetchTrips, type Trip } from "../../lib/api/trips";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

// ─── Demo day-by-day data ──────────────────────────────────────────────────────

const DEMO_DAYS = [
  {
    date: "Sat 12 Sep",
    note: "Arrival · Lucca",
    items: [
      { name: "Check in — Villa Il Cortile", detail: "From 16:00 · 4 nights", source: "Homes & Villas", status: "Confirmed", ref: "HV-8842-LUC", pts: 6180, amount: "EUR 1,648.00", bookable: true },
      { name: "City tax", detail: "Payable at the property", source: "Homes & Villas", status: "Due on arrival", ref: "—", pts: null, amount: "EUR 16.00", bookable: false },
    ],
    alert: null,
  },
  {
    date: "Sun 15 Sep",
    note: "Walking",
    items: [],
    alert: null,
  },
  {
    date: "Wed 16 Sep",
    note: null,
    items: [],
    alert: "1 item awaiting supplier",
  },
];

function statusPill(status: string) {
  const map: Record<string, { bg: string; color: string }> = {
    "Confirmed":      { bg: "rgba(34,197,94,0.15)",  color: "#4ade80" },
    "Due on arrival": { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" },
    "Awaiting supplier": { bg: "rgba(251,191,36,0.15)", color: "#fbbf24" },
  };
  const s = map[status] ?? { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" };
  return (
    <span className="inline-block rounded px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const isHvmi = source.toLowerCase().includes("homes");
  const bg = isHvmi ? "rgba(217,119,6,0.18)" : "rgba(59,130,246,0.18)";
  const color = isHvmi ? "#fbbf24" : "#93c5fd";
  return (
    <span className="inline-block rounded px-1.5 py-0.5 text-xs" style={{ backgroundColor: bg, color }}>
      {source}
    </span>
  );
}

const TABS = ["Upcoming", "In progress", "Past", "Cancelled"] as const;

export default function DashboardPage(): React.JSX.Element {
  const { isOnline } = useOnlineStatus();
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<(typeof TABS)[number]>("Upcoming");

  React.useEffect(() => {
    fetchTrips().then(setTrips).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcoming = trips.filter(t => t.status === "CONFIRMED" && t.departureDate && new Date(t.departureDate) > now);
  const past      = trips.filter(t => t.status === "CONFIRMED" && (!t.departureDate || new Date(t.departureDate) <= now));

  return (
    <div style={{ backgroundColor: "#14100c", minHeight: "100vh", color: "white" }}>
      <div className="mx-auto max-w-5xl px-4 py-8">

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--voya-text)]">My trips</h1>
          <div className="hidden items-center gap-2 text-xs text-[var(--voya-text-3)] sm:flex">
            <span className="font-semibold" style={{ color: "#f59e0b" }}>Bonvoy Gold</span>
            <span>48.2 k pts</span>
            <span className="text-lg">🌙</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex border-b border-[var(--voya-border)]">
          {TABS.map((tab, i) => {
            const count = tab === "Upcoming" ? upcoming.length || 2 : tab === "Past" ? past.length || 7 : 0;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
                style={{
                  color: activeTab === tab ? "white" : "rgba(255,255,255,0.4)",
                  borderColor: activeTab === tab ? "#c1440e" : "transparent",
                }}
              >
                {tab}{count > 0 ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>

        {/* Main grid */}
        <div className="grid gap-5 lg:grid-cols-[1fr_220px]">

          {/* Trip card */}
          <div className="space-y-5">
            {/* Summary card */}
            <div className="rounded-xl border border-[var(--voya-border)] p-5" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-[var(--voya-text)]">Tuscany &amp; the coast</h2>
                  <p className="text-sm text-[var(--voya-text-3)]">12–18 Sep 2026 · Lucca, Forte dei Marmi · 2 travellers</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="rounded border border-[var(--voya-border)] px-3 py-1.5 text-xs text-[var(--voya-text-2)] hover:text-[var(--voya-text)] transition-colors">
                    Export PDF
                  </button>
                  <button type="button" className="rounded border border-[var(--voya-border)] px-3 py-1.5 text-xs text-[var(--voya-text-2)] hover:text-[var(--voya-text)] transition-colors">
                    Email itinerary
                  </button>
                </div>
              </div>

              {/* Status badges */}
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80" }}>Villa confirmed</span>
                <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>Car awaiting supplier</span>
                <span className="rounded px-2 py-0.5 text-xs text-[var(--voya-text-3)]" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>3 items</span>
              </div>

              {/* Stats grid */}
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Paid",            value: "EUR 1,834.00" },
                  { label: "Due on arrival",  value: "EUR 16.00" },
                  { label: "Points preview",  value: "6,880" },
                  { label: "Sources involved", value: "2" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded border border-[var(--voya-border)] p-3" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                    <p className="text-lg font-semibold text-[var(--voya-text)]">{value}</p>
                    <p className="text-xs text-[var(--voya-text-3)]">{label}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-[var(--voya-text-4)]">Itinerary emails go to m•••••@example.com</p>
            </div>

            {/* Day by day */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-[var(--voya-text)]">Day by day</h3>
              <p className="mb-3 text-xs text-[var(--voya-text-3)]">Items are grouped by day across all suppliers. Every row carries its source, status and confirmation reference.</p>

              {/* Table header */}
              <div className="overflow-hidden rounded-t-xl border border-[var(--voya-border)]">
                <table className="w-full text-sm" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                  <thead>
                    <tr className="border-b border-[var(--voya-border)]">
                      <th className="py-2 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--voya-text-3)]">Item</th>
                      <th className="py-2 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--voya-text-3)]">Source</th>
                      <th className="py-2 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--voya-text-3)]">Status</th>
                      <th className="py-2 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--voya-text-3)]">Reference</th>
                      <th className="py-2 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--voya-text-3)]">Points*</th>
                      <th className="py-2 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-[var(--voya-text-3)]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_DAYS.map((day) => (
                      <React.Fragment key={day.date}>
                        {/* Day header row */}
                        <tr>
                          <td
                            colSpan={6}
                            className="border-t border-[var(--voya-border)] py-2 pl-4 text-xs font-semibold text-[var(--voya-text)]"
                            style={{ backgroundColor: day.alert ? "rgba(251,191,36,0.06)" : "rgba(255,255,255,0.025)" }}
                          >
                            <span>{day.date}</span>
                            {day.note && <span className="ml-3 font-normal text-[var(--voya-text-3)]">{day.note}</span>}
                            {day.alert && (
                              <span className="ml-3 rounded px-1.5 py-0.5 text-xs font-medium" style={{ backgroundColor: "rgba(251,191,36,0.2)", color: "#fbbf24" }}>
                                {day.alert}
                              </span>
                            )}
                          </td>
                        </tr>
                        {day.items.map((item, i) => (
                          <tr key={i} className="border-t border-white/6 hover:bg-white/[0.015] transition-colors">
                            <td className="py-2.5 pl-4 pr-3">
                              <p className="text-sm text-[var(--voya-text)] leading-tight">{item.name}</p>
                              <p className="text-xs text-[var(--voya-text-3)]">{item.detail}</p>
                            </td>
                            <td className="py-2.5 pr-3"><SourceBadge source={item.source} /></td>
                            <td className="py-2.5 pr-3">{statusPill(item.status)}</td>
                            <td className="py-2.5 pr-3 text-xs text-[var(--voya-text-3)]">{item.ref}</td>
                            <td className="py-2.5 pr-3 text-xs text-amber-400">{item.pts != null ? item.pts.toLocaleString() : "—"}</td>
                            <td className="py-2.5 pr-4 text-right text-sm font-medium text-[var(--voya-text)]">
                              {item.amount}
                              {item.bookable && (
                                <Link href="/checkout" className="ml-2 text-xs font-medium hover:underline" style={{ color: "#c1440e" }}>View</Link>
                              )}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-[var(--voya-text-4)]">
                * Points are an illustrative preview — no server-side earning source exists yet, so no accrual is implied or guaranteed.
              </p>
            </div>
          </div>

          {/* Right: while travelling */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--voya-border)] p-4" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
              <h3 className="mb-2 text-sm font-semibold text-[var(--voya-text)]">While you&apos;re travelling</h3>
              <div className="mb-3 h-20 rounded" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
              <div className="rounded border border-sky-500/20 p-3" style={{ backgroundColor: "rgba(14,165,233,0.07)" }}>
                <p className="text-xs font-medium text-sky-400 mb-1">Illustrative preview.</p>
                <p className="text-xs text-[var(--voya-text-3)]">
                  Live in-trip status and change notices have no data source yet, so nothing here reflects real-time conditions.
                </p>
              </div>
            </div>

            {/* Quick links */}
            <div className="rounded-xl border border-[var(--voya-border)] p-4" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--voya-text-3)]">Quick actions</p>
              <div className="space-y-1.5">
                {[
                  { label: "Plan more activities", href: "/assistant?prefill=What+activities+near+Lucca?" },
                  { label: "Add a flight",          href: "/search?types=flight" },
                  { label: "Rent a car",            href: "/search?types=car" },
                  { label: "View full itinerary",   href: "/itineraries" },
                ].map(l => (
                  <Link key={l.label} href={l.href} className="block rounded px-3 py-2 text-xs text-[var(--voya-text-2)] hover:text-[var(--voya-text)] transition-colors hover:bg-[var(--voya-accent-f1)]">
                    {l.label} →
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
