/**
 * Players API Cache Manager
 * Prevents multiple simultaneous calls to /api/players
 */

class PlayersCacheManager {
  private static instance: PlayersCacheManager
  private isFetching = false
  private lastFetchTime = 0
  private cache: any = null
  private readonly CACHE_DURATION = 30000 // 30 seconds

  static getInstance(): PlayersCacheManager {
    if (!PlayersCacheManager.instance) {
      PlayersCacheManager.instance = new PlayersCacheManager()
    }
    return PlayersCacheManager.instance
  }

  async getPlayers(api: any): Promise<any> {
    const now = Date.now()
    
    console.log('🔍 PlayersCache: getPlayers called', {
      hasCache: !!this.cache,
      isFetching: this.isFetching,
      timeSinceLastFetch: now - this.lastFetchTime,
      cacheDuration: this.CACHE_DURATION
    })
    
    // Return cached data if it's still fresh
    if (this.cache && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      console.log('📦 PlayersCache: Returning cached data')
      return this.cache
    }

    // If already fetching, wait for the current request
    if (this.isFetching) {
      console.log('⏳ PlayersCache: Waiting for ongoing fetch...')
      return new Promise((resolve) => {
        const checkCache = () => {
          if (!this.isFetching && this.cache) {
            resolve(this.cache)
          } else {
            setTimeout(checkCache, 100)
          }
        }
        checkCache()
      })
    }

    // Start new fetch
    this.isFetching = true
    console.log('🔄 PlayersCache: Fetching fresh data...')

    try {
      const response = await api.get('/api/players')
      this.cache = response
      this.lastFetchTime = now
      console.log('✅ PlayersCache: Fresh data fetched and cached')
      return response
    } catch (error) {
      console.error('❌ PlayersCache: Fetch failed:', error)
      throw error
    } finally {
      this.isFetching = false
    }
  }

  clearCache(): void {
    this.cache = null
    this.lastFetchTime = 0
    console.log('🗑️ PlayersCache: Cache cleared')
  }

  // Get cached data without making API calls (useful for offline mode)
  getCachedData(): any | null {
    console.log('📦 PlayersCache: getCachedData called', {
      hasCache: !!this.cache,
      cacheData: this.cache
    })
    return this.cache
  }
}

export const playersCache = PlayersCacheManager.getInstance()
export default playersCache
