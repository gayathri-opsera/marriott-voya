"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Input, Card, CardContent, CardHeader } from "@travel/design-system";
import { apiGet, apiPatch } from "../../../lib/api/client";
import { useToast } from "../../../components/ui/Toast";
import { StateBoundary } from "../../../components/patterns/StateBoundary";

interface UserPreferences {
  preferredCabinClass: string;
  preferredAirlines: string;
  mealPreference: string;
  seatPreference: string;
  accessibilityNeeds: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  preferredCabinClass: "economy",
  preferredAirlines: "",
  mealPreference: "standard",
  seatPreference: "aisle",
  accessibilityNeeds: "",
};

export default function PreferencesPage(): React.JSX.Element {
  const { addToast } = useToast();
  const [prefs, setPrefs] = React.useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    apiGet<UserPreferences>("/api/v1/users/preferences")
      .then(setPrefs)
      .catch((err) => setError(err instanceof Error ? err : new Error("Failed to load preferences")))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPatch("/api/v1/users/preferences", prefs);
      addToast({ title: "Preferences saved", variant: "success" });
    } catch {
      addToast({ title: "Failed to save preferences", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const screenState = loading ? "loading" : error ? "error" : "idle";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/profile" className="text-sm text-brand-primary hover:underline">
        ← Back to Profile
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold text-text-primary">Travel Preferences</h1>

      <StateBoundary state={screenState} error={error}>
        <form onSubmit={(e) => void handleSave(e)} className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-text-primary">Flight preferences</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="cabin-class" className="text-sm font-medium text-text-primary">
                  Preferred cabin class
                </label>
                <select
                  id="cabin-class"
                  value={prefs.preferredCabinClass}
                  onChange={(e) => setPrefs({ ...prefs, preferredCabinClass: e.target.value })}
                  className="mt-1 h-10 w-full rounded-md border border-border-default bg-surface-default px-3 text-sm"
                >
                  <option value="economy">Economy</option>
                  <option value="premium_economy">Premium Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First</option>
                </select>
              </div>

              <Input
                label="Preferred airlines"
                id="preferred-airlines"
                value={prefs.preferredAirlines}
                onChange={(e) => setPrefs({ ...prefs, preferredAirlines: e.target.value })}
                placeholder="e.g. Delta, United"
              />

              <div>
                <label htmlFor="meal-preference" className="text-sm font-medium text-text-primary">
                  Meal preference
                </label>
                <select
                  id="meal-preference"
                  value={prefs.mealPreference}
                  onChange={(e) => setPrefs({ ...prefs, mealPreference: e.target.value })}
                  className="mt-1 h-10 w-full rounded-md border border-border-default bg-surface-default px-3 text-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="kosher">Kosher</option>
                  <option value="halal">Halal</option>
                </select>
              </div>

              <div>
                <label htmlFor="seat-preference" className="text-sm font-medium text-text-primary">
                  Seat preference
                </label>
                <select
                  id="seat-preference"
                  value={prefs.seatPreference}
                  onChange={(e) => setPrefs({ ...prefs, seatPreference: e.target.value })}
                  className="mt-1 h-10 w-full rounded-md border border-border-default bg-surface-default px-3 text-sm"
                >
                  <option value="aisle">Aisle</option>
                  <option value="window">Window</option>
                  <option value="middle">Middle</option>
                </select>
              </div>

              <Input
                label="Accessibility needs"
                id="accessibility-needs"
                value={prefs.accessibilityNeeds}
                onChange={(e) => setPrefs({ ...prefs, accessibilityNeeds: e.target.value })}
                placeholder="Wheelchair, assistance, etc."
              />
            </CardContent>
          </Card>

          <Button type="submit" loading={saving}>
            Save preferences
          </Button>
        </form>
      </StateBoundary>
    </div>
  );
}
