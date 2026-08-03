import { describe, it, expect } from "vitest";
import {
  makeOffer,
  makeSearchResponse,
  makeError,
  makeItinerary,
  makeTextChunk,
  makeDoneChunk,
  makeSseStream,
} from "../fixtures";

describe("fixture factories", () => {
  it("makeOffer returns a contract-typed UnifiedOffer", () => {
    const offer = makeOffer({ title: "Custom Offer" });
    expect(offer.title).toBe("Custom Offer");
    expect(offer.provenance).toBe("AMADEUS");
    expect(offer.bookable).toBe(true);
  });

  it("makeSearchResponse returns offers array", () => {
    const response = makeSearchResponse({ total: 1, offers: [makeOffer()] });
    expect(response.offers).toHaveLength(1);
    expect(response.total).toBe(1);
    expect(response.searchId).toBeTruthy();
  });

  it("makeError returns code/message/field envelope", () => {
    const envelope = makeError({ code: "NOT_FOUND", message: "Missing", field: "origin" });
    expect(envelope.error.code).toBe("NOT_FOUND");
    expect(envelope.error.message).toBe("Missing");
    expect(envelope.error.field).toBe("origin");
    expect(envelope.reference).toBeTruthy();
  });

  it("makeItinerary returns items (trip segments)", () => {
    const itinerary = makeItinerary();
    expect(itinerary.items.length).toBeGreaterThan(0);
    expect(itinerary.items[0]?.bookingType).toBe("FLIGHT");
    expect(itinerary.totalAmount).toBeTruthy();
  });

  it("makeSseStream encodes chat chunks as SSE frames", async () => {
    const stream = makeSseStream([makeTextChunk("Hi"), makeDoneChunk()]);
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    const first = await reader.read();
    expect(decoder.decode(first.value)).toContain('"type":"text"');
    expect(decoder.decode(first.value)).toContain("data:");

    const second = await reader.read();
    expect(decoder.decode(second.value)).toContain('"type":"done"');

    const done = await reader.read();
    expect(done.done).toBe(true);
  });
});
