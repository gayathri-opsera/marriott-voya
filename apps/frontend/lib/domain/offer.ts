export function isBookable(offer: {
  bookable: boolean;
  provenance: string;
  expiresAt?: string;
}): boolean {
  if (!offer.bookable) return false;
  if (offer.provenance === "ILLUSTRATIVE") return false;
  if (offer.expiresAt && new Date(offer.expiresAt) <= new Date()) return false;
  return true;
}

const PROVENANCE_LABELS: Record<string, string> = {
  AMADEUS: "Amadeus",
  RAPIDAPI: "RapidAPI",
  ILLUSTRATIVE: "Sample data",
};

export function getProvenanceLabel(provenance: string): string {
  return PROVENANCE_LABELS[provenance] ?? provenance;
}

const PROVENANCE_BADGE_VARIANTS: Record<string, string> = {
  AMADEUS: "provenance-amadeus",
  RAPIDAPI: "provenance-rapidapi",
  ILLUSTRATIVE: "provenance-illustrative",
};

export function getProvenanceBadgeVariant(provenance: string): string {
  return PROVENANCE_BADGE_VARIANTS[provenance] ?? "default";
}
