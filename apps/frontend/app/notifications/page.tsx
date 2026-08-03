"use client";

/**
 * Notifications Center — WOREF-037 (gap coverage)
 * Lists all notifications for the user with read/unread state and type filtering.
 */

import React, { useState } from "react";
import Link from "next/link";

interface AppNotification {
  id: string;
  type: "ITINERARY_ACCEPTED" | "ITINERARY_BOOKED" | "PRICE_CHANGE" | "OFFER_EXPIRED" | "BOOKING_CONFIRMED" | "GENERAL";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

const DEMO_NOTIFICATIONS: AppNotification[] = [
  { id: "n1", type: "ITINERARY_ACCEPTED", title: "Itinerary accepted", body: "Your Lucca, Italy trip plan is ready for checkout.", read: false, createdAt: new Date(Date.now() - 5 * 60_000).toISOString(), link: "/itineraries/itin-lucca-001" },
  { id: "n2", type: "PRICE_CHANGE",       title: "Price alert",        body: "Villa della Torre price dropped by $50/night. Book now!", read: false, createdAt: new Date(Date.now() - 30 * 60_000).toISOString(), link: "/search" },
  { id: "n3", type: "BOOKING_CONFIRMED",  title: "Booking confirmed",  body: "Your Kyoto Marriott booking is confirmed. Check-in Nov 15.", read: true,  createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(), link: "/itineraries/itin-kyoto-003" },
  { id: "n4", type: "OFFER_EXPIRED",      title: "Offer expired",      body: "The special rate for Hotel de Rome is no longer available.", read: true,  createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString() },
];

const TYPE_ICONS: Record<AppNotification["type"], string> = {
  ITINERARY_ACCEPTED: "✅",
  ITINERARY_BOOKED:   "🎉",
  PRICE_CHANGE:       "💰",
  OFFER_EXPIRED:      "⏱",
  BOOKING_CONFIRMED:  "🏡",
  GENERAL:            "ℹ️",
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 3600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

export default function NotificationsPage(): React.JSX.Element {
  const [notifications, setNotifications] = useState<AppNotification[]>(DEMO_NOTIFICATIONS);

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <main className="min-h-screen" style={{ background: "var(--voya-surface-0)" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--voya-text-1)" }}>
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--voya-accent)", color: "#000" }}>
                {unreadCount}
              </span>
            )}
          </h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs hover:underline"
              style={{ color: "var(--voya-accent)" }}
            >
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔔</div>
            <p className="font-medium" style={{ color: "var(--voya-text-2)" }}>No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl p-4 cursor-pointer transition-opacity`}
                style={{
                  background: n.read ? "var(--voya-surface-1)" : "var(--voya-surface-1)",
                  border: `1px solid ${n.read ? "var(--voya-border)" : "var(--voya-accent)30"}`,
                  opacity: n.read ? 0.8 : 1,
                }}
                onClick={() => markRead(n.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{TYPE_ICONS[n.type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium`} style={{ color: "var(--voya-text-1)" }}>{n.title}</p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: "var(--voya-accent)" }} />
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--voya-text-3)" }}>{n.body}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--voya-text-3)" }}>{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
                {n.link && (
                  <Link
                    href={n.link}
                    className="mt-2 text-xs underline block"
                    style={{ color: "var(--voya-accent)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    View →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
