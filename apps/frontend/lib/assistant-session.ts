import { apiGet, apiPost } from "./api/client";

export interface SessionMetadata {
  id: string;
  createdAt: string;
  messageCount: number;
  tokenCount: number;
}

export async function createSession(): Promise<{ sessionId: string }> {
  const res = await apiPost<{ id: string }>("/api/v1/ai/sessions", {});
  return { sessionId: res.id };
}

export async function getSessionMetadata(id: string): Promise<SessionMetadata> {
  return apiGet<SessionMetadata>(`/api/v1/ai/sessions/${id}`);
}
