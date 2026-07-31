"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader } from "@travel/design-system";
import { apiDelete, apiGet } from "../../../lib/api/client";
import { useToast } from "../../../components/ui/Toast";
import { StateBoundary } from "../../../components/patterns/StateBoundary";

interface Session {
  id: string;
  device: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

export default function SessionsPage(): React.JSX.Element {
  const { addToast } = useToast();
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const loadSessions = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Session[]>("/api/v1/auth/sessions");
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load sessions"));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const handleRevoke = async (id: string): Promise<void> => {
    try {
      await apiDelete(`/api/v1/auth/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      addToast({ title: "Session revoked", variant: "success" });
    } catch {
      addToast({ title: "Failed to revoke session", variant: "error" });
    }
  };

  const screenState = loading ? "loading" : error ? "error" : "idle";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/profile" className="text-sm text-brand-primary hover:underline">
        ← Back to Profile
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold text-text-primary">Active Sessions</h1>

      <StateBoundary state={screenState} error={error} onRetry={() => void loadSessions()}>
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-text-primary">
                    {session.device}
                    {session.current && (
                      <span className="ml-2 text-xs text-brand-primary">This device</span>
                    )}
                  </p>
                  <p className="text-sm text-text-muted">
                    {session.ip} · Last active {new Date(session.lastActive).toLocaleString()}
                  </p>
                </div>
                {!session.current && (
                  <Button variant="outline" size="sm" onClick={() => void handleRevoke(session.id)}>
                    Revoke
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </StateBoundary>
    </div>
  );
}
