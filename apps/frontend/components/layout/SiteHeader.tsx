"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "../../lib/utils";
import { NAV_LINKS, ROUTES } from "../../lib/routes";
import { clearSession, getSession, isAuthenticated } from "../../lib/session";
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
    <div className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#1c1410]/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href={ROUTES.HOME}
          className="text-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c1440e]"
          style={{ color: "#c1440e" }}
        >
          voya
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main" className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((link) => {
            const active = isActiveLink(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "text-white font-medium"
                    : "text-white/60 hover:text-white/90 font-normal",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Mobile menu */}
          <button
            type="button"
            className="rounded p-2 text-white/60 hover:text-white md:hidden"
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <span aria-hidden className="text-lg">☰</span>
          </button>

          <div className="hidden items-center gap-2 md:flex">
            {authed ? (
              <>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors"
                >
                  Sign out
                </button>
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: "#c1440e" }}
                  aria-label="User avatar"
                >
                  {(userId ?? "U").charAt(0).toUpperCase()}
                </span>
              </>
            ) : (
              <>
                <Link
                  href={ROUTES.LOGIN}
                  className="rounded px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href={ROUTES.REGISTER}
                  className="rounded px-3 py-1.5 text-sm font-semibold text-white/90 ring-1 ring-amber-500/60 hover:ring-amber-400 transition-colors"
                  style={{ color: "#f59e0b" }}
                >
                  Bonvoy Gold
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
