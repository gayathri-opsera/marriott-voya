import { describe, it, expect } from "vitest";
import { parseSearchParams, toSearchParams } from "../../lib/search-params";

describe("search-params", () => {
  it("parseSearchParams extracts q, type, and sort from URLSearchParams", () => {
    const params = new URLSearchParams("q=Paris&type=hotels&sort=price_desc");
    expect(parseSearchParams(params)).toEqual({
      q: "Paris",
      type: "hotels",
      sort: "price_desc",
    });
  });

  it("parseSearchParams extracts numeric price filters", () => {
    const params = new URLSearchParams("minPrice=50&maxPrice=500");
    expect(parseSearchParams(params)).toEqual({
      minPrice: 50,
      maxPrice: 500,
    });
  });

  it("toSearchParams serializes state back to URLSearchParams", () => {
    const params = toSearchParams({
      q: "London",
      type: "flights",
      sort: "rating",
      minPrice: 100,
      maxPrice: 800,
      date: "2026-07-01",
      passengers: 2,
      density: "compact",
    });
    expect(params.get("q")).toBe("London");
    expect(params.get("type")).toBe("flights");
    expect(params.get("sort")).toBe("rating");
    expect(params.get("minPrice")).toBe("100");
    expect(params.get("maxPrice")).toBe("800");
    expect(params.get("date")).toBe("2026-07-01");
    expect(params.get("passengers")).toBe("2");
    expect(params.get("density")).toBe("compact");
  });
});
