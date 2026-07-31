"use client";

import * as React from "react";
import { Button } from "@travel/design-system";

export interface ComposerProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function Composer({
  onSend,
  onStop,
  isStreaming,
  disabled = false,
}: ComposerProps): React.JSX.Element {
  const [value, setValue] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border-default bg-surface-default px-4 py-3">
      <textarea
        aria-label="Message"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isStreaming}
        placeholder="Type a message..."
        rows={1}
        className="flex-1 resize-none rounded-md border border-border-default px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50"
      />
      {isStreaming ? (
        <Button type="button" variant="destructive" onClick={onStop}>
          Stop
        </Button>
      ) : (
        <Button type="submit" disabled={disabled || !value.trim()}>
          Send
        </Button>
      )}
    </form>
  );
}
