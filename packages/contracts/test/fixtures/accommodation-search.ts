/**
 * Accommodation Search Fixtures — WO-015
 * Covers: Marriott/HVMI villa, partner apartment, unavailable property,
 * illustrative fallback, discounted offer, request edge cases.
 */

const FRESH = "2099-09-01T10:00:00.000Z";
const EXPIRES = "2099-09-02T10:00:00.000Z";
const CHECKIN = "2099-09-10T00:00:00.000Z";
const CHECKOUT = "2099-09-14T00:00:00.000Z";

// ─── Valid search requests ────────────────────────────────────────────────────

export const validAccommodationRequest = {
  destination: "Lucca, Tuscany, Italy",
  checkIn: CHECKIN,
  checkOut: CHECKOUT,
  guests: { adults: 2, children: 0, infants: 0, pets: 0 },
  propertyTypes: ["VILLA", "HOME"],
  currency: "USD",
  sort: "HVMI_FIRST",
  page: 1,
  pageSize: 10,
};

export const geoSearchRequest = {
  geo: { lat: 43.8429, lng: 10.5027, radiusKm: 30 },
  checkIn: CHECKIN,
  checkOut: CHECKOUT,
  guests: { adults: 4, children: 2 },
  sort: "HVMI_FIRST",
};

export const bonvoyMemberRequest = {
  destination: "Lucca, Italy",
  checkIn: CHECKIN,
  checkOut: CHECKOUT,
  guests: { adults: 2 },
  bonvoyContext: {
    memberId: "BONVOY-12345",
    tierLevel: "PLATINUM",
    pointsBalance: 45000,
    usePointsForStay: false,
  },
};

// ─── Accommodation search results ─────────────────────────────────────────────

export const hvmiVillaResult = {
  propertyId: "hvmi-villa-della-torre",
  name: "Villa della Torre",
  propertyType: "VILLA",
  partnerClassification: "HVMI",
  hvmiPriority: true,
  location: { city: "Lucca", country: "IT", address: "Via della Torre, Lucca", regionLabel: "Tuscany" },
  geo: { lat: 43.843, lng: 10.502 },
  images: [
    { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", alt: "Villa della Torre exterior", isPrimary: true, category: "EXTERIOR" },
  ],
  amenities: ["private pool", "wine cellar", "vineyard views", "concierge", "wifi"],
  ratingSummary: { score: 9.4, reviewCount: 48, category: "Exceptional" },
  priceSummary: { nightlyRate: "450.00", currency: "USD", discountPct: 0, taxesAndFees: "81.00", totalStay: "1881.00" },
  availabilitySummary: { available: true, roomsLeft: 1 },
  bonvoySummary: { pointsForStay: 9000, pointsPerDollar: 5, eliteBonus: false, termsNote: "HVMI points vary by property" },
  policiesSummary: { cancellationPolicy: "Free cancellation up to 7 days before check-in", checkInTime: "15:00", checkOutTime: "11:00", petsAllowed: false, smokingAllowed: false },
  provenance: "HVMI",
  bookabilityStatus: "BOOKABLE",
  sourceFetchedAt: FRESH,
  expiresAt: EXPIRES,
  hvmiCollectionName: "Vineyards & Winery Homes",
};

export const marriottHotelResult = {
  propertyId: "marriott-grand-universe-lucca",
  name: "Grand Universe Lucca, Autograph Collection",
  propertyType: "HOTEL",
  partnerClassification: "MARRIOTT_PREMIUM",
  hvmiPriority: false,
  location: { city: "Lucca", country: "IT", address: "Via Santa Giustina 1", regionLabel: "Tuscany" },
  geo: { lat: 43.844, lng: 10.503 },
  images: [
    { url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800", alt: "Grand Universe Lucca hotel", isPrimary: true, category: "EXTERIOR" },
  ],
  amenities: ["spa", "restaurant", "bar", "fitness centre", "wifi"],
  ratingSummary: { score: 8.8, reviewCount: 312, category: "Excellent" },
  priceSummary: { nightlyRate: "280.00", currency: "USD", discountPct: 15, taxesAndFees: "45.00", totalStay: "1185.00" },
  availabilitySummary: { available: true, roomsLeft: 4 },
  bonvoySummary: { pointsForStay: 5600, pointsPerDollar: 5, eliteBonus: true },
  policiesSummary: { cancellationPolicy: "Free cancellation 24 hours before check-in", checkInTime: "16:00", checkOutTime: "12:00", petsAllowed: true, smokingAllowed: false },
  provenance: "MARRIOTT_DIRECT",
  bookabilityStatus: "BOOKABLE",
  sourceFetchedAt: FRESH,
  expiresAt: EXPIRES,
};

export const partnerApartmentResult = {
  propertyId: "partner-apt-tuscany-001",
  name: "Tuscan Farmhouse Apartment",
  propertyType: "APARTMENT",
  partnerClassification: "NON_MARRIOTT",
  hvmiPriority: false,
  location: { city: "Lucca", country: "IT", regionLabel: "Tuscany" },
  images: [],
  amenities: ["kitchen", "garden", "wifi"],
  priceSummary: { nightlyRate: "120.00", currency: "USD", discountPct: 0, taxesAndFees: "18.00", totalStay: "498.00" },
  availabilitySummary: { available: true },
  provenance: "ILLUSTRATIVE",
  bookabilityStatus: "ILLUSTRATIVE",
  sourceFetchedAt: FRESH,
};

export const unavailablePropertyResult = {
  propertyId: "marriott-spa-resort-lucca",
  name: "Marriott Wellness Resort Lucca",
  propertyType: "RESORT",
  partnerClassification: "MARRIOTT_PREMIUM",
  hvmiPriority: false,
  location: { city: "Lucca", country: "IT" },
  priceSummary: { nightlyRate: "380.00", currency: "USD", discountPct: 0 },
  availabilitySummary: { available: false, soldOutMessage: "Sold out for selected dates" },
  provenance: "MARRIOTT_DIRECT",
  bookabilityStatus: "EXPIRED",
  sourceFetchedAt: "2099-08-01T00:00:00.000Z",
  expiresAt: "2099-08-02T00:00:00.000Z",
};

export const illustrativeFallbackResult = {
  propertyId: "illustrative-villa-001",
  name: "Sample Villa Toscana",
  propertyType: "VILLA",
  partnerClassification: "NON_MARRIOTT",
  hvmiPriority: false,
  location: { city: "Siena", country: "IT" },
  priceSummary: { nightlyRate: "200.00", currency: "USD", discountPct: 0 },
  availabilitySummary: { available: false },
  provenance: "ILLUSTRATIVE",
  bookabilityStatus: "ILLUSTRATIVE",
  sourceFetchedAt: FRESH,
};

// ─── Valid search response ────────────────────────────────────────────────────

export const validSearchResponse = {
  queryId: "q-lucca-20990901",
  correlationId: "corr-search-001",
  cacheStatus: "MISS",
  results: [hvmiVillaResult, marriottHotelResult, partnerApartmentResult],
  pagination: { page: 1, pageSize: 10, totalResults: 3, hasNextPage: false },
  freshness: { fetchedAt: FRESH, expiresAt: EXPIRES, label: "FRESH" },
  fallbackDisclosure: "One result shows illustrative inventory not available for booking.",
};

// ─── Invalid request fixtures ─────────────────────────────────────────────────

export const invalidAccommodationRequests = {
  checkOutBeforeCheckIn: {
    destination: "Lucca, Italy",
    checkIn: "2099-09-14T00:00:00.000Z",
    checkOut: "2099-09-10T00:00:00.000Z",
    guests: { adults: 2 },
  },
  checkOutEqualsCheckIn: {
    destination: "Lucca, Italy",
    checkIn: CHECKIN,
    checkOut: CHECKIN,
    guests: { adults: 2 },
  },
  noGuestsAtAll: {
    destination: "Lucca, Italy",
    checkIn: CHECKIN,
    checkOut: CHECKOUT,
    guests: { adults: 0 },
  },
  noDestinationOrGeo: {
    checkIn: CHECKIN,
    checkOut: CHECKOUT,
    guests: { adults: 2 },
  },
  negativeGuestCount: {
    destination: "Rome",
    checkIn: CHECKIN,
    checkOut: CHECKOUT,
    guests: { adults: -1 },
  },
  pageSizeTooLarge: {
    destination: "Paris",
    checkIn: CHECKIN,
    checkOut: CHECKOUT,
    guests: { adults: 2 },
    pageSize: 200,
  },
};
