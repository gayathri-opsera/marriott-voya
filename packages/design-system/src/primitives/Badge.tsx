"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn.js";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-surface-muted text-text-secondary",
        success: "bg-surface-subtle text-success border border-success/30",
        warning: "bg-surface-subtle text-warning border border-warning/30",
        danger: "bg-surface-subtle text-danger border border-danger/30",
        info: "bg-surface-subtle text-info border border-info/30",
        "provenance-amadeus": "bg-surface-subtle text-brand-primary border border-brand-primary/30",
        "provenance-rapidapi": "bg-surface-subtle text-info border border-info/30",
        "provenance-illustrative": "bg-surface-muted text-text-muted border border-border-subtle",
        "freshness-fresh": "bg-surface-subtle text-success border border-success/30",
        "freshness-stale": "bg-surface-subtle text-warning border border-warning/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge({ className, variant, ...props }, ref) {
    return (
      <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
    );
  },
);

export { badgeVariants };
