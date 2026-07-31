"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@travel/design-system";
import { trackEvent } from "../../lib/analytics";
import { ROUTES } from "../../lib/routes";
import { QuickSearchForm } from "./QuickSearchForm";

export function LandingPageContent(): React.JSX.Element {
  React.useEffect(() => {
    trackEvent("LANDING_VIEWED", {});
  }, []);

  const handleEntryClick = (destination: "search" | "assistant"): void => {
    trackEvent("ENTRY_CARD_CLICKED", { destination });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <section className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">
          Marriott Voya
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
          Your journey, intelligently planned
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
          Search flights, hotels, and cars — or let our AI assistant craft the perfect trip for you.
        </p>
      </section>

      <QuickSearchForm />

      <section className="mt-12 grid gap-6 sm:grid-cols-2">
        <Link
          href={ROUTES.SEARCH}
          onClick={() => handleEntryClick("search")}
          className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Card className="h-full transition-shadow group-hover:shadow-md">
            <CardHeader>
              <h2 className="text-xl font-semibold text-text-primary">
                Search Flights, Hotels &amp; Cars
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                Compare real-time offers from trusted providers and book with confidence.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link
          href={ROUTES.ASSISTANT}
          onClick={() => handleEntryClick("assistant")}
          className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Card className="h-full transition-shadow group-hover:shadow-md">
            <CardHeader>
              <h2 className="text-xl font-semibold text-text-primary">
                Chat with AI Assistant
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                Describe your dream trip and let Voya find the best options for you.
              </p>
            </CardContent>
          </Card>
        </Link>
      </section>
    </div>
  );
}
