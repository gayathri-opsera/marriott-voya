"use client";

import * as React from "react";

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  available: boolean;
  partialAvailability?: boolean;
  isPeakPricing?: boolean;
  minimumStay?: number;
  price?: number;
}

export interface AvailabilityCalendarProps {
  propertyId?: string;
  /** Pre-loaded availability. If absent and propertyId provided, calendar shows loading state. */
  availability?: DayAvailability[];
  checkIn?: string;
  checkOut?: string;
  onRangeSelect?: (checkIn: string, checkOut: string) => void;
  onMinStayViolation?: (minNights: number) => void;
  className?: string;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addMonths(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(1);
  copy.setMonth(copy.getMonth() + n);
  return copy;
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

/** Generates the grid of dates (padded to full weeks) for a given month. */
function monthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const cells: (Date | null)[] = Array(first.getDay()).fill(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function AvailabilityCalendar({
  availability = [],
  checkIn,
  checkOut,
  onRangeSelect,
  onMinStayViolation,
  className = "",
}: AvailabilityCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [baseMonth, setBaseMonth] = React.useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [hoverDate, setHoverDate] = React.useState<string | null>(null);
  const [selecting, setSelecting] = React.useState<"none" | "start">("none");
  const [localStart, setLocalStart] = React.useState<string | undefined>(checkIn);
  const [localEnd, setLocalEnd] = React.useState<string | undefined>(checkOut);

  // Sync props
  React.useEffect(() => { setLocalStart(checkIn); }, [checkIn]);
  React.useEffect(() => { setLocalEnd(checkOut); }, [checkOut]);

  const availMap = React.useMemo(() => {
    const m = new Map<string, DayAvailability>();
    for (const d of availability) m.set(d.date, d);
    return m;
  }, [availability]);

  const nextMonth = addMonths(baseMonth, 1);

  function handleDayClick(ymd: string) {
    const info = availMap.get(ymd);
    const isBlocked = info ? !info.available : false;
    const isPast = ymd < formatYMD(today);
    if (isBlocked || isPast) return;

    if (selecting === "none" || (localStart && localEnd)) {
      // Start new selection
      setLocalStart(ymd);
      setLocalEnd(undefined);
      setSelecting("start");
    } else if (selecting === "start" && localStart) {
      if (ymd <= localStart) {
        setLocalStart(ymd);
        setLocalEnd(undefined);
        return;
      }
      // Validate minimum stay
      const startInfo = availMap.get(localStart);
      const minNights = startInfo?.minimumStay ?? 1;
      const nights = diffDays(localStart, ymd);
      if (nights < minNights) {
        onMinStayViolation?.(minNights);
        return;
      }
      setLocalEnd(ymd);
      setSelecting("none");
      onRangeSelect?.(localStart, ymd);
    }
  }

  function getDayStyle(ymd: string): React.CSSProperties & { _label?: string } {
    const info = availMap.get(ymd);
    const isPast = ymd < formatYMD(today);
    const isStart = ymd === localStart;
    const isEnd = ymd === localEnd;
    const inRange = localStart && (localEnd || hoverDate) &&
      ymd > localStart && ymd < (localEnd ?? hoverDate ?? "");
    const isHover = ymd === hoverDate && selecting === "start";

    if (isPast || (info && !info.available)) {
      return { background: "var(--cal-unavailable-bg)", color: "var(--cal-unavailable-fg)", cursor: "not-allowed", textDecoration: "line-through" };
    }
    if (isStart || isEnd) {
      return { background: "var(--cal-selected-bg)", color: "var(--cal-selected-fg)", borderRadius: isStart && !isEnd ? "50% 0 0 50%" : isEnd && localStart ? "0 50% 50% 0" : "50%" };
    }
    if (inRange) {
      return { background: "var(--cal-range-bg)", color: "var(--cal-range-fg)" };
    }
    if (info?.isPeakPricing) {
      return { border: "2px solid var(--cal-peak-border)", borderRadius: "50%", color: "var(--cal-peak-fg)" };
    }
    if (info?.partialAvailability) {
      return { background: "var(--cal-partial-bg)", borderRadius: "50%", color: "var(--cal-partial-fg)" };
    }
    if (isHover) {
      return { background: "var(--cal-hover-bg)", borderRadius: "50%" };
    }
    return {};
  }

  function renderMonth(year: number, month: number) {
    const cells = monthGrid(year, month);
    const label = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return (
      <div className="flex-1 min-w-0">
        <div className="text-center text-sm font-semibold mb-3" style={{ color: "var(--voya-fg-primary)" }}>
          {label}
        </div>
        <div className="grid grid-cols-7 gap-0 text-center">
          {DAYS.map(d => (
            <div key={d} className="text-xs font-medium py-1" style={{ color: "var(--voya-fg-secondary)" }}>{d}</div>
          ))}
          {cells.map((date, i) => {
            if (!date) return <div key={i} />;
            const ymd = formatYMD(date);
            const style = getDayStyle(ymd);
            const info = availMap.get(ymd);
            const disabled = style.cursor === "not-allowed";
            return (
              <div
                key={ymd}
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-label={`${ymd}${info?.price ? ` — $${info.price}` : ""}${disabled ? " (unavailable)" : ""}`}
                aria-disabled={disabled}
                className="relative flex items-center justify-center text-sm select-none py-0.5"
                style={{ height: 36, cursor: disabled ? "not-allowed" : "pointer" }}
                onClick={() => handleDayClick(ymd)}
                onMouseEnter={() => setHoverDate(ymd)}
                onMouseLeave={() => setHoverDate(null)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") handleDayClick(ymd); }}
              >
                <span
                  className="flex items-center justify-center w-8 h-8 text-sm font-medium transition-colors"
                  style={style}
                >
                  {date.getDate()}
                </span>
                {info?.price && !disabled && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] leading-none"
                    style={{ color: "var(--voya-fg-tertiary)" }}
                  >
                    ${info.price}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-4 ${className}`}
      style={{
        background: "var(--voya-surface)",
        borderColor: "var(--voya-border)",
        // CSS custom props for calendar color semantics
        ["--cal-unavailable-bg" as string]: "transparent",
        ["--cal-unavailable-fg" as string]: "var(--voya-fg-tertiary)",
        ["--cal-selected-bg" as string]: "var(--voya-gold)",
        ["--cal-selected-fg" as string]: "#000",
        ["--cal-range-bg" as string]: "color-mix(in srgb, var(--voya-gold) 20%, transparent)",
        ["--cal-range-fg" as string]: "var(--voya-fg-primary)",
        ["--cal-peak-border" as string]: "var(--voya-gold)",
        ["--cal-peak-fg" as string]: "var(--voya-gold)",
        ["--cal-partial-bg" as string]: "color-mix(in srgb, #f59e0b 20%, transparent)",
        ["--cal-partial-fg" as string]: "#92400e",
        ["--cal-hover-bg" as string]: "var(--voya-fg-tertiary)",
      }}
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setBaseMonth(b => addMonths(b, -1))}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Previous month"
          style={{ color: "var(--voya-fg-secondary)" }}
        >
          ‹
        </button>
        <div className="flex gap-6 flex-1">
          {renderMonth(baseMonth.getFullYear(), baseMonth.getMonth())}
          {renderMonth(nextMonth.getFullYear(), nextMonth.getMonth())}
        </div>
        <button
          type="button"
          onClick={() => setBaseMonth(b => addMonths(b, 1))}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Next month"
          style={{ color: "var(--voya-fg-secondary)" }}
        >
          ›
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 pt-3 border-t" style={{ borderColor: "var(--voya-border)" }}>
        {[
          { color: "var(--voya-gold)", label: "Selected" },
          { color: "color-mix(in srgb, var(--voya-gold) 20%, transparent)", label: "In range" },
          { color: "transparent", border: "2px solid var(--voya-gold)", label: "Peak pricing" },
          { color: "color-mix(in srgb, #f59e0b 20%, transparent)", label: "Partial avail." },
          { color: "var(--voya-fg-tertiary)", label: "Unavailable", strikethrough: true },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="w-3.5 h-3.5 rounded-full flex-shrink-0"
              style={{ background: item.color, border: item.border ?? "none" }}
            />
            <span className="text-[11px]" style={{ color: "var(--voya-fg-secondary)", textDecoration: item.strikethrough ? "line-through" : "none" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Selected range summary */}
      {localStart && localEnd && (
        <div
          className="mt-3 pt-3 border-t text-sm flex items-center justify-between"
          style={{ borderColor: "var(--voya-border)" }}
        >
          <span style={{ color: "var(--voya-fg-secondary)" }}>
            {localStart} → {localEnd} &nbsp;·&nbsp; {diffDays(localStart, localEnd)} nights
          </span>
          <button
            type="button"
            className="text-xs underline"
            style={{ color: "var(--voya-gold)" }}
            onClick={() => { setLocalStart(undefined); setLocalEnd(undefined); setSelecting("none"); }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
