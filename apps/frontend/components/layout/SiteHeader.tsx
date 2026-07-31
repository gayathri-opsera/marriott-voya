"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "../../lib/utils";
import { NAV_LINKS, ROUTES } from "../../lib/routes";
import { clearSession, getSession, isAuthenticated } from "../../lib/session";
import { LocaleCurrencyPicker } from "./LocaleCurrencyPicker";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNavDrawer } from "./MobileNavDrawer";

function isActiveLink(pathname: string, href: string): boolean {
  if (href === ROUTES.HOME) return pathname === ROUTES.HOME;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader(): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [authed, setAuthed] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    void getSession().then((session) => {
      setAuthed(isAuthenticated());
      setUserId(session.userId);
    });
  }, []);

  const handleLogout = (): void => {
    clearSession();
    setAuthed(false);
    setUserId(null);
    router.push(ROUTES.HOME);
  };

  return (
    <div className="sticky top-0 z-40 w-full border-b border-surface-muted bg-surface-default/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-2 rounded font-bold text-xl text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <span aria-hidden>✈</span>
          <span>Voya</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActiveLink(pathname, link.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActiveLink(pathname, link.href)
                  ? "bg-brand-50 text-brand-600"
                  : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 md:flex">
            <LocaleCurrencyPicker />
            <ThemeToggle />
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-text-secondary hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:hidden"
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            aria-controls="mobile-nav"
            onClick={() => setDrawerOpen(true)}
          >
            <span aria-hidden className="block text-lg">☰</span>
          </button>

          <div className="hidden items-center gap-3 md:flex">
            {authed ? (
              <>
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-600"
                  aria-label="User avatar"
                >
                  {(userId ?? "U").charAt(0).toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href={ROUTES.LOGIN}
                  className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
                >
                  Login
                </Link>
                <Link
                  href={ROUTES.REGISTER}
                  className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-600"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <MobileNavDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        authed={authed}
        userId={userId}
        onLogout={handleLogout}
      />
    </div>
  );
}
