import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import { SiteHeader } from "../components/layout/SiteHeader";
import { SiteFooter } from "../components/layout/SiteFooter";
import { SkipLink } from "../components/layout/SkipLink";
import { SessionExpiryBanner } from "../components/auth/SessionExpiryBanner";
import { ToastProvider } from "../components/ui/Toast";
import { WebVitalsReporter } from "../components/WebVitalsReporter";
import { reportWebVitals } from "../lib/vitals";

export { reportWebVitals };

export const metadata: Metadata = {
  title: "Voya — AI Travel Booking",
  description: "Discover and book extraordinary homes, villas and experiences powered by AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const themeScript = `(function(){try{var t=localStorage.getItem('voya-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Wayfare-aligned fonts: Newsreader (serif display) + Work Sans (body) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=Work+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <SkipLink />
        <WebVitalsReporter />
        <ToastProvider>
          <header>
            <SessionExpiryBanner />
            <SiteHeader />
          </header>
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <footer>
            <SiteFooter />
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
