"use client";

/**
 * Bonvoy Loyalty Dashboard — WOREF-036
 * Displays member tier, points balance, earning history, and redemption opportunities.
 */

import React, { useState } from "react";
import Link from "next/link";
import { AccountLayout } from "@/components/layout/AccountLayout";

const DEMO_MEMBER = {
  memberId: "BONVOY-•••••6789",
  name: "Gayathri K.",
  tier: "Platinum Elite",
  tierColor: "#d4a84b",
  points: 47_850,
  nextTier: "Titanium Elite",
  nightsThisYear: 68,
  nightsNeeded: 7,
  expiresAt: "Jan 31, 2026",
};

const TIER_PROGRESSION = [
  { name: "Silver",    nights: 10,  color: "#c0c0c0" },
  { name: "Gold",      nights: 25,  color: "#d4a84b" },
  { name: "Platinum",  nights: 50,  color: "#a78bfa" },
  { name: "Titanium",  nights: 75,  color: "#60a5fa" },
  { name: "Ambassador",nights: 100, color: "#f97316" },
];

const EARNING_HISTORY = [
  { date: "Sep 10–14, 2099", property: "Villa della Torre (HVMI)", activity: "Stay", points: 4500, status: "POSTED" },
  { date: "Aug 22, 2099",    property: "Bonvoy Tours — Truffle Hunting, Lucca", activity: "Tour", points: 1200, status: "POSTED" },
  { date: "Aug 01, 2099",    property: "Grand Universe Lucca, Autograph Collection", activity: "Stay", points: 3800, status: "POSTED" },
  { date: "Jul 15, 2099",    property: "Marriott Florence", activity: "Stay", points: 5200, status: "PENDING" },
];

const REDEMPTION_IDEAS = [
  { label: "Free Night Award",   points: 25_000, savings: "$280", icon: "🏨" },
  { label: "Villa Upgrade (HVMI)", points: 15_000, savings: "$150", icon: "🏡" },
  { label: "Bonvoy Tour Credit", points: 10_000, savings: "$100", icon: "🎭" },
  { label: "Room Upgrade",       points: 5_000,  savings: "$50",  icon: "⭐" },
];

function PointsMeter({ current, max }: { current: number; max: number }) {
  const pct = Math.min((current / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--voya-surface-2)" }}>
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: "var(--voya-accent)" }}
        />
      </div>
      <div className="flex justify-between text-xs" style={{ color: "var(--voya-text-3)" }}>
        <span>{current.toLocaleString()} pts</span>
        <span>{max.toLocaleString()} pts for {DEMO_MEMBER.nextTier}</span>
      </div>
    </div>
  );
}

export default function BonvoyPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "redeem">("overview");

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "history" as const,  label: "Earning History" },
    { id: "redeem" as const,   label: "Redeem Points" },
  ];

  return (
    <AccountLayout current="bonvoy">
      <div className="space-y-6">
        {/* Tier card */}
        <div
          className="rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-4"
          style={{ background: "var(--voya-surface-1)", border: "1px solid var(--voya-border)" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold shrink-0"
            style={{ background: DEMO_MEMBER.tierColor + "20", border: `2px solid ${DEMO_MEMBER.tierColor}` }}
          >
            B
          </div>
          <div className="flex-1 space-y-1">
            <div className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--voya-text-3)" }}>
              Marriott Bonvoy
            </div>
            <div className="font-semibold text-xl" style={{ color: "var(--voya-text-1)" }}>
              {DEMO_MEMBER.name}
            </div>
            <div className="text-sm flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: DEMO_MEMBER.tierColor + "30", color: DEMO_MEMBER.tierColor }}
              >
                {DEMO_MEMBER.tier}
              </span>
              <span style={{ color: "var(--voya-text-3)" }}>#{DEMO_MEMBER.memberId}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold" style={{ color: "var(--voya-amber)" }}>
              {DEMO_MEMBER.points.toLocaleString()}
            </div>
            <div className="text-xs" style={{ color: "var(--voya-text-3)" }}>points balance</div>
            <div className="text-xs mt-1" style={{ color: "var(--voya-text-3)" }}>
              Expires {DEMO_MEMBER.expiresAt}
            </div>
          </div>
        </div>

        {/* Tier progress */}
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{ background: "var(--voya-surface-1)", border: "1px solid var(--voya-border)" }}
        >
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm" style={{ color: "var(--voya-text-1)" }}>
              Progress to {DEMO_MEMBER.nextTier}
            </h3>
            <span className="text-xs" style={{ color: "var(--voya-accent)" }}>
              {DEMO_MEMBER.nightsThisYear} of {DEMO_MEMBER.nightsNeeded + DEMO_MEMBER.nightsThisYear} nights
            </span>
          </div>
          <PointsMeter current={DEMO_MEMBER.nightsThisYear} max={DEMO_MEMBER.nightsThisYear + DEMO_MEMBER.nightsNeeded} />
          <p className="text-xs" style={{ color: "var(--voya-text-3)" }}>
            Only {DEMO_MEMBER.nightsNeeded} more qualifying nights needed this year.
          </p>

          {/* Tier ladder */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {TIER_PROGRESSION.map((t) => (
              <div
                key={t.name}
                className="flex-1 min-w-[70px] rounded-lg px-2 py-1.5 text-center"
                style={{
                  background: t.nights <= DEMO_MEMBER.nightsThisYear ? t.color + "25" : "var(--voya-surface-2)",
                  border: `1px solid ${t.nights <= DEMO_MEMBER.nightsThisYear ? t.color : "var(--voya-border)"}`,
                }}
              >
                <div className="text-xs font-semibold" style={{ color: t.nights <= DEMO_MEMBER.nightsThisYear ? t.color : "var(--voya-text-3)" }}>
                  {t.name}
                </div>
                <div className="text-xs" style={{ color: "var(--voya-text-3)" }}>{t.nights} nights</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b" style={{ borderColor: "var(--voya-border)" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                color: activeTab === tab.id ? "var(--voya-accent)" : "var(--voya-text-3)",
                borderBottom: activeTab === tab.id ? "2px solid var(--voya-accent)" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Points Balance", value: DEMO_MEMBER.points.toLocaleString(), sub: "Marriott Bonvoy points" },
              { label: "Qualifying Nights", value: DEMO_MEMBER.nightsThisYear.toString(), sub: "This year" },
              { label: "Nights to Next Tier", value: DEMO_MEMBER.nightsNeeded.toString(), sub: `Until ${DEMO_MEMBER.nextTier}` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-4 space-y-1"
                style={{ background: "var(--voya-surface-1)", border: "1px solid var(--voya-border)" }}
              >
                <div className="text-xs" style={{ color: "var(--voya-text-3)" }}>{stat.label}</div>
                <div className="text-2xl font-bold" style={{ color: "var(--voya-text-1)" }}>{stat.value}</div>
                <div className="text-xs" style={{ color: "var(--voya-text-3)" }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-3">
            {EARNING_HISTORY.map((h, i) => (
              <div
                key={i}
                className="rounded-xl p-4 flex items-center justify-between"
                style={{ background: "var(--voya-surface-1)", border: "1px solid var(--voya-border)" }}
              >
                <div>
                  <div className="font-medium text-sm" style={{ color: "var(--voya-text-1)" }}>{h.property}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--voya-text-3)" }}>
                    {h.date} · {h.activity}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold" style={{ color: "var(--voya-amber)" }}>
                    +{h.points.toLocaleString()} pts
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: h.status === "POSTED" ? "var(--voya-success)" : "var(--voya-text-3)" }}
                  >
                    {h.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "redeem" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {REDEMPTION_IDEAS.map((r) => (
              <div
                key={r.label}
                className="rounded-xl p-4 space-y-2"
                style={{ background: "var(--voya-surface-1)", border: "1px solid var(--voya-border)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{r.icon}</span>
                  <div>
                    <div className="font-medium text-sm" style={{ color: "var(--voya-text-1)" }}>{r.label}</div>
                    <div className="text-xs" style={{ color: "var(--voya-amber)" }}>
                      {r.points.toLocaleString()} pts · saves {r.savings}
                    </div>
                  </div>
                </div>
                <button
                  className="w-full py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "var(--voya-accent)", color: "#000" }}
                  disabled={DEMO_MEMBER.points < r.points}
                >
                  {DEMO_MEMBER.points >= r.points ? "Redeem" : "Insufficient points"}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-center" style={{ color: "var(--voya-text-3)" }}>
          <a href="https://www.marriott.com/loyalty/mermiles/earning/earnTermsAndConditions.mi" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Bonvoy Terms & Conditions
          </a>
          {" · "}
          <Link href="/profile" className="hover:underline">Back to Profile</Link>
        </div>
      </div>
    </AccountLayout>
  );
}
