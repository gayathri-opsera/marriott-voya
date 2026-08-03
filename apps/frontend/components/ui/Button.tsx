"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, React.CSSProperties> = {
  primary:   { background: "var(--voya-accent)", color: "#fff" },
  secondary: { background: "var(--voya-surface-2)", color: "var(--voya-text)", border: "1px solid var(--voya-border)" },
  ghost:     { background: "transparent", color: "var(--voya-text)" },
  destructive: { background: "var(--voya-red)", color: "#fff" },
  outline:   { background: "transparent", color: "var(--voya-accent)", border: "1px solid var(--voya-accent)" },
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-[13px] rounded-md",
  md: "h-10 px-4 text-[13.5px] rounded-lg",
  lg: "h-12 px-6 text-sm rounded-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", loading = false, disabled, className, style, children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled ?? loading}
        aria-disabled={disabled ?? loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-opacity",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--voya-accent)] focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "hover:opacity-88",
          sizeClasses[size],
          className,
        )}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      >
        {loading && (
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {children}
      </button>
    );
  },
);
