"use client";

import * as React from "react";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Input } from "../ui/Input";

export interface TravellerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passportNumber: string;
}

export interface TravellerDetailsStepProps {
  onSubmit: (data: TravellerDetails) => void;
  onBack: () => void;
}

type FieldErrors = Partial<Record<keyof TravellerDetails, string>>;

function maskPassport(value: string): string {
  if (value.length <= 4) return value;
  return "•".repeat(value.length - 4) + value.slice(-4);
}

function validate(data: TravellerDetails): FieldErrors {
  const errors: FieldErrors = {};

  if (!data.firstName.trim()) errors.firstName = "First name is required";
  if (!data.lastName.trim()) errors.lastName = "Last name is required";
  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Enter a valid email address";
  }
  if (!data.phone.trim()) {
    errors.phone = "Phone is required";
  } else if (data.phone.trim().length < 7) {
    errors.phone = "Phone must be at least 7 characters";
  }
  if (!data.passportNumber.trim()) errors.passportNumber = "Passport number is required";

  return errors;
}

export function TravellerDetailsStep({ onSubmit, onBack }: TravellerDetailsStepProps) {
  const [form, setForm] = React.useState<TravellerDetails>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    passportNumber: "",
  });
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [passportFocused, setPassportFocused] = React.useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit(form);
  }

  function updateField<K extends keyof TravellerDetails>(field: K, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Traveller details</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              {...(errors.firstName ? { error: errors.firstName } : {})}
              required
            />
            <Input
              label="Last name"
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              {...(errors.lastName ? { error: errors.lastName } : {})}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            {...(errors.email ? { error: errors.email } : {})}
            required
          />
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            {...(errors.phone ? { error: errors.phone } : {})}
            required
          />
          <Input
            label="Passport number"
            value={passportFocused ? form.passportNumber : maskPassport(form.passportNumber)}
            onChange={(e) => updateField("passportNumber", e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())}
            onFocus={() => setPassportFocused(true)}
            onBlur={() => setPassportFocused(false)}
            {...(errors.passportNumber ? { error: errors.passportNumber } : {})}
            autoComplete="off"
            required
          />
          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={onBack}>
              Back
            </Button>
            <Button type="submit" className="flex-1">
              Continue to payment
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
