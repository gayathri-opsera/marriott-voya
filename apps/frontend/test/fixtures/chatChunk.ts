import type { ChatChunk } from "../../lib/sse";

export type { ChatChunk };

export function makeTextChunk(content = "Hello from the assistant"): ChatChunk {
  return { type: "text", content };
}

export function makeToolChunk(toolName: string, input: unknown): ChatChunk {
  return { type: "tool_use", toolName, input };
}

export function makeErrorChunk(message = "Something went wrong"): ChatChunk {
  return { type: "error", message };
}

export function makeDoneChunk(finishReason = "stop"): ChatChunk {
  return { type: "done", finishReason };
}
