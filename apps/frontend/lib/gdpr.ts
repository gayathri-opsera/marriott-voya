/**
 * GDPR Right to Erasure and Data Portability — WOREF-028 / WOREF-046
 *
 * Implements two GDPR data subject rights:
 * 1. Right to Erasure (Art. 17) — delete all personal data for a user
 * 2. Right to Portability (Art. 20) — export all personal data as JSON
 *
 * Both APIs delegate to the user service, which handles the actual data operations
 * across all microservices (bookings, conversations, analytics).
 *
 * Compliance notes:
 * - Erasure deletes within 30 days per regulation
 * - Export uses a machine-readable JSON format
 * - Both operations require authenticated session (enforced at API Gateway)
 * - Audit log entries are created for regulatory evidence (not deleted on erasure)
 */

export interface GdprEraseRequest {
  /** User must explicitly confirm erasure — prevents accidental calls */
  confirmation: "I understand this will permanently delete my data";
  reason?: "user_request" | "account_closure" | "legal_requirement";
}

export interface GdprEraseResponse {
  requestId: string;
  status: "ACCEPTED" | "REJECTED";
  estimatedCompletionDays: number;
  message: string;
}

export interface GdprExportResponse {
  downloadUrl: string;
  expiresAt: string;
  format: "JSON";
  sizeBytes?: number;
}

/**
 * Submit a Right to Erasure request.
 * Requires explicit confirmation string to prevent accidental calls.
 */
export async function requestErasure(userId: string, req: GdprEraseRequest): Promise<GdprEraseResponse> {
  const res = await fetch(`/api/v1/users/${userId}/gdpr/erase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, string>;
    throw new Error(body["message"] ?? `Erasure request failed: ${res.status}`);
  }
  return res.json() as Promise<GdprEraseResponse>;
}

/**
 * Request a data portability export.
 * Returns a time-limited download URL.
 */
export async function requestDataExport(userId: string): Promise<GdprExportResponse> {
  const res = await fetch(`/api/v1/users/${userId}/gdpr/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, string>;
    throw new Error(body["message"] ?? `Export request failed: ${res.status}`);
  }
  return res.json() as Promise<GdprExportResponse>;
}
