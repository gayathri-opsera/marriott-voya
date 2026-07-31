"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@travel/design-system";
import { StateBoundary } from "../../components/patterns/StateBoundary";

export default function ProfilePage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">My Profile</h1>

      <StateBoundary state="idle">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/profile/preferences" className="block">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <h2 className="font-semibold text-text-primary">Travel Preferences</h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  Cabin class, airlines, meals, seats, and accessibility.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile/sessions" className="block">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <h2 className="font-semibold text-text-primary">Active Sessions</h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  View and revoke sessions on other devices.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile/privacy" className="block">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <h2 className="font-semibold text-text-primary">Privacy Centre</h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  Data export, account deletion, and document management.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </StateBoundary>
    </div>
  );
}
