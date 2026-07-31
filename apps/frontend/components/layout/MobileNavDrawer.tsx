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
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => onOpenChange(false)}
            aria-current={isActiveLink(pathname, link.href) ? "page" : undefined}
            className={cn(
              "rounded-md px-4 py-3 text-base font-medium transition-colors",
              isActiveLink(pathname, link.href)
                ? "bg-brand-50 text-brand-600"
                : "text-text-primary hover:bg-surface-subtle",
            )}
          >
            {link.label}
          </Link>
        ))}

        <div className="mt-4 border-t border-surface-muted pt-4">
          {authed ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 px-4">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-600"
                  aria-hidden
                >
                  {(userId ?? "U").charAt(0).toUpperCase()}
                </span>
                <span className="text-sm text-text-secondary">Signed in</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onOpenChange(false);
                }}
                className="rounded-md px-4 py-3 text-left text-base font-medium text-text-primary hover:bg-surface-subtle"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href={ROUTES.LOGIN}
                onClick={() => onOpenChange(false)}
                className="rounded-md bg-brand-500 px-4 py-3 text-center text-base font-medium text-white hover:bg-brand-600"
              >
                Login
              </Link>
              <Link
                href={ROUTES.REGISTER}
                onClick={() => onOpenChange(false)}
                className="rounded-md border border-surface-muted px-4 py-3 text-center text-base font-medium text-text-primary hover:bg-surface-subtle"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </nav>
    </Drawer>
  );
}
