"use client";

import * as React from "react";

export interface SupplierStatus {
  name: string;
  status: "ok" | "partial" | "down";
}

export interface DegradedResultsBannerProps {
  supplierStatuses: SupplierStatus[];
}

export function DegradedResultsBanner({
  supplierStatuses,
}: DegradedResultsBannerProps): React.JSX.Element | null {
  const [dismissed, setDismissed] = React.useState(false);

  const degraded = supplierStatuses.filter(
    (s) => s.status === "partial" || s.status === "down",
  );

  if (degraded.length === 0 || dismissed) return null;

  const supplierNames = degraded.map((s) => s.name).join(", ");

  return (
    <div
      role="status"
      className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-warning bg-warning-light px-4 py-3 text-sm text-warning"
      data-testid="degraded-results-banner"
    >
      <p>
        Results from {supplierNames} are incomplete
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss degraded results notice"
        className="shrink-0 text-lg leading-none opacity-70 hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}
