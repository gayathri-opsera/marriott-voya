"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Card, CardHeader, CardContent, ErrorBanner } from "@travel/design-system";
import { useToast } from "../../../components/ui/Toast";
import { apiPost } from "../../../lib/api/client";
import { ApiError } from "../../../lib/api/errors";

export default function RegisterPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    form?: string;
  }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    setLoading(true);

    try {
      await apiPost("/auth/register", {
        email,
        password,
        displayName: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
      });
      addToast({
        title: "Check your email",
        description: "We sent you a verification link. Please check your inbox.",
        variant: "success",
      });
      router.push("/auth/login");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.field) {
          setErrors({ [err.field]: err.message } as typeof errors);
        } else {
          setErrors({ form: err.message });
        }
      } else {
        setErrors({ form: "An unexpected error occurred. Please try again." });
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
          <h1 className="text-xl font-semibold text-text-primary">Create your account</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Join Voya to book travel with AI-powered recommendations.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {errors.form && <ErrorBanner error={{ message: errors.form }} />}

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                {...(errors.firstName ? { error: errors.firstName } : {})}
                required
              />
              <Input
                label="Last name"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                {...(errors.lastName ? { error: errors.lastName } : {})}
                required
              />
            </div>

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              {...(errors.email ? { error: errors.email } : {})}
              required
            />

            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              {...(errors.password ? { error: errors.password } : {})}
              hint="Must be at least 8 characters"
              required
            />

            <Input
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              {...(errors.confirmPassword ? { error: errors.confirmPassword } : {})}
              required
            />

            <Button type="submit" loading={loading} className="w-full">
              Create account
            </Button>

            <p className="text-center text-sm text-text-secondary">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-medium text-brand-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
