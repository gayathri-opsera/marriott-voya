"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Input, Card, CardHeader, CardContent, ErrorBanner } from "@travel/design-system";
import { useToast } from "../../../components/ui/Toast";
import { apiPost } from "../../../lib/api/client";
import { ApiError } from "../../../lib/api/errors";

export default function ForgotPasswordPage() {
  const { addToast } = useToast();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiPost("/auth/forgot-password", { email });
      setSent(true);
      addToast({ title: "Reset link sent", variant: "success" });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-surface-subtle px-4 py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-lg font-bold text-text-inverse">
            V
          </div>
          <h1 className="text-xl font-semibold text-text-primary">Reset your password</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center">
              <p className="text-sm text-text-secondary">
                If an account exists for {email}, you will receive a password reset link shortly.
              </p>
              <Link
                href="/auth/login"
                className="mt-4 inline-block text-sm font-medium text-brand-primary hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              {error && <ErrorBanner error={{ message: error }} />}

              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button type="submit" loading={loading} className="w-full">
                Send reset link
              </Button>

              <p className="text-center text-sm text-text-secondary">
                Remember your password?{" "}
                <Link href="/auth/login" className="font-medium text-brand-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
