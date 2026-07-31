"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@travel/design-system";
import { fetchTrips, type Trip } from "../../lib/api/trips";
import { DayView, type TripSegment } from "../../components/trips/DayView";
import { StateBoundary } from "../../components/patterns/StateBoundary";
import { ApiError, ErrorCode } from "../../lib/api/errors";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { ROUTES } from "../../lib/routes";

export default function DashboardPage(): React.JSX.Element {
  const { isOnline } = useOnlineStatus();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadTrips = useCallback(async () => {
    if (!navigator.onLine) {
      setError(new ApiError(0, ErrorCode.NETWORK_ERROR, "You appear to be offline"));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrips();
      setTrips(data);
    } catch {
      setError(new Error("Failed to load your trips"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const now = new Date();
  const upcoming = trips.filter(
    (t) => t.status === "CONFIRMED" && t.departureDate && new Date(t.departureDate) > now,
  );
  const past = trips.filter(
    (t) => t.status === "CONFIRMED" && (!t.departureDate || new Date(t.departureDate) <= now),
  );

  const itineraryByDay = groupTripsByDay(upcoming);

  const screenState = !isOnline
    ? "offline"
    : loading
      ? "loading"
      : error
        ? "error"
        : upcoming.length === 0 && past.length === 0
          ? "empty"
          : "idle";

  return (
    <div className="min-h-screen bg-surface-subtle">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-text-primary">My Trips</h1>

        <StateBoundary
          state={screenState}
          error={error}
          onRetry={() => void loadTrips()}
          emptyTitle="No upcoming trips"
          emptyDescription="No upcoming trips. Start planning!"
          emptyAction={{ label: "Search trips", href: ROUTES.SEARCH }}
        >
          <>
            <div className="mb-8 grid grid-cols-3 gap-4">
              <StatCard label="Total Trips" value={trips.length} />
              <StatCard label="Upcoming" value={upcoming.length} highlight />
              <StatCard label="Completed" value={past.length} />
            </div>

            {itineraryByDay.size > 0 && (
              <Section title="Itinerary">
                {[...itineraryByDay.entries()]
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, segments]) => (
                    <DayView key={date} date={date} segments={segments} />
                  ))}
              </Section>
            )}

            <Section title="Upcoming Trips">
              {upcoming.length === 0 ? (
                <div className="rounded-xl bg-surface-default p-8 text-center">
                  <p className="mb-4 text-text-muted">No upcoming trips. Start planning!</p>
                  <Button asChild>
                    <Link href={ROUTES.SEARCH}>Search trips</Link>
                  </Button>
                </div>
              ) : (
                upcoming.map((trip) => <TripCard key={trip.id} trip={trip} />)
              )}
            </Section>

            {past.length > 0 && (
              <Section title="Past Trips">
                {past.map((trip) => (
                  <TripCard key={trip.id} trip={trip} faded />
                ))}
              </Section>
            )}
          </>
        </StateBoundary>
      </div>
    </div>
  );
}

function tripToSegment(trip: Trip): TripSegment {
  const date = trip.departureDate ?? trip.createdAt;
  return {
    id: trip.id,
    type: "FLIGHT",
    time: new Date(date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    description: trip.title,
    loyaltyPoints: Math.round(trip.price.amount * 10),
    loyaltyIllustrative: false,
    programName: "Bonvoy",
  };
}

function groupTripsByDay(trips: Trip[]): Map<string, TripSegment[]> {
  const byDay = new Map<string, TripSegment[]>();
  for (const trip of trips) {
    const dateKey = (trip.departureDate ?? trip.createdAt).slice(0, 10);
    const segments = byDay.get(dateKey) ?? [];
    segments.push(tripToSegment(trip));
    byDay.set(dateKey, segments);
  }
  return byDay;
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 text-center shadow-sm ${
        highlight ? "bg-brand-primary text-text-inverse" : "bg-surface-default text-text-primary"
      }`}
    >
      <p className="text-3xl font-bold">{value}</p>
      <p className={`mt-1 text-sm ${highlight ? "opacity-80" : "text-text-muted"}`}>{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-text-primary">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function TripCard({ trip, faded = false }: { trip: Trip; faded?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl bg-surface-default p-4 shadow-sm ${
        faded ? "opacity-60" : ""
      }`}
    >
      <div>
        <p className="font-medium text-text-primary">{trip.title}</p>
        <p className="text-sm text-text-muted">{trip.departureDate ?? "—"}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-brand-primary">
          {trip.price.currency} {trip.price.amount.toFixed(2)}
        </p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            trip.status === "CONFIRMED"
              ? "bg-success-light text-success"
              : "bg-surface-muted text-text-muted"
          }`}
        >
          {trip.status}
        </span>
      </div>
    </div>
  );
}
