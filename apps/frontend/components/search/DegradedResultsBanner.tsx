"use client";

import React from "react";

interface DegradedResultsBannerProps {
  message: string;
}

export function DegradedResultsBanner({ message }: DegradedResultsBannerProps): React.JSX.Element {
  return (
    <div
      role="note"
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-3"
      style={{ background: "#f59e0b15", border: "1px solid #f59e0b40", color: "#92400e" }}
    >
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  );
}
