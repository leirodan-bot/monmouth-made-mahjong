const CACHE_NAME = 'mahjrank-v2'
const STATIC_ASSETS = [
  '/offline.html',
  '/mahjrankicon192.png',
  '/mahjrankicon512.png',
  '/apple-touch-icon.png',
  '/favicon.png',
]

// Install: pre-cache offline page and icons
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean old caches, claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: network-first for HTML/JS/API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip cross-origin requests (Supabase, fonts CDN, etc.)
  if (url.origin !== self.location.origin) return

  // Static assets (images, fonts) — cache-first with background update
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|ico|woff2?|ttf|eot)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Update cache in background
          fetch(request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, response))
            }
          }).catch(() => {})
          return cached
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // HTML, JS bundles, CSS — network-first (CRITICAL: prevents stale cache issues)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached
          // For navigation requests, show offline page
          if (request.mode === 'navigate') {
            return caches.match('/offline.html')
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' })
        })
      })
  )
})

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'MahjRank', body: 'You have a new notification' }
  if (event.data) {
    try { data = event.data.json() } catch (e) { data.body = event.data.text() }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'MahjRank', {
      body: data.body,
      icon: '/mahjrankicon192.png',
      badge: '/mahjrankicon192.png',
      tag: data.tag || 'mahjrank-notification',
      data: { url: data.url || '/' },
    })
  )
})

// Notification click — open or focus app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin))
      if (existing) {
        existing.focus()
        return existing.navigate(url)
      }
      return self.clients.openWindow(url)
    })
  )
})
