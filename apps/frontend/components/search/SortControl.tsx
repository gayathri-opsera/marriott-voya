import type { ResultDensity, SortOption } from "../../lib/search-params";

export interface Filters {
  minPrice?: number;
  maxPrice?: number;
  sort: SortOption;
  density: ResultDensity;
}

interface SortControlProps {
  value: SortOption;
  onChange: (sort: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "duration", label: "Duration" },
  { value: "rating", label: "Rating" },
];

export function SortControl({ value, onChange }: SortControlProps): React.JSX.Element {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-text-primary mb-2">Sort by</legend>
      <div className="space-y-1">
        {SORT_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer"
          >
            <input
              type="radio"
              name="sort"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="accent-brand-primary"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
