"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Card, CardHeader, CardContent, ErrorBanner } from "@travel/design-system";
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
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8" style={{ background: "var(--voya-bg)" }}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white" style={{ background: "var(--voya-accent)" }}>
            V
          </div>
          <h1 className="text-xl font-medium" style={{ color: "var(--voya-text)", fontFamily: "var(--font-serif)" }}>Sign in to Voya</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--voya-text-2)" }}>
            Welcome back! Enter your credentials to continue.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {errors.form && <ErrorBanner error={{ message: errors.form }} />}

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
              <Link href="/auth/forgot-password" className="text-brand-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>

            <p className="text-center text-sm text-text-secondary">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="font-medium text-brand-primary hover:underline">
                Register
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
