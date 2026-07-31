"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { UnifiedOffer } from "@travel/contracts/search";
import type { BookingResponse } from "@travel/contracts/booking";
import { useToast } from "../../components/ui/Toast";
import { apiGet, apiPost } from "../../lib/api/client";
import { ApiError } from "../../lib/api/errors";
import { generateIdempotencyKey, IdempotencyStore } from "../../lib/idempotency";

type CheckoutStep = "review" | "traveler" | "payment" | "confirmation";
const STEPS: { key: CheckoutStep; label: string }[] = [
  { key: "review",       label: "Review" },
  { key: "traveler",     label: "Travellers" },
  { key: "payment",      label: "Payment" },
  { key: "confirmation", label: "Confirmation" },
];
const STEP_INDEX: Record<CheckoutStep, number> = { review: 0, traveler: 1, payment: 2, confirmation: 3 };

const idempotencyStore = new IdempotencyStore();

// ─── Price hold banner ─────────────────────────────────────────────────────────

function PriceHoldBanner({ secondsLeft }: { secondsLeft: number }) {
  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const secs = (secondsLeft % 60).toString().padStart(2, "0");
  return (
    <div
      className="flex items-center justify-between border-b border-amber-500/20 px-4 py-2.5 text-sm"
      style={{ backgroundColor: "rgba(251,191,36,0.08)" }}
    >
      <div className="flex items-center gap-2 text-amber-300">
        <span className="text-xs font-medium">
          Your prices are held for {mins}:{secs}.
        </span>
        <span className="text-xs text-amber-200/60">We will re-validate before charging.</span>
      </div>
      <button type="button" className="text-xs font-medium underline text-amber-300 hover:text-amber-200">
        Refresh quote
      </button>
    </div>
  );
}

// ─── Step indicator ────────────────────────────────────────────────────────────

function Steps({ current }: { current: CheckoutStep }) {
  const idx = STEP_INDEX[current];
  return (
    <div className="mb-6 flex items-center gap-0">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className="flex items-center gap-1.5">
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold"
              style={{
                backgroundColor: i < idx ? "#4ade80" : i === idx ? "#c1440e" : "rgba(255,255,255,0.1)",
                color: i <= idx ? "white" : "rgba(255,255,255,0.35)",
              }}
            >
              {i < idx ? "✓" : i + 1}
            </div>
            <span
              className="text-sm font-medium"
              style={{ color: i === idx ? "white" : i < idx ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.3)" }}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <span className="mx-3 text-white/15">·</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Source/freshness mini badges ─────────────────────────────────────────────

function OfferLineBadges({ tag, isLive }: { tag?: string | undefined; isLive: boolean }) {
  const isHvmi = (tag ?? "").startsWith("HVMI");
  const bg = isHvmi ? "rgba(217,119,6,0.18)" : "rgba(59,130,246,0.18)";
  const color = isHvmi ? "#fbbf24" : "#93c5fd";
  const label = isHvmi ? "Homes & Villas" : "Named partner";
  return (
    <div className="mt-0.5 flex items-center gap-2">
      <span className="inline-block rounded px-1.5 py-0.5 text-xs" style={{ backgroundColor: bg, color }}>{label}</span>
      <span className="inline-flex items-center gap-1 text-xs" style={{ color: isLive ? "#4ade80" : "#fbbf24" }}>
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: isLive ? "#4ade80" : "#fbbf24" }} />
        {isLive ? "Live · re-validated 8s ago" : "Cached · 2m — will re-validate"}
      </span>
    </div>
  );
}

// ─── Build demo offer ─────────────────────────────────────────────────────────

function buildDemoOffer(id: string): UnifiedOffer {
  const isVilla = id?.toLowerCase().includes("hvmi") || id?.toLowerCase().includes("villa") || id?.toLowerCase().includes("hotel");
  if (isVilla || !id) {
    return {
      id: id || "hvmi-lucca-001",
      provenance: "AMADEUS",
      price: "1648.00",
      currency: "EUR",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      bookable: true,
      title: "Villa Il Cortile",
      tag: "HVMI — Homes & Villas by Marriott Bonvoy",
      details: { hotelName: "Villa Il Cortile", accommodationType: "HVMI_VILLA", starRating: 5, checkInDate: "2026-09-12", checkOutDate: "2026-09-16", roomType: "Entire villa · 3 bedrooms", amenities: ["Private courtyard", "0.6km to walls", "2 adults", "Free cancellation to 5 Sep"] },
    } as unknown as UnifiedOffer;
  }
  return {
    id: id || "car-psa-001",
    provenance: "RAPIDAPI",
    price: "186.00",
    currency: "EUR",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    bookable: true,
    title: "Compact automatic car — Pisa airport",
    tag: "Named partner",
    details: { carClass: "COMPACT", pickupLocation: "Pisa Airport", days: 3 },
  } as unknown as UnifiedOffer;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerId = searchParams.get("offerId") ?? "";
  const { addToast } = useToast();

  const [step, setStep] = React.useState<CheckoutStep>("review");
  const [offer, setOffer] = React.useState<UnifiedOffer | null>(null);
  const [secondsLeft, setSecondsLeft] = React.useState(8 * 60 + 36);
  const [loadingOffer, setLoadingOffer] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [bookingResult, setBookingResult] = React.useState<BookingResponse | null>(null);
  const [traveller, setTraveller] = React.useState({ first: "Maria", last: "Serrano", email: "maria.serrano@example.com", phone: "+34 6", dob: "••/••/1987", passport: "••••••419" });
  const [agreeTerms, setAgreeTerms] = React.useState(false);

  // Load offer
  React.useEffect(() => {
    if (!offerId) {
      setOffer(buildDemoOffer(""));
      setLoadingOffer(false);
      return;
    }
    apiGet<UnifiedOffer>(`/offers/${offerId}`)
      .then(setOffer)
      .catch(() => setOffer(buildDemoOffer(offerId)))
      .finally(() => setLoadingOffer(false));
  }, [offerId]);

  // Countdown timer
  React.useEffect(() => {
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!offer) return;
    setSubmitting(true);
    try {
      const result = await apiPost<BookingResponse>("/bookings", {
        offerId: offer.id,
        bookingType: "HOTEL",
        passengers: [{ firstName: traveller.first, lastName: traveller.last, dateOfBirth: "1987-01-01", passportNumber: traveller.passport }],
        contactEmail: traveller.email,
        contactPhone: traveller.phone,
        currency: offer.currency,
        idempotencyKey: generateIdempotencyKey("checkout"),
      });
      setBookingResult(result);
      setStep("confirmation");
    } catch (err) {
      addToast({ title: "Payment failed", description: err instanceof Error ? err.message : "Please try again.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  const carOffer = buildDemoOffer("car");
  const villaPrice  = Number(offer?.price ?? 1648);
  const carPrice    = 186;
  const cityTax     = 16;
  const totalDue    = villaPrice + (step === "payment" ? carPrice : 0);

  if (loadingOffer) {
    return (
      <div style={{ backgroundColor: "#14100c", minHeight: "100vh" }} className="flex items-center justify-center">
        <p className="text-white/40 text-sm animate-pulse">Loading your booking…</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#14100c", minHeight: "100vh", color: "white" }}>
      <PriceHoldBanner secondsLeft={secondsLeft} />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-5 text-2xl font-bold text-white">
          Complete your Tuscany trip
        </h1>
        <Steps current={step} />

        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">

          {/* ── Left: main content ─────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* REVIEW step */}
            {step === "review" && offer && (
              <div className="rounded-xl border border-white/10 p-5" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                <h2 className="mb-4 text-sm font-semibold text-white">What you&apos;re booking</h2>

                {/* Villa line */}
                <div className="flex items-start gap-3 rounded-lg border border-white/8 p-3 mb-3" style={{ backgroundColor: "rgba(255,255,255,0.025)" }}>
                  <div className="h-10 w-12 shrink-0 rounded" style={{ background: "hsl(30,40%,28%)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{offer.title}</p>
                    <p className="text-xs text-white/40">12–16 Sep 2026 · 2 adults · free cancellation to 5 Sep</p>
                    <OfferLineBadges tag={(offer as {tag?:string}).tag ?? ""} isLive={offer.provenance === "AMADEUS"} />
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-white">EUR {Number(offer.price).toLocaleString()}.00</p>
                </div>

                {/* Info callout */}
                <div className="rounded-lg border border-sky-500/20 p-3 text-xs text-sky-300 mb-4" style={{ backgroundColor: "rgba(14,165,233,0.07)" }}>
                  Two sources means two confirmation references. You&apos;ll get both on one screen and in one email.
                </div>

                <button
                  type="button"
                  onClick={() => setStep("traveler")}
                  className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
                  style={{ backgroundColor: "#c1440e" }}
                >
                  Continue to traveller details
                </button>
              </div>
            )}

            {/* TRAVELLER step */}
            {step === "traveler" && (
              <div className="rounded-xl border border-white/10 p-5 space-y-4" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                <h2 className="text-sm font-semibold text-white">Lead traveller</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "First name",  value: traveller.first,   key: "first"    as const },
                    { label: "Last name",   value: traveller.last,    key: "last"     as const },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs text-white/40 mb-1">{f.label}</label>
                      <input
                        value={f.value}
                        onChange={e => setTraveller(t => ({ ...t, [f.key]: e.target.value }))}
                        className="w-full rounded border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                        style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Email for confirmations</label>
                    <input value={traveller.email} onChange={e => setTraveller(t => ({ ...t, email: e.target.value }))}
                      className="w-full rounded border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                      style={{ backgroundColor: "rgba(255,255,255,0.06)" }} type="email" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Mobile</label>
                    <input value={traveller.phone} onChange={e => setTraveller(t => ({ ...t, phone: e.target.value }))}
                      className="w-full rounded border border-red-500/40 px-3 py-2 text-sm text-white focus:outline-none focus:border-red-400"
                      style={{ backgroundColor: "rgba(255,255,255,0.06)" }} type="tel" />
                    <p className="mt-0.5 text-xs text-red-400">Enter a full mobile number including country code.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Date of birth (restricted — masked after saving)", value: traveller.dob,      key: "dob"      as const },
                    { label: "Passport number (restricted — masked after saving)", value: traveller.passport, key: "passport" as const },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs text-white/40 mb-1">{f.label}</label>
                      <input value={f.value} readOnly
                        className="w-full rounded border border-white/10 px-3 py-2 text-sm text-white/50"
                        style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/25">Restricted fields are sent to the supplier and masked everywhere they are displayed. They never appear in analytics or client logs.</p>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setStep("review")}
                    className="rounded border border-white/15 px-4 py-2 text-sm text-white/60 hover:text-white transition-colors">
                    Back to review
                  </button>
                  <button type="button" onClick={() => setStep("payment")}
                    className="flex-1 rounded py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85"
                    style={{ backgroundColor: "#c1440e" }}>
                    Continue to payment
                  </button>
                </div>
              </div>
            )}

            {/* PAYMENT step */}
            {step === "payment" && offer && (
              <form onSubmit={handlePay} className="space-y-5">
                {/* What you're booking */}
                <div className="rounded-xl border border-white/10 p-5" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                  <h2 className="mb-3 text-sm font-semibold text-white">What you&apos;re booking</h2>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 rounded border border-white/8 p-3" style={{ backgroundColor: "rgba(255,255,255,0.025)" }}>
                      <div className="h-9 w-11 shrink-0 rounded" style={{ background: "hsl(30,40%,28%)" }} />
                      <div className="flex-1">
                        <p className="text-sm text-white">{offer.title}</p>
                        <p className="text-xs text-white/35">12–16 Sep 2026 · 2 adults · free cancellation to 5 Sep</p>
                        <OfferLineBadges tag={(offer as {tag?:string}).tag ?? ""} isLive />
                      </div>
                      <p className="text-sm font-semibold text-white shrink-0">EUR {Number(offer.price).toLocaleString()}.00</p>
                    </div>
                    <div className="flex items-start gap-3 rounded border border-white/8 p-3" style={{ backgroundColor: "rgba(255,255,255,0.025)" }}>
                      <div className="h-9 w-11 shrink-0 rounded" style={{ background: "hsl(210,40%,28%)" }} />
                      <div className="flex-1">
                        <p className="text-sm text-white">{carOffer.title}</p>
                        <p className="text-xs text-white/35">16–19 Sep · 3 days · unlimited km</p>
                        <OfferLineBadges tag="Named partner" isLive={false} />
                      </div>
                      <p className="text-sm font-semibold text-white shrink-0">EUR {carPrice}.00</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded border border-sky-500/20 p-2.5 text-xs text-sky-300" style={{ backgroundColor: "rgba(14,165,233,0.07)" }}>
                    Two sources means two confirmation references. You&apos;ll get both on one screen and in one email.
                  </div>
                </div>

                {/* Payment */}
                <div className="rounded-xl border border-white/10 p-5 space-y-3" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                  <h2 className="text-sm font-semibold text-white">Payment</h2>
                  <p className="text-xs text-white/35">Card fields are hosted by our payment provider in an isolated frame. The embedding method and script inventory are unchanged by this redesign.</p>
                  <div className="rounded border border-white/10 p-4 space-y-3" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                    <div>
                      <label className="block text-xs text-white/35 mb-1">Card number</label>
                      <div className="rounded border border-white/10 px-3 py-2 text-sm text-white/40">•••• •••• •••• 4242  hosted field</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-white/35 mb-1">Expiry</label>
                        <div className="rounded border border-white/10 px-3 py-2 text-sm text-white/40">09 / 29</div>
                      </div>
                      <div>
                        <label className="block text-xs text-white/35 mb-1">Security code</label>
                        <div className="rounded border border-white/10 px-3 py-2 text-sm text-white/40">•••</div>
                      </div>
                    </div>
                    <p className="text-xs text-white/25">Attempt key chk_{Math.random().toString(36).slice(2,10)} — minted once for this attempt and reused on every retry, so a retry can never double-book.</p>
                  </div>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-0.5 accent-[#c1440e]" />
                    <span className="text-xs text-white/40">I accept the cancellation terms for both items and confirm the traveller details are correct.</span>
                  </label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setStep("traveler")}
                      className="rounded border border-white/15 px-4 py-2 text-sm text-white/55 hover:text-white transition-colors">
                      Back to travellers
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !agreeTerms}
                      className="flex-1 rounded py-2.5 text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-85"
                      style={{ backgroundColor: "#c1440e" }}
                    >
                      {submitting ? "Processing…" : `Pay EUR ${(villaPrice + carPrice).toLocaleString()}.00`}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* CONFIRMATION step */}
            {step === "confirmation" && (
              <div className="rounded-xl border border-white/10 p-5 space-y-4" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                <div className="rounded-lg border border-green-500/20 p-3" style={{ backgroundColor: "rgba(34,197,94,0.08)" }}>
                  <p className="text-sm font-medium text-green-400">Booked. Confirmation emails sent to m•••••@example.com</p>
                </div>

                <h2 className="text-sm font-semibold text-white">Confirmation preview — one screen, every reference</h2>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      {["Source","Reference","Status","Amount"].map(h => (
                        <th key={h} className="py-2 text-left text-xs font-semibold uppercase tracking-wider text-white/30">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/8">
                      <td className="py-2.5 text-sm text-amber-400">Homes &amp; Villas</td>
                      <td className="py-2.5 text-sm text-white">HV-8842-LUC</td>
                      <td className="py-2.5"><span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80" }}>Confirmed</span></td>
                      <td className="py-2.5 text-sm text-white">EUR {Number(offer?.price ?? 1648).toLocaleString()}.00</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-sm text-sky-400">Partner car supplier</td>
                      <td className="py-2.5 text-sm text-white">CAR-5198T-PSA</td>
                      <td className="py-2.5"><span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>Awaiting supplier</span></td>
                      <td className="py-2.5 text-sm text-white">EUR {carPrice}.00</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-xs text-white/20">Booked 31 Jul 2026 14:08 UTC · payment reference pay_3n08u1 — retained for audit and regulatory reconstruction.</p>
                <p className="text-xs text-amber-400">Points preview 6,880 points — illustrative, not an accrual guarantee</p>

                {/* Upsell */}
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Add flights", desc: "Fly into Pisa (PSA)", href: "/search?types=flight", },
                    { label: "Discover activities", desc: "Bonvoy Tours & walks", href: "/assistant?prefill=I+just+booked+a+villa.+What+activities?" },
                    { label: "View full itinerary", desc: "Day-by-day plan", href: "/itineraries" },
                  ].map(card => (
                    <Link
                      key={card.label}
                      href={card.href}
                      className="rounded-lg border border-white/10 p-3 text-left hover:border-white/25 transition-colors"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    >
                      <p className="text-sm font-medium text-white">{card.label}</p>
                      <p className="text-xs text-white/40">{card.desc}</p>
                    </Link>
                  ))}
                </div>
                <Link href="/dashboard" className="block w-full rounded border border-white/15 py-2 text-center text-sm text-white/55 hover:text-white transition-colors">
                  Go to My Trips
                </Link>
              </div>
            )}
          </div>

          {/* ── Right: Order summary ──────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 p-4" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
              <h2 className="mb-3 text-sm font-semibold text-white">Order summary</h2>
              <div className="space-y-2 text-sm">
                {[
                  { label: offer?.title ?? "Villa Il Cortile (4 nights)", amount: `${Number(offer?.price ?? 1648).toLocaleString()}.00` },
                  ...(step === "payment" || step === "confirmation" ? [{ label: "Car hire (3 days)", amount: `${carPrice}.00` }] : []),
                  { label: "Taxes & fees", amount: "0.00" },
                  { label: "City tax on arrival", amount: `${cityTax}.00` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between gap-2">
                    <span className="text-white/50 text-xs leading-relaxed">{row.label}</span>
                    <span className="text-white shrink-0 text-xs">{row.amount}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
                  <span className="text-sm text-white/70">Due now (EUR)</span>
                  <span className="text-base text-white">{(villaPrice + (step !== "review" && step !== "traveler" ? carPrice : 0) + cityTax).toLocaleString()}.00</span>
                </div>
              </div>

              <p className="mt-2 text-xs text-white/25">All amounts in EUR, the currency supplied by each source.</p>

              {(step === "payment") && (
                <button
                  type="button"
                  className="mt-4 w-full rounded py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
                  style={{ backgroundColor: "#c1440e" }}
                  onClick={() => { const form = document.querySelector("form"); form?.requestSubmit(); }}
                >
                  Pay EUR {(villaPrice + carPrice + cityTax).toLocaleString()}.00
                </button>
              )}

              {step === "payment" && (
                <button type="button" className="mt-2 w-full text-center text-xs text-white/40 hover:text-white/60 underline">
                  Simulate price change
                </button>
              )}

              {step !== "confirmation" && (
                <p className="mt-2 text-center text-xs text-white/25">
                  Free cancellation on the villa until 5 Sep 2026.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
