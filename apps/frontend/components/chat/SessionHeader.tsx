"use client";

/**
 * SessionHeader — WOREF-013
 * Shows session context at the top of the AI chat: destination, dates, traveller count.
 * Provides session management (clear, new chat) actions.
 */

import React from "react";

export interface SessionContext {
  sessionId?: string;
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  travellerCount?: number;
  status?: "active" | "idle" | "expired";
  lastActivityAt?: string;
}

interface SessionHeaderProps {
  context: SessionContext;
  onNewSession?: () => void;
  onClearSession?: () => void;
}

export function SessionHeader({ context, onNewSession, onClearSession }: SessionHeaderProps): React.JSX.Element {
  const hasContext = context.destination || context.checkIn || context.travellerCount;
  const isExpired = context.status === "expired";

  return (
    <header
      className="flex items-center justify-between px-4 py-2"
      style={{ borderBottom: "1px solid var(--voya-border)", background: "var(--voya-surface-1)" }}
    >
      <div className="flex items-center gap-3">
        {/* Status dot */}
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: isExpired ? "#ef4444" : context.status === "idle" ? "#f59e0b" : "#22c55e",
          }}
          title={context.status ?? "active"}
          aria-label={`Session ${context.status ?? "active"}`}
        />

        {/* Session context summary */}
        {hasContext ? (
          <div className="flex items-center gap-2 flex-wrap">
            {context.destination && (
              <span className="text-xs font-medium" style={{ color: "var(--voya-text-1)" }}>
                📍 {context.destination}
              </span>
            )}
            {context.checkIn && context.checkOut && (
              <span className="text-xs" style={{ color: "var(--voya-text-3)" }}>
                {context.checkIn} → {context.checkOut}
              </span>
            )}
            {context.travellerCount && (
              <span className="text-xs" style={{ color: "var(--voya-text-3)" }}>
                👥 {context.travellerCount} traveller{context.travellerCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs" style={{ color: "var(--voya-text-3)" }}>
            AI Concierge
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onClearSession && (
          <button
            onClick={onClearSession}
            className="text-xs hover:opacity-70"
            style={{ color: "var(--voya-text-3)" }}
            title="Clear conversation"
          >
            Clear
          </button>
        )}
        {onNewSession && (
          <button
            onClick={onNewSession}
            className="px-2 py-1 rounded-lg text-xs font-medium"
            style={{ background: "var(--voya-surface-2)", color: "var(--voya-text-2)" }}
          >
            + New
          </button>
        )}
      </div>
    </header>
  );
}
