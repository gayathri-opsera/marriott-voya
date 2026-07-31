"use client";

import { Input } from "@travel/design-system";
import type { Filters } from "./SortControl";
import { SortControl } from "./SortControl";
import type { ResultDensity } from "../../lib/search-params";

export type { Filters } from "./SortControl";

interface FilterPanelProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

const DENSITY_OPTIONS: { value: ResultDensity; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
];

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps): React.JSX.Element {
  const update = (partial: Partial<Filters>): void => {
    onFilterChange({ ...filters, ...partial });
  };

  return (
    <aside className="w-full shrink-0 space-y-6 lg:w-56" aria-label="Search filters">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Price range</h3>
        <div className="space-y-2">
          <Input
            label="Min price"
            id="filter-min-price"
            type="number"
            min={0}
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              update({
                minPrice: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            placeholder="0"
          />
          <Input
            label="Max price"
            id="filter-max-price"
            type="number"
            min={0}
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              update({
                maxPrice: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            placeholder="Any"
          />
        </div>
      </div>

      <SortControl value={filters.sort} onChange={(sort) => update({ sort })} />

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Result density</h3>
        <div className="space-y-1">
          {DENSITY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer"
            >
              <input
                type="radio"
                name="density"
                value={option.value}
                checked={filters.density === option.value}
                onChange={() => update({ density: option.value })}
                className="accent-brand-primary"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
