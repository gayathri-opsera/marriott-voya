"use client";

/**
 * Editable Itinerary Timeline — WOREF-030 + WO-GAP-04 (PDF export)
 * Displays a day-by-day editable itinerary with accept/edit/abandon actions.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { use } from "react";
import { downloadItineraryPdf } from "../../../lib/itinerary-pdf";

interface ItineraryItem {
  date: string;
  type: string;
  label: string;
  detail?: string;
  price?: number;
  currency?: string;
  bonvoyPoints?: number;
  provenance?: string;
}

interface ItineraryDraft {
  draftId: string;
  destination: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalUSD: number;
  totalBonvoyPoints: number;
  items: ItineraryItem[];
}

const ITEM_ICONS: Record<string, string> = {
  ACCOMMODATION: "🏡",
  ACTIVITY: "🎭",
  FLIGHT: "✈️",
  TRANSPORT: "🚗",
  DINING: "🍽️",
  FREE_TIME: "🌟",
};

const PROVENANCE_BADGE: Record<string, { label: string; color: string }> = {
  HVMI:        { label: "HVMI",          color: "#d4a84b" },
  MARRIOTT:    { label: "Marriott",      color: "#c1440e" },
  BONVOY_TOURS:{ label: "Bonvoy Tours",  color: "#7c3aed" },
  LOCAL:       { label: "Local",         color: "#059669" },
  ILLUSTRATIVE:{ label: "Demo",          color: "#6b7280" },
};

function groupByDate(items: ItineraryItem[]): Record<string, ItineraryItem[]> {
  return items.reduce((acc, item) => {
    const key = item.date;
    return { ...acc, [key]: [...(acc[key] ?? []), item] };
  }, {} as Record<string, ItineraryItem[]>);
}

export default function ItineraryDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }): React.JSX.Element {
  // Next.js 14 passes params as a plain object in dev, Promise in some builds
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const { id } = resolvedParams;
  const [draft, setDraft] = useState<ItineraryDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  // Demo itinerary for display when no real data
  const demoItinerary: ItineraryDraft = {
    draftId: id,
    destination: "Lucca, Italy",
    checkIn: "2099-09-10",
    checkOut: "2099-09-14",
    status: "DRAFT",
    totalUSD: 2510,
    totalBonvoyPoints: 12550,
    items: [
      { date: "2099-09-10", type: "ACCOMMODATION", label: "Villa della Torre", detail: "HVMI — Historic Centre, Lucca", price: 485, currency: "USD", bonvoyPoints: 2425, provenance: "HVMI" },
      { date: "2099-09-10", type: "TRANSPORT",     label: "Pisa Airport → Lucca", detail: "Shuttle transfer, 25 min", price: 25, currency: "USD" },
      { date: "2099-09-11", type: "ACTIVITY",      label: "City Walls Cycle Ride", detail: "Free, self-guided — 4.2km loop", price: 0, provenance: "LOCAL" },
      { date: "2099-09-11", type: "ACTIVITY",      label: "Marriott Bonvoy Historic Centre Walk", detail: "Guided tour, €85pp, earns Bonvoy points", price: 85, currency: "EUR", bonvoyPoints: 425, provenance: "BONVOY_TOURS" },
      { date: "2099-09-12", type: "ACTIVITY",      label: "Chianti Vineyard Tour", detail: "Full-day, estate lunch, Bonvoy Tours", price: 145, currency: "USD", bonvoyPoints: 725, provenance: "BONVOY_TOURS" },
      { date: "2099-09-13", type: "ACTIVITY",      label: "Cinque Terre Day Trip", detail: "Bonvoy Tours — coastal hike + boat", price: 135, currency: "USD", bonvoyPoints: 675, provenance: "BONVOY_TOURS" },
      { date: "2099-09-14", type: "TRANSPORT",     label: "Lucca → Pisa Airport", detail: "Shuttle transfer, 25 min", price: 25, currency: "USD" },
    ],
  };

  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const res = await fetch(`/api/v1/ai/itineraries/${id}`);
        if (res.ok) {
          const data = await res.json() as ItineraryDraft;
          setDraft(data);
        } else {
          setDraft(demoItinerary);
        }
      } catch {
        setDraft(demoItinerary);
      } finally {
        setLoading(false);
      }
    };
    void fetchDraft();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    const itinerary = draft ?? demoItinerary;
    setExportingPdf(true);
    try {
      const days = Object.entries(groupByDate(itinerary.items))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, items]) => ({
          date,
          items: items.map(i => ({
            type: (i.type.toLowerCase() as "accommodation" | "activity" | "transport" | "restaurant" | "flight"),
            title: i.label,
            description: i.detail,
            price: i.price,
            currency: i.currency,
          })),
        }));

      await downloadItineraryPdf({
        tripTitle: itinerary.destination,
        destination: itinerary.destination,
        checkIn: itinerary.checkIn,
        checkOut: itinerary.checkOut,
        travellers: 2,
        bonvoyPoints: itinerary.totalBonvoyPoints,
        totalCost: itinerary.totalUSD,
        currency: "USD",
        days,
      });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleAccept = async () => {
    if (!draft) return;
    setAccepting(true);
    try {
      await fetch(`/api/v1/ai/itineraries/${draft.draftId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setDraft({ ...draft, status: "ACCEPTED" });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--voya-surface-0)" }}>
        <div className="animate-pulse text-lg" style={{ color: "var(--voya-text-3)" }}>Loading itinerary…</div>
      </div>
    );
  }

  const itinerary = draft ?? demoItinerary;
  const grouped = groupByDate(itinerary.items);
  const dates = Object.keys(grouped).sort();
  const isAccepted = itinerary.status === "ACCEPTED" || itinerary.status === "BOOKED";

  return (
    <main className="min-h-screen" style={{ background: "var(--voya-surface-0)" }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/itineraries" className="text-sm hover:underline" style={{ color: "var(--voya-accent)" }}>
            ← My Itineraries
          </Link>
          <h1 className="text-2xl font-bold mt-2" style={{ color: "var(--voya-text-1)" }}>
            {itinerary.destination}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--voya-text-3)" }}>
            {itinerary.checkIn} → {itinerary.checkOut}
          </p>
          {isAccepted && (
            <span className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--voya-success)20", color: "var(--voya-success)" }}>
              ✓ Accepted
            </span>
          )}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl p-4" style={{ background: "var(--voya-surface-1)", border: "1px solid var(--voya-border)" }}>
            <div className="text-xs" style={{ color: "var(--voya-text-3)" }}>Total cost</div>
            <div className="text-xl font-bold" style={{ color: "var(--voya-text-1)" }}>${itinerary.totalUSD.toLocaleString()}</div>
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--voya-surface-1)", border: "1px solid var(--voya-border)" }}>
            <div className="text-xs" style={{ color: "var(--voya-text-3)" }}>Bonvoy points</div>
            <div className="text-xl font-bold" style={{ color: "var(--voya-amber)" }}>
              {itinerary.totalBonvoyPoints.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Day-by-day timeline */}
        <div className="space-y-6">
          {dates.map((date) => (
            <div key={date}>
              <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--voya-text-3)" }}>
                {new Date(date + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
              </h2>
              <div className="space-y-2">
                {grouped[date]?.map((item, idx) => {
                  const badge = item.provenance ? PROVENANCE_BADGE[item.provenance] : null;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl p-4 flex items-start gap-3"
                      style={{ background: "var(--voya-surface-1)", border: "1px solid var(--voya-border)" }}
                    >
                      <span className="text-xl mt-0.5">{ITEM_ICONS[item.type] ?? "📍"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm" style={{ color: "var(--voya-text-1)" }}>{item.label}</span>
                          {badge && (
                            <span className="px-1.5 py-0.5 rounded text-xs font-medium"
                              style={{ background: badge.color + "25", color: badge.color }}>
                              {badge.label}
                            </span>
                          )}
                        </div>
                        {item.detail && (
                          <p className="text-xs mt-0.5" style={{ color: "var(--voya-text-3)" }}>{item.detail}</p>
                        )}
                        {(item.price !== undefined) && (
                          <p className="text-xs mt-1" style={{ color: "var(--voya-text-2)" }}>
                            {item.price === 0 ? "Free" : `${item.currency ?? "USD"} ${item.price}`}
                            {item.bonvoyPoints ? ` · +${item.bonvoyPoints.toLocaleString()} pts` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* PDF Export */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ borderColor: "var(--voya-border)", color: "var(--voya-text-2)" }}
          >
            {exportingPdf ? "⏳ Generating…" : "📥 Export PDF"}
          </button>
        </div>

        {/* Actions */}
        {!isAccepted && (
          <div className="mt-8 flex gap-3">
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--voya-accent)", color: "#000" }}
            >
              {accepting ? "Accepting…" : "Accept this itinerary"}
            </button>
            <Link
              href="/assistant"
              className="px-6 py-3 rounded-xl font-semibold text-sm text-center"
              style={{ background: "var(--voya-surface-2)", color: "var(--voya-text-2)" }}
            >
              Edit with AI
            </Link>
          </div>
        )}

        {isAccepted && (
          <div className="mt-8">
            <Link
              href="/checkout"
              className="block w-full py-3 rounded-xl font-semibold text-sm text-center transition-opacity hover:opacity-90"
              style={{ background: "var(--voya-amber)", color: "#000" }}
            >
              Proceed to Checkout →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
