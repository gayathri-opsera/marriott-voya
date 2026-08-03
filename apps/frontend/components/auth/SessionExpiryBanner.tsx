"use client";

import * as React from "react";
import { getSession, refreshSession, isAuthenticated } from "../../lib/session";
import { Button } from "@travel/design-system";

const WARNING_THRESHOLD_MS = 5 * 60 * 1000;
const POLL_INTERVAL_MS = 30_000;

export function SessionExpiryBanner(): React.JSX.Element | null {
  const [minutesLeft, setMinutesLeft] = React.useState<number | null>(null);
  const [dismissed, setDismissed] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const checkExpiry = React.useCallback(async () => {
    if (!isAuthenticated()) {
      setMinutesLeft(null);
      return;
    }
    const session = await getSession();
    if (!session.expiresAt) {
      setMinutesLeft(null);
      return;
    }
    const msLeft = session.expiresAt - Date.now();
    if (msLeft <= WARNING_THRESHOLD_MS && msLeft > 0) {
      setMinutesLeft(Math.ceil(msLeft / 60_000));
    } else {
      setMinutesLeft(null);
      setDismissed(false);
    }
  }, []);

  React.useEffect(() => {
    void checkExpiry();
    const id = setInterval(() => void checkExpiry(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [checkExpiry]);

  async function handleRefresh() {
    setRefreshing(true);
    const ok = await refreshSession();
    setRefreshing(false);
    if (ok) {
      setDismissed(true);
      setMinutesLeft(null);
    }
  }

  if (!minutesLeft || dismissed) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-4 border-b border-warning/30 bg-warning-light px-4 py-2 text-sm text-warning"
      data-testid="session-expiry-banner"
    >
      <p>Your session expires in {minutesLeft} minute{minutesLeft === 1 ? "" : "s"}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={refreshing}
        onClick={handleRefresh}
        data-testid="refresh-session-button"
      >
        Refresh Session
      </Button>
    </div>
  );
}
