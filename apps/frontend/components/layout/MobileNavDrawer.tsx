"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Drawer } from "@travel/design-system";
import { cn } from "../../lib/utils";
import { NAV_LINKS, ROUTES } from "../../lib/routes";
import { clearSession, getSession, isAuthenticated } from "../../lib/session";

interface MobileNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authed: boolean;
  userId: string | null;
  onLogout: () => void;
}

function isActiveLink(pathname: string, href: string): boolean {
  if (href === ROUTES.HOME) return pathname === ROUTES.HOME;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNavDrawer({
  open,
  onOpenChange,
  authed,
  userId,
  onLogout,
}: MobileNavDrawerProps): React.JSX.Element {
  const pathname = usePathname();

  React.useEffect(() => {
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="Navigation">
      <nav id="mobile-nav" aria-label="Mobile" className="flex flex-col gap-1">
        {NAV_LINKS.map((link) => {
          const active = isActiveLink(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => onOpenChange(false)}
              aria-current={active ? "page" : undefined}
              className="rounded-lg px-4 py-3 text-base font-medium transition-colors"
              style={{
                background: active ? "var(--voya-accent-f1)" : "transparent",
                color: active ? "var(--voya-accent)" : "var(--voya-text)",
                borderLeft: active ? "3px solid var(--voya-accent)" : "3px solid transparent",
              }}
            >
              {link.label}
            </Link>
          );
        })}

        <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--voya-border)" }}>
          {authed ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 px-4">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: "var(--voya-accent)" }}
                  aria-hidden
                >
                  {(userId ?? "U").charAt(0).toUpperCase()}
                </span>
                <span className="text-sm" style={{ color: "var(--voya-text-2)" }}>Signed in</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onOpenChange(false);
                }}
                className="rounded-lg px-4 py-3 text-left text-base font-medium transition-colors"
                style={{ color: "var(--voya-text-2)" }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href={ROUTES.LOGIN}
                onClick={() => onOpenChange(false)}
                className="rounded-lg px-4 py-3 text-center text-base font-semibold transition-opacity hover:opacity-85"
                style={{ background: "var(--voya-accent)", color: "#fff" }}
              >
                Sign in
              </Link>
              <Link
                href={ROUTES.REGISTER}
                onClick={() => onOpenChange(false)}
                className="rounded-lg px-4 py-3 text-center text-base font-medium transition-colors"
                style={{ border: "1px solid var(--voya-border)", color: "var(--voya-text)" }}
              >
                Join free
              </Link>
            </div>
          )}
        </div>
      </nav>
    </Drawer>
  );
}
