"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "elevated";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  function Card({ variant = "default", className, style, children, ...props }, ref) {
    const baseStyle: React.CSSProperties = {
      background: "var(--voya-surface)",
      border: "1px solid var(--voya-border)",
      borderRadius: 12,
      boxShadow: variant === "elevated" ? "var(--voya-shadow-md)" : "var(--voya-shadow-sm)",
      ...style,
    };

    return (
      <div
        ref={ref}
        className={cn("p-6", className)}
        style={baseStyle}
        {...props}
      >
        {children}
      </div>
    );
  },
);

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return <div ref={ref} className={cn("mb-4", className)} {...props} />;
  },
);

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  function CardTitle({ className, style, ...props }, ref) {
    return (
      <h3
        ref={ref}
        className={cn("text-lg font-medium", className)}
        style={{ color: "var(--voya-text)", fontFamily: "var(--font-serif)", ...style }}
        {...props}
      />
    );
  },
);

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, style, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn("text-sm", className)}
        style={{ color: "var(--voya-text-2)", ...style }}
        {...props}
      />
    );
  },
);
