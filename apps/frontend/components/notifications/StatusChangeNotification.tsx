"use client";

/**
 * StatusChangeNotification — WOREF-034
 * Renders a toast notification when an itinerary's status changes.
 * Connects to /api/v1/notifications endpoint to surface real-time updates.
 */

import React, { useEffect, useRef, useState } from "react";

export interface StatusNotification {
  id: string;
  type: "ITINERARY_ACCEPTED" | "ITINERARY_BOOKED" | "PRICE_CHANGE" | "OFFER_EXPIRED" | "BOOKING_CONFIRMED" | "GENERAL";
  title: string;
  body: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  createdAt: string;
}

const TYPE_CONFIG: Record<StatusNotification["type"], { icon: string; color: string }> = {
  ITINERARY_ACCEPTED:  { icon: "✅", color: "var(--voya-success)" },
  ITINERARY_BOOKED:    { icon: "🎉", color: "var(--voya-accent)" },
  PRICE_CHANGE:        { icon: "💰", color: "#f59e0b" },
  OFFER_EXPIRED:       { icon: "⏱", color: "#ef4444" },
  BOOKING_CONFIRMED:   { icon: "🏡", color: "var(--voya-accent)" },
  GENERAL:             { icon: "ℹ️", color: "var(--voya-text-3)" },
};

interface ToastNotification extends StatusNotification {
  visible: boolean;
}

export function StatusChangeNotificationToast(): React.JSX.Element {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = (id: string) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, visible: false } : t));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 400);
  };

  useEffect(() => {
    const handleNotification = (event: CustomEvent<StatusNotification>) => {
      const n = event.detail;
      setToasts((prev) => [...prev, { ...n, visible: true }]);
      const timer = setTimeout(() => dismiss(n.id), n.priority === "HIGH" ? 8000 : 5000);
      timersRef.current.set(n.id, timer);
    };

    window.addEventListener("voya:notification", handleNotification as EventListener);
    return () => {
      window.removeEventListener("voya:notification", handleNotification as EventListener);
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const conf = TYPE_CONFIG[toast.type] ?? TYPE_CONFIG.GENERAL;
        return (
          <div
            key={toast.id}
            role="alert"
            className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg max-w-sm transition-all duration-300 ${toast.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ background: "var(--voya-surface-1)", border: `1px solid ${conf.color}40` }}
          >
            <span className="text-lg shrink-0 mt-0.5">{conf.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--voya-text-1)" }}>{toast.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--voya-text-3)" }}>{toast.body}</p>
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 text-xs hover:opacity-70"
              style={{ color: "var(--voya-text-3)" }}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Programmatically dispatch a status change notification */
export function notifyStatusChange(notification: Omit<StatusNotification, "id" | "createdAt">): void {
  if (typeof window === "undefined") return;
  const event = new CustomEvent<StatusNotification>("voya:notification", {
    detail: {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    },
  });
  window.dispatchEvent(event);
}
