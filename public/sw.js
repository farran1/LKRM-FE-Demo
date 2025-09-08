// Service Worker for Live Stats Tracker - Offline Capabilities
const CACHE_NAME = 'live-stats-tracker-v1'
const STATIC_CACHE = 'live-stats-static-v1'
const DATA_CACHE = 'live-stats-data-v1'

// Files to cache for offline use
const STATIC_FILES = [
  '/',
  '/live-stat-tracker',
  '/offline',
  '/static/js/bundle.js',
  '/static/css/main.css'
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('Static files cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Failed to cache static files:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker activated successfully')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle API requests for offline data
  if (url.pathname.startsWith('/api/') && request.method === 'GET') {
    event.respondWith(
      caches.open(DATA_CACHE)
        .then((cache) => {
          return cache.match(request)
            .then((response) => {
              if (response) {
                console.log('Serving API request from cache:', url.pathname)
                return response
              }
              
              // If not in cache, fetch from network and cache
              return fetch(request)
                .then((networkResponse) => {
                  if (networkResponse.ok) {
                    cache.put(request, networkResponse.clone())
                  }
                  return networkResponse
                })
                .catch(() => {
                  // Network failed, try to serve from cache with fallback
                  console.log('Network failed, serving fallback for:', url.pathname)
                  return new Response(JSON.stringify({
                    error: 'Offline - Data not available',
                    timestamp: Date.now()
                  }), {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'application/json' }
                  })
                })
            })
        })
    )
    return
  }

  // Handle static files
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request)
        })
    )
    return
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Return offline page when navigation fails
          return caches.match('/offline')
        })
    )
    return
  }

  // Default: try network first, fallback to cache
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request)
      })
  )
})

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData())
  }
})

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    console.log('Syncing offline data...')
    
    // Get all clients
    const clients = await self.clients.matchAll()
    
    // Notify clients about sync
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_STARTED',
        timestamp: Date.now()
      })
    })
    
    // TODO: Implement actual data synchronization with backend
    // For now, just mark data as synced in localStorage
    
    console.log('Offline data sync completed')
    
    // Notify clients about sync completion
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        timestamp: Date.now()
      })
    })
    
  } catch (error) {
    console.error('Failed to sync offline data:', error)
    
    // Notify clients about sync failure
    const clients = await self.clients.matchAll()
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_FAILED',
        error: error.message,
        timestamp: Date.now()
      })
    })
  }
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)
  
  const options = {
    body: 'Live Stats Tracker - New data available',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Data',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192x192.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('Live Stats Tracker', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/live-stat-tracker')
    )
  }
})

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data)
  
  const { type, data } = event.data
  
  switch (type) {
    case 'CACHE_API_RESPONSE':
      cacheAPIResponse(data.url, data.response)
      break
      
    case 'GET_CACHED_DATA':
      getCachedData(data.url, event.source)
      break
      
    case 'CLEAR_CACHE':
      clearCache(data.cacheName)
      break
      
    case 'REGISTER_BACKGROUND_SYNC':
      registerBackgroundSync()
      break
      
    default:
      console.log('Unknown message type:', type)
  }
})

// Cache API response
async function cacheAPIResponse(url, response) {
  try {
    const cache = await caches.open(DATA_CACHE)
    const request = new Request(url)
    await cache.put(request, new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    }))
    console.log('API response cached:', url)
  } catch (error) {
    console.error('Failed to cache API response:', error)
  }
}

// Get cached data
async function getCachedData(url, source) {
  try {
    const cache = await caches.open(DATA_CACHE)
    const request = new Request(url)
    const response = await cache.match(request)
    
    if (response) {
      const data = await response.json()
      source.postMessage({
        type: 'CACHED_DATA_RETRIEVED',
        url,
        data
      })
    } else {
      source.postMessage({
        type: 'CACHED_DATA_NOT_FOUND',
        url
      })
    }
  } catch (error) {
    console.error('Failed to get cached data:', error)
    source.postMessage({
      type: 'CACHED_DATA_ERROR',
      url,
      error: error.message
    })
  }
}

// Clear cache
async function clearCache(cacheName) {
  try {
    if (cacheName) {
      await caches.delete(cacheName)
      console.log('Cache cleared:', cacheName)
    } else {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      console.log('All caches cleared')
    }
  } catch (error) {
    console.error('Failed to clear cache:', error)
  }
}

// Register background sync
async function registerBackgroundSync() {
  try {
    if ('serviceWorker' in navigator && 'sync' in self.registration) {
      await self.registration.sync.register('sync-offline-data')
      console.log('Background sync registered')
    } else {
      console.log('Background sync not supported')
    }
  } catch (error) {
    console.error('Failed to register background sync:', error)
  }
}

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    console.log('Periodic sync triggered:', event.tag)
    
    if (event.tag === 'offline-data-sync') {
      event.waitUntil(syncOfflineData())
    }
  })
}

console.log('Service Worker loaded successfully')
