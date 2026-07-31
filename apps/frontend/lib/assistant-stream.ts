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

// ─── Extended types ───────────────────────────────────────────────────────────

export type InlineOffer = {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  currency: string;
  nights?: number;
  provenance: string;
  tag?: string;
  hvmiCollection?: string;
  isBookable: boolean;
  freshness: "live" | "cached";
  freshnessAge: string; // "12s", "3m", etc.
};

export type ToolCall = {
  toolName: string;
  input: unknown;
  status: "running" | "complete";
  resultCount?: number;
  resultLabel?: string;    // "Homes & Villas by Marriott Bonvoy"
  inlineOffers?: InlineOffer[];
};

export type TripDraftItem = {
  dates: string;
  label: string;
  detail: string;
  pricing?: number | null;  // null = "Pricing..."
};

export type Message = {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  chips?: string[];
  tripDraft?: TripDraftItem[];
  budgetCommitted?: number;
  budgetTotal?: number;
};

export type { StreamErrorKind };

// ─── Tool → display label map ─────────────────────────────────────────────────

const TOOL_LABELS: Record<string, { label: string; supplier: string }> = {
  search_hvmi_villas:          { label: "Homes & Villas by Marriott Bonvoy", supplier: "hvmi"    },
  search_marriott_hotels:      { label: "Marriott Hotels",                   supplier: "marriott" },
  search_bonvoy_tours_activities: { label: "Marriott Bonvoy Tours & Activities", supplier: "bonvoy" },
  search_flights:              { label: "partner flight suppliers",          supplier: "flights"  },
  search_local_transport:      { label: "partner car suppliers",             supplier: "cars"     },
  validate_destination:        { label: "destination validation",            supplier: "internal" },
  get_weather_forecast:        { label: "weather service",                   supplier: "weather"  },
  assemble_itinerary:          { label: "itinerary service",                 supplier: "internal" },
  calculate_bonvoy_points:     { label: "Bonvoy loyalty calculator",         supplier: "bonvoy"   },
};

// ─── Quick-reply chip suggestions per context ─────────────────────────────────

function deriveChips(content: string, tools: ToolCall[]): string[] {
  const lower = content.toLowerCase();
  const hasVilla   = lower.includes("villa") || lower.includes("hvmi");
  const hasCar     = lower.includes("car") || lower.includes("rental");
  const hasFlight  = lower.includes("flight") || lower.includes("airport");
  const hasBudget  = lower.includes("budget") || lower.includes("eur") || lower.includes("usd");
  const hasCoast   = lower.includes("coast") || lower.includes("cinque") || lower.includes("liguria");
  const hasTour    = lower.includes("tour") || lower.includes("walking") || lower.includes("wine");

  const chips: string[] = [];
  if (hasBudget)             chips.push("Keep it under EUR 3,500 total");
  if (hasFlight)             chips.push("Show me flights too");
  if (hasCoast)              chips.push("Price the coastal half");
  if (hasCar && !hasFlight)  chips.push("Add a rental car for the coast days");
  if (hasTour)               chips.push("Pencil in the walking tour");
  if (hasVilla)              chips.push("Prefer step-free access");
  chips.push("Looks good — review & book");
  return chips.slice(0, 3);
}

// ─── Fetch inline offers for a given tool ────────────────────────────────────

async function fetchInlineOffers(
  toolName: string,
  input: unknown,
  apiBase: string,
): Promise<{ offers: InlineOffer[]; count: number }> {
  const t0 = Date.now();
  try {
    let url = "";
    const q = (input as Record<string, string>)?.destination
           ?? (input as Record<string, string>)?.query
           ?? "Lucca";

    if (toolName === "search_hvmi_villas" || toolName === "search_marriott_hotels") {
      url = `${apiBase}/search?q=${encodeURIComponent(q)}&types=hotel`;
    } else if (toolName === "search_flights") {
      url = `${apiBase}/search?q=${encodeURIComponent(q)}&types=flight`;
    } else if (toolName === "search_local_transport") {
      url = `${apiBase}/search?q=${encodeURIComponent(q)}&types=car`;
    } else {
      return { offers: [], count: 0 };
    }

    const res = await fetch(url);
    const latencyMs = Date.now() - t0;
    if (!res.ok) return { offers: [], count: 0 };

    const data = await res.json() as { offers: RawOffer[]; total: number };
    const isHvmi = toolName === "search_hvmi_villas";
    const raw = isHvmi
      ? data.offers.filter((o) => (o.tag ?? "").startsWith("HVMI")).slice(0, 3)
      : data.offers.slice(0, 3);

    const freshnessAge = latencyMs < 500 ? `${latencyMs}ms` : `${(latencyMs / 1000).toFixed(0)}s`;

    const offers: InlineOffer[] = raw.map((o) => ({
      id:           o.id,
      title:        o.title,
      subtitle:     buildSubtitle(o, toolName),
      price:        o.price,
      currency:     o.currency ?? "EUR",
      nights:       toolName.includes("hotel") || toolName.includes("villa") ? 4 : undefined,
      provenance:   o.provenance,
      tag:          o.tag,
      hvmiCollection: o.hvmiCollection,
      isBookable:   o.bookable !== false && o.provenance !== "ILLUSTRATIVE",
      freshness:    latencyMs < 2000 ? "live" : "cached",
      freshnessAge,
    }));

    // Always add 1 illustrative "comparison" card for hotel searches
    if ((toolName === "search_hvmi_villas" || toolName === "search_marriott_hotels") && offers.length > 0) {
      offers.push({
        id:           "illustrative-coast",
        title:        "Typical coastal villa",
        subtitle:     "For the second half — comparison only",
        price:        "1400.00",
        currency:     "EUR",
        nights:       3,
        provenance:   "ILLUSTRATIVE",
        isBookable:   false,
        freshness:    "cached",
        freshnessAge: "—",
      });
    }

    return { offers, count: data.total ?? raw.length };
  } catch {
    return { offers: [], count: 0 };
  }
}

type RawOffer = {
  id: string;
  title: string;
  price: string;
  currency?: string;
  provenance: string;
  bookable?: boolean;
  tag?: string;
  hvmiCollection?: string;
  details?: Record<string, unknown>;
};

function buildSubtitle(o: RawOffer, toolName: string): string {
  if (toolName === "search_flights") {
    const d = o.details ?? {};
    return `${d["departureAirport"] ?? "?"} → ${d["arrivalAirport"] ?? "?"} · ${d["seatClass"] ?? "Economy"}`;
  }
  if (toolName.includes("hotel") || toolName.includes("villa")) {
    const d = o.details ?? {};
    const beds = typeof d["starRating"] === "number" ? `${d["starRating"]}★` : "";
    const room = (d["roomType"] as string) ?? "";
    return [beds, room].filter(Boolean).join(" · ");
  }
  if (toolName.includes("car") || toolName.includes("transport")) {
    const d = o.details ?? {};
    return `${d["vendor"] ?? ""} · ${d["carClass"] ?? ""}`;
  }
  return "";
}

// ─── Trip draft extraction ────────────────────────────────────────────────────

function extractTripDraft(messages: Message[]): TripDraftItem[] | null {
  const items: TripDraftItem[] = [];

  for (const msg of messages) {
    if (msg.role !== "assistant") continue;
    const c = msg.content;

    // Look for date patterns: "Sep 12–16 Lucca" or "September 10-17"
    const dateRanges = c.matchAll(/\b(Sep\w*\s+\d+[–\-]\d+|\d+\s*[–\-]\s*\d+\s+\w+)\s+(\w[\w\s,]+?)(?:\.|,|—|\n|$)/gi);
    for (const m of dateRanges) {
      if (items.length < 6) {
        items.push({ dates: m[1]?.trim() ?? "", label: m[2]?.trim() ?? "", detail: "", pricing: null });
      }
    }

    // Look for HVMI villa mentions
    const villaMatch = c.match(/Villa della Torre|Podere Sant['']Angelo|Casa della Pace|Villa Il Cortile|Casa dei Fiori/);
    if (villaMatch && items.length > 0) {
      const first = items.find(i => i.detail === "");
      if (first) first.detail = villaMatch[0];
    }

    // Look for activities
    if (c.includes("Serchio valley") || c.includes("walking route")) {
      const walkItem = items.find(i => i.label.toLowerCase().includes("walk") || i.label.toLowerCase().includes("lucca"));
      if (walkItem) walkItem.detail = "Serchio valley";
    }
    if (c.includes("Montecarlo") || c.includes("wine")) {
      const wineItem = items.find(i => i.label.toLowerCase().includes("wine") || i.label.toLowerCase().includes("montecarlo"));
      if (wineItem) wineItem.detail = "Montecarlo";
    }
  }

  return items.length > 0 ? items : null;
}

function extractBudget(messages: Message[]): { committed: number; total: number } | null {
  for (const msg of [...messages].reverse()) {
    if (msg.role !== "assistant") continue;
    const totalMatch = msg.content.match(/EUR\s*([\d,]+(?:\.\d+)?)\s*(?:budget|total)/i);
    const committedMatch = msg.content.match(/(?:committed|booked)\s+(?:so far\s+)?EUR\s*([\d,]+(?:\.\d+)?)/i);
    if (totalMatch) {
      const total = parseFloat(totalMatch[1]!.replace(",", ""));
      const committed = committedMatch ? parseFloat(committedMatch[1]!.replace(",", "")) : 0;
      return { committed, total };
    }
  }
  return null;
}

// ─── Main hook ────────────────────────────────────────────────────────────────

export function useAssistantStream(sessionId: string) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [errorKind, setErrorKind] = React.useState<StreamErrorKind | null>(null);
  const [activeTool, setActiveTool] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const [lastMessage, setLastMessage] = React.useState<string | null>(null);
  const [replyCount, setReplyCount] = React.useState(0);
  const sessionStartRef = React.useRef<number>(Date.now());
  const abortRef = React.useRef<AbortController | null>(null);

  // Elapsed time formatted as "Xm" or "X min"
  const [elapsedLabel, setElapsedLabel] = React.useState("0 min");
  React.useEffect(() => {
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      const mins = Math.floor(secs / 60);
      setElapsedLabel(mins < 1 ? `<1 min` : `${mins} min`);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

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

      const apiBase = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");

      if (attempt === 0) {
        setMessages((prev) => [
          ...prev,
          { role: "user", content: text },
          { role: "assistant", content: "", toolCalls: [] },
        ]);
      }

      const controller = new AbortController();
      abortRef.current = controller;
      const url = `${apiBase}/api/v1/ai/chat`;

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
            const toolName = chunk.toolName;
            setActiveTool(toolName);

            const toolInfo = TOOL_LABELS[toolName];
            const newCall: ToolCall = {
              toolName,
              input: chunk.input,
              status: "running",
              resultLabel: toolInfo?.label,
            };

            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") {
                next[next.length - 1] = {
                  ...last,
                  toolCalls: [...(last.toolCalls ?? []), newCall],
                };
              }
              return next;
            });

            // Fetch inline offers in the background for search tools
            if (["search_hvmi_villas", "search_flights", "search_local_transport", "search_marriott_hotels"].includes(toolName)) {
              fetchInlineOffers(toolName, chunk.input, apiBase).then(({ offers, count }) => {
                setMessages((prev) => {
                  const next = [...prev];
                  const lastMsg = next[next.length - 1];
                  if (lastMsg?.role === "assistant") {
                    const calls = (lastMsg.toolCalls ?? []).map((tc) =>
                      tc.toolName === toolName && tc.status === "running"
                        ? { ...tc, status: "complete" as const, inlineOffers: offers, resultCount: count }
                        : tc,
                    );
                    next[next.length - 1] = { ...lastMsg, toolCalls: calls };
                  }
                  return next;
                });
              });
            }

          } else if (chunk.type === "tool_result") {
            // Mark all running tool calls as complete
            setActiveTool(null);
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") {
                const calls = (last.toolCalls ?? []).map((tc) =>
                  tc.status === "running" ? { ...tc, status: "complete" as const } : tc,
                );
                next[next.length - 1] = { ...last, toolCalls: calls };
              }
              return next;
            });
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
            setReplyCount((c) => c + 1);
            // Add quick-reply chips to the last assistant message
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") {
                const chips = deriveChips(last.content, last.toolCalls ?? []);
                next[next.length - 1] = { ...last, chips };
              }
              return next;
            });
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

  // Derive trip draft from current messages
  const tripDraft = React.useMemo(() => extractTripDraft(messages), [messages]);
  const budget = React.useMemo(() => extractBudget(messages), [messages]);

  return {
    messages,
    isStreaming,
    error,
    errorKind,
    activeTool,
    retryCount,
    replyCount,
    elapsedLabel,
    tripDraft,
    budget,
    abort,
    send,
    retry,
  };
}
