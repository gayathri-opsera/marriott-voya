"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "../../components/ui/Toast";
import { StateBoundary } from "../../components/patterns/StateBoundary";
import { createSession } from "../../lib/assistant-session";
import { useAssistantStream } from "../../lib/assistant-stream";
import type { Message, TripDraftItem } from "../../lib/assistant-stream";

// ─── Trip draft panel (right column) ─────────────────────────────────────────

function TripDraftSidebar({
  items,
  budgetCommitted = 0,
  budgetTotal = 3500,
  onReviewClick,
}: {
  items: TripDraftItem[];
  budgetCommitted?: number;
  budgetTotal?: number;
  onReviewClick?: () => void;
}) {
  const pct = Math.min(100, Math.round((budgetCommitted / budgetTotal) * 100));

  return (
    <div
      className="flex w-52 shrink-0 flex-col gap-0 overflow-y-auto border-l border-white/10"
      style={{ backgroundColor: "var(--voya-surface-2)" }}
    >
      <div className="border-b border-white/10 px-3 py-2.5">
        <p className="text-xs font-semibold text-white">Trip draft</p>
        <p className="text-xs text-white/35">Nothing is booked until you review and pay.</p>
      </div>

      {items.length === 0 ? (
        <div className="px-3 py-4 text-xs text-white/25">Items will appear here as you plan.</div>
      ) : (
        <div className="divide-y divide-white/8">
          {items.map((item, i) => (
            <div key={i} className="px-3 py-2">
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white/50">{item.dates}</p>
                  <p className="text-xs font-medium text-white leading-tight truncate">{item.label}</p>
                </div>
                <p className="shrink-0 text-xs text-white/40 text-right">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {budgetCommitted > 0 && (
        <div className="border-t border-white/10 px-3 py-2.5">
          <p className="mb-1 text-xs text-white/40">
            Committed so far{" "}
            <span className="font-semibold text-white">EUR {budgetCommitted.toLocaleString()}.00</span>
            {" "}of EUR {budgetTotal.toLocaleString()} budget
          </p>
          <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: "var(--voya-accent-f1)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: "var(--voya-accent-btn)" }}
            />
          </div>
        </div>
      )}

      <div className="mt-auto space-y-2 border-t border-white/10 px-3 py-3">
        <button
          type="button"
          onClick={onReviewClick}
          className="w-full rounded py-2 text-xs font-semibold text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: "var(--voya-accent-btn)" }}
        >
          Review &amp; book this trip
        </button>
        <Link
          href="/search"
          className="block w-full rounded border border-white/15 py-2 text-center text-xs text-white/50 hover:text-white transition-colors"
        >
          Open in search results
        </Link>
      </div>

      {/* Recovery states */}
      <div className="border-t border-white/10 px-3 py-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/25">Recovery states</p>
        <p className="text-xs text-white/25 leading-relaxed">Every failure keeps your transcript and offers a next step.</p>
        <div className="space-y-1.5">
          <div className="rounded border border-white/10 p-2">
            <p className="text-xs text-amber-400 mb-1">Stream interrupted. Your partial reply was kept.</p>
            <div className="flex gap-1.5">
              <button type="button" className="rounded px-2 py-0.5 text-xs text-white" style={{ backgroundColor: "var(--voya-accent-btn)" }}>Retry</button>
              <button type="button" className="rounded border border-white/15 px-2 py-0.5 text-xs text-white/50">New session</button>
            </div>
          </div>
          <div className="rounded border border-white/10 p-2">
            <p className="text-xs text-white/35">Reply allowance reached for this session. Start a new session or continue in search.</p>
          </div>
          <div className="rounded border border-white/10 p-2">
            <p className="text-xs text-sky-400">Offline. The transcript is readable; sending resumes when you reconnect.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inline offer card ────────────────────────────────────────────────────────

function InlineOfferChip({
  title,
  subtitle,
  price,
  source,
  isLive,
  href,
}: {
  title: string;
  subtitle: string;
  price: string;
  source: string;
  isLive: boolean;
  href: string;
}) {
  return (
    <div
      className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2.5 mb-2"
      style={{ backgroundColor: "var(--voya-accent-f1)" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="h-9 w-10 shrink-0 rounded"
          style={{ background: `hsl(${title.charCodeAt(0) * 37 % 360}, 40%, 28%)` }}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-white leading-tight truncate">{title}</p>
          <p className="text-xs text-white/40">{subtitle}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="inline-block rounded px-1.5 py-0.5 text-xs font-medium" style={{ backgroundColor: "var(--voya-amber-f)", color: "var(--voya-amber)" }}>
              {source}
            </span>
            <span className="text-xs" style={{ color: isLive ? "#4ade80" : "#fbbf24" }}>
              <span className="inline-block h-1.5 w-1.5 rounded-full mr-0.5 align-middle" style={{ backgroundColor: isLive ? "#4ade80" : "#fbbf24" }} />
              {isLive ? `Live · ${Math.floor(Math.random()*15+2)}s` : `Cached · ${Math.floor(Math.random()*5+1)}m`}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
        <p className="text-sm font-semibold text-white">{price}</p>
        <Link
          href={href}
          className="rounded px-3 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: "var(--voya-accent-btn)" }}
        >
          Reserve
        </Link>
      </div>
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

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div
          className="max-w-[70%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white"
          style={{ backgroundColor: "var(--voya-accent-f2)" }}
        >
          {message.content}
        </div>
        <span className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white self-end" style={{ backgroundColor: "var(--voya-surface-2)" }}>
          You
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 mb-4">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: "var(--voya-accent-btn)" }}>
        V
      </div>
      <div className="min-w-0 flex-1 max-w-[85%]">
        {/* Tool use indicators */}
        {(message.toolCalls ?? []).map((tc, i) => (
          <div key={i} className="mb-2 flex items-center gap-1.5 text-xs text-white/50">
            <span style={{ color: "var(--voya-green)" }}>✓</span>
            Consulted {tc.toolName.replace(/_/g, " ")}{tc.resultCount ? `: ${tc.resultCount} results` : ""}
          </div>
        ))}

        {/* Text */}
        {message.content && (
          <div
            className="rounded-2xl rounded-tl-sm border border-white/10 px-4 py-3 text-sm text-white/85 leading-relaxed"
            style={{ backgroundColor: "var(--voya-chip-bg)" }}
          >
            {message.content}
          </div>
        )}

        {/* Inline offers */}
        {(message.toolCalls ?? []).some(tc => (tc.inlineOffers ?? []).length > 0) && (
          <div className="mt-2">
            {(message.toolCalls ?? []).flatMap(tc =>
              (tc.inlineOffers ?? []).map(offer => (
                <InlineOfferChip
                  key={offer.id}
                  title={offer.title}
                  subtitle={offer.subtitle}
                  price={`EUR ${offer.price}`}
                  source={offer.provenance ?? "Homes & Villas"}
                  isLive={offer.freshness === "live"}
                  href={`/checkout?offerId=${offer.id}`}
                />
              ))
            )}
          </div>
        )}

        {/* Chips */}
        {isLast && (message.chips ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(message.chips ?? []).map(chip => (
              <button
                key={chip}
                type="button"
                onClick={() => onSend(chip)}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60 hover:text-white transition-colors"
                style={{ backgroundColor: "var(--voya-chip-bg)" }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Composer ────────────────────────────────────────────────────────────────

function Composer({
  onSend,
  onStop,
  isStreaming,
  prefill,
}: {
  onSend: (t: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  prefill?: string;
}) {
  const [text, setText] = React.useState(prefill ?? "");
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (prefill) setText(prefill);
  }, [prefill]);

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };

  return (
    <form
      onSubmit={e => { e.preventDefault(); submit(); }}
      className="flex items-end gap-2 border-t border-white/10 px-4 py-3"
      style={{ backgroundColor: "var(--voya-surface-2)" }}
    >
      <textarea
        ref={ref}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder='Ask for a change, or say "show me cheaper villas"'
        rows={1}
        className="flex-1 resize-none rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-white/30 focus:outline-none"
        style={{ backgroundColor: "var(--voya-accent-f1)" }}
        disabled={isStreaming}
      />
      {isStreaming && (
        <button
          type="button"
          onClick={onStop}
          className="rounded px-3 py-2 text-xs font-medium text-white/70 border border-white/15 hover:text-white transition-colors"
        >
          Stopped
        </button>
      )}
      <button
        type="submit"
        disabled={isStreaming || !text.trim()}
        className="rounded px-4 py-2 text-xs font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-85"
        style={{ backgroundColor: "var(--voya-accent-btn)" }}
      >
        Send
      </button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssistantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [initError, setInitError] = React.useState<Error | null>(null);
  const [initLoading, setInitLoading] = React.useState(true);
  const [composerPrefill, setComposerPrefill] = React.useState<string | undefined>();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const prefillParam = searchParams?.get("prefill");

  const {
    messages, isStreaming, errorKind, error,
    activeTool, retryCount, replyCount, elapsedLabel,
    tripDraft, budget, send, abort, retry,
  } = useAssistantStream(sessionId ?? "");

  const startSession = React.useCallback(() => {
    setInitLoading(true);
    setInitError(null);
    createSession()
      .then(({ sessionId: id }) => {
        setSessionId(id);
        if (prefillParam) {
          setTimeout(() => send(prefillParam), 300);
        }
      })
      .catch(() => {
        setInitError(new Error("Failed to start session"));
        addToast({ title: "Failed to start assistant session", variant: "error" });
      })
      .finally(() => setInitLoading(false));
  }, [addToast, prefillParam]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => { startSession(); }, [startSession]);

  React.useEffect(() => {
    if (errorKind === "session_expired") {
      addToast({ title: "Session expired", variant: "warning" });
      router.push("/auth/login");
    }
  }, [errorKind, addToast, router]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleNewSession = () => {
    setSessionId(null);
    startSession();
  };

  const showWelcome = messages.length === 0 && !isStreaming;
  const draftItems: TripDraftItem[] = tripDraft ?? [];

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 3.5rem)", backgroundColor: "var(--voya-bg)" }}>

      {/* ── Session bar ────────────────────────────────────────────────────── */}
      <header
        className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2"
        style={{ backgroundColor: "var(--voya-surface-2)", borderColor: "var(--voya-accent-f2)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #9184d9, #5d5294)" }}>V</div>
            <span className="text-sm font-semibold" style={{ color: "var(--voya-text)" }}>voya</span>
            <span className="rounded px-1.5 py-0.5 text-xs font-medium" style={{ background: "var(--voya-accent-f2)", color: "var(--voya-accent-lt)" }}>Assistant</span>
          </div>
          <span className="hidden text-xs text-white/35 sm:inline">
            Session {elapsedLabel} · {replyCount} of 40 replies used
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="rounded border border-white/15 px-3 py-1 text-xs text-white/50 hover:text-white transition-colors"
          >
            Switch to search
          </Link>
          <button
            type="button"
            onClick={handleNewSession}
            className="flex items-center gap-1.5 rounded border border-white/15 px-3 py-1 text-xs text-white/50 hover:text-white transition-colors"
          >
            New session
            <span className="text-sm">🌙</span>
          </button>
        </div>
      </header>

      {/* ── Main: chat + right panel ────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">

        {/* Chat */}
        <div className="flex min-w-0 flex-1 flex-col">
          <StateBoundary
            state={initLoading ? "loading" : initError ? "error" : "idle"}
            error={initError}
            onRetry={startSession}
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
              {showWelcome ? (
                <div className="flex h-full flex-col items-center justify-center text-center px-4 py-6">
                  {/* Voya logo */}
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold text-white"
                    style={{ background: "radial-gradient(135deg, #9184d9 0%, #5d5294 100%)" }}>V</div>
                  <p className="mb-1 text-xl font-semibold" style={{ color: "var(--voya-text)" }}>AI vacation planning</p>
                  <p className="mb-1 text-sm font-medium" style={{ color: "var(--voya-accent)" }}>Plan the trip. Skip the tabs.</p>
                  <p className="mb-6 max-w-sm text-sm" style={{ color: "var(--voya-text-3)" }}>
                    Tell me what you enjoy — I&apos;ll search Homes &amp; Villas, Bonvoy Tours, and flights for you.
                  </p>

                  {/* Preference chips (from design) */}
                  <p className="mb-3 text-xs font-medium" style={{ color: "var(--voya-text-2)" }}>What matters most on this trip?</p>
                  <div className="mb-6 flex flex-wrap justify-center gap-2 max-w-lg">
                    {[
                      { label: "Countryside stay",        icon: "🌿" },
                      { label: "Food & wine focus",       icon: "🍷" },
                      { label: "Walkable historic towns", icon: "🏛️" },
                      { label: "Beach & coast",           icon: "🌊" },
                      { label: "Nightlife & city energy", icon: "✨" },
                      { label: "Art & history",           icon: "🎨" },
                    ].map(p => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => { if (sessionId) send(`My priority is: ${p.label}. Find me HVMI villas in Tuscany for September.`); }}
                        style={{ background: "var(--voya-accent-f1)", border: "1px solid var(--voya-border)", borderRadius: 20 }}
                        className="px-3 py-1.5 text-xs transition-all hover:bg-[var(--voya-accent-f2)]"
                      >
                        <span style={{ color: "var(--voya-accent-lt)" }}>{p.icon} {p.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Destination chips */}
                  <p className="mb-3 text-xs font-medium" style={{ color: "var(--voya-text-2)" }}>Or start with a trip idea</p>
                  <div className="grid max-w-lg grid-cols-1 gap-2 sm:grid-cols-2 w-full">
                    {[
                      "A week somewhere warm, we like walking",
                      "Villa near Lucca for 4 nights in September",
                      "Family half-term, short flight, pool",
                      "Rebuild my Tuscany trip around a wine tour",
                    ].map(chip => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => { if (sessionId) send(chip); }}
                        style={{ background: "rgba(145,132,217,0.06)", border: "1px solid var(--voya-accent-f2)", borderRadius: 10 }}
                        className="px-3 py-2.5 text-left text-xs transition-colors hover:bg-[var(--voya-accent-f1)]"
                      >
                        <span style={{ color: "var(--voya-text-2)" }}>{chip}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <MessageBubble
                      key={i}
                      message={msg}
                      isLast={i === messages.length - 1}
                      onSend={(t) => { setComposerPrefill(t); }}
                    />
                  ))}
                  {isStreaming && activeTool && (
                    <div className="mb-3 ml-9 flex items-center gap-1.5 text-xs text-white/40">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                      Consulting {activeTool.replace(/_/g, " ")}…
                    </div>
                  )}
                  {errorKind && errorKind !== "session_expired" && (
                    <div className="mb-3 ml-9 rounded border border-white/10 p-3 text-xs">
                      <p className="text-red-400 mb-2">{error ?? "Something went wrong."}</p>
                      <button type="button" onClick={retry} className="rounded px-2 py-1 text-xs text-white" style={{ backgroundColor: "var(--voya-accent-btn)" }}>
                        Retry
                      </button>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </StateBoundary>

          {/* Quick chips */}
          {messages.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t px-4 py-2"
              style={{ backgroundColor: "var(--voya-surface-2)", borderColor: "var(--voya-accent-f1)" }}>
              {["Keep it under EUR 3,500 total", "Prefer step-free access", "Show me flights too", "Add a beach day", "Can I extend by 2 nights?"].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => { if (sessionId) send(chip); }}
                  style={{ background: "var(--voya-chip-bg)", border: "1px solid var(--voya-accent-f2)", borderRadius: 20 }}
                  className="px-3 py-1 text-xs transition-colors hover:bg-[rgba(145,132,217,0.18)]"
                >
                  <span style={{ color: "var(--voya-text-2)" }}>{chip}</span>
                </button>
              ))}
            </div>
          )}

          {/* Composer */}
          <Composer
            onSend={(t) => { if (sessionId) send(t); }}
            onStop={abort}
            isStreaming={isStreaming}
            {...(composerPrefill != null ? { prefill: composerPrefill } : {})}
          />
        </div>

        {/* Right panel: Trip draft */}
        <TripDraftSidebar
          items={draftItems}
          budgetCommitted={budget?.committed ?? 0}
          budgetTotal={budget?.total ?? 3500}
          onReviewClick={() => router.push("/itineraries")}
        />
      </div>
    </div>
  );
}
