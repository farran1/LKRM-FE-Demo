/**
 * Storage Management Hook
 * Provides storage status and management functions
 */

import { useState, useEffect } from 'react'
import { offlineStorage, StorageUsage } from '@/services/offline-storage'
import { syncService } from '@/services/sync-service'

export interface StorageStatus {
  usage: StorageUsage | null
  isNearLimit: boolean
  isOnline: boolean
  syncStatus: {
    pendingSyncs: number
    failedSyncs: number
    isSyncing: boolean
  }
}

export const useStorageManagement = () => {
  const [storageStatus, setStorageStatus] = useState<StorageStatus>({
    usage: null,
    isNearLimit: false,
    isOnline: true,
    syncStatus: {
      pendingSyncs: 0,
      failedSyncs: 0,
      isSyncing: false
    }
  })

  const [showStorageManager, setShowStorageManager] = useState(false)

  useEffect(() => {
    const updateStatus = () => {
      const usage = offlineStorage.getStorageUsage()
      const isNearLimit = offlineStorage.isStorageNearLimit()
      const syncStatus = syncService.getSyncStatus()

      setStorageStatus({
        usage,
        isNearLimit,
        isOnline: syncStatus.isOnline,
        syncStatus: {
          pendingSyncs: syncStatus.pendingSyncs,
          failedSyncs: syncStatus.failedSyncs,
          isSyncing: syncStatus.isSyncing
        }
      })
    }

    // Initial update
    updateStatus()

    // Update every 10 seconds
    const interval = setInterval(updateStatus, 10000)

    return () => clearInterval(interval)
  }, [])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStorageColor = (percentage: number): string => {
    if (percentage < 50) return '#52c41a' // Green
    if (percentage < 80) return '#faad14' // Orange
    return '#ff4d4f' // Red
  }

  return {
    storageStatus,
    showStorageManager,
    setShowStorageManager,
    formatBytes,
    getStorageColor,
    refreshStorageStatus: () => {
      const usage = offlineStorage.getStorageUsage()
      const isNearLimit = offlineStorage.isStorageNearLimit()
      const syncStatus = syncService.getSyncStatus()

      setStorageStatus({
        usage,
        isNearLimit,
        isOnline: syncStatus.isOnline,
        syncStatus: {
          pendingSyncs: syncStatus.pendingSyncs,
          failedSyncs: syncStatus.failedSyncs,
          isSyncing: syncStatus.isSyncing
        }
      })
    }
  }
}

export default useStorageManagement



