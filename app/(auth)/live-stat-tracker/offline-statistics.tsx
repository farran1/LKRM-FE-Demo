/**
 * Offline Statistics Wrapper
 * Integrates offline-first system with existing Statistics component
 */

import React, { useEffect, useState } from 'react'
import Statistics from './statistics'
import { liveGameDataService } from '@/services/live-game-data-service'
import { useStorageManagement } from '@/hooks/useStorageManagement'
import StorageQuotaManager from '@/components/storage-quota-manager'
import ConflictResolutionModal from '@/components/conflict-resolution-modal'

interface OfflineStatisticsProps {
  eventId: number
  onExit: () => void
  autoStart?: boolean
  choice?: 'resume' | 'startOver'
}

const OfflineStatistics: React.FC<OfflineStatisticsProps> = ({
  eventId,
  onExit,
  autoStart = false,
  choice
}) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [showConflictModal, setShowConflictModal] = useState(false)
  const { storageStatus, showStorageManager, setShowStorageManager } = useStorageManagement()

  useEffect(() => {
    const initializeOfflineSystem = async () => {
      try {
        console.log('🚀 Initializing offline-first live stat tracker...')
        
        // Initialize the offline system
        await liveGameDataService.initialize(eventId, choice)
        
        console.log('✅ Offline system initialized successfully')
        setIsInitialized(true)
      } catch (error) {
        console.error('❌ Failed to initialize offline system:', error)
        setInitError(error instanceof Error ? error.message : 'Unknown error')
      }
    }

    initializeOfflineSystem()
  }, [eventId, choice])

  // Handle exit with offline system
  const handleExit = async () => {
    // Don't end the session here - let the handleEndGame function in track/page.tsx handle it
    // This prevents "no active session" errors
    console.log('✅ Exiting live stat tracker')
    onExit()
  }

  if (!isInitialized) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>
            🚀 Initializing Offline Stat Tracker...
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {choice === 'resume' ? 'Checking for existing game data...' : 
             choice === 'startOver' ? 'Preparing fresh start...' : 
             'Setting up offline-first tracking...'}
          </div>
        </div>
        
        {/* Show storage status */}
        <div style={{ marginTop: '16px', fontSize: '12px', color: '#999' }}>
          {!storageStatus.isOnline && (
            <span style={{ color: '#ff4d4f' }}>📱 Offline Mode</span>
          )}
          {storageStatus.syncStatus.pendingSyncs > 0 && (
            <span style={{ color: '#faad14', marginLeft: '8px' }}>
              ⏳ {storageStatus.syncStatus.pendingSyncs} pending syncs
            </span>
          )}
        </div>
      </div>
    )
  }

  if (initError) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ color: '#ff4d4f', marginBottom: '16px' }}>
          ❌ Failed to Initialize Offline System
        </div>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
          {initError}
        </div>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#1890ff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Storage status indicator */}
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px', 
        zIndex: 1000,
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        {!storageStatus.isOnline && (
          <span style={{ 
            backgroundColor: '#ff4d4f', 
            color: 'white', 
            padding: '2px 6px', 
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            📱 Offline
          </span>
        )}
        {storageStatus.syncStatus.pendingSyncs > 0 && (
          <span style={{ 
            backgroundColor: '#faad14', 
            color: 'white', 
            padding: '2px 6px', 
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            ⏳ {storageStatus.syncStatus.pendingSyncs}
          </span>
        )}
        {storageStatus.isNearLimit && (
          <span style={{ 
            backgroundColor: '#ff4d4f', 
            color: 'white', 
            padding: '2px 6px', 
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            💾 Storage Full
          </span>
        )}
        <button
          onClick={() => setShowStorageManager(true)}
          style={{
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          💾 Storage
        </button>
      </div>

      {/* Original Statistics component */}
      <Statistics 
        eventId={eventId} 
        onExit={handleExit} 
        autoStart={autoStart} 
        choice={choice} 
      />

      {/* Storage Management Modal */}
      {showStorageManager && (
        <StorageQuotaManager
          showAsModal={true}
          onClose={() => setShowStorageManager(false)}
        />
      )}

      {/* Conflict Resolution Modal */}
      <ConflictResolutionModal
        eventId={eventId}
        visible={showConflictModal}
        onResolve={(resolution) => {
          console.log('Conflict resolved:', resolution)
          setShowConflictModal(false)
        }}
        onCancel={() => setShowConflictModal(false)}
      />
    </div>
  )
}

export default OfflineStatistics



