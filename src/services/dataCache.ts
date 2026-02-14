/**
 * Centralized in-memory data cache with request deduplication.
 *
 * - **Stale-while-revalidate**: returns cached data instantly while
 *   re-fetching in the background on the next page that needs it.
 * - **Request deduplication**: if the same fetch is already in-flight,
 *   callers share the same promise instead of firing a duplicate request.
 * - **Cross-page sharing**: Results, Home, Guide, and Courses pages all
 *   read from the same store — no redundant API calls when navigating.
 * - **Profile image**: cached in localStorage so it survives full reloads.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

type InFlight = Promise<unknown>;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, InFlight>();

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 min

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

export function getCached<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(): void {
  cache.clear();
  inFlight.clear();
}

// ---------------------------------------------------------------------------
// Request deduplication wrapper
// ---------------------------------------------------------------------------

/**
 * Deduplicated fetch: if the same `key` is already in-flight, returns
 * the existing promise.  Otherwise starts the fetcher and caches the result.
 */
export async function dedupFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // 1. Return in-flight promise if one exists
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  // 2. Start fetch, store promise
  const promise = fetcher()
    .then((data) => {
      setCached(key, data);
      return data;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// Cache keys (constants to avoid typos)
// ---------------------------------------------------------------------------

export const CACHE_KEYS = {
  results: (stnum: string, rlevel: string) => `results:${stnum}:${rlevel}`,
  homeData: "homeData",
  notices: "notices",
  courseReg: "courseReg",
  profileImage: "profileImage",
} as const;

// ---------------------------------------------------------------------------
// Profile image helpers (persisted to localStorage)
// ---------------------------------------------------------------------------

const PROFILE_IMG_KEY = "cachedProfileImage";

export function getProfileImage(username: string | null): string | null {
  if (!username) return null;

  // Try localStorage first
  try {
    const stored = localStorage.getItem(PROFILE_IMG_KEY);
    if (stored) {
      const { url, user } = JSON.parse(stored);
      if (user === username && url) return url;
    }
  } catch {
    // ignore
  }

  // Construct the default URL — browser will cache the actual image via HTTP
  return `https://paravi.ruh.ac.lk/rumis/picture/user_pictures/student_std_pics/fosmis_pic/sc${username}.jpg`;
}

export function setProfileImage(username: string, url: string): void {
  try {
    localStorage.setItem(
      PROFILE_IMG_KEY,
      JSON.stringify({ url, user: username })
    );
  } catch {
    // ignore quota
  }
}

export function clearProfileImage(): void {
  try {
    localStorage.removeItem(PROFILE_IMG_KEY);
  } catch {
    // ignore
  }
}
