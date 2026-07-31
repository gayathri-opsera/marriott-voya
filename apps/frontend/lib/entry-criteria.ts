const STORAGE_KEY = "voya:entry-criteria";

export type TravelType = "flights" | "hotels" | "cars";

export interface EntryCriteria {
  destination?: string;
  type: TravelType;
  date?: string;
  passengers?: number;
}

export function getEntryCriteria(): EntryCriteria | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EntryCriteria;
  } catch {
    return null;
  }
}

export function setEntryCriteria(criteria: EntryCriteria): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(criteria));
}

export function clearEntryCriteria(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
