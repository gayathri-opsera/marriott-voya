"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// ─── Dynamic Leaflet map (no SSR) ─────────────────────────────────────────────
const LeafletMap = dynamic(
  () => import("../../components/assistant/LeafletMap").then(m => m.LeafletMap),
  { ssr: false, loading: () => <div className="w-full h-full animate-pulse" style={{ background: "var(--voya-surface-2)" }} /> }
);

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentStatus = "idle" | "running" | "done" | "error" | "queued" | "timeout";
type AgentState  = { name: string; label: string; status: AgentStatus; result?: object };
type Property    = {
  id: string; name: string; collection: string; location: string;
  pricePerNight: number; totalPrice: number; currency: string;
  rating: number; reviews: number; bedrooms: number;
  amenities: string[]; photo: string;
  marriottOwned: boolean; badge: string;
  coordinates?: { lat: number; lng: number };
  bonvoyPoints: number;
  nights?: number;
};
type ChatMessage = {
  id: string; role: "user" | "assistant"; content: string;
  toolCalls?: { toolName: string; status: AgentStatus }[];
};
type TripContext = {
  destination: string; checkIn: string; checkOut: string;
  guests: number; budget: number; currency: string; bonvoyPoints: number;
};

// ─── Agent definitions ────────────────────────────────────────────────────────

const AGENT_DEFS: { key: string; label: string; toolName: string }[] = [
  { key: "safety",      label: "Safety",       toolName: "validate_safety"     },
  { key: "budget",      label: "Budget",        toolName: "check_budget"        },
  { key: "stays",       label: "Stays",         toolName: "search_properties"   },
  { key: "dining",      label: "Dining",        toolName: "search_restaurants"  },
  { key: "weather",     label: "Weather",       toolName: "get_weather"         },
  { key: "flights",     label: "Flights",       toolName: "search_flights"      },
  { key: "activities",  label: "Activities",    toolName: "search_activities"   },
  { key: "attractions", label: "Attractions",   toolName: "search_attractions"  },
  { key: "transport",   label: "Transport",     toolName: "search_transport"    },
  { key: "itinerary",   label: "Itinerary",     toolName: "build_itinerary"     },
];

const CUR_SYM: Record<string, string> = { USD: "$", GBP: "£", EUR: "€", INR: "₹" };

// ─── Agent chip ───────────────────────────────────────────────────────────────

function AgentChip({ agent }: { agent: AgentState }) {
  const s = agent.status;
  const palette: Record<AgentStatus, { bg: string; text: string }> = {
    idle:    { bg: "transparent",            text: "var(--voya-text-4, #94a3b8)" },
    queued:  { bg: "rgba(245,158,11,0.10)",  text: "#f59e0b" },
    running: { bg: "rgba(59,130,246,0.13)",  text: "#60a5fa" },
    done:    { bg: "rgba(16,185,129,0.12)",  text: "#34d399" },
    error:   { bg: "rgba(239,68,68,0.12)",   text: "#f87171" },
    timeout: { bg: "rgba(239,68,68,0.08)",   text: "#fb923c" },
  };
  const { bg, text } = palette[s];
  const suffix =
    s === "done"    ? " ✓"       :
    s === "running" ? " ·"       :
    s === "queued"  ? " — queued":
    s === "timeout" ? " × timed out" : "";

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: bg, color: text, border: "1px solid rgba(128,128,128,0.15)" }}
    >
      {s === "running" && (
        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      )}
      {agent.label}{suffix}
    </span>
  );
}

// ─── Compact property row (left panel) ────────────────────────────────────────

function PropertyRow({ prop, sym, onSelect, selected }: {
  prop: Property; sym: string;
  onSelect: (p: Property) => void;
  selected: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl p-2 cursor-pointer transition-all"
      style={{
        background: selected ? "var(--voya-accent-f1, rgba(60,122,145,0.08))" : "var(--voya-surface)",
        border: selected ? "1px solid var(--voya-accent)" : "1px solid var(--voya-border)",
        marginBottom: 6,
      }}
      onClick={() => onSelect(prop)}
    >
      <div style={{ position: "relative", width: 60, height: 48, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
        <Image src={prop.photo} alt={prop.name} fill sizes="60px" className="object-cover" unoptimized />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ background: prop.marriottOwned ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)",
              color: prop.marriottOwned ? "#059669" : "#2563eb" }}>
            {prop.marriottOwned ? "Marriott owned" : "Partner"}
          </span>
          <span className="text-[10px] rounded-full px-1.5 py-0.5"
            style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}>
            ✓ Verified
          </span>
        </div>
        <p className="text-xs font-semibold truncate" style={{ color: "var(--voya-text)" }}>{prop.name}</p>
        <p className="text-xs" style={{ color: "var(--voya-text-3)" }}>
          <strong style={{ color: "var(--voya-text)" }}>{sym}{prop.pricePerNight.toLocaleString()}</strong>/night
        </p>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <Link
          href={`/listings/${prop.id}`}
          onClick={e => e.stopPropagation()}
          className="rounded-lg px-2.5 py-1 text-[10px] font-semibold text-center"
          style={{ background: "var(--voya-surface-2)", border: "1px solid var(--voya-border)", color: "var(--voya-text)", textDecoration: "none" }}
        >
          View dates
        </Link>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onSelect(prop); }}
          className="rounded-lg px-2.5 py-1 text-[10px] font-semibold text-white"
          style={{ background: "var(--voya-accent)" }}
        >
          + Add
        </button>
      </div>
    </div>
  );
}

// ─── Grid property card (right panel) ─────────────────────────────────────────

function PropertyGridCard({ prop, sym, onSelect, selected }: {
  prop: Property; sym: string;
  onSelect: (p: Property) => void;
  selected: boolean;
}) {
  const nights = prop.nights ?? prop.totalPrice / Math.max(prop.pricePerNight, 1);
  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer transition-all"
      style={{
        background: "var(--voya-surface)",
        border: selected ? "2px solid var(--voya-accent)" : "1px solid var(--voya-border)",
        boxShadow: selected ? "0 0 0 3px var(--voya-accent-f1)" : "var(--voya-shadow-sm, none)",
      }}
      onClick={() => onSelect(prop)}
    >
      <div style={{ position: "relative", height: 140 }}>
        <Image src={prop.photo} alt={prop.name} fill sizes="320px" className="object-cover" unoptimized />
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ background: prop.marriottOwned ? "#059669" : "#2563eb", color: "#fff" }}>
            {prop.marriottOwned ? "Marriott owned" : "Partner"}
          </span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ background: "rgba(255,255,255,0.9)", color: "#059669" }}>
            ✓ Verified
          </span>
        </div>
        <div className="absolute top-2 right-2 rounded-full px-1.5 py-0.5 text-[11px] font-bold"
          style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}>
          ★ {prop.rating.toFixed(1)}
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs font-bold leading-snug mb-0.5" style={{ color: "var(--voya-text)" }}>{prop.name}</p>
        <p className="text-[10px] mb-1.5 truncate" style={{ color: "var(--voya-text-3)" }}>{prop.location}</p>
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-sm font-bold" style={{ color: "var(--voya-text)" }}>
              {sym}{prop.totalPrice.toLocaleString()}
            </span>
            <span className="text-[10px] ml-1" style={{ color: "var(--voya-text-3)" }}>
              total · {Math.round(nights)} nights
            </span>
          </div>
          <Link
            href={`/listings/${prop.id}`}
            onClick={e => e.stopPropagation()}
            className="rounded-lg px-2.5 py-1 text-[10px] font-semibold text-white"
            style={{ background: "var(--voya-accent)", textDecoration: "none" }}
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────

function RenderText({ text }: { text: string }) {
  return (
    <div className="text-sm leading-relaxed space-y-1" style={{ color: "var(--voya-text)" }}>
      {text.split("\n").map((line, i) => {
        if (line.startsWith("# "))  return <p key={i} className="font-bold text-base">{line.slice(2)}</p>;
        if (line.startsWith("## ")) return <p key={i} className="font-semibold">{line.slice(3)}</p>;
        if (line.startsWith("- ") || line.startsWith("• ")) return <p key={i} className="pl-3">· {line.slice(2)}</p>;
        if (line.startsWith("✓ "))  return <p key={i} className="pl-3" style={{ color: "#34d399" }}>✓ {line.slice(2)}</p>;
        if (line === "") return <div key={i} className="h-1" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>{parts.map((pt, j) =>
            pt.startsWith("**") && pt.endsWith("**") ? <strong key={j}>{pt.slice(2, -2)}</strong> : pt
          )}</p>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AssistantPage() {
  const searchParams = useSearchParams();
  const [messages, setMessages]   = React.useState<ChatMessage[]>([]);
  const [agents, setAgents]       = React.useState<Record<string, AgentState>>(() =>
    Object.fromEntries(AGENT_DEFS.map(a => [a.key, { name: a.key, label: a.label, status: "idle" as AgentStatus }]))
  );
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [mapCenter, setMapCenter]   = React.useState<{ lat: number; lng: number } | undefined>();
  const [tripCtx, setTripCtx]       = React.useState<TripContext>({
    destination: "", checkIn: "", checkOut: "", guests: 2, budget: 0, currency: "USD", bonvoyPoints: 0,
  });
  const [input, setInput]           = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [sessionId]                 = React.useState(() => `session-${Date.now()}`);
  const [selectedProp, setSelectedProp] = React.useState<Property | null>(null);
  const [quickReplies, setQuickReplies] = React.useState<string[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const abortRef       = React.useRef<(() => void) | null>(null);

  // Pre-fill from landing page chips
  React.useEffect(() => {
    const pf = searchParams?.get("prefill");
    if (pf) setInput(decodeURIComponent(pf));
  }, [searchParams]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Extract trip context from message
  function extractContext(msg: string) {
    const destMatch   = msg.match(/(?:visit|go to|in|to)\s+([A-Za-z][A-Za-z\s,]+?)(?:\s+for|\s+in\s+\d|\s+on|[.?]|$)/i);
    const guestMatch  = msg.match(/(\d+)\s*(?:guest|person|people|adult|travell)/i);
    const budgetMatch = msg.match(/(?:budget|£|\$|€|₹)\s*([\d,]+)/i);
    const dateMatch   = msg.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i);

    setTripCtx(prev => {
      const u = { ...prev };
      if (destMatch?.[1]) u.destination = destMatch[1].trim();
      if (guestMatch?.[1]) u.guests = parseInt(guestMatch[1]);
      if (budgetMatch?.[1]) u.budget = parseInt(budgetMatch[1].replace(/,/g, ""));
      if (dateMatch) {
        const MONTHS: Record<string, string> = {
          january: "01", february: "02", march: "03", april: "04",
          may: "05", june: "06", july: "07", august: "08",
          september: "09", october: "10", november: "11", december: "12",
        };
        const m = MONTHS[dateMatch[1].toLowerCase()];
        if (m) { u.checkIn = `${dateMatch[2]}-${m}-10`; u.checkOut = `${dateMatch[2]}-${m}-20`; }
      }
      const d = ((destMatch?.[1] ?? prev.destination) ?? "").toLowerCase();
      if (["india", "hyderabad", "mumbai", "delhi", "bangalore"].some(k => d.includes(k))) u.currency = "INR";
      else if (["uk", "london", "england", "britain", "amalfi", "positano", "tuscany", "lucca", "italy", "europe", "france", "spain"].some(k => d.includes(k))) u.currency = d.includes("amalfi") || d.includes("italy") || d.includes("tuscany") ? "EUR" : "GBP";
      else u.currency = "USD";
      return u;
    });
  }

  function updateAgent(toolName: string, status: AgentStatus, result?: object) {
    const def = AGENT_DEFS.find(a => a.toolName === toolName);
    if (!def) return;
    setAgents(prev => ({ ...prev, [def.key]: { ...prev[def.key], status, result } }));
  }

  function handlePropertyResult(result: object) {
    const r = result as { results?: Property[]; mapCenter?: { lat: number; lng: number }; currency?: string };
    if (r.results?.length) {
      setProperties(r.results);
      if (r.mapCenter) setMapCenter(r.mapCenter);
      if (r.currency)  setTripCtx(prev => ({ ...prev, currency: r.currency! }));
    }
  }

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || isStreaming) return;

    setInput("");
    extractContext(msg);
    setQuickReplies([]);

    const userMsg: ChatMessage      = { id: `u-${Date.now()}`, role: "user",      content: msg };
    const assistantMsg: ChatMessage = { id: `a-${Date.now()}`, role: "assistant", content: "", toolCalls: [] };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    // Mark idle agents as queued
    setAgents(prev => {
      const u = { ...prev };
      for (const k of Object.keys(u)) if (u[k].status === "idle") u[k] = { ...u[k], status: "queued" };
      return u;
    });

    let aborted = false;
    const controller = new AbortController();
    abortRef.current = () => { aborted = true; controller.abort(); };

    try {
      const resp = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: msg }),
        signal: controller.signal,
      });
      if (!resp.body) throw new Error("No response body");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (!aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6)) as {
              type: string; content?: string; toolName?: string; result?: object; message?: string;
            };

            if (evt.type === "delta" && evt.content) {
              setMessages(prev => {
                const msgs = [...prev];
                const last = msgs[msgs.length - 1];
                if (last?.role === "assistant") msgs[msgs.length - 1] = { ...last, content: last.content + evt.content };
                return msgs;
              });
            }

            if (evt.type === "tool_start" && evt.toolName) {
              updateAgent(evt.toolName, "running");
              setMessages(prev => {
                const msgs = [...prev];
                const last = msgs[msgs.length - 1];
                if (last?.role === "assistant") {
                  msgs[msgs.length - 1] = {
                    ...last,
                    toolCalls: [...(last.toolCalls ?? []), { toolName: evt.toolName!, status: "running" }],
                  };
                }
                return msgs;
              });
            }

            if (evt.type === "tool_result" && evt.toolName && evt.result) {
              updateAgent(evt.toolName, "done", evt.result);
              if (evt.toolName === "search_properties") handlePropertyResult(evt.result);
              if (evt.toolName === "validate_safety") {
                const r = evt.result as { coordinates?: { lat: number; lng: number } };
                if (r.coordinates) setMapCenter(r.coordinates);
              }
              if (evt.toolName === "check_budget") {
                const r = evt.result as { bonvoyPointsTotal?: number };
                if (r.bonvoyPointsTotal) setTripCtx(prev => ({ ...prev, bonvoyPoints: r.bonvoyPointsTotal! }));
              }
              if (evt.toolName === "search_flights") {
                const r = evt.result as { results?: { from?: string }[] };
                const froms = [...new Set((r.results ?? []).map(f => f.from).filter(Boolean))];
                if (froms.length > 0) {
                  setQuickReplies([
                    ...froms.slice(0, 2).map(f => `Flying from ${f}`),
                    "No flights needed",
                  ]);
                }
              }
              setMessages(prev => {
                const msgs = [...prev];
                const last = msgs[msgs.length - 1];
                if (last?.role === "assistant") {
                  msgs[msgs.length - 1] = {
                    ...last,
                    toolCalls: (last.toolCalls ?? []).map(tc =>
                      tc.toolName === evt.toolName ? { ...tc, status: "done" as AgentStatus } : tc
                    ),
                  };
                }
                return msgs;
              });
            }

            if (evt.type === "done") break;
            if (evt.type === "error") {
              setMessages(prev => {
                const msgs = [...prev];
                const last = msgs[msgs.length - 1];
                if (last?.role === "assistant") msgs[msgs.length - 1] = { ...last, content: last.content || `Error: ${evt.message ?? "Unknown error"}` };
                return msgs;
              });
              break;
            }
          } catch { /* skip malformed SSE */ }
        }
      }
    } catch (err) {
      if (!aborted) {
        setMessages(prev => {
          const msgs = [...prev];
          const last = msgs[msgs.length - 1];
          if (last?.role === "assistant") msgs[msgs.length - 1] = { ...last, content: last.content || "Connection error. Please try again." };
          return msgs;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
      setAgents(prev => {
        const u = { ...prev };
        for (const k of Object.keys(u)) {
          if (u[k].status === "running" || u[k].status === "queued") u[k] = { ...u[k], status: "idle" };
        }
        return u;
      });
    }
  }

  const sym          = CUR_SYM[tripCtx.currency] ?? "$";
  const activeAgents = AGENT_DEFS.map(d => agents[d.key]).filter(a => a.status !== "idle");
  const hasResults   = properties.length > 0;

  // Map pins from properties
  const mapPins = properties
    .filter(p => p.coordinates)
    .map(p => ({
      id: p.id,
      lat: p.coordinates!.lat,
      lng: p.coordinates!.lng,
      label: `${sym}${p.pricePerNight.toLocaleString()}`,
      marriottOwned: p.marriottOwned,
      selected: selectedProp?.id === p.id,
    }));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", background: "var(--voya-bg)", overflow: "hidden" }}>

      {/* ── Context bar ── */}
      {tripCtx.destination && (
        <div
          className="flex items-center justify-between gap-4 px-4 py-2 text-xs flex-shrink-0"
          style={{ background: "var(--voya-surface-2)", borderBottom: "1px solid var(--voya-border)" }}
        >
          <div className="flex items-center gap-2 flex-wrap" style={{ color: "var(--voya-text-2)" }}>
            <span className="font-semibold" style={{ color: "var(--voya-text)" }}>{tripCtx.destination}</span>
            {tripCtx.checkIn && <span>· {tripCtx.checkIn.slice(0, 7)}</span>}
            {tripCtx.guests > 0 && <span>· {tripCtx.guests} guest{tripCtx.guests > 1 ? "s" : ""}</span>}
            {tripCtx.budget > 0 && <span>· {sym}{tripCtx.budget.toLocaleString()}</span>}
          </div>
          {tripCtx.bonvoyPoints > 0 && (
            <span className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>
              ★ Wayfare Circle · {tripCtx.bonvoyPoints.toLocaleString()} pts
            </span>
          )}
        </div>
      )}

      {/* ── Main 2-column body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ══ LEFT PANEL ═══════════════════════════════════════════════════════ */}
        <div style={{
          width: 300, minWidth: 260, maxWidth: 340,
          display: "flex", flexDirection: "column", flexShrink: 0,
          borderRight: "1px solid var(--voya-border)",
          background: "var(--voya-surface)",
        }}>
          {/* Agent status chips */}
          {activeAgents.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 py-2"
              style={{ borderBottom: "1px solid var(--voya-border)", background: "var(--voya-surface-2)", flexShrink: 0 }}>
              {activeAgents.map(a => <AgentChip key={a.name} agent={a} />)}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center mt-6">
                <div
                  className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: "var(--voya-accent)" }}
                >
                  W
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--voya-text)" }}>Voya AI Travel Concierge</p>
                <p className="text-xs mb-4" style={{ color: "var(--voya-text-3)" }}>Tell me where you want to go</p>
                <div className="space-y-2">
                  {[
                    "I want to visit Hyderabad in December",
                    "Honeymoon in Amalfi, December 2026, budget £6,000",
                    "Family trip to Austin Texas, 4 people",
                  ].map(s => (
                    <button key={s} type="button" onClick={() => setInput(s)}
                      className="block w-full rounded-xl px-3 py-2 text-left text-xs transition-opacity hover:opacity-70"
                      style={{ background: "var(--voya-surface-2)", border: "1px solid var(--voya-border)", color: "var(--voya-text-2)" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id}>
                {msg.role === "user" ? (
                  /* User bubble — right-aligned green */
                  <div
                    className="ml-6 rounded-xl rounded-br-sm px-3 py-2 text-sm"
                    style={{ background: "var(--voya-accent)", color: "#fff" }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  /* Assistant bubble */
                  <div className="flex gap-2">
                    <div
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: "var(--voya-accent)" }}
                    >
                      W
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Tool indicators */}
                      {(msg.toolCalls ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {(msg.toolCalls ?? []).map((tc, i) => (
                            <span key={i} className="text-[10px] rounded-full px-2 py-0.5 font-medium"
                              style={{
                                background: tc.status === "done" ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.12)",
                                color: tc.status === "done" ? "#34d399" : "#60a5fa",
                              }}>
                              {tc.status === "done" ? "✓" : "⟳"} {tc.toolName.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}
                      {msg.content ? (
                        <div
                          className="rounded-xl rounded-tl-sm px-3 py-2.5"
                          style={{ background: "var(--voya-surface-2)", border: "1px solid var(--voya-border)" }}
                        >
                          <RenderText text={msg.content} />
                        </div>
                      ) : isStreaming && (
                        <div className="rounded-xl px-3 py-2" style={{ background: "var(--voya-surface-2)" }}>
                          <span className="text-xs animate-pulse" style={{ color: "var(--voya-text-3)" }}>Agents working…</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Compact property list in left panel */}
            {hasResults && (
              <div className="mt-2">
                {properties.slice(0, 4).map(p => (
                  <PropertyRow
                    key={p.id} prop={p} sym={sym}
                    onSelect={setSelectedProp}
                    selected={selectedProp?.id === p.id}
                  />
                ))}
              </div>
            )}

            {/* Quick replies */}
            {quickReplies.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] mb-1.5 font-medium" style={{ color: "var(--voya-text-3)" }}>One thing I still need:</p>
                <div className="flex flex-wrap gap-1.5">
                  {quickReplies.map(r => (
                    <button key={r} type="button"
                      onClick={() => { void sendMessage(r); setQuickReplies([]); }}
                      className="rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80"
                      style={{ background: "var(--voya-surface-2)", border: "1px solid var(--voya-border)", color: "var(--voya-text-2)" }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="flex-shrink-0 border-t px-3 py-2.5" style={{ borderColor: "var(--voya-border)", background: "var(--voya-surface-2)" }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
                placeholder="Reply or refine your search..."
                disabled={isStreaming}
                className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
                style={{ background: "var(--voya-surface)", border: "1px solid var(--voya-border)", color: "var(--voya-text)" }}
              />
              {isStreaming ? (
                <button type="button" onClick={() => abortRef.current?.()}
                  className="rounded-xl px-3 py-2 text-xs font-medium"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>
                  Stop
                </button>
              ) : (
                <button type="button" onClick={() => void sendMessage()} disabled={!input.trim()}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: "var(--voya-accent)" }}>
                  ➜
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL ══════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* ── Map (upper ~55%) ── */}
          <div style={{ flex: "0 0 55%", position: "relative", overflow: "hidden" }}>
            {mapCenter ? (
              <LeafletMap
                center={mapCenter}
                pins={mapPins}
                onPinClick={id => {
                  const p = properties.find(pr => pr.id === id);
                  if (p) setSelectedProp(p === selectedProp ? null : p);
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center flex-col gap-3"
                style={{ background: "var(--voya-surface-2)", color: "var(--voya-text-3)" }}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.35">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <p className="text-sm">Map will load once you enter a destination</p>
              </div>
            )}
          </div>

          {/* ── Property grid (lower ~45%) ── */}
          <div style={{ flex: "0 0 45%", display: "flex", flexDirection: "column", overflow: "hidden", borderTop: "1px solid var(--voya-border)" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--voya-border)", background: "var(--voya-surface)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--voya-text-2)" }}>
                {hasResults
                  ? `${properties.length} stays · Marriott owned or partnered`
                  : "Stays will appear here after search"}
              </p>
              {hasResults && (
                <span className="flex items-center gap-1 text-[10px]" style={{ color: "#34d399" }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                  Prices cached 4 min ago · re-verified at checkout
                </span>
              )}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {hasResults ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                  {properties.map(p => (
                    <PropertyGridCard
                      key={p.id} prop={p} sym={sym}
                      onSelect={setSelectedProp}
                      selected={selectedProp?.id === p.id}
                    />
                  ))}
                </div>
              ) : isStreaming ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-48 rounded-xl animate-pulse"
                      style={{ background: "var(--voya-surface-2)", animationDelay: `${i * 100}ms` }} />
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm" style={{ color: "var(--voya-text-3)" }}>
                    Tell Voya where you want to go to see available stays.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
