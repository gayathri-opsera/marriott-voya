import type { TravelType } from "./entry-criteria";

export type SortOption = "price_asc" | "price_desc" | "duration" | "rating";
export type ResultDensity = "compact" | "comfortable" | "spacious";

export interface SearchState {
  q?: string;
  type?: TravelType;
  sort?: SortOption;
  minPrice?: number;
  maxPrice?: number;
  date?: string;
  returnDate?: string;
  passengers?: number;
  density?: ResultDensity;
}

export function parseSearchParams(params: URLSearchParams): SearchState {
  const state: SearchState = {};

  const q = params.get("q");
  if (q) state.q = q;

  const type = params.get("type");
  if (type === "flights" || type === "hotels" || type === "cars") {
    state.type = type;
  }

  const sort = params.get("sort");
  if (
    sort === "price_asc" ||
    sort === "price_desc" ||
    sort === "duration" ||
    sort === "rating"
  ) {
    state.sort = sort;
  }

  const minPrice = params.get("minPrice");
  if (minPrice !== null && minPrice !== "") {
    const parsed = Number(minPrice);
    if (!Number.isNaN(parsed)) state.minPrice = parsed;
  }

  const maxPrice = params.get("maxPrice");
  if (maxPrice !== null && maxPrice !== "") {
    const parsed = Number(maxPrice);
    if (!Number.isNaN(parsed)) state.maxPrice = parsed;
  }

  const date = params.get("date");
  if (date) state.date = date;

  const returnDate = params.get("returnDate");
  if (returnDate) state.returnDate = returnDate;

  const passengers = params.get("passengers");
  if (passengers !== null && passengers !== "") {
    const parsed = Number(passengers);
    if (!Number.isNaN(parsed)) state.passengers = parsed;
  }

  const density = params.get("density");
  if (density === "compact" || density === "comfortable" || density === "spacious") {
    state.density = density;
  }

  return state;
}

export function toSearchParams(state: SearchState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.q) params.set("q", state.q);
  if (state.type) params.set("type", state.type);
  if (state.sort) params.set("sort", state.sort);
  if (state.minPrice !== undefined) params.set("minPrice", String(state.minPrice));
  if (state.maxPrice !== undefined) params.set("maxPrice", String(state.maxPrice));
  if (state.date) params.set("date", state.date);
  if (state.returnDate) params.set("returnDate", state.returnDate);
  if (state.passengers !== undefined) params.set("passengers", String(state.passengers));
  if (state.density) params.set("density", state.density);

  return params;
}
