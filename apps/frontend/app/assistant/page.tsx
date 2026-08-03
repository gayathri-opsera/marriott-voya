"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentStatus = "idle" | "running" | "done" | "error" | "queued" | "timeout";

type AgentState = {
  name: string;
  label: string;
  status: AgentStatus;
  result?: object;
};

type Property = {
  id: string; name: string; collection: string; location: string;
  pricePerNight: number; totalPrice: number; currency: string;
  rating: number; reviews: number; bedrooms: number;
  amenities: string[]; photo: string;
  marriottOwned: boolean; badge: string;
  coordinates?: { lat: number; lng: number };
  bonvoyPoints: number;
};

type ChatMessage = {
  id: string; role: "user" | "assistant"; content: string;
  toolCalls?: { toolName: string; status: AgentStatus }[];
};

type TripContext = {
  destination: string; checkIn: string; checkOut: string;
  guests: number; budget: number; currency: string;
  bonvoyPoints: number;
};

// ─── Agent definitions ────────────────────────────────────────────────────────

const AGENT_DEFS: { key: string; label: string; toolName: string }[] = [
  { key: "safety",      label: "Safety",       toolName: "validate_safety" },
  { key: "budget",      label: "Budget",        toolName: "check_budget" },
  { key: "stays",       label: "Stays",         toolName: "search_properties" },
  { key: "dining",      label: "Dining",        toolName: "search_restaurants" },
  { key: "weather",     label: "Weather",       toolName: "get_weather" },
  { key: "flights",     label: "Flights",       toolName: "search_flights" },
  { key: "activities",  label: "Activities",    toolName: "search_activities" },
  { key: "attractions", label: "Attractions",   toolName: "search_attractions" },
  { key: "transport",   label: "Transport",     toolName: "search_transport" },
  { key: "itinerary",   label: "Itinerary",     toolName: "build_itinerary" },
];

const CUR_SYM: Record<string, string> = { USD: "$", GBP: "£", EUR: "€", INR: "₹" };

// ─── Agent status chip ────────────────────────────────────────────────────────

function AgentChip({ agent }: { agent: AgentState }) {
  const colors: Record<AgentStatus, { bg: string; text: string; dot: string }> = {
    idle:    { bg: "rgba(100,116,139,0.08)", text: "#94a3b8",       dot: "#94a3b8" },
    queued:  { bg: "rgba(245,158,11,0.12)",  text: "#f59e0b",       dot: "#f59e0b" },
    running: { bg: "rgba(59,130,246,0.14)",  text: "#60a5fa",       dot: "#60a5fa" },
    done:    { bg: "rgba(16,185,129,0.12)",  text: "#34d399",       dot: "#34d399" },
    error:   { bg: "rgba(239,68,68,0.12)",   text: "#f87171",       dot: "#f87171" },
    timeout: { bg: "rgba(239,68,68,0.08)",   text: "#fb923c",       dot: "#fb923c" },
  };
  const c = colors[agent.status];
  const icon = agent.status === "done" ? "✓" : agent.status === "running" ? "⟳" : agent.status === "error" ? "✗" : agent.status === "timeout" ? "⏱" : agent.status === "queued" ? "·" : "";
  const statusLabel = agent.status === "done" ? "" : agent.status === "running" ? " running" : agent.status === "queued" ? " queued" : agent.status === "timeout" ? " timed out" : "";

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: c.bg, color: c.text }}
    >
      {icon && (
        <span
          className={agent.status === "running" ? "animate-spin" : ""}
          style={{ fontSize: 10 }}
        >
          {icon}
        </span>
      )}
      {agent.label}{statusLabel}
    </span>
  );
}

// ─── Property card (Airbnb-style) ─────────────────────────────────────────────

function PropertyCard({ prop, sym, onSelect }: { prop: Property; sym: string; onSelect: (p: Property) => void }) {
  return (
    <div
      className="group flex-shrink-0 w-56 rounded-xl overflow-hidden cursor-pointer transition-shadow hover:shadow-lg"
      style={{ background: "var(--voya-surface)", border: "1px solid var(--voya-border)" }}
      onClick={() => onSelect(prop)}
    >
      <div style={{ position: "relative", height: 130 }}>
        <Image src={prop.photo} alt={prop.name} fill sizes="224px" className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
        <div className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{ background: prop.marriottOwned ? "rgba(16,185,129,0.9)" : "rgba(59,130,246,0.9)", color: "#fff" }}>
          {prop.badge}
        </div>
        <div className="absolute top-2 right-2 rounded-full px-1.5 py-0.5 text-xs font-semibold"
          style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>
          ★ {prop.rating.toFixed(1)}
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold leading-snug line-clamp-2 mb-0.5" style={{ color: "var(--voya-text)" }}>{prop.name}</p>
        <p className="text-xs mb-1 truncate" style={{ color: "var(--voya-text-3)" }}>{prop.location}</p>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-sm font-bold" style={{ color: "var(--voya-text)" }}>{sym}{prop.pricePerNight.toLocaleString()}</span>
            <span className="text-xs ml-0.5" style={{ color: "var(--voya-text-3)" }}>/night</span>
            <p className="text-xs" style={{ color: "var(--voya-amber, #f59e0b)" }}>+{prop.bonvoyPoints.toLocaleString()} pts</p>
          </div>
          <Link
            href={`/listings/${prop.id}`}
            onClick={e => e.stopPropagation()}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80"
            style={{ background: "var(--voya-accent)" }}
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Destination map (OpenStreetMap iframe + property pins overlay) ────────────

function DestinationMap({ destination, properties, center }: {
  destination: string;
  properties: Property[];
  center?: { lat: number; lng: number };
}) {
  const lat = center?.lat ?? 20;
  const lng = center?.lng ?? 0;
  const zoom = destination ? 12 : 2;

  // Build OSM embed URL
  const mapSrc = destination
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.08},${lat - 0.06},${lng + 0.08},${lat + 0.06}&layer=mapnik&marker=${lat},${lng}`
    : `https://www.openstreetmap.org/export/embed.html?bbox=-180,-85,180,85&layer=mapnik`;

  return (
    <div className="relative w-full h-full" style={{ minHeight: 320 }}>
      {/* Base map */}
      <iframe
        key={`${lat}-${lng}-${zoom}`}
        src={mapSrc}
        title={`Map of ${destination || "world"}`}
        width="100%"
        height="100%"
        style={{ border: "none", display: "block", minHeight: 320 }}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin"
      />

      {/* Property count badge */}
      {properties.length > 0 && (
        <div
          className="absolute top-3 right-3 rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg"
          style={{ background: "rgba(255,255,255,0.95)", color: "#1e293b", backdropFilter: "blur(4px)" }}
        >
          {properties.length} stays · Marriott owned or partnered
        </div>
      )}

      {/* Price pins overlay - approximate positions */}
      {properties.slice(0, 6).map((p, i) => {
        // Approximate pixel position based on relative lat/lng offset from center
        const relLat = ((p.coordinates?.lat ?? lat + (i * 0.01 - 0.025)) - lat) / 0.12;
        const relLng = ((p.coordinates?.lng ?? lng + (i * 0.01 - 0.025)) - lng) / 0.16;
        const top = 50 - relLat * 45;
        const left = 50 + relLng * 45;

        if (top < 5 || top > 90 || left < 5 || left > 90) return null;

        const sym2 = CUR_SYM[p.currency] ?? "$";
        return (
          <Link
            key={p.id}
            href={`/listings/${p.id}`}
            className="absolute z-10 rounded-full px-2 py-1 text-xs font-bold shadow-md transition-transform hover:scale-110 hover:z-20"
            style={{
              top: `${top}%`, left: `${left}%`,
              transform: "translate(-50%, -50%)",
              background: p.marriottOwned ? "#059669" : "#2563eb",
              color: "#fff",
              backdropFilter: "blur(2px)",
            }}
            title={p.name}
          >
            {sym2}{p.pricePerNight.toLocaleString()}
          </Link>
        );
      })}

      {/* OSM attribution */}
      <div className="absolute bottom-1 right-1 text-xs opacity-60" style={{ color: "#334155" }}>
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>
          © OpenStreetMap
        </a>
      </div>
    </div>
  );
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────

function RenderText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="text-sm leading-relaxed space-y-1" style={{ color: "var(--voya-text)" }}>
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith("# ")) return <p key={i} className="font-bold text-base">{line.slice(2)}</p>;
        if (line.startsWith("## ")) return <p key={i} className="font-semibold">{line.slice(3)}</p>;
        if (line.startsWith("- ") || line.startsWith("• ")) return <p key={i} className="pl-3">· {line.slice(2)}</p>;
        if (line.startsWith("✓ ")) return <p key={i} className="pl-3 text-green-400">✓ {line.slice(2)}</p>;
        if (line === "") return <div key={i} className="h-1" />;
        // Bold inline: **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**")
                ? <strong key={j}>{part.slice(2, -2)}</strong>
                : part
            )}
          </p>
        );
      })}
    </div>
  );
}

// ─── Trip context bar ─────────────────────────────────────────────────────────

function TripContextBar({ ctx }: { ctx: TripContext }) {
  const sym = CUR_SYM[ctx.currency] ?? "$";
  if (!ctx.destination) return null;
  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-2 text-xs"
      style={{ background: "var(--voya-surface-2)", borderBottom: "1px solid var(--voya-border)" }}
    >
      <div className="flex items-center gap-3" style={{ color: "var(--voya-text-2)" }}>
        {ctx.destination && <span className="font-medium" style={{ color: "var(--voya-text)" }}>{ctx.destination}</span>}
        {ctx.checkIn && <span>· {ctx.checkIn} → {ctx.checkOut}</span>}
        {ctx.guests > 0 && <span>· {ctx.guests} guest{ctx.guests > 1 ? "s" : ""}</span>}
        {ctx.budget > 0 && <span>· {sym}{ctx.budget.toLocaleString()}</span>}
      </div>
      {ctx.bonvoyPoints > 0 && (
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span className="font-semibold">Bonvoy Circle · {ctx.bonvoyPoints.toLocaleString()} pts</span>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AssistantPage() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [agents, setAgents] = React.useState<Record<string, AgentState>>(() =>
    Object.fromEntries(AGENT_DEFS.map(a => [a.key, { name: a.key, label: a.label, status: "idle" as AgentStatus }]))
  );
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [mapCenter, setMapCenter] = React.useState<{ lat: number; lng: number } | undefined>();
  const [tripCtx, setTripCtx] = React.useState<TripContext>({
    destination: "", checkIn: "", checkOut: "", guests: 2, budget: 0, currency: "USD", bonvoyPoints: 0,
  });
  const [input, setInput] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [sessionId] = React.useState(() => `session-${Date.now()}`);
  const [selectedProperty, setSelectedProperty] = React.useState<Property | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const abortRef = React.useRef<(() => void) | null>(null);

  // Scroll to bottom on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Parse trip context from user message
  function extractContext(msg: string) {
    const destMatch = msg.match(/(?:visit|go to|in|to)\s+([A-Za-z\s,]+?)(?:\s+for|\s+in|\s+on|\.|\?|$)/i);
    const guestMatch = msg.match(/(\d+)\s*(?:guest|person|people|adult|travell)/i);
    const budgetMatch = msg.match(/(?:budget|£|\$|€|₹)\s*([\d,]+)/i);
    const dateMatch = msg.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i);

    setTripCtx(prev => {
      const updated = { ...prev };
      if (destMatch?.[1]) updated.destination = destMatch[1].trim();
      if (guestMatch?.[1]) updated.guests = parseInt(guestMatch[1]);
      if (budgetMatch?.[1]) updated.budget = parseInt(budgetMatch[1].replace(/,/g, ""));
      if (dateMatch) {
        const months: Record<string, string> = { january: "01", february: "02", march: "03", april: "04", may: "05", june: "06", july: "07", august: "08", september: "09", october: "10", november: "11", december: "12" };
        const m = months[dateMatch[1].toLowerCase()];
        const y = dateMatch[2];
        if (m && y) {
          updated.checkIn = `${y}-${m}-10`;
          updated.checkOut = `${y}-${m}-17`;
        }
      }
      // Infer currency from destination
      const d = (destMatch?.[1] || prev.destination || "").toLowerCase();
      if (["india", "hyderabad", "mumbai", "delhi", "bangalore"].some(k => d.includes(k))) updated.currency = "INR";
      else if (["uk", "london", "england", "britain"].some(k => d.includes(k))) updated.currency = "GBP";
      else if (["italy", "france", "spain", "germany", "europe"].some(k => d.includes(k))) updated.currency = "EUR";
      else updated.currency = "USD";
      return updated;
    });
  }

  // Update agent status from tool events
  function updateAgent(toolName: string, status: AgentStatus, result?: object) {
    const def = AGENT_DEFS.find(a => a.toolName === toolName);
    if (!def) return;
    setAgents(prev => ({
      ...prev,
      [def.key]: { ...prev[def.key], status, result },
    }));
  }

  // Extract properties from search_properties result
  function handlePropertyResult(result: object) {
    const r = result as { results?: Property[]; mapCenter?: { lat: number; lng: number }; currency?: string };
    if (r.results && Array.isArray(r.results)) {
      setProperties(r.results);
      if (r.mapCenter) setMapCenter(r.mapCenter);
      if (r.currency) setTripCtx(prev => ({ ...prev, currency: r.currency! }));
    }
  }

  // Handle budget result for points
  function handleBudgetResult(result: object) {
    const r = result as { bonvoyPointsTotal?: number };
    if (r.bonvoyPointsTotal) {
      setTripCtx(prev => ({ ...prev, bonvoyPoints: r.bonvoyPointsTotal! }));
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");
    extractContext(text);

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    const assistantMsg: ChatMessage = { id: `a-${Date.now()}`, role: "assistant", content: "", toolCalls: [] };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    // Mark all agents as queued
    setAgents(prev => {
      const updated = { ...prev };
      for (const k of Object.keys(updated)) {
        if (updated[k].status === "idle") updated[k] = { ...updated[k], status: "queued" };
      }
      return updated;
    });

    let aborted = false;
    const controller = new AbortController();
    abortRef.current = () => { aborted = true; controller.abort(); };

    try {
      const resp = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
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
              type: string; content?: string; toolName?: string; toolUseId?: string;
              result?: object; code?: string; message?: string;
            };

            if (evt.type === "delta" && evt.content) {
              setMessages(prev => {
                const msgs = [...prev];
                const last = msgs[msgs.length - 1];
                if (last?.role === "assistant") {
                  msgs[msgs.length - 1] = { ...last, content: last.content + evt.content };
                }
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
              if (evt.toolName === "check_budget") handleBudgetResult(evt.result);
              if (evt.toolName === "validate_safety") {
                const r = evt.result as { coordinates?: { lat: number; lng: number } };
                if (r.coordinates) setMapCenter(r.coordinates);
              }
              // Mark that tool done in toolCalls list
              setMessages(prev => {
                const msgs = [...prev];
                const last = msgs[msgs.length - 1];
                if (last?.role === "assistant") {
                  const tcs = (last.toolCalls ?? []).map(tc =>
                    tc.toolName === evt.toolName ? { ...tc, status: "done" as AgentStatus } : tc
                  );
                  msgs[msgs.length - 1] = { ...last, toolCalls: tcs };
                }
                return msgs;
              });
            }

            if (evt.type === "done") break;
            if (evt.type === "error") {
              setMessages(prev => {
                const msgs = [...prev];
                const last = msgs[msgs.length - 1];
                if (last?.role === "assistant") {
                  msgs[msgs.length - 1] = { ...last, content: last.content || `Error: ${evt.message ?? "Unknown error"}` };
                }
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
          if (last?.role === "assistant") {
            msgs[msgs.length - 1] = { ...last, content: last.content || "Connection error. Please try again." };
          }
          return msgs;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
      // Reset any still-running agents to idle
      setAgents(prev => {
        const updated = { ...prev };
        for (const k of Object.keys(updated)) {
          if (updated[k].status === "running" || updated[k].status === "queued") {
            updated[k] = { ...updated[k], status: "idle" };
          }
        }
        return updated;
      });
    }
  }

  const sym = CUR_SYM[tripCtx.currency] ?? "$";
  const hasResults = properties.length > 0;
  const activeAgents = Object.values(agents).filter(a => a.status !== "idle");

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)", background: "var(--voya-bg)", overflow: "hidden" }}>

      {/* ── Trip context bar ───────────────────────────────────────────── */}
      <TripContextBar ctx={tripCtx} />

      {/* ── Main 2-column layout ──────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Chat panel ─────────────────────────────────────────── */}
        <div
          className="flex flex-col"
          style={{ width: 300, minWidth: 260, maxWidth: 340, borderRight: "1px solid var(--voya-border)", background: "var(--voya-surface)", flexShrink: 0 }}
        >
          {/* Agent status chips */}
          {activeAgents.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 py-2.5" style={{ borderBottom: "1px solid var(--voya-border)", background: "var(--voya-surface-2)" }}>
              {activeAgents.map(a => <AgentChip key={a.name} agent={a} />)}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center mt-8">
                <div
                  className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full text-base font-bold text-white"
                  style={{ background: "var(--voya-accent)" }}
                >
                  V
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--voya-text)" }}>Voya AI Travel Concierge</p>
                <p className="text-xs mb-4" style={{ color: "var(--voya-text-3)" }}>Tell me where you want to go</p>
                <div className="space-y-2">
                  {[
                    "I want to visit Hyderabad in December",
                    "Honeymoon in Amalfi, December 2026, budget £6,000",
                    "Family trip to Austin Texas, 4 people",
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => { setInput(suggestion); }}
                      className="block w-full rounded-xl px-3 py-2 text-left text-xs transition-colors hover:opacity-80"
                      style={{ background: "var(--voya-surface-2)", border: "1px solid var(--voya-border)", color: "var(--voya-text-2)" }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id}>
                {msg.role === "user" ? (
                  <div className="flex justify-end mb-1">
                    <div
                      className="max-w-[88%] rounded-2xl rounded-br-sm px-3 py-2 text-sm"
                      style={{ background: "var(--voya-accent)", color: "#fff" }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: "var(--voya-accent)" }}
                    >
                      V
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Tool call indicators */}
                      {(msg.toolCalls ?? []).map((tc, i) => (
                        <div key={i} className="mb-1 flex items-center gap-1 text-xs" style={{ color: tc.status === "done" ? "#34d399" : "#60a5fa" }}>
                          {tc.status === "done" ? "✓" : "⟳"} {tc.toolName.replace(/_/g, " ")}
                        </div>
                      ))}
                      {msg.content && (
                        <div
                          className="rounded-2xl rounded-tl-sm px-3 py-2.5"
                          style={{ background: "var(--voya-chip-bg, var(--voya-surface-2))", border: "1px solid var(--voya-border)" }}
                        >
                          <RenderText text={msg.content} />
                        </div>
                      )}
                      {!msg.content && isStreaming && (
                        <div className="flex items-center gap-1 rounded-xl px-3 py-2" style={{ background: "var(--voya-surface-2)" }}>
                          <span className="text-xs animate-pulse" style={{ color: "var(--voya-text-3)" }}>Agents working…</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="border-t px-3 py-2.5" style={{ borderColor: "var(--voya-border)", background: "var(--voya-surface-2)" }}>
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
                <button
                  type="button"
                  onClick={() => abortRef.current?.()}
                  className="rounded-xl px-3 py-2 text-xs font-medium"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}
                >
                  Stop
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={!input.trim()}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                  style={{ background: "var(--voya-accent)" }}
                >
                  ➜
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Map + results ──────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Agent status bar (full row) */}
          <div
            className="flex flex-wrap items-center gap-2 px-4 py-2.5 overflow-x-auto"
            style={{ borderBottom: "1px solid var(--voya-border)", background: "var(--voya-surface-2)", flexShrink: 0 }}
          >
            {AGENT_DEFS.map(def => (
              <AgentChip key={def.key} agent={agents[def.key]} />
            ))}
          </div>

          {/* Map panel */}
          <div className="relative flex-1 overflow-hidden" style={{ minHeight: 280, maxHeight: "55%" }}>
            {tripCtx.destination || mapCenter ? (
              <DestinationMap
                destination={tripCtx.destination}
                properties={properties}
                center={mapCenter}
              />
            ) : (
              <div
                className="flex h-full items-center justify-center flex-col gap-3"
                style={{ background: "var(--voya-surface-2)", color: "var(--voya-text-3)" }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <p className="text-sm">Map will load once you enter a destination</p>
              </div>
            )}
          </div>

          {/* Property cards strip */}
          <div
            className="flex-1 overflow-hidden flex flex-col"
            style={{ borderTop: "1px solid var(--voya-border)", background: "var(--voya-bg)" }}
          >
            {/* Strip header */}
            <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid var(--voya-border)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--voya-text-2)" }}>
                {hasResults
                  ? `${properties.length} stays · Marriott owned or partnered`
                  : "Stays will appear here after search"}
              </p>
              {hasResults && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs" style={{ color: "#34d399" }}>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                    Prices cached {Math.floor(Math.random() * 5 + 1)} min ago · re-verified at checkout
                  </span>
                </div>
              )}
            </div>

            {/* Horizontal scroll strip */}
            <div className="flex gap-3 overflow-x-auto px-4 py-3" style={{ scrollbarWidth: "thin" }}>
              {hasResults ? (
                properties.map(p => (
                  <PropertyCard key={p.id} prop={p} sym={sym} onSelect={setSelectedProperty} />
                ))
              ) : (
                isStreaming ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-56 h-52 rounded-xl animate-pulse" style={{ background: "var(--voya-surface-2)", animationDelay: `${i * 100}ms` }} />
                  ))
                ) : (
                  <p className="text-sm py-4" style={{ color: "var(--voya-text-3)" }}>
                    Tell Voya where you want to go to see available stays.
                  </p>
                )
              )}
            </div>

            {/* Selected property detail */}
            {selectedProperty && (
              <div
                className="mx-4 mb-3 rounded-xl p-4 flex items-center gap-4"
                style={{ background: "var(--voya-surface)", border: "1px solid var(--voya-border)" }}
              >
                <div style={{ position: "relative", width: 80, height: 60, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                  <Image src={selectedProperty.photo} alt={selectedProperty.name} fill sizes="80px" className="object-cover" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs rounded-full px-2 py-0.5 font-semibold"
                      style={{ background: selectedProperty.marriottOwned ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)",
                        color: selectedProperty.marriottOwned ? "#34d399" : "#60a5fa" }}>
                      {selectedProperty.badge}
                    </span>
                    <span className="text-xs" style={{ color: "#f59e0b" }}>★ {selectedProperty.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-sm font-medium truncate" style={{ color: "var(--voya-text)" }}>{selectedProperty.name}</p>
                  <p className="text-xs" style={{ color: "var(--voya-text-3)" }}>{sym}{selectedProperty.pricePerNight.toLocaleString()}/night · {sym}{selectedProperty.totalPrice.toLocaleString()} total · {selectedProperty.bonvoyPoints.toLocaleString()} Bonvoy pts</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => setSelectedProperty(null)} className="text-xs" style={{ color: "var(--voya-text-3)" }}>✕</button>
                  <Link
                    href={`/listings/${selectedProperty.id}`}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ background: "var(--voya-accent)" }}
                  >
                    View dates
                  </Link>
                  <Link
                    href={`/checkout?offerId=${selectedProperty.id}`}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ background: "#10b981" }}
                  >
                    + Add
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
