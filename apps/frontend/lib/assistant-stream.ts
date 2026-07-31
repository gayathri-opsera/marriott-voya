"use client";

import * as React from "react";
import { env } from "./env";
import { streamChat } from "./sse";
import type { StreamErrorKind } from "../components/assistant/StreamErrorBanner";
import {
  classifyStreamError,
  getRetryDelayMs,
  MAX_STREAM_RETRIES,
} from "../components/assistant/StreamErrorBanner";

export type ToolCall = {
  toolName: string;
  input: unknown;
};

export type Message = {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
};

export type { StreamErrorKind };

export function useAssistantStream(sessionId: string) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [errorKind, setErrorKind] = React.useState<StreamErrorKind | null>(null);
  const [activeTool, setActiveTool] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const [lastMessage, setLastMessage] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const abort = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    setActiveTool(null);
  }, []);

  const executeStream = React.useCallback(
    async (text: string, attempt = 0): Promise<void> => {
      setError(null);
      setErrorKind(null);
      setIsStreaming(true);
      setActiveTool(null);

      if (attempt === 0) {
        setMessages((prev) => [
          ...prev,
          { role: "user", content: text },
          { role: "assistant", content: "", toolCalls: [] },
        ]);
      }

      const controller = new AbortController();
      abortRef.current = controller;

      const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
      const url = `${base}/api/v1/ai/chat`;

      try {
        for await (const chunk of streamChat(
          url,
          { sessionId, message: text },
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
            setActiveTool(chunk.toolName);
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") {
                const toolCalls = [
                  ...(last.toolCalls ?? []),
                  { toolName: chunk.toolName, input: chunk.input },
                ];
                next[next.length - 1] = { ...last, toolCalls };
              }
              return next;
            });
          } else if (chunk.type === "tool_result") {
            setActiveTool(null);
          } else if (chunk.type === "error") {
            const kind = classifyStreamError(0, chunk.message);
            setError(chunk.message);
            setErrorKind(kind);
            setIsStreaming(false);
            setActiveTool(null);
            return;
          } else if (chunk.type === "done") {
            setIsStreaming(false);
            setActiveTool(null);
            setRetryCount(0);
            return;
          }
        }
        setIsStreaming(false);
        setActiveTool(null);
        setRetryCount(0);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setIsStreaming(false);
          setActiveTool(null);
          return;
        }

        const status = (err as { status?: number }).status ?? 0;
        const message = err instanceof Error ? err.message : "Stream failed";
        const kind = classifyStreamError(status, message);

        if (kind === "connection_lost" && attempt < MAX_STREAM_RETRIES) {
          const delay = getRetryDelayMs(attempt);
          await new Promise((r) => setTimeout(r, delay));
          setRetryCount(attempt + 1);
          return executeStream(text, attempt + 1);
        }

        setError(message);
        setErrorKind(kind);
        setIsStreaming(false);
        setActiveTool(null);
      } finally {
        abortRef.current = null;
      }
    },
    [sessionId],
  );

  const send = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;
      setLastMessage(trimmed);
      setRetryCount(0);
      await executeStream(trimmed);
    },
    [isStreaming, executeStream],
  );

  const retry = React.useCallback(async () => {
    if (!lastMessage || isStreaming) return;
    setRetryCount((c) => c + 1);
    await executeStream(lastMessage, retryCount);
  }, [lastMessage, isStreaming, retryCount, executeStream]);

  return {
    messages,
    isStreaming,
    error,
    errorKind,
    activeTool,
    retryCount,
    abort,
    send,
    retry,
  };
}
