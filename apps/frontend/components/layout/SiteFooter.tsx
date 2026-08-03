import * as React from "react";
import Link from "next/link";

const FOOTER_COLS = [
  {
    heading: "Explore",
    links: [
      { href: "/search", label: "Search Homes" },
      { href: "/collections", label: "Collections" },
      { href: "/assistant", label: "AI Planner" },
      { href: "/itineraries", label: "My Trips" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/profile", label: "Profile" },
      { href: "/auth/login", label: "Sign In" },
      { href: "/auth/register", label: "Join Free" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/accessibility", label: "Accessibility" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer
      style={{
        background: "var(--voya-surface-2)",
        borderTop: "1px solid var(--voya-border)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {/* Top row: brand + columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 mb-10">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="9.5" stroke="var(--voya-accent)" strokeWidth="2"/>
                <path d="M5 13 L8.5 8 L11.5 11.5 L15.5 6" stroke="var(--voya-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span
                className="text-base font-medium"
                style={{ fontFamily: "var(--font-serif)", color: "var(--voya-text)" }}
              >
                Voya
              </span>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--voya-text-2)" }}>
              AI-powered travel planning for extraordinary stays and experiences.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.heading}>
              <h3
                className="text-[11px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--voya-text-3)" }}
              >
                {col.heading}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] transition-colors hover:text-[var(--voya-accent)]"
                      style={{ color: "var(--voya-text-2)" }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6"
          style={{ borderTop: "1px solid var(--voya-border)" }}
        >
          <p className="text-[12px]" style={{ color: "var(--voya-text-3)" }}>
            © {new Date().getFullYear()} Voya Travel. All rights reserved.
          </p>
          <p className="text-[12px]" style={{ color: "var(--voya-text-3)" }}>
            Powered by Marriott Bonvoy · HVMI Collection
          </p>
        </div>
      </div>
    </footer>
  );
}
