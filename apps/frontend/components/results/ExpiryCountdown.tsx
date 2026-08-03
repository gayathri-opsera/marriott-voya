"use client";

import * as React from "react";

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

export interface ExpiryCountdownProps {
  expiresAt: string | null;
  className?: string;
}

export function ExpiryCountdown({
  expiresAt,
  className,
}: ExpiryCountdownProps): React.JSX.Element | null {
  const [remaining, setRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!expiresAt) {
      setRemaining(null);
      return;
    }

    const expiry = new Date(expiresAt).getTime();

    const tick = (): void => {
      const diff = expiry - Date.now();
      if (diff > THIRTY_MINUTES_MS) {
        setRemaining(null);
        return;
      }
      setRemaining(diff);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt || remaining === null) return null;

  if (remaining <= 0) {
    return (
      <p className={className} role="status" aria-live="polite">
        Expired
      </p>
    );
  }

  return (
    <p className={className} role="status" aria-live="polite">
      Expires in {formatRemaining(remaining)}
    </p>
  );
}
