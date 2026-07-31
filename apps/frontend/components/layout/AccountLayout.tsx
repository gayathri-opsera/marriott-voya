"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ACCOUNT_NAV = [
  { label: "Profile",                 href: "/profile" },
  { label: "Travel preferences",      href: "/profile/preferences" },
  { label: "Display & accessibility", href: "/profile/display" },
  { label: "Active sessions",         href: "/profile/sessions" },
  { label: "Privacy & my data",       href: "/profile/privacy" },
];

export function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div style={{ backgroundColor: "#14100c", minHeight: "100vh", color: "white" }}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
          <nav>
            <ul className="space-y-0.5">
              {ACCOUNT_NAV.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded px-3 py-2 text-sm transition-colors"
                    style={{
                      backgroundColor: pathname === item.href ? "rgba(193,68,14,0.15)" : "transparent",
                      color: pathname === item.href ? "white" : "rgba(255,255,255,0.5)",
                      borderLeft: pathname === item.href ? "2px solid #c1440e" : "2px solid transparent",
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
