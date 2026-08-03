"use client";

/**
 * SessionExpiryBanner — WOREF-045
 * Warns the user when their session is about to expire and offers to extend.
 * Shows at 5 minutes remaining; locks at 0 minutes.
 */

import React, { useEffect, useState, useCallback } from "react";

interface SessionExpiryBannerProps {
  /** ISO timestamp when session expires */
  expiresAt: string;
  /** Called when user clicks "Extend session" */
  onExtend?: () => Promise<void>;
  /** Called when session fully expires */
  onExpired?: () => void;
  /** Minutes before expiry to show the banner */
  warningThresholdMinutes?: number;
}

export function SessionExpiryBanner({
  expiresAt,
  onExtend,
  onExpired,
  warningThresholdMinutes = 5,
}: SessionExpiryBannerProps): React.JSX.Element | null {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [extending, setExtending] = useState(false);

  const calcSeconds = useCallback(() => {
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  }, [expiresAt]);

  useEffect(() => {
    setSecondsLeft(calcSeconds());
    const id = setInterval(() => {
      const secs = calcSeconds();
      setSecondsLeft(secs);
      if (secs === 0) {
        clearInterval(id);
        onExpired?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [calcSeconds, onExpired]);

  if (secondsLeft === null || secondsLeft > warningThresholdMinutes * 60) return null;

  const expired = secondsLeft === 0;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  const handleExtend = async () => {
    if (!onExtend) return;
    setExtending(true);
    try { await onExtend(); } finally { setExtending(false); }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-center justify-between px-4 py-2 text-sm"
      style={{ background: expired ? "#ef444420" : "#f59e0b20", borderBottom: `1px solid ${expired ? "#ef4444" : "#f59e0b"}40` }}
    >
      <span style={{ color: expired ? "#ef4444" : "#92400e" }}>
        {expired
          ? "⚠️ Your session has expired. Please refresh to continue."
          : `⏱ Session expires in ${mins}:${String(secs).padStart(2, "0")}`}
      </span>
      {!expired && onExtend && (
        <button
          onClick={handleExtend}
          disabled={extending}
          className="text-xs font-semibold ml-3 px-3 py-1 rounded-lg disabled:opacity-50"
          style={{ background: "#f59e0b", color: "#000" }}
        >
          {extending ? "Extending…" : "Extend session"}
        </button>
      )}
    </div>
  );
}
