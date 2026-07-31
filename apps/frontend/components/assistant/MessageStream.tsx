"use client";

import * as React from "react";
import type { Message } from "../../lib/assistant-stream";

export interface MessageStreamProps {
  messages: Message[];
  isStreaming: boolean;
}

export function MessageStream({ messages, isStreaming }: MessageStreamProps): React.JSX.Element {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
      {messages.map((message, index) => (
        <div
          key={`${message.role}-${index}`}
          className={`flex flex-col gap-1 ${message.role === "user" ? "items-end" : "items-start"}`}
        >
          <span className="text-xs font-medium text-text-muted">
            {message.role === "user" ? "You" : "Assistant"}
          </span>
          <div
            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
              message.role === "user"
                ? "bg-brand-primary text-text-inverse"
                : "border border-border-default bg-surface-default text-text-primary shadow-sm"
            }`}
          >
            {message.content}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs opacity-80">
                {message.toolCalls.map((tool, toolIndex) => (
                  <li key={toolIndex}>Tool: {tool.toolName}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}

      <div aria-live="polite" aria-atomic="false" className="sr-only">
        {messages.length > 0 && (() => {
          const last = messages[messages.length - 1]!;
          return `${last.role === "user" ? "You" : "Assistant"}: ${last.content}`;
        })()}
      </div>

      {isStreaming && (
        <div
          role="status"
          aria-label="Assistant is responding"
          className="flex gap-1 px-3"
          data-testid="streaming-indicator"
        >
          <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted" />
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-text-muted"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-text-muted"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
