// Service Worker Registration and Management
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager
  private registration: ServiceWorkerRegistration | null = null
  private messageHandlers: Map<string, (data: any) => void> = new Map()

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager()
    }
    return ServiceWorkerManager.instance
  }

  // Register service worker
  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported')
      return false
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered successfully:', this.registration)

      // Handle service worker updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              this.showUpdateNotification()
            }
          })
        }
      })

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event)
      })

      // Register background sync if supported
      if ('sync' in this.registration) {
        await this.registerBackgroundSync()
      }

      return true
    } catch (error) {
      console.error('Service Worker registration failed:', error as any)
      return false
    }
  }

  // Unregister service worker
  async unregister(): Promise<boolean> {
    if (this.registration) {
      try {
        await this.registration.unregister()
        this.registration = null
        console.log('Service Worker unregistered')
        return true
      } catch (error) {
        console.error('Service Worker unregistration failed:', error as any)
        return false
      }
    }
    return false
  }

  // Register background sync
  private async registerBackgroundSync(): Promise<void> {
    try {
      if ('sync' in this.registration!) {
        await (this.registration as any)!.sync.register('sync-offline-data')
        console.log('Background sync registered')
      }
    } catch (error) {
      console.error('Background sync registration failed:', error as any)
    }
  }

  // Send message to service worker
  async sendMessage(type: string, data?: any): Promise<void> {
    if (this.registration && this.registration.active) {
      try {
        this.registration.active.postMessage({ type, data })
      } catch (error) {
        console.error('Failed to send message to service worker:', error as any)
      }
    }
  }

  // Register message handler
  onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler)
  }

  // Remove message handler
  offMessage(type: string): void {
    this.messageHandlers.delete(type)
  }

  // Handle service worker messages
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data
    const handler = this.messageHandlers.get(type)
    
    if (handler) {
      handler(data)
    } else {
      console.log('No handler for message type:', type)
    }
  }

  // Show update notification
  private showUpdateNotification(): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Live Stats Tracker Update Available', {
        body: 'A new version is available. Refresh the page to update.',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'update-available'
      })

      notification.addEventListener('click', () => {
        window.location.reload()
      })
    }
  }

  // Check if service worker is active
  isActive(): boolean {
    return this.registration !== null && this.registration.active !== null
  }

  // Get service worker state
  getState(): string | null {
    if (this.registration && this.registration.active) {
      return this.registration.active.state
    }
    return null
  }

  // Cache API response
  async cacheAPIResponse(url: string, response: any): Promise<void> {
    await this.sendMessage('CACHE_API_RESPONSE', { url, response })
  }

  // Get cached data
  async getCachedData(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const handler = (data: any) => {
        if (data.url === url) {
          this.offMessage('CACHED_DATA_RETRIEVED')
          resolve(data.data)
        }
      }
      
      this.onMessage('CACHED_DATA_RETRIEVED', handler)
      
      // Set timeout for response
      setTimeout(() => {
        this.offMessage('CACHED_DATA_RETRIEVED')
        reject(new Error('Timeout waiting for cached data'))
      }, 5000)
      
      this.sendMessage('GET_CACHED_DATA', { url })
    })
  }

  // Clear cache
  async clearCache(cacheName?: string): Promise<void> {
    await this.sendMessage('CLEAR_CACHE', { cacheName })
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      console.log('Notification permission denied')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Failed to request notification permission:', error as any)
      return false
    }
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!('PushManager' in window)) {
      console.log('Push notifications not supported')
      return null
    }

    try {
      const permission = await this.requestNotificationPermission()
      if (!permission) {
        return null
      }

      const subscription = await this.registration!.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '') as any
      })

      console.log('Push notification subscription created:', subscription)
      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error as any)
      return null
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPushNotifications(): Promise<boolean> {
    try {
      const subscription = await this.registration!.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        console.log('Push notification subscription removed')
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error as any)
      return false
    }
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Get offline status
  getOfflineStatus(): { isOnline: boolean; lastUpdated: number } {
    try {
      const saved = localStorage.getItem('offline-status')
      return saved ? JSON.parse(saved) : { isOnline: navigator.onLine, lastUpdated: Date.now() }
    } catch (error) {
      return { isOnline: navigator.onLine, lastUpdated: Date.now() }
    }
  }

  // Update offline status
  updateOfflineStatus(isOnline: boolean): void {
    try {
      localStorage.setItem('offline-status', JSON.stringify({
        isOnline,
        lastUpdated: Date.now()
      }))
    } catch (error) {
      console.error('Failed to update offline status:', error as any)
    }
  }
}

// Export singleton instance
export const serviceWorkerManager = ServiceWorkerManager.getInstance()

// Auto-register service worker when module is imported
if (typeof window !== 'undefined') {
  serviceWorkerManager.register()
    .then((success) => {
      if (success) {
        console.log('Service Worker auto-registered successfully')
      }
    })
    .catch((error) => {
      console.error('Service Worker auto-registration failed:', error)
    })
}
