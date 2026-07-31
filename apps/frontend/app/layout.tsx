import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import { SiteHeader } from "../components/layout/SiteHeader";
import { SiteFooter } from "../components/layout/SiteFooter";
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
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-surface-subtle">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <WebVitalsReporter />
        <ToastProvider>
          <SiteHeader />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </ToastProvider>
      </body>
    </html>
  );
}
