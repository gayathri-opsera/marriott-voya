import { describe, it, expect } from "vitest";
import { parseSseChunk } from "../../lib/sse";

describe("parseSseChunk", () => {
  it("parses a text chunk", () => {
    const chunk = parseSseChunk('data: {"type":"text","content":"Hello"}');
    expect(chunk).toEqual({ type: "text", content: "Hello" });
  });

  it("parses a done chunk", () => {
    const chunk = parseSseChunk('data: {"type":"done","finishReason":"stop"}');
    expect(chunk).toEqual({ type: "done", finishReason: "stop" });
  });

  it("parses an error chunk", () => {
    const chunk = parseSseChunk('data: {"type":"error","message":"Something went wrong"}');
    expect(chunk).toEqual({ type: "error", message: "Something went wrong" });
  });

  it("returns null for an unknown type", () => {
    const chunk = parseSseChunk('data: {"type":"unknown","payload":"x"}');
    expect(chunk).toBeNull();
  });
});
