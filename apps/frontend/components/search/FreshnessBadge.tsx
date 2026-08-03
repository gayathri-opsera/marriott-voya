"use client";

/**
 * FreshnessBadge — WOREF-020
 * Shows when search results were last fetched and if they are stale.
 * Provides a "Refresh" button when results are stale.
 */

import React, { useEffect, useState } from "react";

type FreshnessLabel = "FRESH" | "STALE" | "EXPIRED" | "LIVE";

interface FreshnessBadgeProps {
  fetchedAt: string;
  expiresAt?: string;
  label?: FreshnessLabel;
  onRefresh?: () => void;
}

function getAge(fetchedAt: string): string {
  const ageMs = Date.now() - new Date(fetchedAt).getTime();
  if (ageMs < 60_000) return "Just now";
  if (ageMs < 3600_000) return `${Math.floor(ageMs / 60_000)}m ago`;
  return `${Math.floor(ageMs / 3600_000)}h ago`;
}

const BADGE_STYLES: Record<FreshnessLabel, { bg: string; text: string; label: string }> = {
  LIVE:    { bg: "#22c55e15", text: "#15803d", label: "⚡ Live" },
  FRESH:   { bg: "#22c55e15", text: "#15803d", label: "✓ Fresh" },
  STALE:   { bg: "#f59e0b15", text: "#92400e", label: "⚠ Stale" },
  EXPIRED: { bg: "#ef444415", text: "#b91c1c", label: "⏱ Expired" },
};

export function FreshnessBadge({ fetchedAt, expiresAt, label = "FRESH", onRefresh }: FreshnessBadgeProps): React.JSX.Element {
  const [age, setAge] = useState(getAge(fetchedAt));

  useEffect(() => {
    const id = setInterval(() => setAge(getAge(fetchedAt)), 30_000);
    return () => clearInterval(id);
  }, [fetchedAt]);

  const style = BADGE_STYLES[label];
  const isStale = label === "STALE" || label === "EXPIRED";

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className="px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ background: style.bg, color: style.text }}
      >
        {style.label} · {age}
      </span>
      {isStale && onRefresh && (
        <button
          onClick={onRefresh}
          className="text-xs underline"
          style={{ color: "var(--voya-accent)" }}
        >
          Refresh
        </button>
      )}
      {expiresAt && label === "FRESH" && (
        <span className="text-xs" style={{ color: "var(--voya-text-3)" }}>
          · prices valid for {Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 60_000))}m
        </span>
      )}
    </div>
  );
}
