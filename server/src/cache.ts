import crypto from 'crypto';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();
  private maxItems: number;
  private defaultTtlMs: number;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(maxItems = 200, defaultTtlMs = 1000 * 60 * 30, cleanupIntervalMs = 1000 * 60 * 5) {
    this.maxItems = maxItems;
    this.defaultTtlMs = defaultTtlMs;

    this.cleanupTimer = setInterval(() => {
      this.purgeExpired();
    }, cleanupIntervalMs);
    this.cleanupTimer.unref();
  }

  purgeExpired(): number {
    const now = Date.now();
    let purged = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        purged++;
      }
    }
    return purged;
  }

  static createKey(prefix: string, payload: unknown): string {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hash = crypto.createHash('sha256').update(serialized).digest('hex');
    return `${prefix}:${hash}`;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    if (this.store.size >= this.maxItems) {
      // Evict oldest item
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }

    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.store.set(key, { value, expiresAt });
  }

  clear(): void {
    this.store.clear();
  }
}

export const requestCache = new MemoryCache();
