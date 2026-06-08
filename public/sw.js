// ToolsHub Service Worker - Caching Strategies for PWA
const CACHE_NAME = 'toolshub-v1';
const CACHE_META_DB = 'toolshub-cache-meta';
const CACHE_META_STORE = 'entries';
const CACHE_META_DB_VERSION = 1;
const MAX_CACHE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// App shell pages to precache on install
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

// Static asset file extensions that use cache-first strategy
const STATIC_ASSET_EXTENSIONS = [
  '.css', '.js', '.woff2', '.woff',
  '.svg', '.png', '.ico', '.jpg', '.gif', '.webp'
];

// Network-first timeout for HTML navigation requests (ms)
const NETWORK_TIMEOUT = 3000;

// ============================================================
// IndexedDB Cache Metadata Store
// Tracks: url, lastAccessed, size, isAppShell
// ============================================================

/**
 * Open the IndexedDB database for cache metadata.
 */
function openMetaDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_META_DB, CACHE_META_DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(CACHE_META_STORE)) {
        const store = db.createObjectStore(CACHE_META_STORE, { keyPath: 'url' });
        store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Determine if a URL is an app shell asset (exempt from eviction).
 * App shell assets include: precached HTML pages, critical CSS, fonts, and favicon.
 */
function isAppShellAsset(url) {
  const urlObj = new URL(url, self.location.origin);
  const pathname = urlObj.pathname;

  // All precached URLs are app shell
  if (PRECACHE_URLS.includes(pathname)) {
    return true;
  }

  // Critical CSS files
  if (pathname.endsWith('.css')) {
    return true;
  }

  // Font files
  if (pathname.endsWith('.woff2') || pathname.endsWith('.woff')) {
    return true;
  }

  // Favicon
  if (pathname.includes('favicon')) {
    return true;
  }

  return false;
}

/**
 * Save or update cache entry metadata in IndexedDB.
 */
async function updateCacheMeta(url, size) {
  const db = await openMetaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_META_STORE, 'readwrite');
    const store = tx.objectStore(CACHE_META_STORE);
    const entry = {
      url: url,
      lastAccessed: Date.now(),
      size: size,
      isAppShell: isAppShellAsset(url)
    };
    const request = store.put(entry);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

/**
 * Update the lastAccessed timestamp for a cached resource being served.
 */
async function touchCacheMeta(url) {
  try {
    const db = await openMetaDB();
    const tx = db.transaction(CACHE_META_STORE, 'readwrite');
    const store = tx.objectStore(CACHE_META_STORE);

    return new Promise((resolve, reject) => {
      const getRequest = store.get(url);
      getRequest.onsuccess = () => {
        const entry = getRequest.result;
        if (entry) {
          entry.lastAccessed = Date.now();
          store.put(entry);
        }
        resolve();
      };
      getRequest.onerror = () => reject(getRequest.error);
      tx.oncomplete = () => db.close();
    });
  } catch (e) {
    // Non-critical: silently ignore metadata update failures
  }
}

/**
 * Get total cache size from metadata store.
 */
async function getTotalCacheSize(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_META_STORE, 'readonly');
    const store = tx.objectStore(CACHE_META_STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      const entries = request.result || [];
      const total = entries.reduce((sum, entry) => sum + (entry.size || 0), 0);
      resolve(total);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all non-app-shell entries sorted by lastAccessed ascending (LRU first).
 */
async function getEvictableEntries(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_META_STORE, 'readonly');
    const store = tx.objectStore(CACHE_META_STORE);
    const index = store.index('lastAccessed');
    const request = index.getAll();
    request.onsuccess = () => {
      const entries = request.result || [];
      // Filter out app shell entries — they are exempt from eviction
      const evictable = entries.filter((entry) => !entry.isAppShell);
      // Already sorted by lastAccessed ascending (index order)
      resolve(evictable);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Perform LRU cache eviction if total cache size exceeds threshold.
 * Evicts entries in ascending last-access-time order (least recently used first).
 * App shell assets are EXEMPT from eviction.
 */
async function performLRUEviction() {
  try {
    const db = await openMetaDB();
    const totalSize = await getTotalCacheSize(db);

    if (totalSize <= MAX_CACHE_SIZE_BYTES) {
      db.close();
      return;
    }

    const evictable = await getEvictableEntries(db);
    const cache = await caches.open(CACHE_NAME);
    let currentSize = totalSize;

    for (const entry of evictable) {
      if (currentSize <= MAX_CACHE_SIZE_BYTES) {
        break;
      }

      // Remove from cache
      await cache.delete(entry.url);

      // Remove from metadata store
      await new Promise((resolve, reject) => {
        const tx = db.transaction(CACHE_META_STORE, 'readwrite');
        const store = tx.objectStore(CACHE_META_STORE);
        const request = store.delete(entry.url);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      currentSize -= entry.size || 0;
    }

    db.close();
  } catch (e) {
    // Non-critical: log but don't break caching functionality
    console.warn('LRU eviction error:', e);
  }
}

/**
 * Get the size of a response in bytes.
 */
function getResponseSize(response) {
  // Try Content-Length header first
  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    return parseInt(contentLength, 10);
  }
  // Fallback: estimate from cloned response body
  return 0;
}

/**
 * Cache a response and track its metadata, then trigger LRU eviction if needed.
 */
async function cacheWithTracking(request, response) {
  const cache = await caches.open(CACHE_NAME);
  const url = request.url || request;

  // Clone response before consuming body for size calculation
  const responseToCache = response.clone();
  const responseForSize = response.clone();

  // Get size - try header first, then body
  let size = getResponseSize(responseForSize);
  if (size === 0) {
    try {
      const blob = await responseForSize.blob();
      size = blob.size;
    } catch (e) {
      size = 0;
    }
  }

  // Store in cache
  await cache.put(request, responseToCache);

  // Update metadata
  await updateCacheMeta(url, size);

  // Trigger LRU eviction check
  await performLRUEviction();
}

// ============================================================
// Caching Strategies
// ============================================================

/**
 * Determine if a request is for a static asset based on file extension.
 */
function isStaticAsset(url) {
  const pathname = new URL(url).pathname;
  return STATIC_ASSET_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

/**
 * Determine if a request is an HTML navigation request.
 */
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

/**
 * Cache-first strategy for static assets.
 * If in cache → serve immediately (update lastAccessed).
 * If not in cache → fetch from network, store in cache with tracking, serve response.
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Update lastAccessed timestamp for LRU tracking
    touchCacheMeta(request.url);
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  if (networkResponse && networkResponse.status === 200) {
    await cacheWithTracking(request, networkResponse);
  }
  return networkResponse;
}

/**
 * Network-first strategy with timeout for HTML navigation requests.
 * Try network first with 3s timeout.
 * On success → update cache with tracking + serve fresh response.
 * On timeout/failure → serve cached version if available (update lastAccessed).
 * If no cache and no network → serve /offline fallback page.
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), NETWORK_TIMEOUT)
      )
    ]);

    if (networkResponse && networkResponse.status === 200) {
      await cacheWithTracking(request, networkResponse);
    }
    return networkResponse;
  } catch (error) {
    // Network failed or timed out — try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Update lastAccessed timestamp for LRU tracking
      touchCacheMeta(request.url);
      return cachedResponse;
    }

    // No cache available — serve offline fallback
    const offlineResponse = await cache.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }

    // Last resort: a basic offline response
    return new Response(
      '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// ============================================================
// Service Worker Lifecycle Events
// ============================================================

// Install: precache app shell pages and critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);

      // Initialize metadata for precached entries
      for (const url of PRECACHE_URLS) {
        const fullUrl = new URL(url, self.location.origin).href;
        const response = await cache.match(url);
        let size = 0;
        if (response) {
          const blob = await response.clone().blob();
          size = blob.size;
        }
        await updateCacheMeta(fullUrl, size);
      }
    })()
  );
  self.skipWaiting();
});

// Activate: clean old versioned caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: route requests to the appropriate caching strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  if (isStaticAsset(event.request.url)) {
    // Cache-first for static assets (CSS, JS, fonts, images)
    event.respondWith(cacheFirst(event.request));
  } else if (isNavigationRequest(event.request)) {
    // Network-first with 3s timeout for HTML navigation
    event.respondWith(networkFirst(event.request));
  } else {
    // Default: network with cache fallback for other same-origin requests
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request);
          if (response && response.status === 200) {
            await cacheWithTracking(event.request, response);
          }
          return response;
        } catch (e) {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            touchCacheMeta(event.request.url);
            return cachedResponse;
          }
          throw e;
        }
      })()
    );
  }
});
