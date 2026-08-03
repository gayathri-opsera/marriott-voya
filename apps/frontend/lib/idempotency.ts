const TTL_MS = 24 * 60 * 60 * 1000;
const STORAGE_PREFIX = "voya:idempotency:";

interface StoredEntry {
  key: string;
  expiresAt: number;
}

export function generateIdempotencyKey(namespace: string): string {
  return `${namespace}-${crypto.randomUUID()}`;
}

export class IdempotencyStore {
  private storage: Storage | null;

  constructor(storage?: Storage | null) {
    this.storage = storage ?? (typeof sessionStorage !== "undefined" ? sessionStorage : null);
  }

  get(id: string): string | null {
    if (!this.storage) return null;

    const raw = this.storage.getItem(STORAGE_PREFIX + id);
    if (!raw) return null;

    try {
      const entry = JSON.parse(raw) as StoredEntry;
      if (Date.now() > entry.expiresAt) {
        this.storage.removeItem(STORAGE_PREFIX + id);
        return null;
      }
      return entry.key;
    } catch {
      this.storage.removeItem(STORAGE_PREFIX + id);
      return null;
    }
  }

  set(id: string, key: string): void {
    if (!this.storage) return;

    const entry: StoredEntry = { key, expiresAt: Date.now() + TTL_MS };
    this.storage.setItem(STORAGE_PREFIX + id, JSON.stringify(entry));
  }

  clear(id: string): void {
    if (!this.storage) return;
    this.storage.removeItem(STORAGE_PREFIX + id);
  }
}
