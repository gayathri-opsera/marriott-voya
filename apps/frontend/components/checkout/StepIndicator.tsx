"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

export interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Checkout steps">
      <ol role="list" className="flex items-center gap-2 mb-6">
        {steps.map((label, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <React.Fragment key={label}>
              <li
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium",
                  isCompleted && "text-success",
                  isActive && "text-brand-500",
                  !isCompleted && !isActive && "text-text-tertiary",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs border-2",
                    isCompleted && "bg-success border-success text-text-inverse",
                    isActive && "border-brand-500 text-brand-500",
                    !isCompleted && !isActive && "border-surface-muted text-text-tertiary",
                  )}
                >
                  {isCompleted ? "✓" : idx + 1}
                </span>
                {label}
              </li>
              {idx < steps.length - 1 && (
                <li aria-hidden className="flex-1 h-px bg-surface-muted list-none" />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
