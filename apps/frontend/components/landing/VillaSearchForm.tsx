"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "../../lib/analytics";

// ─── Destination suggestions (global HVMI inventory) ─────────────────────────

const DESTINATIONS = [
  // Italy
  { label: "Lucca, Tuscany, Italy",         value: "Lucca",           icon: "🏛",  highlight: true  },
  { label: "Florence, Tuscany, Italy",       value: "Florence",        icon: "🌸",  highlight: true  },
  { label: "Tuscany Countryside, Italy",     value: "Tuscany",         icon: "🍷",  highlight: true  },
  { label: "Amalfi Coast, Italy",            value: "Amalfi",          icon: "🍋",  highlight: true  },
  { label: "Lake Como, Italy",               value: "Lake Como",       icon: "🏔",  highlight: true  },
  { label: "Positano, Italy",                value: "Positano",        icon: "🌺",  highlight: false },
  { label: "Rome, Italy",                    value: "Rome",            icon: "🏟",  highlight: false },
  { label: "Sicily, Italy",                  value: "Sicily",          icon: "🍊",  highlight: false },
  // France
  { label: "Provence, France",               value: "Provence",        icon: "💐",  highlight: true  },
  { label: "Côte d'Azur, France",            value: "Cote d'Azur",     icon: "🌊",  highlight: false },
  { label: "Paris, France",                  value: "Paris",           icon: "🗼",  highlight: false },
  // Spain
  { label: "Marbella, Spain",                value: "Marbella",        icon: "☀️",  highlight: true  },
  { label: "Ibiza, Spain",                   value: "Ibiza",           icon: "🏖",  highlight: false },
  { label: "Barcelona, Spain",               value: "Barcelona",       icon: "🎨",  highlight: false },
  // Greece
  { label: "Santorini, Greece",              value: "Santorini",       icon: "🏝",  highlight: true  },
  { label: "Mykonos, Greece",                value: "Mykonos",         icon: "💎",  highlight: false },
  // Croatia
  { label: "Dubrovnik, Croatia",             value: "Dubrovnik",       icon: "🏰",  highlight: false },
  // Portugal
  { label: "Algarve, Portugal",              value: "Algarve",         icon: "🌅",  highlight: true  },
  { label: "Lisbon, Portugal",               value: "Lisbon",          icon: "🛤",  highlight: false },
  // Caribbean
  { label: "St. Barts, Caribbean",           value: "St. Barts",       icon: "🌴",  highlight: true  },
  { label: "Turks & Caicos",                 value: "Turks and Caicos",icon: "🐠",  highlight: true  },
  { label: "Barbados",                       value: "Barbados",        icon: "🏄",  highlight: false },
  // USA
  { label: "Hamptons, New York, USA",        value: "Hamptons",        icon: "🌾",  highlight: true  },
  { label: "Aspen, Colorado, USA",           value: "Aspen",           icon: "⛷",  highlight: true  },
  { label: "Napa Valley, California, USA",   value: "Napa Valley",     icon: "🍾",  highlight: true  },
  // Asia Pacific
  { label: "Bali, Indonesia",                value: "Bali",            icon: "🌺",  highlight: true  },
  { label: "Phuket, Thailand",               value: "Phuket",          icon: "🐘",  highlight: false },
  { label: "Maldives",                       value: "Maldives",        icon: "🐬",  highlight: true  },
  // Middle East & Africa
  { label: "Marrakech, Morocco",             value: "Marrakech",       icon: "🕌",  highlight: false },
  { label: "Dubai, UAE",                     value: "Dubai",           icon: "🌆",  highlight: false },
];

const ACCOMMODATION_STYLES = [
  { value: "villa",   label: "Villas & Homes",       subtitle: "HVMI exclusive"    },
  { value: "hotel",   label: "Marriott Hotels",       subtitle: "Bonvoy properties" },
  { value: "all",     label: "All accommodations",   subtitle: "Villas + hotels"   },
];

const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

// ─── Component ────────────────────────────────────────────────────────────────

export function VillaSearchForm(): React.JSX.Element {
  const router = useRouter();

  const [destination, setDestination] = React.useState("");
  const [checkIn, setCheckIn] = React.useState("");
  const [checkOut, setCheckOut] = React.useState("");
  const [guests, setGuests] = React.useState(2);
  const [accommodationType, setAccommodationType] = React.useState("villa");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [focusedIdx, setFocusedIdx] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const filtered = destination.length === 0
    ? DESTINATIONS
    : DESTINATIONS.filter(d =>
        d.label.toLowerCase().includes(destination.toLowerCase()) ||
        d.value.toLowerCase().includes(destination.toLowerCase())
      );

  const handleDestinationSelect = (value: string, label: string) => {
    setDestination(label);
    setShowSuggestions(false);
    setFocusedIdx(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && focusedIdx >= 0) {
      e.preventDefault();
      const d = filtered[focusedIdx];
      if (d) handleDestinationSelect(d.value, d.label);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    // Determine search type based on accommodation selection
    const searchType = accommodationType === "villa" || accommodationType === "all" ? "hotel" : "hotel";
    const q = destination.split(",")[0]?.trim() ?? destination;

    trackEvent("VILLA_SEARCH_SUBMITTED", { destination: q, guests, accommodationType });

    const params = new URLSearchParams({ q, types: searchType });
    if (checkIn) params.set("date", checkIn);
    if (checkOut) params.set("returnDate", checkOut);
    if (guests > 1) params.set("passengers", String(guests));

    router.push(`/search?${params.toString()}`);
  };

  // Today's date as min for date pickers
  const today = new Date().toISOString().split("T")[0] ?? "";
  const minCheckOut = checkIn || today;

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mx-auto mt-6 max-w-4xl rounded-2xl bg-white shadow-xl ring-1 ring-black/5 overflow-visible"
      aria-label="Find your Marriott villa"
    >
      {/* Accommodation type tabs */}
      <div className="flex gap-0 border-b border-gray-100 px-4 pt-4">
        {ACCOMMODATION_STYLES.map((style) => (
          <button
            key={style.value}
            type="button"
            onClick={() => setAccommodationType(style.value)}
            className={`flex flex-col items-start px-4 py-2.5 text-left text-sm transition-all rounded-t-lg mr-1
              ${accommodationType === style.value
                ? "bg-brand-primary/8 border-b-2 border-brand-primary text-brand-primary font-semibold"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
          >
            <span className="text-xs font-semibold">{style.label}</span>
            <span className={`text-[10px] ${accommodationType === style.value ? "text-brand-primary/70" : "text-gray-400"}`}>
              {style.subtitle}
            </span>
          </button>
        ))}
      </div>

      {/* Search fields */}
      <div className="grid gap-0 sm:grid-cols-[2fr_1fr_1fr_auto_auto] p-4 gap-x-2 gap-y-3">

        {/* Destination with autocomplete */}
        <div className="relative sm:col-span-1" onKeyDown={handleKeyDown}>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
            Destination
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </span>
            <input
              ref={inputRef}
              value={destination}
              onChange={(e) => { setDestination(e.target.value); setShowSuggestions(true); setFocusedIdx(-1); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Where in the world?"
              required
              autoComplete="off"
              aria-label="Destination"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
            />
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && filtered.length > 0 && (
            <ul
              ref={listRef}
              role="listbox"
              className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-gray-100 bg-white shadow-2xl overflow-hidden"
            >
              {filtered.map((dest, idx) => (
                <li
                  key={dest.value}
                  role="option"
                  aria-selected={idx === focusedIdx}
                  onMouseDown={() => handleDestinationSelect(dest.value, dest.label)}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors
                    ${idx === focusedIdx ? "bg-brand-primary/8 text-brand-primary" : "hover:bg-gray-50"}
                    ${dest.highlight ? "font-medium" : ""}`}
                >
                  <span className="text-base shrink-0">{dest.icon}</span>
                  <div>
                    <p className="text-sm text-gray-900">{dest.label}</p>
                    {dest.highlight && (
                      <p className="text-xs text-brand-primary">Homes &amp; Villas available</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Check-in */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
            Check-in
          </label>
          <input
            type="date"
            value={checkIn}
            min={today}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (checkOut && e.target.value > checkOut) setCheckOut("");
            }}
            aria-label="Check-in date"
            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
          />
        </div>

        {/* Check-out */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
            Check-out
          </label>
          <input
            type="date"
            value={checkOut}
            min={minCheckOut}
            onChange={(e) => setCheckOut(e.target.value)}
            aria-label="Check-out date"
            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
          />
        </div>

        {/* Guests */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
            Guests
          </label>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            aria-label="Number of guests"
            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
          >
            {GUEST_OPTIONS.map(n => (
              <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
            ))}
          </select>
        </div>

        {/* Search CTA */}
        <div className="flex items-end">
          <button
            type="submit"
            className="h-11 rounded-xl bg-brand-primary px-6 font-semibold text-white text-sm hover:bg-brand-primary/90 transition-colors whitespace-nowrap shadow-sm"
          >
            {accommodationType === "villa" ? "Find my villa" : "Search"}
          </button>
        </div>
      </div>

      {/* Duration hint */}
      {checkIn && checkOut && (
        <div className="px-4 pb-3 -mt-1">
          <p className="text-xs text-gray-500">
            {(() => {
              const days = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
              return days > 0 ? `${days} night${days !== 1 ? "s" : ""} · ${guests} guest${guests !== 1 ? "s" : ""}` : null;
            })()}
          </p>
        </div>
      )}
    </form>
  );
}
