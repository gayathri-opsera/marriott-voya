/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAssistantStream } from "../../lib/assistant-stream";
import * as sse from "../../lib/sse";
import {
  makeTextChunk,
  makeToolChunk,
  makeDoneChunk,
  makeErrorChunk,
} from "../fixtures/chatChunk";

vi.mock("../../lib/sse", () => ({
  streamChat: vi.fn(),
}));

async function* mockStream(...chunks: sse.ChatChunk[]) {
  for (const chunk of chunks) {
    yield chunk;
  }
}

describe("useAssistantStream", () => {
  beforeEach(() => {
    vi.mocked(sse.streamChat).mockReset();
  });

  it("accumulates text chunks into the last assistant message", async () => {
    vi.mocked(sse.streamChat).mockReturnValue(
      mockStream(makeTextChunk("Hello"), makeTextChunk(" world"), makeDoneChunk()) as AsyncGenerator<sse.ChatChunk>,
    );

    const { result } = renderHook(() => useAssistantStream("session-1"));

    await act(async () => {
      await result.current.send("Hi");
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toEqual({ role: "user", content: "Hi" });
    expect(result.current.messages[1]).toEqual({ role: "assistant", content: "Hello world", toolCalls: [] });
  });

  it("creates toolCalls entries from tool_use chunks", async () => {
    vi.mocked(sse.streamChat).mockReturnValue(
      mockStream(
        makeToolChunk("search_flights", { origin: "JFK" }),
        makeDoneChunk(),
      ) as AsyncGenerator<sse.ChatChunk>,
    );

    const { result } = renderHook(() => useAssistantStream("session-2"));

    await act(async () => {
      await result.current.send("Find flights");
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));

    expect(result.current.messages[1]!.toolCalls).toEqual([
      { toolName: "search_flights", input: { origin: "JFK" } },
    ]);
  });

  it("sets error state on error chunks", async () => {
    vi.mocked(sse.streamChat).mockReturnValue(
      mockStream(makeErrorChunk("Stream failed")) as AsyncGenerator<sse.ChatChunk>,
    );

    const { result } = renderHook(() => useAssistantStream("session-3"));

    await act(async () => {
      await result.current.send("Hi");
    });

    await waitFor(() => expect(result.current.error).toBe("Stream failed"));
    expect(result.current.isStreaming).toBe(false);
  });
});
