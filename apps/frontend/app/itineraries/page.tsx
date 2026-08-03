"use client";

/**
 * Saved Trips / Manage Itineraries — WOREF-033
 * Lists all saved itinerary drafts with status, destination, and quick actions.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface SavedTrip {
  draftId: string;
  destination: string;
  checkIn: string;
  checkOut: string;
  status: "DRAFT" | "ACCEPTED" | "BOOKED" | "ABANDONED";
  totalUSD?: number;
  totalBonvoyPoints?: number;
  updatedAt?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: "Draft",    color: "#6b7280" },
  ACCEPTED:  { label: "Accepted", color: "#059669" },
  BOOKED:    { label: "Booked",   color: "#c1440e" },
  ABANDONED: { label: "Archived", color: "#9ca3af" },
};

const DEMO_TRIPS: SavedTrip[] = [
  { draftId: "itin-lucca-001", destination: "Lucca, Italy",    checkIn: "2099-09-10", checkOut: "2099-09-14", status: "DRAFT",    totalUSD: 2510,  totalBonvoyPoints: 12550, updatedAt: "2026-07-28T10:30:00Z" },
  { draftId: "itin-paris-002", destination: "Paris, France",   checkIn: "2099-10-01", checkOut: "2099-10-07", status: "ACCEPTED", totalUSD: 3800,  totalBonvoyPoints: 19000, updatedAt: "2026-07-25T14:00:00Z" },
  { draftId: "itin-kyoto-003", destination: "Kyoto, Japan",    checkIn: "2099-11-15", checkOut: "2099-11-22", status: "BOOKED",   totalUSD: 4100,  totalBonvoyPoints: 20500, updatedAt: "2026-07-20T09:00:00Z" },
];

export default function ItinerariesPage(): React.JSX.Element {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    const loadTrips = async () => {
      try {
        const res = await fetch("/api/v1/ai/itineraries");
        if (res.ok) {
          const data = await res.json() as SavedTrip[];
          setTrips(data.length ? data : DEMO_TRIPS);
        } else {
          setTrips(DEMO_TRIPS);
        }
      } catch {
        setTrips(DEMO_TRIPS);
      } finally {
        setLoading(false);
      }
    };
    void loadTrips();
  }, []);

  const filtered = filter === "ALL" ? trips : trips.filter((t) => t.status === filter);

  return (
    <main className="min-h-screen" style={{ background: "var(--voya-surface-0)" }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--voya-text-1)" }}>My Trips</h1>
          <Link
            href="/assistant"
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--voya-accent)", color: "#000" }}
          >
            + Plan a new trip
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {["ALL", "DRAFT", "ACCEPTED", "BOOKED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
              style={{
                background: filter === f ? "var(--voya-accent)" : "var(--voya-surface-2)",
                color: filter === f ? "#000" : "var(--voya-text-2)",
              }}
            >
              {f === "ALL" ? "All" : STATUS_CONFIG[f]?.label ?? f}
            </button>
          ))}
        </div>

        {/* Trip cards */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: "var(--voya-surface-2)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="font-medium" style={{ color: "var(--voya-text-2)" }}>No trips yet</p>
            <p className="text-sm mt-1" style={{ color: "var(--voya-text-3)" }}>
              Start a conversation with your AI Concierge to plan your first trip.
            </p>
            <Link
              href="/assistant"
              className="mt-4 inline-block px-6 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "var(--voya-accent)", color: "#000" }}
            >
              Open Concierge
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((trip) => {
              const statusConf = STATUS_CONFIG[trip.status] ?? { label: trip.status, color: "#6b7280" };
              const nights = Math.round(
                (new Date(trip.checkOut).getTime() - new Date(trip.checkIn).getTime()) / 86_400_000,
              );
              return (
                <Link
                  key={trip.draftId}
                  href={`/itineraries/${trip.draftId}`}
                  className="block rounded-xl p-4 transition-transform hover:scale-[1.01]"
                  style={{ background: "var(--voya-surface-1)", border: "1px solid var(--voya-border)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-sm" style={{ color: "var(--voya-text-1)" }}>{trip.destination}</h2>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: statusConf.color + "25", color: statusConf.color }}
                        >
                          {statusConf.label}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--voya-text-3)" }}>
                        {trip.checkIn} · {nights} night{nights !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {trip.totalUSD && (
                        <p className="text-sm font-semibold" style={{ color: "var(--voya-text-1)" }}>
                          ${trip.totalUSD.toLocaleString()}
                        </p>
                      )}
                      {trip.totalBonvoyPoints && (
                        <p className="text-xs" style={{ color: "var(--voya-amber)" }}>
                          +{trip.totalBonvoyPoints.toLocaleString()} pts
                        </p>
                      )}
                    </div>
                  </div>
                  {trip.updatedAt && (
                    <p className="text-xs mt-2" style={{ color: "var(--voya-text-3)" }}>
                      Updated {new Date(trip.updatedAt).toLocaleDateString()}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
