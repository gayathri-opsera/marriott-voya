export type ChatChunkType = "text" | "tool_use" | "tool_result" | "error" | "done";

export interface ChatChunkFixture {
  type: ChatChunkType;
  content?: string;
  toolName?: string;
  toolInput?: unknown;
  toolResult?: unknown;
  error?: string;
  finishReason?: "stop" | "max_tokens" | "tool_use" | "error" | "cancelled";
}

export function makeTextChunk(content: string): ChatChunkFixture {
  return { type: "text", content };
}

export function makeToolChunk(toolName: string, toolInput: unknown): ChatChunkFixture {
  return { type: "tool_use", toolName, toolInput };
}

export function makeErrorChunk(error: string): ChatChunkFixture {
  return { type: "error", error };
}

export function makeDoneChunk(finishReason: ChatChunkFixture["finishReason"] = "stop"): ChatChunkFixture {
  return { type: "done", finishReason };
}
