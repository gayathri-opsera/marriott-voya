"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { TripDraftItem } from "../../lib/assistant-stream";

export interface TripDraftPanelProps {
  items: TripDraftItem[];
  budgetCommitted?: number;
  budgetTotal?: number;
}

export function TripDraftPanel({ items, budgetCommitted = 0, budgetTotal = 3500 }: TripDraftPanelProps) {
  const router = useRouter();
  if (items.length === 0) return null;

  const pct = Math.min(100, Math.round((budgetCommitted / budgetTotal) * 100));
  const committed = budgetCommitted > 0
    ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(budgetCommitted)
    : null;
  const total = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(budgetTotal);

  return (
    <div className="mx-4 mb-2 rounded-xl border border-border-default bg-surface-default shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-default bg-surface-subtle">
        <div>
          <p className="text-sm font-semibold text-text-primary">Trip draft</p>
          <p className="text-xs text-text-secondary">Nothing is booked until you review and pay.</p>
        </div>
      </div>

      {/* Itinerary rows */}
      <div className="divide-y divide-border-default">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="shrink-0 text-xs font-semibold text-text-primary tabular-nums">{item.dates}</span>
              <span className="text-xs text-text-secondary truncate">{item.label}</span>
            </div>
            <span className="ml-2 shrink-0 text-xs text-text-secondary">
              {item.detail
                ? item.detail
                : item.pricing !== undefined
                ? item.pricing === null
                  ? <span className="text-text-tertiary italic">Pricing…</span>
                  : new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(item.pricing)
                : <span className="text-text-tertiary italic">Pricing…</span>
              }
            </span>
          </div>
        ))}
      </div>

      {/* Budget bar */}
      {budgetCommitted > 0 && (
        <div className="px-4 py-2.5 border-t border-border-default">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-text-secondary">
              Committed so far{" "}
              <span className="font-semibold text-text-primary">{committed}</span>
              {" "}of {total} budget
            </p>
            <span className="text-xs text-text-tertiary">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface-subtle overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="px-4 py-3 border-t border-border-default">
        <button
          onClick={() => router.push("/itineraries")}
          className="w-full rounded-xl bg-brand-primary py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/90 transition-colors"
        >
          Review &amp; book this trip
        </button>
      </div>
    </div>
  );
}
