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
      case "text":
        if (typeof parsed.content !== "string") return null;
        return { type: "text", content: parsed.content };
      case "tool_use":
        if (typeof parsed.toolName !== "string") return null;
        return { type: "tool_use", toolName: parsed.toolName, input: parsed.input };
      case "tool_result":
        if (typeof parsed.toolUseId !== "string" || typeof parsed.content !== "string") return null;
        return { type: "tool_result", toolUseId: parsed.toolUseId, content: parsed.content };
      case "error":
        if (typeof parsed.message !== "string") return null;
        return { type: "error", message: parsed.message };
      case "done":
        if (typeof parsed.finishReason !== "string") return null;
        return { type: "done", finishReason: parsed.finishReason };
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
    throw new Error(`SSE request failed: ${response.status}`);
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
