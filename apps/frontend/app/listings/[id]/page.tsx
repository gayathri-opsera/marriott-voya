"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { UnifiedOffer } from "@travel/contracts/search";
import { StateBoundary } from "../../../components/patterns/StateBoundary";
import { ExpiryCountdown } from "../../../components/results/ExpiryCountdown";
import { AvailabilityCalendar } from "../../../components/search/AvailabilityCalendar";
import { apiGet, apiPost } from "../../../lib/api/client";
import { ApiError } from "../../../lib/api/errors";
import { canProceedToCheckout } from "../../../lib/domain/checkout";
import { formatMoney } from "../../../lib/money";
import { trackEvent, JOURNEY_EVENTS } from "../../../lib/analytics";
import { CompleteTripPanel } from "../../../components/property/CompleteTripPanel";

// ─── Mock villa photos (Unsplash, remote-pattern-allowed) ────────────────────

const VILLA_PHOTOS = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85&fit=crop",
  "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=1200&q=85&fit=crop",
  "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1200&q=85&fit=crop",
  "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200&q=85&fit=crop",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=85&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85&fit=crop",
];

const MOCK_AMENITIES = [
  { icon: "🏊", label: "Private pool" },
  { icon: "🌿", label: "Garden" },
  { icon: "🍳", label: "Full kitchen" },
  { icon: "🚗", label: "Free parking" },
  { icon: "📶", label: "Fast Wi-Fi" },
  { icon: "🛁", label: "Luxury bathrooms" },
  { icon: "❄️", label: "Air conditioning" },
  { icon: "🔥", label: "Fireplace" },
  { icon: "🍷", label: "Wine cellar" },
  { icon: "🐾", label: "Pet-friendly" },
  { icon: "👶", label: "Kids' amenities" },
  { icon: "🧺", label: "Washer & dryer" },
];

const MOCK_REVIEWS = [
  { author: "Sarah C.", rating: 5, date: "August 2026", body: "Absolutely stunning villa. The pool views were breathtaking and the location couldn't be better for exploring Tuscany." },
  { author: "Marco B.", rating: 5, date: "July 2026", body: "Perfect for our family. The host was incredibly responsive and the property was exactly as described." },
  { author: "Emma T.", rating: 4, date: "June 2026", body: "Wonderful stay. Beautifully decorated and well-equipped kitchen. We cooked dinner every night with local produce." },
];

type Tab = "overview" | "amenities" | "location" | "reviews" | "policies";
const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "amenities", label: "Amenities" },
  { key: "location", label: "Location" },
  { key: "reviews", label: "Reviews" },
  { key: "policies", label: "Policies" },
];

// ─── Gallery lightbox ─────────────────────────────────────────────────────────

function Gallery({ photos }: { photos: string[] }) {
  const [lightboxIdx, setLightboxIdx] = React.useState<number | null>(null);

  function prev() { setLightboxIdx(i => (i === null ? 0 : (i - 1 + photos.length) % photos.length)); }
  function next() { setLightboxIdx(i => (i === null ? 0 : (i + 1) % photos.length)); }

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (lightboxIdx === null) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setLightboxIdx(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <>
      {/* Primary gallery grid */}
      <div className="grid grid-cols-4 grid-rows-2 gap-1.5 rounded-xl overflow-hidden h-[420px] md:h-[480px]">
        {/* Large first photo */}
        <button
          className="col-span-2 row-span-2 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-[var(--voya-gold)] rounded-l-xl"
          onClick={() => setLightboxIdx(0)}
          aria-label="View photo 1"
        >
          <Image src={photos[0] ?? VILLA_PHOTOS[0]} alt="Main villa view" fill sizes="50vw" className="object-cover hover:scale-105 transition-transform duration-500" />
        </button>
        {/* Smaller grid thumbnails */}
        {photos.slice(1, 5).map((src, i) => (
          <button
            key={i}
            className={`relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-[var(--voya-gold)] ${i === 1 ? "rounded-tr-xl" : i === 3 ? "rounded-br-xl" : ""}`}
            onClick={() => setLightboxIdx(i + 1)}
            aria-label={`View photo ${i + 2}`}
          >
            <Image src={src} alt={`Villa photo ${i + 2}`} fill sizes="25vw" className="object-cover hover:scale-105 transition-transform duration-500" />
          </button>
        ))}
        {/* Show all button overlay */}
        <button
          className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-white/20"
          style={{ background: "rgba(0,0,0,0.5)", borderColor: "rgba(255,255,255,0.3)", color: "#fff", position: "absolute" }}
          onClick={() => setLightboxIdx(0)}
          aria-label={`Show all ${photos.length} photos`}
        >
          <span>⊞</span> All {photos.length} photos
        </button>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)" }}
          onClick={() => setLightboxIdx(null)}
          role="dialog"
          aria-modal
          aria-label="Photo lightbox"
        >
          <div className="relative w-full max-w-4xl px-12" onClick={e => e.stopPropagation()}>
            <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden">
              <Image
                src={photos[lightboxIdx] ?? VILLA_PHOTOS[0]}
                alt={`Photo ${lightboxIdx + 1} of ${photos.length}`}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
            </div>
            <div className="mt-3 text-center text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              {lightboxIdx + 1} / {photos.length}
            </div>
          </div>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20" aria-label="Previous photo">‹</button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20" aria-label="Next photo">›</button>
          <button onClick={() => setLightboxIdx(null)} className="absolute top-4 right-4 text-white text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20" aria-label="Close">✕</button>
        </div>
      )}
    </>
  );
}

// ─── Star rating ──────────────────────────────────────────────────────────────

function Stars({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} out of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ color: i < value ? "var(--voya-gold)" : "var(--voya-fg-tertiary)", fontSize: 14 }}>★</span>
      ))}
    </span>
  );
}

// ─── Sticky booking widget ────────────────────────────────────────────────────

interface BookingWidgetProps {
  offer: UnifiedOffer;
  checkIn: string;
  checkOut: string;
  guests: number;
  onCheckInChange: (d: string) => void;
  onCheckOutChange: (d: string) => void;
  onGuestsChange: (n: number) => void;
  onReserve: () => void;
}

function BookingWidget({ offer, checkIn, checkOut, guests, onCheckInChange, onCheckOutChange, onGuestsChange, onReserve }: BookingWidgetProps) {
  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000))
    : 0;
  const nightly = Number(offer.price);
  const total = nights > 0 ? nightly * nights : nightly;
  const bonvoyPoints = Math.round(total * 10);

  return (
    <div
      className="sticky top-4 rounded-2xl border p-5 shadow-lg"
      style={{ background: "var(--voya-surface)", borderColor: "var(--voya-border)" }}
    >
      <div className="mb-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold" style={{ color: "var(--voya-fg-primary)" }}>
            {formatMoney(offer.price, offer.currency)}
          </span>
          <span className="text-sm" style={{ color: "var(--voya-fg-secondary)" }}>/ night</span>
        </div>
        {offer.rating && (
          <div className="flex items-center gap-1.5 mt-1">
            <Stars value={Math.round(offer.rating)} />
            <span className="text-xs" style={{ color: "var(--voya-fg-secondary)" }}>
              {offer.rating.toFixed(1)} ({offer.reviews ?? 0} reviews)
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--voya-fg-secondary)" }}>Check-in</span>
          <input
            type="date"
            value={checkIn}
            min={new Date().toISOString().split("T")[0]}
            onChange={e => onCheckInChange(e.target.value)}
            className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
            style={{ background: "var(--voya-surface-alt)", borderColor: "var(--voya-border)", color: "var(--voya-fg-primary)" }}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--voya-fg-secondary)" }}>Check-out</span>
          <input
            type="date"
            value={checkOut}
            min={checkIn || new Date().toISOString().split("T")[0]}
            onChange={e => onCheckOutChange(e.target.value)}
            className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
            style={{ background: "var(--voya-surface-alt)", borderColor: "var(--voya-border)", color: "var(--voya-fg-primary)" }}
          />
        </label>
      </div>

      <label className="block mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--voya-fg-secondary)" }}>Guests</span>
        <select
          value={guests}
          onChange={e => onGuestsChange(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
          style={{ background: "var(--voya-surface-alt)", borderColor: "var(--voya-border)", color: "var(--voya-fg-primary)" }}
        >
          {[1,2,3,4,5,6,7,8].map(n => (
            <option key={n} value={n}>{n} guest{n > 1 ? "s" : ""}</option>
          ))}
        </select>
      </label>

      {nights > 0 && (
        <div className="text-sm space-y-1 mb-3 pb-3 border-b" style={{ borderColor: "var(--voya-border)" }}>
          <div className="flex justify-between">
            <span style={{ color: "var(--voya-fg-secondary)" }}>{formatMoney(offer.price, offer.currency)} × {nights} nights</span>
            <span style={{ color: "var(--voya-fg-primary)" }}>{formatMoney(total, offer.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--voya-fg-secondary)" }}>Service fee</span>
            <span style={{ color: "var(--voya-fg-primary)" }}>{formatMoney(Math.round(total * 0.12), offer.currency)}</span>
          </div>
          <div className="flex justify-between font-semibold pt-1">
            <span style={{ color: "var(--voya-fg-primary)" }}>Total</span>
            <span style={{ color: "var(--voya-fg-primary)" }}>{formatMoney(Math.round(total * 1.12), offer.currency)}</span>
          </div>
        </div>
      )}

      <div
        className="flex items-center gap-2 mb-3 text-xs px-3 py-2 rounded-lg"
        style={{ background: "color-mix(in srgb, var(--voya-gold) 12%, transparent)", color: "var(--voya-gold)" }}
      >
        <span>⭐</span>
        <span>Earn <strong>{bonvoyPoints.toLocaleString()}</strong> Marriott Bonvoy Points</span>
      </div>

      <button
        type="button"
        onClick={onReserve}
        className="w-full rounded-xl py-3 text-base font-semibold transition-all active:scale-95"
        style={{ background: "var(--voya-cta-bg)", color: "var(--voya-cta-fg)" }}
        aria-label="Reserve this property"
      >
        Reserve
      </button>

      <p className="mt-2 text-center text-xs" style={{ color: "var(--voya-fg-tertiary)" }}>
        You won't be charged yet
      </p>

      <p className="mt-1 text-center text-xs underline cursor-pointer" style={{ color: "var(--voya-fg-secondary)" }}>
        Free cancellation within 48 hours
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ListingDetailPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const offerId = params.id as string;

  const [offer, setOffer] = React.useState<UnifiedOffer | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [activeTab, setActiveTab] = React.useState<Tab>("overview");
  const [checkIn, setCheckIn] = React.useState("");
  const [checkOut, setCheckOut] = React.useState("");
  const [guests, setGuests] = React.useState(2);
  const [saved, setSaved] = React.useState(false);
  const [minStayMsg, setMinStayMsg] = React.useState<string | null>(null);

  const loadOffer = React.useCallback(() => {
    setLoading(true);
    setError(null);
    apiGet<UnifiedOffer>(`/offers/${offerId}`)
      .then(o => {
        setOffer(o);
        trackEvent(JOURNEY_EVENTS.OFFER_PRESENTED, { offerId: o.id, price: o.price, currency: o.currency });
      })
      .catch(err => {
        if (err instanceof ApiError && err.status === 404) {
          setError(new Error("This listing is no longer available."));
        } else {
          setError(new Error("Failed to load listing. Please try again."));
        }
      })
      .finally(() => setLoading(false));
  }, [offerId]);

  React.useEffect(() => { loadOffer(); }, [loadOffer]);

  function handleReserve() {
    if (!offer) return;
    const params = new URLSearchParams({ offerId: offer.id });
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("guests", String(guests));
    router.push(`/checkout?${params}`);
  }

  const screenState = loading ? "loading" : error ? "error" : offer ? "idle" : "empty";
  const photos = VILLA_PHOTOS;

  return (
    <div className="min-h-screen pb-16" style={{ background: "var(--voya-bg)" }}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <StateBoundary state={screenState} error={error} onRetry={loadOffer}>
          {offer && (
            <>
              {/* Back link */}
              <Link
                href="/search"
                className="inline-flex items-center gap-1.5 text-sm mb-4 hover:underline"
                style={{ color: "var(--voya-fg-secondary)" }}
              >
                ‹ Back to results
              </Link>

              {/* Title row */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold" style={{ color: "var(--voya-fg-primary)" }}>
                    {offer.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    {offer.rating && (
                      <div className="flex items-center gap-1">
                        <Stars value={Math.round(offer.rating)} />
                        <span className="text-sm font-medium" style={{ color: "var(--voya-fg-primary)" }}>
                          {offer.rating.toFixed(1)}
                        </span>
                        <span className="text-sm" style={{ color: "var(--voya-fg-secondary)" }}>
                          ({offer.reviews ?? 0} reviews)
                        </span>
                      </div>
                    )}
                    <ExpiryCountdown expiresAt={offer.expiresAt} className="text-sm text-warning" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSaved(s => !s)}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors"
                    style={{
                      borderColor: "var(--voya-border)",
                      background: saved ? "color-mix(in srgb, var(--voya-gold) 12%, transparent)" : "transparent",
                      color: saved ? "var(--voya-gold)" : "var(--voya-fg-secondary)",
                    }}
                    aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
                  >
                    <span>{saved ? "♥" : "♡"}</span> Save
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors hover:bg-white/5"
                    style={{ borderColor: "var(--voya-border)", color: "var(--voya-fg-secondary)" }}
                    onClick={() => { navigator.clipboard.writeText(window.location.href).catch(() => {}); }}
                    aria-label="Copy link"
                  >
                    ⤴ Share
                  </button>
                </div>
              </div>

              {/* Photo gallery */}
              <div className="relative mb-6">
                <Gallery photos={photos} />
              </div>

              {/* Main content + sidebar */}
              <div className="flex gap-8 items-start">
                {/* Left: tabs */}
                <div className="flex-1 min-w-0">
                  {/* Tabs */}
                  <div className="flex gap-0 border-b mb-5 overflow-x-auto" style={{ borderColor: "var(--voya-border)" }}>
                    {TABS.map(t => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setActiveTab(t.key)}
                        className="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors"
                        style={{
                          borderColor: activeTab === t.key ? "var(--voya-gold)" : "transparent",
                          color: activeTab === t.key ? "var(--voya-gold)" : "var(--voya-fg-secondary)",
                        }}
                        aria-selected={activeTab === t.key}
                        role="tab"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div role="tabpanel">
                    {activeTab === "overview" && (
                      <div className="space-y-5">
                        <div>
                          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--voya-fg-primary)" }}>About this property</h2>
                          <p className="text-sm leading-relaxed" style={{ color: "var(--voya-fg-secondary)" }}>
                            Experience the height of Tuscan luxury in this beautifully restored villa. Perched above rolling vineyards with panoramic views, this property offers the perfect blend of authentic Italian character and modern comfort. The private pool overlooks the Val d'Orcia valley, while the fully-equipped kitchen lets you prepare meals with locally-sourced ingredients.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { icon: "🛏", label: "4 bedrooms" },
                            { icon: "🚿", label: "3 bathrooms" },
                            { icon: "👥", label: "Up to 8 guests" },
                            { icon: "📐", label: "320 m²" },
                          ].map(i => (
                            <div key={i.label} className="flex flex-col items-center gap-1 rounded-xl p-3 text-center" style={{ background: "var(--voya-surface-alt)" }}>
                              <span className="text-xl">{i.icon}</span>
                              <span className="text-xs" style={{ color: "var(--voya-fg-secondary)" }}>{i.label}</span>
                            </div>
                          ))}
                        </div>
                        {/* Availability calendar */}
                        <div>
                          <h3 className="text-base font-semibold mb-3" style={{ color: "var(--voya-fg-primary)" }}>Availability</h3>
                          {minStayMsg && (
                            <p className="text-sm mb-2 text-amber-400">{minStayMsg}</p>
                          )}
                          <AvailabilityCalendar
                            checkIn={checkIn}
                            checkOut={checkOut}
                            onRangeSelect={(ci, co) => { setCheckIn(ci); setCheckOut(co); }}
                            onMinStayViolation={n => setMinStayMsg(`Minimum stay: ${n} nights`)}
                          />
                        </div>
                      </div>
                    )}

                    {activeTab === "amenities" && (
                      <div>
                        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--voya-fg-primary)" }}>What this place offers</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {MOCK_AMENITIES.map(a => (
                            <div key={a.label} className="flex items-center gap-3 text-sm" style={{ color: "var(--voya-fg-primary)" }}>
                              <span className="text-lg w-6 text-center flex-shrink-0">{a.icon}</span>
                              <span>{a.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === "location" && (
                      <div>
                        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--voya-fg-primary)" }}>Location</h2>
                        <div
                          className="rounded-xl overflow-hidden mb-4 flex items-center justify-center"
                          style={{ height: 280, background: "var(--voya-surface-alt)", border: "1px solid var(--voya-border)" }}
                          aria-label="Property location map placeholder"
                        >
                          <div className="text-center space-y-2" style={{ color: "var(--voya-fg-tertiary)" }}>
                            <div className="text-4xl">📍</div>
                            <p className="text-sm">Tuscany, Italy</p>
                            <p className="text-xs">Interactive map — Google Maps integration coming soon</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {[
                            { label: "Lucca historic center", distance: "8 km" },
                            { label: "Florence airport", distance: "85 km" },
                            { label: "Pisa airport", distance: "35 km" },
                            { label: "Val d'Orcia UNESCO site", distance: "45 km" },
                          ].map(item => (
                            <div key={item.label} className="flex items-center justify-between text-sm">
                              <span style={{ color: "var(--voya-fg-primary)" }}>{item.label}</span>
                              <span style={{ color: "var(--voya-fg-secondary)" }}>{item.distance}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === "reviews" && (
                      <div>
                        <div className="flex items-center gap-3 mb-5">
                          <div className="text-4xl font-bold" style={{ color: "var(--voya-fg-primary)" }}>
                            {offer.rating?.toFixed(1) ?? "4.9"}
                          </div>
                          <div>
                            <Stars value={Math.round(offer.rating ?? 5)} />
                            <p className="text-sm mt-0.5" style={{ color: "var(--voya-fg-secondary)" }}>
                              {offer.reviews ?? 3} guest reviews
                            </p>
                          </div>
                        </div>
                        <div className="space-y-5">
                          {MOCK_REVIEWS.map((r, i) => (
                            <div key={i} className="pb-5 border-b last:border-b-0" style={{ borderColor: "var(--voya-border)" }}>
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-medium text-sm" style={{ color: "var(--voya-fg-primary)" }}>{r.author}</p>
                                  <p className="text-xs" style={{ color: "var(--voya-fg-tertiary)" }}>{r.date}</p>
                                </div>
                                <Stars value={r.rating} />
                              </div>
                              <p className="text-sm" style={{ color: "var(--voya-fg-secondary)" }}>{r.body}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === "policies" && (
                      <div className="space-y-4 text-sm" style={{ color: "var(--voya-fg-secondary)" }}>
                        {[
                          { title: "Check-in / Check-out", body: "Check-in: 3:00 PM or later\nCheck-out: 11:00 AM or earlier\nSelf check-in with smart lock" },
                          { title: "Cancellation policy", body: "Free cancellation for 48 hours after booking.\nCancellations before 14 days of check-in receive a 50% refund.\nNo refund within 14 days of check-in." },
                          { title: "House rules", body: "No smoking indoors\nNo unregistered guests\nPets allowed with prior approval\nQuiet hours: 10 PM – 8 AM" },
                          { title: "Safety & property", body: "Carbon monoxide alarm installed\nSmoke alarm installed\nFirst aid kit available\nPool safety fence (child-safe)" },
                        ].map(p => (
                          <div key={p.title} className="rounded-xl p-4" style={{ background: "var(--voya-surface-alt)" }}>
                            <h3 className="font-semibold mb-1.5" style={{ color: "var(--voya-fg-primary)" }}>{p.title}</h3>
                            <p className="whitespace-pre-line">{p.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: sticky booking widget */}
                <div className="hidden lg:block w-80 flex-shrink-0">
                  <BookingWidget
                    offer={offer}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    guests={guests}
                    onCheckInChange={setCheckIn}
                    onCheckOutChange={setCheckOut}
                    onGuestsChange={setGuests}
                    onReserve={handleReserve}
                  />
                </div>
              </div>

              {/* Complete Your Trip AI suggestions */}
              <div className="mt-8">
                <CompleteTripPanel
                  destination={offer.title.split(",")[0] ?? "Tuscany"}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onAddToItinerary={s => {
                    trackEvent(JOURNEY_EVENTS.OFFER_CTA_CLICKED, { source: "complete-trip", suggestionId: s.id });
                  }}
                />
              </div>

              {/* Mobile booking CTA bar */}
              <div
                className="lg:hidden fixed bottom-0 left-0 right-0 border-t flex items-center justify-between px-4 py-3 z-30"
                style={{ background: "var(--voya-surface)", borderColor: "var(--voya-border)" }}
              >
                <div>
                  <span className="text-lg font-bold" style={{ color: "var(--voya-fg-primary)" }}>
                    {formatMoney(offer.price, offer.currency)}
                  </span>
                  <span className="text-sm ml-1" style={{ color: "var(--voya-fg-secondary)" }}>/ night</span>
                </div>
                <button
                  type="button"
                  onClick={handleReserve}
                  className="rounded-xl px-6 py-2.5 text-sm font-semibold"
                  style={{ background: "var(--voya-cta-bg)", color: "var(--voya-cta-fg)" }}
                >
                  Reserve
                </button>
              </div>
            </>
          )}
        </StateBoundary>
      </div>
    </div>
  );
}
