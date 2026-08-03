"use client";

/**
 * ToolCallIndicator — WOREF-004
 * Shows real-time tool call activity during AI streaming.
 * Renders inline in the message bubble when the assistant is calling a tool.
 */

import React from "react";

export type ToolCallStatus = "pending" | "running" | "complete" | "error";

export interface ToolCallActivity {
  toolName: string;
  status: ToolCallStatus;
  label?: string;
  durationMs?: number;
}

const TOOL_ICONS: Record<string, string> = {
  search_hvmi_villas:          "🏡",
  search_hotels:               "🏨",
  search_flights:              "✈️",
  search_local_transport:      "🚗",
  search_bonvoy_tours:         "🎭",
  get_weather_forecast:        "🌤",
  get_travel_advisory:         "🛡",
  calculate_bonvoy_points:     "⭐",
  validate_destination:        "📍",
  assemble_itinerary:          "📋",
  search_bonvoy_tours_activities: "🎭",
};

const STATUS_CONFIG: Record<ToolCallStatus, { color: string; label: string; animate: boolean }> = {
  pending:  { color: "var(--voya-text-3)", label: "Queued",   animate: false },
  running:  { color: "var(--voya-accent)", label: "Running…", animate: true },
  complete: { color: "var(--voya-success, #059669)", label: "Done",   animate: false },
  error:    { color: "#ef4444",           label: "Error",    animate: false },
};

interface ToolCallIndicatorProps {
  calls: ToolCallActivity[];
}

export function ToolCallIndicator({ calls }: ToolCallIndicatorProps): React.JSX.Element | null {
  if (calls.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 my-1.5" role="status" aria-label="AI tool activity">
      {calls.map((call, idx) => {
        const icon = TOOL_ICONS[call.toolName] ?? "🔧";
        const conf = STATUS_CONFIG[call.status];
        const friendlyName = call.label ?? call.toolName.replace(/_/g, " ");

        return (
          <div
            key={`${call.toolName}-${idx}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: "var(--voya-surface-2)", border: `1px solid ${conf.color}30` }}
          >
            <span>{icon}</span>
            <span className="flex-1 capitalize" style={{ color: "var(--voya-text-2)" }}>
              {friendlyName}
            </span>
            <span
              className={conf.animate ? "animate-pulse" : ""}
              style={{ color: conf.color, fontWeight: 500 }}
            >
              {call.status === "complete" && call.durationMs
                ? `${call.durationMs}ms`
                : conf.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Convenience: build a single ToolCallActivity from a partial update */
export function makeToolCall(
  toolName: string,
  status: ToolCallStatus = "running",
  opts?: { label?: string; durationMs?: number },
): ToolCallActivity {
  return { toolName, status, ...opts };
}
