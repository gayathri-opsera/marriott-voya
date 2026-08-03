import type { ChatChunk } from "../../lib/sse";

function encodeChunk(chunk: ChatChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

export function makeSseStream(chunks: ChatChunk[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream({
    pull(controller) {
      if (index >= chunks.length) {
        controller.close();
        return;
      }
      const chunk = chunks[index];
      if (!chunk) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(encodeChunk(chunk)));
      index += 1;
    },
  });
}
