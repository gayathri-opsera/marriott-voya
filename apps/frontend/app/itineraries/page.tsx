"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import { apiGet, apiPost } from "../../lib/api/client";
import { formatMoney } from "../../lib/money";

// Types matching the assemble_itinerary tool output
interface ItineraryDay {
  day: string;
  morning: string;
  afternoon: string;
  evening: string;
  source: string;
}

interface ItineraryBudget {
  totalUSD: number;
  breakdown: Record<string, number>;
}

interface BonvoyPoints {
  [key: string]: number | string;
  TOTAL_CONFIRMED: number;
}

interface Itinerary {
  tripName: string;
  destination: string;
  travelers: number;
  checkIn: string;
  checkOut: string;
  itinerary: ItineraryDay[];
  accommodationSource: string;
  activitySource: string;
  budget: ItineraryBudget;
  bonvoyPointsSummary: BonvoyPoints;
  openItems: string[];
}

function SourceBadge({ source }: { source: string }) {
  const parts = source.split("+").map((s) => s.trim());
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {parts.map((p) => {
        const isHVMI = p.includes("HVMI");
        const isBonvoy = p.includes("Bonvoy");
        const isPublic = p.includes("PUBLIC");
        const variant = isHVMI ? "success" : isBonvoy ? "info" : isPublic ? "default" : "secondary";
        return (
          <Badge key={p} variant={variant as "success" | "info" | "default" | "secondary"} size="sm">
            {p}
          </Badge>
        );
      })}
    </div>
  );
}

function DayCard({ day, index }: { day: ItineraryDay; index: number }) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{day.day}</CardTitle>
          <span className="text-xs text-text-secondary bg-surface-secondary px-2 py-0.5 rounded-full">
            Day {index + 1}
          </span>
        </div>
        <SourceBadge source={day.source} />
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        {[
          { label: "🌅 Morning", text: day.morning },
          { label: "☀️ Afternoon", text: day.afternoon },
          { label: "🌙 Evening", text: day.evening },
        ].map(({ label, text }) => (
          <div key={label} className="space-y-1">
            <p className="font-medium text-xs text-text-secondary uppercase tracking-wide">{label}</p>
            <p className="text-text-primary leading-snug">{text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function ItineraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? "";
  const { addToast } = useToast();

  const [itinerary, setItinerary] = React.useState<Itinerary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [bookingAll, setBookingAll] = React.useState(false);
  const [booked, setBooked] = React.useState(false);

  // Demo itinerary for direct navigation without a session
  const DEMO: Itinerary = {
    tripName: "Lucca Villa Escape — Lucca, Tuscany",
    destination: "Lucca, Tuscany, Italy",
    travelers: 2,
    checkIn: "2026-09-10",
    checkOut: "2026-09-17",
    accommodationSource: "HVMI — Homes & Villas by Marriott Bonvoy (primary, not a fallback)",
    activitySource: "Marriott Bonvoy Tours & Activities (activities.marriott.com)",
    itinerary: [
      { day: "Day 1 — Wednesday Sep 10", morning: "Arrive Pisa (PSA) → shuttle/taxi to Villa della Torre Lucca (25 min)", afternoon: "Settle in, explore city walls on bicycles (4km loop) — free, open always", evening: "Dinner in villa kitchen or rooftop terrace with Chianti", source: "HVMI Villa + PUBLIC_LANDMARK" },
      { day: "Day 2 — Thursday Sep 11", morning: "Marriott Bonvoy Walking Tour: Historic Centre & City Walls (3h, $85pp)", afternoon: "Guinigi Tower climb ($5); Piazza dell'Anfiteatro coffee", evening: "Explore local markets near Piazza Napoleone", source: "Bonvoy Tours & Activities + PUBLIC_LANDMARKS" },
      { day: "Day 3 — Friday Sep 12", morning: "Marriott Bonvoy Tuscan Wine Tour: Chianti Vineyards & Cellar Visits (full day, $145pp)", afternoon: "3 vineyard visits, cellar tastings, estate lunch included", evening: "Return to villa; relaxed evening by pool", source: "Bonvoy Tours & Activities" },
      { day: "Day 4 — Saturday Sep 13", morning: "Marriott Bonvoy Day Trip: Florence & Chianti (full day, $120pp)", afternoon: "Florence Duomo, Uffizi exterior, Ponte Vecchio + Chianti wine region", evening: "Late return to Lucca", source: "Bonvoy Tours & Activities" },
      { day: "Day 5 — Sunday Sep 14", morning: "Marriott Bonvoy Day Trip: Cinque Terre Coastal Villages (full day, $135pp)", afternoon: "Coach + boat through 5 coastal villages (Vernazza, Monterosso, Manarola)", evening: "Late return; last evening at villa pool", source: "Bonvoy Tours & Activities" },
      { day: "Day 6 — Monday Sep 15", morning: "Self-guided audio tour of Duomo di San Martino + Orto Botanico ($4)", afternoon: "Free time: local market, souvenir shopping", evening: "Final villa dinner with remaining Chianti", source: "PUBLIC_LANDMARKS" },
      { day: "Day 7 — Tuesday Sep 16", morning: "Check out of Villa della Torre; shuttle to Pisa airport (25 min)", afternoon: "Depart Pisa (PSA) → home", evening: "In transit", source: "Flights + Local Transport" },
    ],
    budget: {
      totalUSD: 10147,
      breakdown: {
        "Villa della Torre — 7 nights × $485 × 2 guests": 6790,
        "Flights — round-trip, 2 passengers": 2400,
        "Bonvoy Tours & Activities × 2 guests": 806,
        "Local transport (shuttle + car rental)": 151,
      },
    },
    bonvoyPointsSummary: {
      "Walking Tour (2 pax × 850pts)": 1700,
      "Wine Tour (2 pax × 1450pts)": 2900,
      "Florence Day Trip (2 pax × 1200pts)": 2400,
      "Cinque Terre Day Trip (2 pax × 1350pts)": 2700,
      "Audio Tour (2 pax × 180pts)": 360,
      "HVMI Villa": "Confirm current HVMI loyalty terms at booking",
      "Flights": "0 (flights carry no Bonvoy constraint)",
      TOTAL_CONFIRMED: 10060,
    },
    openItems: [
      "On-property dining gap: HVMI villas have no restaurant. Nearest Marriott dining: Grand Universe Lucca (Autograph Collection) — 1.2km from villa",
      "HVMI Bonvoy points: confirm current terms at booking — may differ from hotel stays",
    ],
  };

  React.useEffect(() => {
    if (!sessionId) {
      setItinerary(DEMO);
      setLoading(false);
      return;
    }
    apiGet<Itinerary>(`/api/v1/ai/sessions/${sessionId}/itinerary`)
      .then(setItinerary)
      .catch(() => {
        setItinerary(DEMO);
        addToast({ title: "Using demo itinerary", variant: "warning" });
      })
      .finally(() => setLoading(false));
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleBookAll() {
    if (!itinerary) return;
    setBookingAll(true);
    try {
      await apiPost("/api/v1/bookings", {
        bookingType: "FLIGHT",
        offerId: `itinerary-${Date.now()}`,
        passengers: [{ firstName: "Guest", lastName: "Traveller", dateOfBirth: "1985-01-01", passportNumber: "XX000000" }],
        contactEmail: "guest@example.com",
        contactPhone: "+1-555-0100",
        currency: "USD",
        idempotencyKey: `it-${Date.now()}`,
      });
      setBooked(true);
      addToast({ title: "Itinerary booked! Confirmation numbers sent.", variant: "success" });
    } catch {
      addToast({ title: "Booking failed — please try again", variant: "error" });
    } finally {
      setBookingAll(false);
    }
  }

  if (loading) {
    return (
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        {[1,2,3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
      </main>
    );
  }

  if (!itinerary) return null;

  const confirmedPoints = itinerary.bonvoyPointsSummary.TOTAL_CONFIRMED as number;

  return (
    <main id="main-content" className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-brand-primary uppercase tracking-wider mb-1">Marriott Voya · AI Itinerary</p>
          <h1 className="text-3xl font-bold text-text-primary">{itinerary.tripName}</h1>
          <p className="text-text-secondary mt-1">
            {itinerary.travelers} travellers · {itinerary.checkIn} → {itinerary.checkOut} · {itinerary.itinerary.length} nights
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => router.push("/assistant")}>
            Modify with AI
          </Button>
          {booked ? (
            <Button variant="primary" size="sm" onClick={() => router.push("/dashboard")}>View My Trips</Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleBookAll} disabled={bookingAll}>
              {bookingAll ? "Booking…" : "Book Everything"}
            </Button>
          )}
        </div>
      </div>

      {/* Source disclosure */}
      <Card className="mb-6 border-brand-primary/20 bg-brand-primary/5">
        <CardContent className="py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div><span className="font-medium">🏡 Accommodation:</span> <span className="text-text-secondary">{itinerary.accommodationSource}</span></div>
            <div><span className="font-medium">🎯 Activities:</span> <span className="text-text-secondary">{itinerary.activitySource}</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Day-by-day itinerary */}
      <h2 className="text-xl font-semibold text-text-primary mb-4">Day-by-Day Itinerary</h2>
      {itinerary.itinerary.map((day, i) => (
        <DayCard key={i} day={day} index={i} />
      ))}

      {/* Budget & Bonvoy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader><CardTitle>Budget Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(itinerary.budget.breakdown).map(([label, amount]) => (
              <div key={label} className="flex justify-between">
                <span className="text-text-secondary">{label}</span>
                <span className="font-medium">{formatMoney(amount, "USD")}</span>
              </div>
            ))}
            <div className="border-t border-border-primary pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-brand-primary">{formatMoney(itinerary.budget.totalUSD, "USD")}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bonvoy Points Estimate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(itinerary.bonvoyPointsSummary)
              .filter(([k]) => k !== "TOTAL_CONFIRMED")
              .map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-text-secondary">{label}</span>
                  <span className={typeof value === "number" && value > 0 ? "font-medium text-status-success" : "text-text-tertiary text-xs"}>
                    {typeof value === "number" ? `${value.toLocaleString()} pts` : value}
                  </span>
                </div>
              ))}
            <div className="border-t border-border-primary pt-2 flex justify-between font-bold">
              <span>Confirmed Total</span>
              <span className="text-status-success">{confirmedPoints.toLocaleString()} pts</span>
            </div>
            <p className="text-text-tertiary text-xs mt-1">≈ {formatMoney(confirmedPoints * 0.008, "USD")} cash value at standard rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Open items */}
      {itinerary.openItems.length > 0 && (
        <Card className="mt-6 border-status-warning/40 bg-status-warning/5">
          <CardHeader><CardTitle className="text-sm text-status-warning">⚠️ Open Items to Confirm Before Booking</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {itinerary.openItems.map((item, i) => (
              <p key={i} className="text-sm text-text-secondary">• {item}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <div className="mt-8 flex gap-3 justify-end">
        <Link href="/assistant"><Button variant="outline">Ask AI to Modify</Button></Link>
        <Link href="/search?types=hotel&q=Lucca"><Button variant="outline">Browse More Properties</Button></Link>
        {!booked && <Button variant="primary" onClick={handleBookAll} disabled={bookingAll}>{bookingAll ? "Booking…" : "Confirm & Book All"}</Button>}
        {booked && <Button variant="primary" onClick={() => router.push("/dashboard")}>View Booked Trips →</Button>}
      </div>
    </main>
  );
}
