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
      className="sticky top-0 z-40 w-full backdrop-blur"
      style={{
        background: "var(--voya-nav-bg)",
        borderBottom: "1px solid var(--voya-nav-border)",
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href={ROUTES.HOME}
          className="text-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2"
          style={{ color: "var(--voya-accent)" }}
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
                style={{
                  color: active ? "var(--voya-accent)" : "var(--voya-text-3)",
                  fontWeight: active ? 600 : 400,
                  borderBottom: active ? "2px solid var(--voya-accent)" : "2px solid transparent",
                  paddingBottom: 2,
                }}
                className={cn(
                  "rounded px-3 py-1.5 text-sm transition-colors hover:text-[var(--voya-text)]",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Theme toggle — desktop */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          {/* Mobile menu */}
          <button
            type="button"
            className="rounded p-2 md:hidden"
            style={{ color: "var(--voya-text-3)" }}
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
                  className="rounded px-3 py-1.5 text-sm transition-colors"
                  style={{ color: "var(--voya-text-3)" }}
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
                  className="rounded px-3 py-1.5 text-sm transition-colors"
                  style={{ color: "var(--voya-text-3)" }}
                >
                  Sign In
                </Link>
                <Link
                  href={ROUTES.REGISTER}
                  className="rounded px-3 py-1.5 text-sm font-semibold transition-colors"
                  style={{ color: "var(--voya-amber)", border: "1px solid var(--voya-amber)", borderRadius: 8, padding: "5px 12px" }}
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
