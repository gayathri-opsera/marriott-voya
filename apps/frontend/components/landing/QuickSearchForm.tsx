"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@travel/design-system";
import { setEntryCriteria, type TravelType } from "../../lib/entry-criteria";

export function QuickSearchForm(): React.JSX.Element {
  const router = useRouter();
  const [destination, setDestination] = React.useState("");
  const [date, setDate] = React.useState("");
  const [type, setType] = React.useState<TravelType>("flights");

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!destination.trim()) return;

    setEntryCriteria({
      destination: destination.trim(),
      type,
      date: date || undefined,
    });

    const params = new URLSearchParams({
      q: destination.trim(),
      type,
    });
    if (date) params.set("date", date);

    router.push(`/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-8 max-w-3xl rounded-xl border border-surface-muted bg-surface-default p-6 shadow-sm"
      aria-label="Quick search"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Destination"
          id="quick-search-destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Where to?"
          required
        />
        <Input
          label="Date"
          id="quick-search-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="quick-search-type" className="text-sm font-medium text-text-primary">
            Search type
          </label>
          <select
            id="quick-search-type"
            value={type}
            onChange={(e) => setType(e.target.value as TravelType)}
            className="h-10 w-full rounded-md border border-surface-muted bg-surface-default px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <option value="flights">Flights</option>
            <option value="hotels">Hotels</option>
            <option value="cars">Cars</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Search
          </Button>
        </div>
      </div>
    </form>
  );
}
