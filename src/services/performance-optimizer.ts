/**
 * Performance Optimization Service
 * Handles request deduplication, caching, and batching to reduce API calls
 */

interface RequestCache {
  [key: string]: {
    data: any
    timestamp: number
    promise?: Promise<any>
  }
}

interface BatchRequest {
  id: string
  url: string
  options?: RequestInit
  resolve: (value: any) => void
  reject: (error: any) => void
}

class PerformanceOptimizer {
  private static instance: PerformanceOptimizer
  private requestCache: RequestCache = {}
  private batchQueue: BatchRequest[] = []
  private batchTimeout: NodeJS.Timeout | null = null
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  private readonly BATCH_DELAY = 100 // 100ms batch delay
  private readonly MAX_BATCH_SIZE = 10

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer()
    }
    return PerformanceOptimizer.instance
  }

  /**
   * Optimized fetch with caching and deduplication
   */
  public async optimizedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const cacheKey = this.generateCacheKey(url, options)
    const now = Date.now()

    // Check cache first
    if (this.requestCache[cacheKey]) {
      const cached = this.requestCache[cacheKey]
      
      // Return cached data if still fresh
      if (now - cached.timestamp < this.CACHE_DURATION) {
        console.log('📦 PerformanceOptimizer: Returning cached data for', url)
        return new Response(JSON.stringify(cached.data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      // If there's an ongoing request, wait for it
      if (cached.promise) {
        console.log('⏳ PerformanceOptimizer: Waiting for ongoing request for', url)
        try {
          const result = await cached.promise
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        } catch (error) {
          // If the ongoing request failed, remove it and continue with new request
          delete this.requestCache[cacheKey]
        }
      }
    }

    // Create new request promise
    const requestPromise = this.executeRequest(url, options)
    
    // Cache the promise to prevent duplicate requests
    this.requestCache[cacheKey] = {
      data: null,
      timestamp: now,
      promise: requestPromise
    }

    try {
      const response = await requestPromise
      const data = await response.clone().json()
      
      // Update cache with actual data
      this.requestCache[cacheKey] = {
        data,
        timestamp: now
      }
      
      return response
    } catch (error) {
      // Remove failed request from cache
      delete this.requestCache[cacheKey]
      throw error
    }
  }

  /**
   * Batch multiple requests together
   */
  public async batchRequest(url: string, options: RequestInit = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const request: BatchRequest = {
        id: Math.random().toString(36).substr(2, 9),
        url,
        options,
        resolve,
        reject
      }

      this.batchQueue.push(request)

      // Process batch if it's full or start timeout
      if (this.batchQueue.length >= this.MAX_BATCH_SIZE) {
        this.processBatch()
      } else if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.processBatch()
        }, this.BATCH_DELAY)
      }
    })
  }

  /**
   * Process batched requests
   */
  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return

    const requests = [...this.batchQueue]
    this.batchQueue = []
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    console.log(`🔄 PerformanceOptimizer: Processing batch of ${requests.length} requests`)

    try {
      // Execute all requests in parallel
      const responses = await Promise.allSettled(
        requests.map(req => this.executeRequest(req.url, req.options || {}))
      )

      // Resolve/reject each request based on its result
      responses.forEach((result, index) => {
        const request = requests[index]
        
        if (result.status === 'fulfilled') {
          result.value.json().then(data => {
            request.resolve(data)
          }).catch(error => {
            request.reject(error)
          })
        } else {
          request.reject(result.reason)
        }
      })
    } catch (error) {
      // Reject all requests if batch processing fails
      requests.forEach(request => {
        request.reject(error)
      })
    }
  }

  /**
   * Execute actual request
   */
  private async executeRequest(url: string, options: RequestInit): Promise<Response> {
    // Remove cache-busting parameters for better caching
    const cleanUrl = this.removeCacheBusting(url)
    
    console.log('🌐 PerformanceOptimizer: Executing request to', cleanUrl)
    
    return fetch(cleanUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
  }

  /**
   * Generate cache key from URL and options
   */
  private generateCacheKey(url: string, options: RequestInit): string {
    const cleanUrl = this.removeCacheBusting(url)
    const method = options.method || 'GET'
    const body = options.body ? JSON.stringify(options.body) : ''
    
    return `${method}:${cleanUrl}:${body}`
  }

  /**
   * Remove cache-busting parameters from URL
   */
  private removeCacheBusting(url: string): string {
    try {
      const urlObj = new URL(url)
      urlObj.searchParams.delete('_t')
      urlObj.searchParams.delete('timestamp')
      urlObj.searchParams.delete('cacheBuster')
      return urlObj.toString()
    } catch {
      return url
    }
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.requestCache = {}
    console.log('🧹 PerformanceOptimizer: Cache cleared')
  }

  /**
   * Clear cache for specific URL pattern
   */
  public clearCacheForPattern(pattern: string): void {
    const regex = new RegExp(pattern)
    Object.keys(this.requestCache).forEach(key => {
      if (regex.test(key)) {
        delete this.requestCache[key]
      }
    })
    console.log(`🧹 PerformanceOptimizer: Cache cleared for pattern: ${pattern}`)
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    totalEntries: number
    cacheSize: number
    oldestEntry: number
    newestEntry: number
  } {
    const entries = Object.values(this.requestCache)
    const timestamps = entries.map(entry => entry.timestamp)
    
    return {
      totalEntries: entries.length,
      cacheSize: JSON.stringify(this.requestCache).length,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
    }
  }

  /**
   * Preload critical data
   */
  public async preloadCriticalData(): Promise<void> {
    const criticalEndpoints = [
      '/api/events?perPage=50',
      '/api/players',
      '/api/eventTypes',
      '/api/tasks?perPage=50'
    ]

    console.log('🚀 PerformanceOptimizer: Preloading critical data...')

    try {
      await Promise.allSettled(
        criticalEndpoints.map(endpoint => 
          this.optimizedFetch(endpoint).catch(() => {
            // Silent fail for preload
          })
        )
      )
      console.log('✅ PerformanceOptimizer: Critical data preloaded')
    } catch (error) {
      console.warn('⚠️ PerformanceOptimizer: Preload failed:', error)
    }
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance()

// Export convenience functions
export const optimizedFetch = (url: string, options?: RequestInit) => 
  performanceOptimizer.optimizedFetch(url, options)

export const batchRequest = (url: string, options?: RequestInit) => 
  performanceOptimizer.batchRequest(url, options)

export const clearCache = () => performanceOptimizer.clearCache()

export const preloadCriticalData = () => performanceOptimizer.preloadCriticalData()
