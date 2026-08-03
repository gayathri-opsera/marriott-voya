"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "../../lib/utils";
import { NAV_LINKS, ROUTES } from "../../lib/routes";
import { clearSession, getSession, isAuthenticated } from "../../lib/session";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { ThemeToggle } from "./ThemeToggle";

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
    <div
      className="sticky top-0 z-40 w-full backdrop-blur-sm"
      style={{
        background: "var(--voya-nav-bg)",
        borderBottom: "1px solid var(--voya-nav-border)",
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo — Wayfare-style serif wordmark */}
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--voya-accent)]"
          aria-label="Voya home"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="9.5" stroke="var(--voya-accent)" strokeWidth="2"/>
            <path d="M5 13 L8.5 8 L11.5 11.5 L15.5 6" stroke="var(--voya-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span
            className="text-[17px] font-medium tracking-tight"
            style={{ fontFamily: "var(--font-serif)", color: "var(--voya-text)" }}
          >
            Voya
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active = isActiveLink(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13.5px] font-[500] transition-colors",
                  active
                    ? "text-[var(--voya-accent)]"
                    : "text-[var(--voya-text-2)] hover:text-[var(--voya-text)]"
                )}
                style={{
                  borderBottom: active ? "2px solid var(--voya-accent)" : "2px solid transparent",
                  paddingBottom: "6px",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          {/* Mobile menu */}
          <button
            type="button"
            className="flex items-center justify-center rounded-md p-2 md:hidden"
            style={{ color: "var(--voya-text-2)" }}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <rect x="2" y="3.5" width="14" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="2" y="8.25" width="14" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="2" y="13" width="14" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          </button>

          <div className="hidden items-center gap-2 md:flex">
            {authed ? (
              <>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md px-3 py-1.5 text-[13px] font-[500] transition-colors"
                  style={{ color: "var(--voya-text-2)" }}
                >
                  Sign out
                </button>
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: "var(--voya-accent)" }}
                  aria-label="User avatar"
                >
                  {(userId ?? "U").charAt(0).toUpperCase()}
                </span>
              </>
            ) : (
              <>
                <Link
                  href={ROUTES.LOGIN}
                  className="rounded-md px-3 py-1.5 text-[13px] font-[500] transition-colors"
                  style={{ color: "var(--voya-text-2)" }}
                >
                  Sign in
                </Link>
                <Link
                  href={ROUTES.REGISTER}
                  className="rounded-md px-4 py-1.5 text-[13px] font-semibold transition-opacity hover:opacity-85"
                  style={{
                    background: "var(--voya-accent)",
                    color: "#fff",
                    borderRadius: 8,
                  }}
                >
                  Join free
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
