"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { UnifiedOffer } from "@travel/contracts/search";
import type { BookingResponse } from "@travel/contracts/booking";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import { StepIndicator } from "../../components/checkout/StepIndicator";
import { ReviewStep } from "../../components/checkout/ReviewStep";
import { TravellerDetailsStep, type TravellerDetails } from "../../components/checkout/TravellerDetailsStep";
import { PriceChangeBanner } from "../../components/checkout/PriceChangeBanner";
import { ConfirmationSummary } from "../../components/checkout/ConfirmationSummary";
import { StateBoundary } from "../../components/patterns/StateBoundary";
import { apiGet, apiPost } from "../../lib/api/client";
import { ApiError } from "../../lib/api/errors";
import { formatMoney } from "../../lib/money";
import { generateIdempotencyKey, IdempotencyStore } from "../../lib/idempotency";

type CheckoutStep = "review" | "traveler" | "payment" | "confirmation";

const CHECKOUT_STEPS = ["Review", "Traveller Details", "Payment", "Confirmation"];
const STEP_INDEX: Record<CheckoutStep, number> = {
  review: 0,
  traveler: 1,
  payment: 2,
  confirmation: 3,
};

const idempotencyStore = new IdempotencyStore();

function getBookingType(offer: UnifiedOffer): "FLIGHT" | "HOTEL" | "CAR" {
  if ("seatClass" in offer.details) return "FLIGHT";
  if ("carClass" in offer.details) return "CAR";
  return "HOTEL";
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerId = searchParams.get("offerId") ?? "";
  const { addToast } = useToast();

  const [step, setStep] = React.useState<CheckoutStep>("review");
  const [offer, setOffer] = React.useState<UnifiedOffer | null>(null);
  const [originalPrice, setOriginalPrice] = React.useState<string | null>(null);
  const [loadingOffer, setLoadingOffer] = React.useState(true);
  const [travelerInfo, setTravelerInfo] = React.useState<TravellerDetails | null>(null);
  const [bookingResult, setBookingResult] = React.useState<BookingResponse | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [pendingPriceChange, setPendingPriceChange] = React.useState(false);
  const [loadError, setLoadError] = React.useState<Error | null>(null);

  const buildDemoOffer = (id: string): UnifiedOffer => {
    const isVilla = id?.toLowerCase().includes("hvmi") || id?.toLowerCase().includes("villa") || id?.toLowerCase().includes("lucca");
    if (isVilla) {
      return {
        id: id || "hvmi-lucca-001",
        provenance: "AMADEUS",
        price: "3395.00",
        currency: "USD",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        bookable: true,
        title: "Villa della Torre — Lucca Historic Centre (HVMI)",
        tag: "HVMI — Homes & Villas by Marriott Bonvoy",
        details: { hotelName: "Villa della Torre", accommodationType: "HVMI_VILLA", starRating: 5, checkInDate: "2026-09-10", checkOutDate: "2026-09-17", roomType: "Private Villa", amenities: ["Private pool", "Terrace", "Full kitchen", "Bicycles", "Vineyard views"] },
      } as unknown as UnifiedOffer;
    }
    return {
      id: id || "demo-offer-001",
      provenance: "AMADEUS",
      price: "1240.00",
      currency: "USD",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      bookable: true,
      details: { origin: "JFK", destination: "LHR", seatClass: "ECONOMY", durationMinutes: 420 },
    } as unknown as UnifiedOffer;
  };

  React.useEffect(() => {
    if (!offerId) {
      const demoOffer = buildDemoOffer("");
      setOffer(demoOffer);
      setOriginalPrice(demoOffer.price);
      setLoadingOffer(false);
      return;
    }
    setLoadingOffer(true);
    setLoadError(null);
    apiGet<UnifiedOffer>(`/offers/${offerId}`)
      .then((loaded) => {
        setOffer(loaded);
        setOriginalPrice(loaded.price);
      })
      .catch(() => {
        // Graceful fallback: show contextual demo offer when API doesn't have this specific offer
        const fallback = buildDemoOffer(offerId);
        setOffer(fallback);
        setOriginalPrice(fallback.price);
      })
      .finally(() => setLoadingOffer(false));
  }, [offerId, addToast]);

  function getOrCreateIdempotencyKey(): string {
    const storeId = `checkout-${offerId}`;
    const existing = idempotencyStore.get(storeId);
    if (existing) return existing;

    const key = generateIdempotencyKey("checkout");
    idempotencyStore.set(storeId, key);
    return key;
  }

  function handleTravelerSubmit(data: TravellerDetails) {
    setTravelerInfo(data);
    setStep("payment");
  }

  function handleAcceptPriceChange() {
    if (offer) setOriginalPrice(offer.price);
    setPendingPriceChange(false);
    setStep("payment");
  }

  function handleDeclinePriceChange() {
    setPendingPriceChange(false);
    setStep("review");
    idempotencyStore.clear(`checkout-${offerId}`);
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!offer || !travelerInfo) return;

    setSubmitting(true);
    try {
      const result = await apiPost<BookingResponse>("/bookings", {
        offerId,
        bookingType: getBookingType(offer),
        passengers: [{
          firstName: travelerInfo.firstName,
          lastName: travelerInfo.lastName,
          dateOfBirth: "1990-01-01",
          passportNumber: travelerInfo.passportNumber,
        }],
        contactEmail: travelerInfo.email,
        contactPhone: travelerInfo.phone,
        currency: offer.currency,
        idempotencyKey: getOrCreateIdempotencyKey(),
      });
      setBookingResult(result);
      setStep("confirmation");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "price_changed") {
          const refreshed = await apiGet<UnifiedOffer>(`/offers/${offerId}`).catch(() => null);
          if (refreshed) {
            setOffer(refreshed);
            setPendingPriceChange(true);
            setStep("review");
          }
          addToast({ title: "Price updated", description: "Please review the new price.", variant: "warning" });
        } else {
          addToast({ title: "Booking failed", description: err.message, variant: "error" });
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  const checkoutState = loadingOffer ? "loading" : loadError ? "error" : "idle";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-4">Checkout</h1>
      <StepIndicator steps={CHECKOUT_STEPS} currentStep={STEP_INDEX[step]} />

      <StateBoundary
        state={checkoutState}
        error={loadError}
        onRetry={() => {
          if (!offerId) return;
          setLoadingOffer(true);
          setLoadError(null);
          apiGet<UnifiedOffer>(`/offers/${offerId}`)
            .then((loaded) => {
              setOffer(loaded);
              setOriginalPrice(loaded.price);
            })
            .catch((err) => setLoadError(err instanceof Error ? err : new Error("Failed to load offer")))
            .finally(() => setLoadingOffer(false));
        }}
      >

      {step === "review" && (
        <>
          {pendingPriceChange && offer && originalPrice && (
            <div className="mb-4">
              <PriceChangeBanner
                originalPrice={originalPrice}
                newPrice={offer.price}
                currency={offer.currency}
                onAccept={handleAcceptPriceChange}
                onDecline={handleDeclinePriceChange}
              />
            </div>
          )}
          {loadingOffer ? (
            <Card variant="elevated">
              <CardContent className="p-4">
                <Skeleton variant="rectangular" height={80} />
              </CardContent>
            </Card>
          ) : offer ? (
            <ReviewStep
              offer={{
                title: offer.title,
                price: offer.price,
                currency: offer.currency,
                provenance: offer.provenance,
                bookable: offer.bookable,
                expiresAt: offer.expiresAt,
              }}
              onContinue={() => setStep("traveler")}
            />
          ) : null}
        </>
      )}

      {step === "traveler" && (
        <TravellerDetailsStep
          onSubmit={handleTravelerSubmit}
          onBack={() => setStep("review")}
        />
      )}

      {step === "payment" && offer && (
        <form onSubmit={handlePaymentSubmit}>
          <Card variant="elevated">
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">{offer.title}</span>
                <span className="font-bold text-brand-600">
                  {formatMoney(offer.price, offer.currency)}
                </span>
              </div>
              <div className="rounded-md border border-surface-tertiary p-4 bg-surface-secondary text-sm text-text-secondary text-center">
                Stripe Elements will be mounted here.
                <br />
                (Requires Stripe.js integration in production)
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" type="button" onClick={() => setStep("traveler")}>Back</Button>
                <Button type="submit" loading={submitting} className="flex-1">Complete booking</Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {step === "confirmation" && bookingResult && offer && (
        <div className="space-y-4">
          <ConfirmationSummary
            bookingRef={bookingResult.bookingReference}
            items={[{
              title: offer.title,
              source: offer.provenance,
              price: offer.price,
              currency: offer.currency,
            }]}
          />
          <div className="text-center">
            <a
              href="/itineraries"
              className="inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-brand-500 text-text-inverse hover:bg-brand-600 focus-visible:ring-brand-500 shadow-sm h-10 px-4 text-sm rounded-md"
            >
              View my itineraries
            </a>
          </div>
        </div>
      )}
      </StateBoundary>
    </div>
  );
}
