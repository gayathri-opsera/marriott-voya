"use client";

import * as React from "react";

export interface ComposerProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  prefill?: string;
}

export function Composer({
  onSend,
  onStop,
  isStreaming,
  disabled = false,
  prefill,
}: ComposerProps): React.JSX.Element {
  const [value, setValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Accept prefill from quick-reply chips
  React.useEffect(() => {
    if (prefill) {
      setValue(prefill);
      textareaRef.current?.focus();
    }
  }, [prefill]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 border-t border-border-default bg-surface-default px-4 py-3"
    >
      <textarea
        ref={textareaRef}
        aria-label="Message"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type a message…"
        rows={1}
        className="flex-1 resize-none rounded-xl border border-border-default bg-surface-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50 transition-shadow"
        style={{ maxHeight: "120px" }}
        onInput={(e) => {
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = `${el.scrollHeight}px`;
        }}
      />

      {/* Wireframe shows Stopped + Send both visible while streaming */}
      {isStreaming && (
        <button
          type="button"
          onClick={onStop}
          className="shrink-0 rounded-xl border border-border-default bg-surface-default px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-subtle transition-colors"
        >
          Stopped
        </button>
      )}

      <button
        type="submit"
        disabled={!canSend}
        className="shrink-0 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Send
      </button>
    </form>
  );
}
