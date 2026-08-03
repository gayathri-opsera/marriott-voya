import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock jsPDF so we don't need a full DOM/canvas environment
vi.mock("jspdf", () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    setFillColor: vi.fn(),
    setTextColor: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    rect: vi.fn(),
    text: vi.fn(),
    line: vi.fn(),
    splitTextToSize: vi.fn(() => ["line1"]),
    addPage: vi.fn(),
    output: vi.fn(() => new Blob(["pdf"], { type: "application/pdf" })),
  })),
}));

// Mock URL.createObjectURL
beforeEach(() => {
  global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
  global.URL.revokeObjectURL = vi.fn();
});

import { generateItineraryPdf, type PdfItineraryData } from "../../lib/itinerary-pdf";

const SAMPLE: PdfItineraryData = {
  tripTitle: "Tuscany Getaway",
  destination: "Lucca, Italy",
  checkIn: "2026-09-10",
  checkOut: "2026-09-14",
  travellers: 2,
  bonvoyPoints: 12500,
  totalCost: 2100,
  currency: "USD",
  days: [
    {
      date: "2026-09-10",
      label: "Day 1 — Arrival",
      items: [
        { type: "accommodation", title: "Villa della Torre", description: "Check-in", price: 485, currency: "USD" },
        { type: "transport", title: "Airport Transfer", price: 25, currency: "USD" },
      ],
    },
    {
      date: "2026-09-11",
      label: "Day 2 — Explore",
      items: [
        { type: "activity", title: "City Walls Walk", price: 0, currency: "USD" },
        { type: "restaurant", title: "Buca di Sant'Antonio", price: 65, currency: "USD" },
      ],
    },
  ],
};

describe("generateItineraryPdf", () => {
  it("returns a blob URL string", async () => {
    const url = await generateItineraryPdf(SAMPLE);
    expect(typeof url).toBe("string");
    expect(url).toMatch(/blob:/);
  });

  it("calls URL.createObjectURL once", async () => {
    await generateItineraryPdf(SAMPLE);
    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it("works with minimal data (no bonvoy points, no total)", async () => {
    const minimal: PdfItineraryData = {
      tripTitle: "Quick Trip",
      destination: "Rome",
      checkIn: "2026-10-01",
      checkOut: "2026-10-03",
      travellers: 1,
      days: [],
    };
    const url = await generateItineraryPdf(minimal);
    expect(url).toBeDefined();
  });

  it("handles items with no description or price", async () => {
    const data: PdfItineraryData = {
      ...SAMPLE,
      days: [{
        date: "2026-09-10",
        items: [{ type: "flight", title: "Flight to Rome" }],
      }],
    };
    const url = await generateItineraryPdf(data);
    expect(url).toBeDefined();
  });
});
