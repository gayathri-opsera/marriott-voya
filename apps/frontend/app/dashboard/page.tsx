"use client";

/**
 * Traveler account dashboard — My Trips.
 */

import { useEffect, useState } from "react";
import { fetchTrips, type Trip } from "../../lib/api/trips";

export default function DashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrips()
      .then(setTrips)
      .catch(() => setError("Failed to load your trips"))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcoming = trips.filter(
    (t) => t.status === "CONFIRMED" && t.departureDate && new Date(t.departureDate) > now,
  );
  const past = trips.filter(
    (t) => t.status === "CONFIRMED" && (!t.departureDate || new Date(t.departureDate) <= now),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Trips</h1>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Trips" value={trips.length} />
          <StatCard label="Upcoming" value={upcoming.length} highlight />
          <StatCard label="Completed" value={past.length} />
        </div>

        <Section title="Upcoming Trips">
          {upcoming.length === 0 ? (
            <EmptyState message="No upcoming trips. Start planning your next adventure!" cta={{ label: "Search Flights", href: "/search" }} />
          ) : (
            upcoming.map((trip) => <TripCard key={trip.id} trip={trip} />)
          )}
        </Section>

        {past.length > 0 && (
          <Section title="Past Trips">
            {past.map((trip) => <TripCard key={trip.id} trip={trip} faded />)}
          </Section>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 text-center shadow-sm ${highlight ? "bg-blue-600 text-white" : "bg-white text-gray-900"}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className={`text-sm mt-1 ${highlight ? "text-blue-100" : "text-gray-500"}`}>{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function TripCard({ trip, faded = false }: { trip: Trip; faded?: boolean }) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm flex justify-between items-center ${faded ? "opacity-60" : ""}`}>
      <div>
        <p className="font-medium text-gray-900">{trip.title}</p>
        <p className="text-sm text-gray-500">{trip.departureDate ?? "—"}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-blue-600">{trip.price.currency} {trip.price.amount.toFixed(2)}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full ${trip.status === "CONFIRMED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {trip.status}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ message, cta }: { message: string; cta: { label: string; href: string } }) {
  return (
    <div className="bg-white rounded-xl p-8 text-center">
      <p className="text-gray-500 mb-4">{message}</p>
      <a href={cta.href} className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
        {cta.label}
      </a>
    </div>
  );
}
