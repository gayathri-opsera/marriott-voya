"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trackEvent } from "../../lib/analytics";
import { ROUTES } from "../../lib/routes";

const ROTATING_LOCATIONS = [
  "Italy", "Tuscany", "Lucca", "Amalfi Coast", "Provence",
  "Santorini", "Marbella", "Lake Como", "Positano", "Dubrovnik",
];

function useTypewriter(words: string[], typeSpeed = 90, eraseSpeed = 50, pauseMs = 1400) {
  const [wordIndex, setWordIndex] = React.useState(0);
  const [displayed, setDisplayed] = React.useState("");
  const [phase, setPhase] = React.useState<"typing" | "pausing" | "erasing">("typing");

  React.useEffect(() => {
    const word = words[wordIndex] ?? "";
    if (phase === "typing") {
      if (displayed.length < word.length) {
        const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), typeSpeed);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("pausing"), pauseMs);
      return () => clearTimeout(t);
    }
    if (phase === "pausing") {
      const t = setTimeout(() => setPhase("erasing"), 0);
      return () => clearTimeout(t);
    }
    if (phase === "erasing") {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), eraseSpeed);
        return () => clearTimeout(t);
      }
      setWordIndex((i) => (i + 1) % words.length);
      setPhase("typing");
    }
  }, [displayed, phase, wordIndex, words, typeSpeed, eraseSpeed, pauseMs]);

  return { displayed, phase };
}

const FEATURED_VILLAS = [
  {
    id: "v1", name: "Casale delle Vigne",  location: "Lucca, Tuscany",
    price: 420, rating: "4.9", collection: "Vineyards & Winery Homes", beds: 3,
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=640&q=80&fit=crop",
  },
  {
    id: "v2", name: "Villa Sant\u2019Anna",   location: "Near Lucca, Tuscany",
    price: 365, rating: "4.8", collection: "Homes With Zen", beds: 2,
    img: "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=640&q=80&fit=crop",
  },
  {
    id: "v3", name: "Podere il Sole",       location: "Lucca countryside",
    price: 510, rating: "5.0", collection: "Vineyards & Winery Homes", beds: 4,
    img: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=640&q=80&fit=crop",
  },
  {
    id: "v4", name: "Villa dei Colli",      location: "Bagni di Lucca",
    price: 340, rating: "4.7", collection: "Rentals with Epic Pools", beds: 3,
    img: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=640&q=80&fit=crop",
  },
];

const PREF_OPTIONS = [
  { label: "Countryside stay",        icon: "🌿" },
  { label: "Food & wine focus",       icon: "🍷" },
  { label: "Walkable historic towns", icon: "🏛️" },
  { label: "Beach & coast",           icon: "🌊" },
  { label: "Nightlife & city energy", icon: "✨" },
  { label: "Art & history",           icon: "🎨" },
];

const STARTER_CHIPS = [
  "A week somewhere warm, we like walking",
  "Villa near Lucca for 4 nights in September",
  "Family half-term, short flight, pool",
  "Rebuild my Tuscany trip around a wine tour",
];

const GEN_TASKS = [
  { label: "Villa search (HVMI)",   icon: "🏡" },
  { label: "Activities & tours",    icon: "🗺️" },
  { label: "Flights",               icon: "✈️" },
  { label: "Dining check",          icon: "🍽️" },
  { label: "Weather & feasibility", icon: "☀️" },
];

// ─── Search card ───────────────────────────────────────────────────────────────
function SearchCard() {
  const router = useRouter();
  const [destination, setDestination] = React.useState("Lucca, Tuscany");
  const [checkIn,  setCheckIn]  = React.useState("2026-09-12");
  const [checkOut, setCheckOut] = React.useState("2026-09-16");
  const [travellers, setTravellers] = React.useState("2 adults");
  const [lookingFor, setLookingFor] = React.useState("Stays");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = encodeURIComponent(destination);
    const type = lookingFor === "Stays" ? "hotel" : lookingFor === "Flights" ? "flight" : "car";
    trackEvent("DUAL_PATH_SEARCH", { destination, type });
    router.push(`/search?q=${q}&types=${type}`);
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--voya-surface-3)",
    border: "1px solid var(--voya-border)",
    color: "var(--voya-text)",
    borderRadius: 8,
    width: "100%",
    padding: "7px 12px",
    fontSize: 13,
    outline: "none",
  };

  return (
    <div style={{ background: "var(--voya-surface)", border: "1px solid var(--voya-border)", borderRadius: 14, padding: 20, transition: "background 0.2s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ color: "var(--voya-accent)", fontSize: 16 }}>⌕</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--voya-text)" }}>Search and book</span>
      </div>
      <p style={{ fontSize: 11, fontWeight: 500, color: "var(--voya-accent)", marginBottom: 16 }}>Fastest route to a confirmed booking</p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "var(--voya-text-3)", marginBottom: 4 }}>Where to</label>
          <input value={destination} onChange={e => setDestination(e.target.value)} style={inputStyle} placeholder="Destination" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--voya-text-3)", marginBottom: 4 }}>Check in</label>
            <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
              style={{ ...inputStyle, colorScheme: "inherit" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--voya-text-3)", marginBottom: 4 }}>Check out</label>
            <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
              style={{ ...inputStyle, colorScheme: "inherit" }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--voya-text-3)", marginBottom: 4 }}>Travellers</label>
            <select value={travellers} onChange={e => setTravellers(e.target.value)} style={inputStyle}>
              {["1 adult","2 adults","3 adults","4 adults","2 adults + 2 children"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--voya-text-3)", marginBottom: 4 }}>Looking for</label>
            <select value={lookingFor} onChange={e => setLookingFor(e.target.value)} style={inputStyle}>
              {["Stays","Flights","Cars","Stays + Flights"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <button type="submit"
          style={{ background: "var(--voya-accent-btn)", borderRadius: 8, color: "#fff", padding: "10px 0", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", transition: "opacity 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          Search live availability
        </button>
      </form>
    </div>
  );
}

// ─── AI assistant card ─────────────────────────────────────────────────────────
function AssistantCard() {
  const router = useRouter();
  const [freeText, setFreeText] = React.useState("");

  const handleChip = (chip: string) => {
    trackEvent("LANDING_CHIP_CLICKED", { chip });
    router.push(`/assistant?prefill=${encodeURIComponent(chip)}`);
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const text = freeText.trim();
    if (!text) return;
    trackEvent("LANDING_FREETEXT_START", { text });
    router.push(`/assistant?prefill=${encodeURIComponent(text)}`);
  };

  return (
    <div style={{ background: "var(--voya-surface)", border: "1px solid var(--voya-border)", borderRadius: 14, padding: 20, transition: "background 0.2s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ color: "var(--voya-accent)", fontSize: 16 }}>◎</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--voya-text)" }}>Plan with the assistant</span>
      </div>
      <p style={{ fontSize: 11, fontWeight: 500, color: "var(--voya-accent)", marginBottom: 16 }}>Best when the trip is still an idea</p>

      <p style={{ fontSize: 11, fontWeight: 500, color: "var(--voya-text-2)", marginBottom: 8 }}>What matters most on this trip?</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {PREF_OPTIONS.map(p => (
          <button key={p.label} type="button" onClick={() => handleChip(`${p.label} trip — find me HVMI villas`)}
            style={{ background: "var(--voya-chip-bg)", border: "1px solid var(--voya-chip-border)", borderRadius: 20, padding: "5px 12px", fontSize: 11, color: "var(--voya-accent-lt)", cursor: "pointer", transition: "background 0.15s" }}
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 11, color: "var(--voya-text-4)", marginBottom: 6 }}>Or describe the trip in your own words</p>
      <form onSubmit={handleStart} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <textarea value={freeText} onChange={e => setFreeText(e.target.value)} rows={2}
          style={{ background: "var(--voya-surface-3)", border: "1px solid var(--voya-border)", color: "var(--voya-text)", borderRadius: 8, padding: "8px 12px", fontSize: 12, resize: "none", outline: "none" }}
          placeholder='Where in the world? e.g. "Villa near Lucca for 5 nights in September"'
        />
        {freeText.trim() ? (
          <button type="submit"
            style={{ background: "var(--voya-accent-btn)", borderRadius: 8, color: "#fff", padding: "10px 0", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
            Start planning →
          </button>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {STARTER_CHIPS.map(chip => (
              <button key={chip} type="button" onClick={() => handleChip(chip)}
                style={{ background: "var(--voya-chip-bg)", border: "1px solid var(--voya-chip-border)", borderRadius: 20, padding: "5px 12px", fontSize: 11, color: "var(--voya-text-3)", cursor: "pointer", textAlign: "left" }}>
                {chip}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}

// ─── Villa photo card ──────────────────────────────────────────────────────────
function VillaCard({ villa }: { villa: typeof FEATURED_VILLAS[0] }) {
  const router = useRouter();
  return (
    <div
      style={{ background: "var(--voya-surface)", border: "1px solid var(--voya-border)", borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s, background 0.2s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
      onClick={() => router.push(`/browse?villa=${villa.id}`)}
    >
      <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
        <Image src={villa.img} alt={villa.name} fill sizes="(max-width: 640px) 100vw, 320px"
          className="object-cover" style={{ transition: "transform 0.5s" }} unoptimized />
        <div style={{ position: "absolute", top: 10, left: 10, background: "var(--voya-photo-scrim)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "3px 10px" }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: "var(--voya-accent-lt)" }}>Homes &amp; Villas</span>
        </div>
        <div style={{ position: "absolute", top: 10, right: 10, background: "var(--voya-photo-scrim)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "3px 10px" }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: "var(--voya-amber)" }}>★ {villa.rating}</span>
        </div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <p style={{ fontSize: 10, color: "var(--voya-accent-dk)", marginBottom: 2 }}>{villa.collection}</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--voya-text)", marginBottom: 2 }}>{villa.name}</p>
        <p style={{ fontSize: 11, color: "var(--voya-text-3)", marginBottom: 10 }}>📍 {villa.location} · {villa.beds} bed</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--voya-text)" }}>
            ${villa.price}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--voya-text-3)" }}>/night</span>
          </p>
          <div style={{ background: "var(--voya-accent-f1)", border: "1px solid var(--voya-border)", borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 500, color: "var(--voya-accent-lt)" }}>
            Reserve
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export function LandingPageContent() {
  const { displayed, phase } = useTypewriter(ROTATING_LOCATIONS);
  const cursor = phase === "typing" || phase === "pausing" ? "|" : "";

  return (
    <div style={{ background: "var(--voya-bg)", minHeight: "100vh", color: "var(--voya-text)", transition: "background 0.2s" }}>

      {/* ── Hero ── */}
      <section style={{ position: "relative", overflow: "hidden", padding: "80px 16px 48px", textAlign: "center" }}>
        <div style={{ position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, var(--voya-hero-orb) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", margin: "0 auto", maxWidth: 720 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--voya-accent-f1)", border: "1px solid var(--voya-border)", borderRadius: 20, padding: "4px 14px", marginBottom: 20 }}>
            <span style={{ color: "var(--voya-accent)", fontSize: 12 }}>✦</span>
            <span style={{ color: "var(--voya-accent)", fontSize: 12, fontWeight: 500 }}>Homes &amp; Villas by Marriott Bonvoy — AI-powered</span>
          </div>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--voya-text)", marginBottom: 10 }}>
            AI vacation planning
          </h1>
          <h2 style={{ fontSize: "clamp(1.25rem,3vw,2rem)", fontWeight: 600, marginBottom: 8, color: "var(--voya-text-2)" }}>
            Your villa in{" "}
            <span style={{ color: "var(--voya-accent-lt)" }}>
              {displayed}<span style={{ opacity: 0.6 }}>{cursor}</span>
            </span>
          </h2>
          <p style={{ fontSize: 17, marginBottom: 32, color: "var(--voya-text-3)" }}>Plan the trip. Skip the tabs.</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            <Link href="/browse"
              style={{ background: "var(--voya-accent-btn)", borderRadius: 10, color: "#fff", padding: "11px 24px", fontSize: 14, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, transition: "opacity 0.15s" }}>
              🏡 Browse villas
            </Link>
            <Link href="/assistant"
              style={{ background: "var(--voya-accent-f1)", border: "1px solid var(--voya-border)", borderRadius: 10, color: "var(--voya-accent-lt)", padding: "11px 24px", fontSize: 14, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, transition: "background 0.15s" }}>
              ◎ Plan with AI
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured villas ── */}
      <section style={{ margin: "0 auto", maxWidth: 1152, padding: "32px 16px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--voya-text)" }}>HVMI villas — Lucca &amp; Tuscany</h2>
            <p style={{ fontSize: 13, marginTop: 2, color: "var(--voya-text-3)" }}>All properties from Homes &amp; Villas by Marriott Bonvoy</p>
          </div>
          <Link href="/browse" style={{ fontSize: 13, fontWeight: 500, color: "var(--voya-accent)", textDecoration: "none" }}>See all →</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
          {FEATURED_VILLAS.map(v => <VillaCard key={v.id} villa={v} />)}
        </div>
      </section>

      {/* ── AI preview ── */}
      <section style={{ margin: "0 auto", maxWidth: 1152, padding: "0 16px 32px" }}>
        <div style={{ background: "var(--voya-surface)", border: "1px solid var(--voya-border)", borderRadius: 14, padding: 24, transition: "background 0.2s" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, /* lg: row */ }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: "var(--voya-text-2)", marginBottom: 12 }}>When you plan with AI, it runs these automatically:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {GEN_TASKS.map((t, i) => (
                  <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, background: "var(--voya-accent-f1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{t.icon}</div>
                    <span style={{ fontSize: 13, color: i < 2 ? "var(--voya-accent-lt)" : "var(--voya-text-3)" }}>{t.label}</span>
                    {i < 2 && <span style={{ background: "var(--voya-accent-f1)", color: "var(--voya-accent)", borderRadius: 10, padding: "1px 8px", fontSize: 10 }}>HVMI first</span>}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, borderTop: "1px solid var(--voya-border-sub)", paddingTop: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: "var(--voya-text-2)", marginBottom: 12 }}>Sample itinerary output:</p>
              {[
                { day: "Day 1", label: "Arrive at Casale delle Vigne, Lucca",              tag: "HVMI" },
                { day: "Day 2", label: "Private walking tour — Historic Centre & Walls",   tag: "Bonvoy Tours" },
                { day: "Day 3", label: "Tuscan wine tour — vineyard trek & cellar visit",  tag: "Bonvoy Tours" },
                { day: "Day 4", label: "Day trip: Cinque Terre coastal villages",          tag: "Bonvoy Tours" },
              ].map(item => (
                <div key={item.day} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--voya-text-4)", width: 40, flexShrink: 0 }}>{item.day}</span>
                  <span style={{ fontSize: 11, flex: 1, color: "var(--voya-text-2)" }}>{item.label}</span>
                  <span style={{ background: item.tag === "HVMI" ? "var(--voya-amber-f)" : "var(--voya-accent-f1)", color: item.tag === "HVMI" ? "var(--voya-amber)" : "var(--voya-accent)", borderRadius: 10, padding: "1px 7px", fontSize: 10, whiteSpace: "nowrap" }}>{item.tag}</span>
                </div>
              ))}
              <Link href="/assistant"
                style={{ background: "var(--voya-accent-btn)", borderRadius: 8, display: "inline-block", marginTop: 10, padding: "8px 18px", fontSize: 12, fontWeight: 600, color: "#fff", textDecoration: "none" }}>
                Build my itinerary →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Two path cards ── */}
      <section style={{ margin: "0 auto", maxWidth: 1152, padding: "0 16px 32px", display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
        <SearchCard />
        <AssistantCard />
      </section>

      {/* ── Transparency strip ── */}
      <section style={{ margin: "0 auto", maxWidth: 1152, padding: "0 16px 64px", display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
        {[
          { icon: "🏷️", title: "Source always shown",        desc: "Homes & Villas, a Marriott brand, or a named partner — on every offer." },
          { icon: "🔄", title: "Price freshness labelled",    desc: "Live or cached with an age. Cached prices re-validated before you pay." },
          { icon: "🔒", title: "Bookable vs illustrative",    desc: "Reference prices are labelled and carry no booking button." },
        ].map(c => (
          <div key={c.title} style={{ background: "var(--voya-surface)", border: "1px solid var(--voya-border-sub)", borderRadius: 12, padding: 16, transition: "background 0.2s" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--voya-text)", marginBottom: 4 }}>{c.title}</p>
            <p style={{ fontSize: 11, color: "var(--voya-text-3)" }}>{c.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default LandingPageContent;
