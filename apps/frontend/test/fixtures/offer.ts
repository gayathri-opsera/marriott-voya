export interface OfferFixture {
  id: string;
  type: string;
  title: string;
  price: number;
  currency: string;
  expiresAt: string;
  bookable: boolean;
}

export function makeOffer(overrides: Partial<OfferFixture> = {}): OfferFixture {
  return {
    id: "offer_test_001",
    type: "flight",
    title: "JFK → LHR",
    price: 499.99,
    currency: "USD",
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    bookable: true,
    ...overrides,
  };
}
