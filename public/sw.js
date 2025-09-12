// Sleep Journal Service Worker
// Provides offline functionality and caching

const CACHE_NAME = 'sleep-journal-v1';
const STATIC_CACHE = 'sleep-journal-static-v1';
const DYNAMIC_CACHE = 'sleep-journal-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  // Add other static assets as needed
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^\/api\/auth\//,
  /^\/api\/entries\//,
  /^\/api\/user\//
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external URLs
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets and pages
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request.clone());
    
    // Cache successful GET responses for certain endpoints
    if (networkResponse.ok && shouldCacheApiResponse(url.pathname)) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request.clone(), networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', request.url);
    
    // Try cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for certain endpoints
    if (url.pathname.includes('/entries')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Sin conexión a internet',
          offline: true,
          data: []
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try network if not in cache
    const networkResponse = await fetch(request);
    
    // Cache the response for future use
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request.clone(), networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Both cache and network failed for:', request.url);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    throw error;
  }
}

// Determine if API response should be cached
function shouldCacheApiResponse(pathname) {
  // Cache read-only endpoints
  return pathname.includes('/entries') && 
         (pathname.includes('GET') || !pathname.includes('POST'));
}

// Background sync for offline entries
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-sleep-entries') {
    event.waitUntil(syncOfflineEntries());
  }
});

// Sync offline entries when connection is restored
async function syncOfflineEntries() {
  try {
    console.log('[SW] Syncing offline entries...');
    
    // Get offline entries from IndexedDB or localStorage
    const offlineEntries = await getOfflineEntries();
    
    for (const entry of offlineEntries) {
      try {
        const response = await fetch('/api/entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry.data)
        });
        
        if (response.ok) {
          await removeOfflineEntry(entry.id);
          console.log('[SW] Synced offline entry:', entry.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync entry:', entry.id, error);
      }
    }
    
    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        syncedCount: offlineEntries.length
      });
    });
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Get offline entries (placeholder - implement with IndexedDB)
async function getOfflineEntries() {
  // This would typically use IndexedDB
  // For now, return empty array
  return [];
}

// Remove synced offline entry (placeholder)
async function removeOfflineEntry(entryId) {
  // This would typically remove from IndexedDB
  console.log('[SW] Removing synced entry:', entryId);
}

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'Recordatorio: ¿Cómo dormiste anoche?',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: 'sleep-reminder',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Abrir app'
      },
      {
        action: 'dismiss',
        title: 'Descartar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Diario de Sueño', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('[SW] Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Service worker script loaded');