"use client";

import * as React from "react";
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

const STARTER_CHIPS = [
  "A week somewhere warm, we like walking",
  "Villa near Lucca for 4 nights in September",
  "Family half-term, short flight, pool",
  "Rebuild my Tuscany trip around a wine tour",
];

const DESTINATION_CARDS = [
  { label: "Tuscany",         count: "126 villas",  bg: "from-amber-800 to-amber-600" },
  { label: "Amalfi Coast",    count: "64 stays",    bg: "from-sky-800 to-sky-600" },
  { label: "Lisbon",          count: "31 stays",    bg: "from-rose-800 to-rose-600" },
  { label: "Scottish Highlands", count: "37 stays", bg: "from-emerald-800 to-emerald-700" },
];

const TRUST_CARDS = [
  {
    badge: "Source",
    title: "You always see who supplies it",
    desc: "Homes & Villas, a Marriott hotel brand, or a named partner — on every offer, on every screen.",
  },
  {
    badge: "Live · 8s",
    badgeLive: true,
    title: "You always see how fresh it is",
    desc: "Live, or cached with an age. Cached prices are re-validated before you pay, within a 2% tolerance.",
  },
  {
    badge: "Bookable?",
    title: "Illustrative offers can't be booked",
    desc: "Reference prices are labelled and carry no booking button — so nothing you can click can fail.",
  },
];

// ─── Inline search form for the "Search and book" card ────────────────────────
function SearchCard() {
  const router = useRouter();
  const [destination, setDestination] = React.useState("Lucca, Tuscany");
  const [checkIn, setCheckIn] = React.useState("2026-09-12");
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

  return (
    <div className="rounded-xl border border-white/10 bg-[#1c1410]/60 p-5">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm text-[#c1440e]">&#9741;</span>
        <span className="text-base font-semibold text-white">Search and book</span>
      </div>
      <p className="mb-4 text-xs text-amber-400 font-medium">Fastest route to a confirmed booking</p>
      <p className="mb-4 text-sm text-white/60">
        You know the destination and dates. Filter, sort and compare stays, flights and cars
        side by side, then book — typically four steps.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-white/50">Where to</label>
          <input
            value={destination}
            onChange={e => setDestination(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/8 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#c1440e] focus:outline-none"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            placeholder="Destination"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-white/50">Check in</label>
            <input
              type="date"
              value={checkIn}
              onChange={e => setCheckIn(e.target.value)}
              className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-white focus:border-[#c1440e] focus:outline-none"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", colorScheme: "dark" }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Check out</label>
            <input
              type="date"
              value={checkOut}
              onChange={e => setCheckOut(e.target.value)}
              className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-white focus:border-[#c1440e] focus:outline-none"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", colorScheme: "dark" }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-white/50">Travellers</label>
            <select
              value={travellers}
              onChange={e => setTravellers(e.target.value)}
              className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-white focus:border-[#c1440e] focus:outline-none"
              style={{ backgroundColor: "#2a1f18", colorScheme: "dark" }}
            >
              {["1 adult","2 adults","3 adults","4 adults","2 adults + 2 children"].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Looking for</label>
            <select
              value={lookingFor}
              onChange={e => setLookingFor(e.target.value)}
              className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-white focus:border-[#c1440e] focus:outline-none"
              style={{ backgroundColor: "#2a1f18", colorScheme: "dark" }}
            >
              {["Stays","Flights","Cars","Stays + Flights"].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#c1440e" }}
        >
          Search live availability
        </button>
        <p className="text-center text-xs text-white/30">
          Results show supplier, price freshness and whether the offer is bookable.
        </p>
      </form>
    </div>
  );
}

// ─── AI assistant entry card ───────────────────────────────────────────────────
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
    <div className="rounded-xl border border-white/10 bg-[#1c1410]/60 p-5">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm text-[#c1440e]">&#9711;</span>
        <span className="text-base font-semibold text-white">Plan with the assistant</span>
      </div>
      <p className="mb-4 text-xs text-amber-400 font-medium">Best when the trip is still an idea</p>
      <p className="mb-4 text-sm text-white/60">
        Describe the trip in your own words. The assistant asks what it needs, consults live
        inventory as it goes, and shows real offers inline. Interrupt or redirect at any point.
      </p>
      <p className="mb-2 text-xs text-white/40">Start from one of these</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {STARTER_CHIPS.map(chip => (
          <button
            key={chip}
            type="button"
            onClick={() => handleChip(chip)}
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-white/30 hover:text-white"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            {chip}
          </button>
        ))}
      </div>
      <p className="mb-1.5 text-xs text-white/40">Or say it your way</p>
      <form onSubmit={handleStart} className="space-y-2">
        <input
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          placeholder="Four nights near Lucca, food and wine focused"
          className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#c1440e] focus:outline-none"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        />
        <button
          type="submit"
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#c1440e" }}
        >
          Start planning
        </button>
      </form>
      <p className="mt-2 text-center text-xs text-white/30">
        Replies stream in. You can stop the assistant mid-sentence and keep what it wrote.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function LandingPageContent(): React.JSX.Element {
  const { displayed, phase } = useTypewriter(ROTATING_LOCATIONS);

  React.useEffect(() => {
    trackEvent("LANDING_VIEWED", {});
  }, []);

  return (
    <main id="main-content" style={{ backgroundColor: "#14100c", minHeight: "100vh" }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="px-4 pb-10 pt-14 text-center">
        <div className="mx-auto max-w-4xl">
          {/* Subtitle line */}
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-white/40">
            HOMES &amp; VILLAS · HOTELS · CARS
          </p>

          {/* Headline */}
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Two ways to plan. Both open to everyone, from today.
          </h1>

          <p className="mx-auto max-w-2xl text-base text-white/50">
            Book straight away with live supplier prices, or talk it through with the Voya
            assistant and watch a trip take shape. Every price we show carries its source
            and how fresh it is.
          </p>

          {/* Typewriter sub-line */}
          <div className="mt-4 text-sm text-white/30">
            Now searching villas in{" "}
            <span className="font-medium text-amber-400">
              {displayed}
              <span
                style={{
                  display: "inline-block",
                  width: "2px",
                  height: "1em",
                  marginLeft: "1px",
                  verticalAlign: "text-bottom",
                  backgroundColor: "#f59e0b",
                  animation: phase === "pausing" ? "blink 0.7s step-end infinite" : "none",
                  opacity: phase === "erasing" && displayed.length === 0 ? 0 : 1,
                }}
              />
            </span>
          </div>
        </div>
      </section>

      {/* ── Dual path cards ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pb-14">
        <div className="grid gap-5 md:grid-cols-2">
          <SearchCard />
          <AssistantCard />
        </div>
      </section>

      {/* ── Why you can trust the price ────────────────────────────────────── */}
      <section className="border-t border-white/8 px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-6 text-center text-lg font-semibold text-white">
            Why you can trust the price
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {TRUST_CARDS.map(card => (
              <div
                key={card.title}
                className="rounded-xl border border-white/8 p-5"
                style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              >
                <span
                  className="mb-3 inline-block rounded px-2 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: card.badgeLive ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.08)",
                    color: card.badgeLive ? "#4ade80" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {card.badge}
                </span>
                <h3 className="mb-1 text-sm font-semibold text-white">{card.title}</h3>
                <p className="text-xs leading-relaxed text-white/45">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Where Bonvoy members are going ─────────────────────────────────── */}
      <section className="border-t border-white/8 px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-6 text-lg font-semibold text-white">Where Bonvoy members are going</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DESTINATION_CARDS.map(dest => (
              <Link
                key={dest.label}
                href={`/search?q=${encodeURIComponent(dest.label)}&types=hotel`}
                className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${dest.bg} p-0 hover:opacity-90 transition-opacity`}
                style={{ height: 120 }}
              >
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute bottom-0 left-0 p-3">
                  <p className="text-sm font-semibold text-white">{dest.label}</p>
                  <p className="text-xs text-white/70">{dest.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/8 px-4 py-10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            {
              heading: "Plan",
              links: [
                { label: "Search stays",  href: "/search?types=hotel" },
                { label: "Search flights", href: "/search?types=flight" },
                { label: "Search cars",   href: "/search?types=car" },
                { label: "Assistant",     href: "/assistant" },
              ],
            },
            {
              heading: "My account",
              links: [
                { label: "Trips & itineraries", href: "/dashboard" },
                { label: "Travel preferences",  href: "/profile/preferences" },
                { label: "Active sessions",      href: "/profile/sessions" },
                { label: "Bonvoy points",        href: "/profile" },
              ],
            },
            {
              heading: "Support",
              links: [
                { label: "Help centre",          href: "#" },
                { label: "Change or cancel",     href: "#" },
                { label: "Accessibility statement", href: "#" },
                { label: "Contact us",           href: "#" },
              ],
            },
            {
              heading: "Privacy",
              links: [
                { label: "Privacy notice",  href: "/profile/privacy" },
                { label: "Download my data", href: "/profile/privacy" },
                { label: "Delete my account", href: "/profile/privacy" },
                { label: "Cookie choices",   href: "#" },
              ],
            },
          ].map(col => (
            <div key={col.heading}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">{col.heading}</p>
              <ul className="space-y-2">
                {col.links.map(l => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-white/50 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-5xl border-t border-white/8 pt-6 text-center text-xs text-white/25">
          © 2026 Voya. Prices shown in the currency of the supplying source. WCAG 2.1 AA.
        </div>
      </footer>
    </main>
  );
}
