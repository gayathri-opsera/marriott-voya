"use client";

/**
 * CheckoutStepper — WOREF-011
 * Multi-step checkout orchestrator: Review → Traveller Details → Payment → Confirmation.
 * Integrates PriceChangeBanner, LoyaltyAccrual, and guardOffer.
 */

import React, { useState } from "react";
import { PriceChangeBanner, PriceChangeInfo } from "./PriceChangeBanner.js";
import { LoyaltyAccrual } from "./LoyaltyAccrual.js";
import { guardOffer, GuardableOffer } from "../../lib/offer-guard.js";

export type CheckoutStep = "review" | "traveller" | "payment" | "confirmation";

const STEP_ORDER: CheckoutStep[] = ["review", "traveller", "payment", "confirmation"];
const STEP_LABELS: Record<CheckoutStep, string> = {
  review: "Review",
  traveller: "Traveller Details",
  payment: "Payment",
  confirmation: "Confirmation",
};

interface CheckoutStepperProps {
  offer: GuardableOffer & {
    propertyName?: string;
    checkIn?: string;
    checkOut?: string;
    nightlyRate?: number;
    currency?: string;
    previousPrice?: number;
    bonvoyPoints?: number;
  };
}

export function CheckoutStepper({ offer }: CheckoutStepperProps): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("review");
  const [priceAcknowledged, setPriceAcknowledged] = useState(!offer.previousPrice);
  const [traveller, setTraveller] = useState({ name: "", email: "", phone: "" });

  const guard = guardOffer(offer);
  const stepIdx = STEP_ORDER.indexOf(currentStep);

  const priceChange: PriceChangeInfo | null =
    offer.previousPrice && offer.nightlyRate && offer.previousPrice !== offer.nightlyRate
      ? {
          previousPrice: offer.previousPrice,
          currentPrice: offer.nightlyRate,
          currency: offer.currency ?? "USD",
          direction: offer.nightlyRate > offer.previousPrice ? "increase" : "decrease",
        }
      : null;

  const canProceedFromReview = guard.canProceed && priceAcknowledged;

  if (!guard.canProceed) {
    return (
      <div className="rounded-xl p-6 text-center" style={{ background: "var(--voya-surface-1)", border: "1px solid var(--voya-border)" }}>
        <p className="text-lg">🔒</p>
        <p className="font-semibold text-sm mt-2" style={{ color: "var(--voya-text-1)" }}>
          {guard.reason ?? "This offer is no longer available"}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--voya-text-3)" }}>
          Please search again to find available properties.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Step indicators */}
      <div className="flex items-center gap-1 mb-6">
        {STEP_ORDER.filter((s) => s !== "confirmation").map((step, idx) => (
          <React.Fragment key={step}>
            <div
              className="flex items-center gap-1.5"
              style={{ color: stepIdx >= idx ? "var(--voya-accent)" : "var(--voya-text-3)" }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: stepIdx > idx ? "var(--voya-accent)" : stepIdx === idx ? "var(--voya-accent)30" : "var(--voya-surface-2)",
                  color: stepIdx > idx ? "#000" : stepIdx === idx ? "var(--voya-accent)" : "var(--voya-text-3)",
                }}
              >
                {stepIdx > idx ? "✓" : idx + 1}
              </div>
              <span className="text-xs font-medium hidden sm:inline">{STEP_LABELS[step]}</span>
            </div>
            {idx < 2 && <div className="flex-1 h-px" style={{ background: stepIdx > idx ? "var(--voya-accent)" : "var(--voya-border)" }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      {currentStep === "review" && (
        <div>
          <h2 className="font-semibold text-sm mb-3" style={{ color: "var(--voya-text-1)" }}>Review Your Booking</h2>
          <div className="rounded-xl p-4 mb-4" style={{ background: "var(--voya-surface-1)", border: "1px solid var(--voya-border)" }}>
            <p className="font-medium text-sm" style={{ color: "var(--voya-text-1)" }}>{offer.propertyName ?? "Selected Property"}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--voya-text-3)" }}>{offer.checkIn} → {offer.checkOut}</p>
            {offer.nightlyRate && (
              <p className="text-sm font-bold mt-1" style={{ color: "var(--voya-text-1)" }}>
                {offer.currency ?? "USD"} {offer.nightlyRate}/night
              </p>
            )}
          </div>

          {priceChange && !priceAcknowledged && (
            <PriceChangeBanner
              priceChange={priceChange}
              onAcknowledge={() => setPriceAcknowledged(true)}
            />
          )}

          {offer.bonvoyPoints && (
            <LoyaltyAccrual pointsForStay={offer.bonvoyPoints} />
          )}

          <button
            onClick={() => setCurrentStep("traveller")}
            disabled={!canProceedFromReview}
            className="mt-4 w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
            style={{ background: "var(--voya-accent)", color: "#000" }}
          >
            Continue to Traveller Details
          </button>
        </div>
      )}

      {currentStep === "traveller" && (
        <div>
          <h2 className="font-semibold text-sm mb-3" style={{ color: "var(--voya-text-1)" }}>Traveller Details</h2>
          <div className="space-y-3">
            {(["name", "email", "phone"] as const).map((field) => (
              <div key={field}>
                <label className="text-xs font-medium block mb-1 capitalize" style={{ color: "var(--voya-text-2)" }}>{field}</label>
                <input
                  type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                  value={traveller[field]}
                  onChange={(e) => setTraveller({ ...traveller, [field]: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{ background: "var(--voya-surface-2)", color: "var(--voya-text-1)", border: "1px solid var(--voya-border)" }}
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => setCurrentStep("payment")}
            disabled={!traveller.name || !traveller.email}
            className="mt-4 w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
            style={{ background: "var(--voya-accent)", color: "#000" }}
          >
            Continue to Payment
          </button>
        </div>
      )}

      {currentStep === "payment" && (
        <div>
          <h2 className="font-semibold text-sm mb-3" style={{ color: "var(--voya-text-1)" }}>Payment</h2>
          <div className="rounded-xl p-4 text-center" style={{ background: "var(--voya-surface-1)", border: "1px solid var(--voya-border)" }}>
            <p className="text-2xl mb-2">💳</p>
            <p className="text-sm font-medium" style={{ color: "var(--voya-text-2)" }}>
              Stripe payment form loads here
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--voya-text-3)" }}>
              PCI-DSS compliant · 3-D Secure authentication
            </p>
          </div>
          <button
            onClick={() => setCurrentStep("confirmation")}
            className="mt-4 w-full py-3 rounded-xl font-semibold text-sm"
            style={{ background: "var(--voya-accent)", color: "#000" }}
          >
            Confirm Booking
          </button>
        </div>
      )}

      {currentStep === "confirmation" && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-xl font-bold" style={{ color: "var(--voya-text-1)" }}>Booking Confirmed!</h2>
          <p className="text-sm mt-2" style={{ color: "var(--voya-text-2)" }}>
            {offer.propertyName ?? "Your property"} · {offer.checkIn} → {offer.checkOut}
          </p>
          {offer.bonvoyPoints && (
            <p className="text-sm mt-2" style={{ color: "var(--voya-amber)" }}>
              +{offer.bonvoyPoints.toLocaleString()} Bonvoy points will be credited after check-out
            </p>
          )}
        </div>
      )}
    </div>
  );
}
