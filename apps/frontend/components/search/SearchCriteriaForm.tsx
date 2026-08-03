"use client";

import * as React from "react";
import { Button, Input } from "@travel/design-system";
import type { TravelType } from "../../lib/entry-criteria";

export interface SearchCriteria {
  destination: string;
  type: TravelType;
  departureDate: string;
  returnDate?: string;
  passengers: number;
}

export interface SearchCriteriaFormProps {
  initialValues?: Partial<SearchCriteria>;
  onSubmit: (criteria: SearchCriteria) => void;
  loading?: boolean;
}

interface FieldErrors {
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: string;
}

function validate(criteria: SearchCriteria): FieldErrors {
  const errors: FieldErrors = {};

  const destination = criteria.destination.trim();
  if (criteria.type === "flights") {
    if (destination.length !== 3) {
      errors.destination = "Enter a valid 3-letter airport code";
    } else if (!/^[A-Za-z]{3}$/.test(destination)) {
      errors.destination = "Airport code must contain only letters";
    }
  } else if (destination.length < 2) {
    errors.destination = "Destination must be at least 2 characters";
  } else if (destination.length > 200) {
    errors.destination = "Destination must not exceed 200 characters";
  }

  if (!criteria.departureDate) {
    errors.departureDate = "Departure date is required";
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const departure = new Date(`${criteria.departureDate}T00:00:00`);
    if (departure < today) {
      errors.departureDate = "Departure date must be in the future";
    }
  }

  if (criteria.returnDate && criteria.departureDate) {
    const departure = new Date(`${criteria.departureDate}T00:00:00`);
    const returnDate = new Date(`${criteria.returnDate}T00:00:00`);
    if (returnDate <= departure) {
      errors.returnDate =
        criteria.type === "hotels"
          ? "Check-out date must be strictly after the check-in date"
          : "Return date must be on or after the departure date";
    }
  }

  if (!Number.isInteger(criteria.passengers) || criteria.passengers < 1) {
    errors.passengers = "At least 1 passenger is required";
  } else if (criteria.type === "flights" && criteria.passengers > 9) {
    errors.passengers = "Maximum 9 passengers allowed";
  } else if (criteria.type === "hotels" && criteria.passengers > 20) {
    errors.passengers = "Maximum 20 guests allowed";
  }

  return errors;
}

export function SearchCriteriaForm({
  initialValues,
  onSubmit,
  loading = false,
}: SearchCriteriaFormProps): React.JSX.Element {
  const [destination, setDestination] = React.useState(initialValues?.destination ?? "");
  const [type, setType] = React.useState<TravelType>(initialValues?.type ?? "flights");
  const [departureDate, setDepartureDate] = React.useState(initialValues?.departureDate ?? "");
  const [returnDate, setReturnDate] = React.useState(initialValues?.returnDate ?? "");
  const [passengers, setPassengers] = React.useState(initialValues?.passengers ?? 1);
  const [errors, setErrors] = React.useState<FieldErrors>({});

  React.useEffect(() => {
    if (initialValues) {
      if (initialValues.destination) setDestination(initialValues.destination);
      if (initialValues.type) setType(initialValues.type);
      if (initialValues.departureDate) setDepartureDate(initialValues.departureDate);
      if (initialValues.returnDate) setReturnDate(initialValues.returnDate);
      if (initialValues.passengers) setPassengers(initialValues.passengers);
    }
  }, [initialValues]);

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    const criteria: SearchCriteria = {
      destination,
      type,
      departureDate,
      returnDate: returnDate || undefined,
      passengers,
    };
    const nextErrors = validate(criteria);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(criteria);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Search criteria">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Destination"
          id="search-destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder={type === "flights" ? "e.g. JFK" : "City or location"}
          error={errors.destination}
          aria-required
          aria-invalid={errors.destination ? true : undefined}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="search-type" className="text-sm font-medium text-text-primary">
            Travel type
          </label>
          <select
            id="search-type"
            value={type}
            onChange={(e) => setType(e.target.value as TravelType)}
            className="h-10 w-full rounded-md border border-surface-muted bg-surface-default px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-required
          >
            <option value="flights">Flights</option>
            <option value="hotels">Hotels</option>
            <option value="cars">Cars</option>
          </select>
        </div>

        <Input
          label="Departure date"
          id="search-departure-date"
          type="date"
          value={departureDate}
          onChange={(e) => setDepartureDate(e.target.value)}
          error={errors.departureDate}
          aria-required
          aria-invalid={errors.departureDate ? true : undefined}
          required
        />

        <Input
          label={type === "hotels" ? "Check-out date (optional)" : "Return date (optional)"}
          id="search-return-date"
          type="date"
          value={returnDate}
          onChange={(e) => setReturnDate(e.target.value)}
          error={errors.returnDate}
          aria-invalid={errors.returnDate ? true : undefined}
        />

        <Input
          label={type === "hotels" ? "Guests" : "Passengers"}
          id="search-passengers"
          type="number"
          min={1}
          value={passengers}
          onChange={(e) => setPassengers(Number(e.target.value))}
          error={errors.passengers}
          aria-required
          aria-invalid={errors.passengers ? true : undefined}
          required
        />
      </div>

      <Button type="submit" loading={loading}>
        Search
      </Button>
    </form>
  );
}
