"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardHeader, CardContent } from "@travel/design-system";
import { useToast } from "../../../components/ui/Toast";
import { apiPost } from "../../../lib/api/client";
import { setSession } from "../../../lib/session";
import { ApiError } from "../../../lib/api/errors";

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string; form?: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const res = await apiPost<{
        accessToken: string;
        userId: string;
        expiresIn: number;
      }>("/auth/login", { email, password });

      setSession(res.accessToken, res.userId, res.expiresIn);
      addToast({ title: "Signed in", variant: "success" });
      router.push("/search");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setErrors({ form: "Invalid email or password. Please try again." });
        } else if (err.status === 422 && err.field) {
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
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <h1 className="text-lg font-semibold text-text-primary">Sign in to Voya</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Welcome back! Enter your credentials to continue.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {errors.form && (
              <div role="alert" className="rounded-md bg-surface-subtle p-3 text-sm text-danger">
                {errors.form}
              </div>
            )}

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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              {...(errors.password ? { error: errors.password } : {})}
              required
            />

            <div className="flex items-center justify-between text-sm">
              <a
                href="/auth/forgot-password"
                className="text-brand-primary hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>

            <p className="text-center text-sm text-text-secondary">
              Don&apos;t have an account?{" "}
              <a href="/auth/register" className="text-brand-primary hover:underline font-medium">
                Create one
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
