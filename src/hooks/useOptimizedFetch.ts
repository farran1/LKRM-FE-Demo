/**
 * React Hook for Optimized API Calls
 * Provides optimized data fetching with caching and deduplication
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { performanceOptimizer } from '../services/performance-optimizer'

export interface UseOptimizedFetchOptions {
  cacheDuration?: number
  retryCount?: number
  retryDelay?: number
  enabled?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export interface UseOptimizedFetchReturn<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  clearCache: () => void
}

export function useOptimizedFetch<T = any>(
  url: string | null,
  options: UseOptimizedFetchOptions = {}
): UseOptimizedFetchReturn<T> {
  const {
    enabled = true,
    onSuccess,
    onError
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)
      setError(null)

      const response = await performanceOptimizer.optimizedFetch(url, {
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result)
      
      if (onSuccess) {
        onSuccess(result)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, don't update state
        return
      }
      
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      
      if (onError) {
        onError(error)
      }
    } finally {
      setLoading(false)
    }
  }, [url, enabled, onSuccess, onError])

  const refetch = useCallback(async () => {
    // Clear cache for this URL to force fresh fetch
    performanceOptimizer.clearCacheForPattern(url || '')
    await fetchData()
  }, [fetchData, url])

  const clearCache = useCallback(() => {
    performanceOptimizer.clearCache()
  }, [])

  useEffect(() => {
    fetchData()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch,
    clearCache
  }
}

/**
 * Hook for batched API calls
 */
export function useBatchedFetch<T = any>(
  urls: string[],
  options: UseOptimizedFetchOptions = {}
): {
  data: T[]
  loading: boolean
  errors: Error[]
  refetch: () => Promise<void>
} {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Error[]>([])

  const fetchData = useCallback(async () => {
    if (!urls.length || !options.enabled) return

    try {
      setLoading(true)
      setErrors([])

      const promises = urls.map(url => 
        performanceOptimizer.batchRequest(url)
          .then((result: any) => ({ success: true, data: result }))
          .catch((error: any) => ({ success: false, error }))
      )

      const results = await Promise.all(promises)
      
      const successfulData: T[] = []
      const failedErrors: Error[] = []

      results.forEach((result: { success: boolean; data?: any; error?: any }) => {
        if (result.success) {
          successfulData.push(result.data)
        } else {
          failedErrors.push(result.error)
        }
      })

      setData(successfulData)
      setErrors(failedErrors)
    } catch (error) {
      setErrors([error instanceof Error ? error : new Error('Unknown error')])
    } finally {
      setLoading(false)
    }
  }, [urls, options.enabled])

  const refetch = useCallback(async () => {
    // Clear cache for all URLs
    urls.forEach(url => {
      performanceOptimizer.clearCacheForPattern(url)
    })
    await fetchData()
  }, [fetchData, urls])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    errors,
    refetch
  }
}

/**
 * Hook for preloading critical data
 */
export function usePreloadCriticalData() {
  const [isPreloaded, setIsPreloaded] = useState(false)
  const [isPreloading, setIsPreloading] = useState(false)

  const preload = useCallback(async () => {
    if (isPreloaded || isPreloading) return

    setIsPreloading(true)
    try {
      await performanceOptimizer.preloadCriticalData()
      setIsPreloaded(true)
    } catch (error) {
      console.warn('Failed to preload critical data:', error)
    } finally {
      setIsPreloading(false)
    }
  }, [isPreloaded, isPreloading])

  useEffect(() => {
    preload()
  }, [preload])

  return {
    isPreloaded,
    isPreloading,
    preload
  }
}
