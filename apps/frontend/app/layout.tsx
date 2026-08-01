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
  description: "Search and book flights, hotels, and car rentals with AI-powered recommendations",
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
