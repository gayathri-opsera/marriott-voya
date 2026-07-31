"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/ui/Toast";
import { SessionMetadataDisplay } from "../../components/assistant/SessionMetadata";
import { AssistantChat } from "../../components/assistant/AssistantChat";
import { createSession, getSessionMetadata } from "../../lib/assistant-session";
import type { SessionMetadata } from "../../lib/assistant-session";
import { useAssistantStream } from "../../lib/assistant-stream";

export default function AssistantPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [metadata, setMetadata] = React.useState<SessionMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = React.useState(true);

  const {
    messages,
    isStreaming,
    errorKind,
    error,
    activeTool,
    retryCount,
    send,
    abort,
    retry,
  } = useAssistantStream(sessionId ?? "");

  React.useEffect(() => {
    createSession()
      .then(({ sessionId: id }) => {
        setSessionId(id);
        return getSessionMetadata(id);
      })
      .then(setMetadata)
      .catch(() => addToast({ title: "Failed to start assistant session", variant: "error" }))
      .finally(() => setMetadataLoading(false));
  }, [addToast]);

  React.useEffect(() => {
    if (errorKind === "session_expired") {
      addToast({ title: "Session expired", description: "Please sign in again.", variant: "warning" });
      router.push("/auth/login");
    }
  }, [errorKind, addToast, router]);

  const showWelcome = messages.length === 0 && !isStreaming;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-surface-subtle md:flex-row">
      <aside className="hidden w-64 shrink-0 border-r border-border-default bg-surface-default p-4 md:block">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-text-inverse">
            V
          </div>
          <div>
            <p className="font-semibold text-text-primary">Voya AI</p>
            <p className="text-xs text-text-muted">Your travel assistant</p>
          </div>
        </div>
        <SessionMetadataDisplay metadata={metadata} loading={metadataLoading} />
      </aside>

      <div className="flex min-h-0 flex-1 flex-col bg-surface-default">
        <header className="border-b border-border-default px-4 py-3 md:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-text-inverse">
              V
            </div>
            <div>
              <p className="font-semibold text-text-primary">Voya AI</p>
              <SessionMetadataDisplay metadata={metadata} loading={metadataLoading} />
            </div>
          </div>
        </header>

        {showWelcome && (
          <div className="flex flex-1 items-center justify-center px-4 text-center text-text-muted">
            <div>
              <p className="text-lg text-text-secondary">Hi! I&apos;m Voya, your AI travel assistant.</p>
              <p className="mt-2 text-sm">Ask me to search for flights, hotels, or plan your trip.</p>
            </div>
          </div>
        )}

        {!showWelcome && sessionId && (
          <AssistantChat
            messages={messages}
            isStreaming={isStreaming}
            activeTool={activeTool}
            errorKind={errorKind === "session_expired" ? null : errorKind}
            errorMessage={error}
            onRetry={retry}
            retryCount={retryCount}
            onSend={send}
            onStop={abort}
          />
        )}

        {showWelcome && sessionId && (
          <AssistantChat
            messages={[]}
            isStreaming={false}
            onSend={send}
            onStop={abort}
          />
        )}
      </div>
    </div>
  );
}
