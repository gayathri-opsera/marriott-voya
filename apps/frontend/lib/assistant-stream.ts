"use client";

import * as React from "react";
import { env } from "./env";
import { streamChat } from "./sse";

export type ToolCall = {
  toolName: string;
  input: unknown;
};

export type Message = {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
};

export function useAssistantStream(sessionId: string) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const abort = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const send = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      setIsStreaming(true);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: trimmed },
        { role: "assistant", content: "", toolCalls: [] },
      ]);

      const controller = new AbortController();
      abortRef.current = controller;

      const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
      const url = `${base}/api/v1/ai/chat`;

      try {
        for await (const chunk of streamChat(
          url,
          { sessionId, message: trimmed },
          controller.signal,
        )) {
          if (chunk.type === "text") {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") {
                next[next.length - 1] = { ...last, content: last.content + chunk.content };
              }
              return next;
            });
          } else if (chunk.type === "tool_use") {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") {
                const toolCalls = [...(last.toolCalls ?? []), { toolName: chunk.toolName, input: chunk.input }];
                next[next.length - 1] = { ...last, toolCalls };
              }
              return next;
            });
          } else if (chunk.type === "error") {
            setError(chunk.message);
            setIsStreaming(false);
            return;
          } else if (chunk.type === "done") {
            setIsStreaming(false);
            return;
          }
        }
        setIsStreaming(false);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setIsStreaming(false);
          return;
        }
        const message = err instanceof Error ? err.message : "Stream failed";
        setError(message);
        setIsStreaming(false);
      } finally {
        abortRef.current = null;
      }
    },
    [sessionId, isStreaming],
  );

  return { messages, isStreaming, error, abort, send };
}
