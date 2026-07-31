"use client";

import * as React from "react";
import { cn } from "../lib/cn.js";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, hint, id, className, required, readOnly, disabled, ...props }, ref) {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
            {required && <span className="text-danger"> *</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          readOnly={readOnly}
          disabled={disabled}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-10 w-full rounded-md border px-3 py-2 text-sm",
            "bg-surface-default text-text-primary placeholder:text-text-muted",
            "border-border-default transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:border-brand-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "read-only:bg-surface-subtle read-only:cursor-default",
            error && "border-danger focus-visible:ring-danger",
            className,
          )}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-text-muted">
            {hint}
          </p>
        )}
        {error && (
          <span id={errorId} role="alert" className="text-xs text-danger">
            {error}
          </span>
        )}
      </div>
    );
  },
);
