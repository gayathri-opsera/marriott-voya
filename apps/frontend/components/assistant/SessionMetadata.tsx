"use client";

import * as React from "react";
import type { SessionMetadata } from "../../lib/assistant-session";

export interface SessionMetadataProps {
  metadata: SessionMetadata | null;
  loading?: boolean;
}

export function SessionMetadataDisplay({
  metadata,
  loading = false,
}: SessionMetadataProps): React.JSX.Element {
  if (loading) {
    return (
      <div className="text-xs text-text-muted" data-testid="session-metadata-loading">
        Loading session…
      </div>
    );
  }

  if (!metadata) return <></>;

  const created = new Date(metadata.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="flex flex-wrap items-center gap-3 text-xs text-text-muted"
      data-testid="session-metadata"
    >
      <span>Session {metadata.id.slice(0, 8)}…</span>
      <span>Started {created}</span>
      <span>{metadata.messageCount} messages</span>
      <span>{metadata.tokenCount.toLocaleString()} tokens</span>
    </div>
  );
}
