"use client";

import * as React from "react";
import Link from "next/link";
import type { Message, ToolCall, InlineOffer } from "../../lib/assistant-stream";

// ─── Freshness badge ─────────────────────────────────────────────────────────

function FreshnessBadge({ freshness, age }: { freshness: "live" | "cached"; age: string }) {
  if (freshness === "live") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live · {age}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500 border border-stone-200">
      Cached · {age}
    </span>
  );
}

// ─── Source badge ────────────────────────────────────────────────────────────

function SourceBadge({ provenance, tag }: { provenance: string; tag?: string }) {
  const isHvmi = (tag ?? "").startsWith("HVMI");
  const isIllustr = provenance === "ILLUSTRATIVE";
  if (isIllustr) {
    return (
      <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 border border-blue-200">
        Illustrative — not bookable
      </span>
    );
  }
  if (isHvmi) {
    return (
      <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
        Homes & Villas
      </span>
    );
  }
  return (
    <span className="inline-block rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-medium text-brand-primary border border-brand-primary/20">
      Marriott
    </span>
  );
}

// ─── Inline offer card ───────────────────────────────────────────────────────

function InlineOfferCard({ offer }: { offer: InlineOffer }) {
  const isIllustr = offer.provenance === "ILLUSTRATIVE";
  const priceNum = parseFloat(offer.price);
  const priceStr = isNaN(priceNum)
    ? offer.price
    : new Intl.NumberFormat("en-GB", { style: "currency", currency: offer.currency, maximumFractionDigits: 2 })
        .format(priceNum);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border-default bg-surface-default p-3 shadow-sm">
      {/* Thumbnail placeholder */}
      <div className="h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
        <span className="text-lg">{isIllustr ? "🏖" : offer.provenance === "RAPIDAPI" ? "🏡" : "🏛"}</span>
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary leading-tight">{offer.title}</p>
        {offer.subtitle && (
          <p className="mt-0.5 truncate text-xs text-text-secondary">{offer.subtitle}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <SourceBadge provenance={offer.provenance} tag={offer.tag} />
          <FreshnessBadge freshness={offer.freshness} age={offer.freshnessAge} />
        </div>
      </div>

      {/* Price + CTA */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-text-primary">
          {priceStr}
        </p>
        {offer.nights && (
          <p className="text-xs text-text-secondary">{offer.nights} nights</p>
        )}
        {offer.isBookable ? (
          <Link
            href={`/checkout?offerId=${offer.id}`}
            className="mt-1.5 inline-block rounded-lg bg-brand-primary px-3 py-1 text-xs font-semibold text-white hover:bg-brand-primary/90 transition-colors"
          >
            Reserve
          </Link>
        ) : (
          <span className="mt-1.5 inline-block text-xs text-text-tertiary">Reference</span>
        )}
      </div>
    </div>
  );
}

// ─── Tool consultation strip ─────────────────────────────────────────────────

function ConsultationStrip({ tool }: { tool: ToolCall }) {
  if (tool.status === "running") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-surface-subtle px-3 py-1.5 text-xs text-text-secondary border border-border-default">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-primary border-t-transparent shrink-0" />
        <span>Consulting {tool.resultLabel ?? tool.toolName.replace(/_/g, " ")}…</span>
      </div>
    );
  }

  if (!tool.resultLabel) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-emerald-700">
      <svg className="h-3.5 w-3.5 shrink-0 text-emerald-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
      </svg>
      <span>
        Consulted {tool.resultLabel}
        {tool.resultCount ? ` · ${tool.resultCount} result${tool.resultCount !== 1 ? "s" : ""}` : ""}
      </span>
    </div>
  );
}

// ─── Quick-reply chips ────────────────────────────────────────────────────────

function QuickReplyChips({ chips, onSend }: { chips: string[]; onSend: (t: string) => void }) {
  if (!chips.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onSend(chip)}
          className="rounded-full border border-border-default bg-surface-default px-3 py-1 text-xs text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-colors"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isLast,
  onSend,
}: {
  message: Message;
  isLast: boolean;
  onSend: (t: string) => void;
}) {
  const isUser = message.role === "user";
  const hasOffers = (message.toolCalls ?? []).some((tc) => (tc.inlineOffers ?? []).length > 0);

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[72%]">
          <div className="rounded-2xl rounded-br-sm bg-brand-primary px-4 py-2.5 text-sm text-white">
            {message.content}
          </div>
          <p className="mt-1 text-right text-xs text-text-tertiary">You</p>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex gap-3 items-start">
      {/* Avatar */}
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
        V
      </div>

      <div className="min-w-0 flex-1 max-w-[85%]">
        {/* Text bubble */}
        {message.content && (
          <div className="rounded-2xl rounded-tl-sm border border-border-default bg-surface-default px-4 py-3 text-sm text-text-primary shadow-sm leading-relaxed">
            {message.content}

            {/* Tool consultation strips within the bubble */}
            {(message.toolCalls ?? []).length > 0 && (
              <div className="mt-3 space-y-2">
                {(message.toolCalls ?? []).map((tc, i) => (
                  <ConsultationStrip key={`${tc.toolName}-${i}`} tool={tc} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Inline offer cards BELOW the bubble */}
        {hasOffers && (
          <div className="mt-2 space-y-2">
            {(message.toolCalls ?? []).flatMap((tc) =>
              (tc.inlineOffers ?? []).map((offer) => (
                <InlineOfferCard key={offer.id} offer={offer} />
              ))
            )}
          </div>
        )}

        {/* Quick-reply chips on last assistant message */}
        {isLast && (message.chips ?? []).length > 0 && (
          <QuickReplyChips chips={message.chips!} onSend={onSend} />
        )}
      </div>
    </div>
  );
}

// ─── Main MessageStream ───────────────────────────────────────────────────────

export interface MessageStreamProps {
  messages: Message[];
  isStreaming: boolean;
  onSend: (text: string) => void;
}

export function MessageStream({ messages, isStreaming, onSend }: MessageStreamProps): React.JSX.Element {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5">
      {messages.map((message, index) => (
        <MessageBubble
          key={`${message.role}-${index}`}
          message={message}
          isLast={index === messages.length - 1}
          onSend={onSend}
        />
      ))}

      {/* Screen-reader live region */}
      <div aria-live="polite" aria-atomic="false" className="sr-only">
        {messages.length > 0 && (() => {
          const last = messages[messages.length - 1]!;
          return `${last.role === "user" ? "You" : "Assistant"}: ${last.content}`;
        })()}
      </div>

      {/* Streaming typing indicator */}
      {isStreaming && (
        <div className="flex gap-3 items-start">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
            V
          </div>
          <div
            role="status"
            aria-label="Assistant is responding"
            className="rounded-2xl rounded-tl-sm border border-border-default bg-surface-default px-4 py-3 shadow-sm"
            data-testid="streaming-indicator"
          >
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
