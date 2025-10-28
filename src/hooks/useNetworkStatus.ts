'use client'

import { useState, useEffect, useCallback } from 'react'

interface NetworkStatus {
  isOnline: boolean
  isReconnecting: boolean
  lastOnlineTime: number | null
  connectionType: string | null
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isReconnecting: false,
    lastOnlineTime: navigator.onLine ? Date.now() : null,
    connectionType: null
  })

  const checkConnection = useCallback(async () => {
    try {
      // Try to fetch a small resource to verify actual connectivity
      const response = await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      })
      return response.ok
    } catch (error) {
      return false
    }
  }, [])

  const updateNetworkStatus = useCallback(async (online: boolean) => {
    if (online) {
      // Verify actual connectivity, not just network interface
      const actuallyOnline = await checkConnection()
      
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: actuallyOnline,
        isReconnecting: !actuallyOnline,
        lastOnlineTime: actuallyOnline ? Date.now() : prev.lastOnlineTime
      }))
    } else {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        isReconnecting: false
      }))
    }
  }, [checkConnection])

  useEffect(() => {
    const handleOnline = () => updateNetworkStatus(true)
    const handleOffline = () => updateNetworkStatus(false)

    // Listen for network status changes
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection) {
        setNetworkStatus(prev => ({
          ...prev,
          connectionType: connection.effectiveType || connection.type
        }))

        const handleConnectionChange = () => {
          setNetworkStatus(prev => ({
            ...prev,
            connectionType: connection.effectiveType || connection.type
          }))
        }

        connection.addEventListener('change', handleConnectionChange)
        
        return () => {
          connection.removeEventListener('change', handleConnectionChange)
        }
      }
    }

    // Periodic connectivity check when online
    const interval = setInterval(async () => {
      if (navigator.onLine) {
        const actuallyOnline = await checkConnection()
        setNetworkStatus(prev => ({
          ...prev,
          isOnline: actuallyOnline,
          isReconnecting: !actuallyOnline
        }))
      }
    }, 30000) // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [updateNetworkStatus, checkConnection])

  return networkStatus
}

// Hook for handling offline-aware API calls
export function useOfflineAwareFetch() {
  const networkStatus = useNetworkStatus()

  const fetchWithOfflineHandling = useCallback(async (
    url: string, 
    options: RequestInit = {},
    fallbackData?: any
  ) => {
    // If offline, return fallback data or throw offline error
    if (!networkStatus.isOnline) {
      if (fallbackData !== undefined) {
        return fallbackData
      }
      throw new Error('OFFLINE')
    }

    try {
      const response = await fetch(url, options)
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('AUTH_FAILED')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return response.json()
    } catch (error) {
      // If network error and we have fallback data, return it
      if (error instanceof TypeError && error.message.includes('fetch') && fallbackData !== undefined) {
        return fallbackData
      }
      throw error
    }
  }, [networkStatus.isOnline])

  return {
    fetchWithOfflineHandling,
    isOnline: networkStatus.isOnline,
    isReconnecting: networkStatus.isReconnecting,
    connectionType: networkStatus.connectionType
  }
}


