export type ChatChunk =
  | { type: "text"; content: string }
  | { type: "tool_use"; toolName: string; input: unknown }
  | { type: "tool_result"; toolUseId: string; content: string }
  | { type: "error"; message: string }
  | { type: "done"; finishReason: string };

export function parseSseChunk(line: string): ChatChunk | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;

  const payload = trimmed.slice(5).trim();
  if (!payload || payload === "[DONE]") return null;

  try {
    const parsed = JSON.parse(payload) as { type?: string; [key: string]: unknown };
    if (!parsed.type || typeof parsed.type !== "string") return null;

    switch (parsed.type) {
      // "delta" is what the AI service streams word-by-word; normalize to "text"
      case "delta":
      case "text":
        if (typeof parsed.content !== "string") return null;
        return { type: "text", content: parsed.content };
      // "tool_start" emitted when a tool begins; normalize to "tool_use"
      case "tool_start":
      case "tool_use":
        if (typeof parsed.toolName !== "string") return null;
        return { type: "tool_use", toolName: parsed.toolName as string, input: parsed.input };
      // "tool_result" emitted after tool execution (AI service sends toolName + toolUseId, no content)
      case "tool_result":
        return { type: "tool_result", toolUseId: (parsed.toolUseId as string) ?? "", content: (parsed.toolName as string) ?? "" };
      case "error":
        if (typeof parsed.message !== "string") return null;
        return { type: "error", message: parsed.message };
      // "done" may have usage instead of finishReason
      case "done":
        return { type: "done", finishReason: (parsed.finishReason as string) ?? "end_turn" };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export async function* streamChat(
  url: string,
  body: unknown,
  signal?: AbortSignal,
): AsyncGenerator<ChatChunk> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(body),
    ...(signal ? { signal } : {}),
  });

  if (!response.ok) {
    const err = new Error(`SSE request failed: ${response.status}`) as Error & { status: number };
    err.status = response.status;
    throw err;
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Response body is not readable");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const chunk = parseSseChunk(line);
        if (chunk) yield chunk;
      }
    }

    if (buffer.trim()) {
      const chunk = parseSseChunk(buffer);
      if (chunk) yield chunk;
    }
  } finally {
    reader.releaseLock();
  }
}
