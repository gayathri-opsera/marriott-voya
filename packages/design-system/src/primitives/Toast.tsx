"use client";

import * as React from "react";
import { cn } from "../lib/cn.js";

export type ToastVariant = "default" | "success" | "warning" | "error";

export interface ToastProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  onDismiss?: () => void;
}

const variantClasses: Record<ToastVariant, string> = {
  default: "border-border-default bg-surface-default text-text-primary",
  success: "border-success bg-surface-subtle text-success",
  warning: "border-warning bg-surface-subtle text-warning",
  error: "border-danger bg-surface-subtle text-danger",
};

function getLiveProps(variant: ToastVariant): { role: "status" | "alert"; "aria-live": "polite" | "assertive" } {
  if (variant === "warning" || variant === "error") {
    return { role: "alert", "aria-live": "assertive" };
  }
  return { role: "status", "aria-live": "polite" };
}

export function Toast({
  title,
  description,
  variant = "default",
  duration = 5000,
  onDismiss,
}: ToastProps) {
  const [paused, setPaused] = React.useState(false);
  const liveProps = getLiveProps(variant);

  React.useEffect(() => {
    if (!onDismiss || paused) return;

    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onDismiss, paused]);

  return (
    <div
      {...liveProps}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        "flex min-w-[280px] max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg",
        variantClasses[variant],
      )}
    >
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="mt-0.5 text-xs opacity-80">{description}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="text-lg leading-none opacity-60 hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}
