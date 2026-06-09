import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

// ============================================================
// Re-implement LRU eviction logic from public/sw.js
// ============================================================

const PRECACHE_URLS = [
  '/',
  '/json-formatter',
  '/base64',
  '/url-encoder-decoder',
  '/regex-tester',
  '/jwt-decoder',
  '/code-minifier-beautifier',
  '/markdown-editor',
  '/color-converter',
  '/timestamp',
  '/hash-generator',
  '/offline',
  '/favicon.svg',
  '/favicon.ico',
  '/manifest.json'
];

const MAX_CACHE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

interface CacheEntry {
  url: string;
  lastAccessed: number;
  size: number;
  isAppShell: boolean;
}

/**
 * Determine if a URL is an app shell asset (exempt from eviction).
 */
function isAppShellAsset(url: string): boolean {
  const pathname = url.startsWith('http') ? new URL(url).pathname : url;

  if (PRECACHE_URLS.includes(pathname)) return true;
  if (pathname.endsWith('.css')) return true;
  if (pathname.endsWith('.woff2') || pathname.endsWith('.woff')) return true;
  if (pathname.includes('favicon')) return true;

  return false;
}

/**
 * Perform LRU eviction simulation.
 * Returns the list of URLs that would be evicted.
 * Rules:
 * 1. Evict least-recently-used entries first (ascending lastAccessed order)
 * 2. App shell entries are EXEMPT from eviction
 * 3. Stop when total size <= threshold
 */
function performLRUEviction(entries: CacheEntry[], threshold: number = MAX_CACHE_SIZE_BYTES): string[] {
  const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
  if (totalSize <= threshold) return [];

  // Filter evictable entries (non-app-shell) and sort by lastAccessed ascending
  const evictable = entries
    .filter(e => !e.isAppShell)
    .sort((a, b) => a.lastAccessed - b.lastAccessed);

  const evicted: string[] = [];
  let currentSize = totalSize;

  for (const entry of evictable) {
    if (currentSize <= threshold) break;
    evicted.push(entry.url);
    currentSize -= entry.size;
  }

  return evicted;
}

// Arbitrary for cache entries
const cacheEntry = (isAppShell: boolean): fc.Arbitrary<CacheEntry> =>
  fc.record({
    url: fc.webUrl(),
    lastAccessed: fc.integer({ min: 1000000000000, max: 2000000000000 }),
    size: fc.integer({ min: 1000, max: 5000000 }),
    isAppShell: fc.constant(isAppShell),
  });

const mixedCacheEntries = fc.array(
  fc.oneof(cacheEntry(true), cacheEntry(false)),
  { minLength: 2, maxLength: 30 }
);

// ============================================================
// Property 18: LRU eviction ordering
// ============================================================
describe('Service Worker - Property 18: LRU eviction ordering', () => {
  test('evicts least-recently-used first', () => {
    fc.assert(
      fc.property(
        fc.array(cacheEntry(false), { minLength: 3, maxLength: 20 }),
        (entries) => {
          // Make total size exceed threshold
          const overSizeEntries = entries.map(e => ({
            ...e,
            size: Math.ceil((MAX_CACHE_SIZE_BYTES * 2) / entries.length),
          }));
          
          const evicted = performLRUEviction(overSizeEntries, MAX_CACHE_SIZE_BYTES);
          
          if (evicted.length > 1) {
            // Verify eviction order matches ascending lastAccessed
            const evictedEntries = evicted.map(url =>
              overSizeEntries.find(e => e.url === url)!
            );
            for (let i = 1; i < evictedEntries.length; i++) {
              expect(evictedEntries[i].lastAccessed).toBeGreaterThanOrEqual(
                evictedEntries[i - 1].lastAccessed
              );
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('app shell entries are exempt from eviction', () => {
    fc.assert(
      fc.property(
        mixedCacheEntries,
        (entries) => {
          // Inflate sizes to trigger eviction
          const inflated = entries.map(e => ({
            ...e,
            size: Math.ceil((MAX_CACHE_SIZE_BYTES * 3) / entries.length),
          }));

          const evicted = performLRUEviction(inflated, MAX_CACHE_SIZE_BYTES);
          const evictedEntries = evicted.map(url => inflated.find(e => e.url === url)!);
          
          // No app shell entry should be evicted
          for (const entry of evictedEntries) {
            expect(entry.isAppShell).toBe(false);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('eviction stops at threshold', () => {
    fc.assert(
      fc.property(
        fc.array(cacheEntry(false), { minLength: 5, maxLength: 20 }),
        fc.integer({ min: 10000, max: 1000000 }),
        (entries, threshold) => {
          // Inflate to exceed threshold
          const inflated = entries.map(e => ({
            ...e,
            size: Math.ceil((threshold * 3) / entries.length),
          }));

          const evicted = performLRUEviction(inflated, threshold);
          
          // After eviction, remaining size should be <= threshold
          const evictedSet = new Set(evicted);
          const remainingSize = inflated
            .filter(e => !evictedSet.has(e.url))
            .reduce((sum, e) => sum + e.size, 0);
          
          expect(remainingSize).toBeLessThanOrEqual(threshold);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('no eviction when below threshold', () => {
    fc.assert(
      fc.property(
        fc.array(cacheEntry(false), { minLength: 1, maxLength: 10 }),
        (entries) => {
          // Make total size below threshold
          const smallEntries = entries.map(e => ({ ...e, size: 100 }));
          const evicted = performLRUEviction(smallEntries, MAX_CACHE_SIZE_BYTES);
          expect(evicted.length).toBe(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('isAppShellAsset correctly identifies precached URLs', () => {
    for (const url of PRECACHE_URLS) {
      expect(isAppShellAsset(url)).toBe(true);
    }
    expect(isAppShellAsset('/some-random-page')).toBe(false);
    expect(isAppShellAsset('/api/data.json')).toBe(false);
  });

  test('isAppShellAsset identifies CSS and font files as app shell', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-z]+$/.test(s)),
        (name) => {
          expect(isAppShellAsset(`/${name}.css`)).toBe(true);
          expect(isAppShellAsset(`/${name}.woff2`)).toBe(true);
          expect(isAppShellAsset(`/${name}.woff`)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
