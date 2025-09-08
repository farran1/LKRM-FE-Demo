'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Alert, Space, Typography, Badge } from 'antd'
import { SyncOutlined, CheckCircleOutlined, ExclamationCircleOutlined, CloudSyncOutlined } from '@ant-design/icons'
import { refinedLiveStatTrackerService } from '../../../../src/services/refinedLiveStatTrackerService'

const { Text, Title } = Typography

interface SyncStatus {
  isOnline: boolean
  pendingEvents: number
  lastSync: string | null
  syncInProgress: boolean
}

const OfflineSyncStatus: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    pendingEvents: 0,
    lastSync: null,
    syncInProgress: false
  })

  const [testResult, setTestResult] = useState<string | null>(null)

  // Check online status and pending events
  useEffect(() => {
    const checkStatus = () => {
      const offlineStatus = refinedLiveStatTrackerService.getOfflineStatus()
      const pendingCount = refinedLiveStatTrackerService.getPendingEventsCount()
      const lastSync = refinedLiveStatTrackerService.getLastSyncTime()
      
      setSyncStatus({
        isOnline: offlineStatus.isOnline,
        pendingEvents: pendingCount,
        lastSync: lastSync,
        syncInProgress: false
      })
    }

    // Check immediately
    checkStatus()

    // Check every 5 seconds
    const interval = setInterval(checkStatus, 5000)

    // Listen for online/offline events
    const handleOnline = () => checkStatus()
    const handleOffline = () => checkStatus()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Test offline sync functionality
  const testOfflineSync = async () => {
    setSyncStatus(prev => ({ ...prev, syncInProgress: true }))
    setTestResult(null)

    try {
      // Check if there's an active session first
      if (!refinedLiveStatTrackerService.hasActiveSession()) {
        setTestResult('❌ No active game session. Start a game first.')
        setSyncStatus(prev => ({ ...prev, syncInProgress: false }))
        return
      }

      // Simulate some offline events
      const testEvents = [
        {
          eventType: 'test_points',
          eventValue: 2,
          quarter: 1,
          gameTime: 300,
          isOpponentEvent: false,
          metadata: { test: true, timestamp: Date.now() }
        }
      ]

      // Record test events
      for (const event of testEvents) {
        refinedLiveStatTrackerService.recordLiveEvent(
          event.eventType,
          event.eventValue,
          1, // test player ID
          event.quarter,
          event.gameTime,
          event.isOpponentEvent,
          undefined,
          event.metadata
        )
      }

      // Try to sync
      await refinedLiveStatTrackerService.syncOfflineData()
      
      setTestResult('✅ Test sync completed successfully!')
      
      // Refresh status
      setTimeout(() => {
        const offlineStatus = refinedLiveStatTrackerService.getOfflineStatus()
        const pendingCount = refinedLiveStatTrackerService.getPendingEventsCount()
        const lastSync = refinedLiveStatTrackerService.getLastSyncTime()
        
        setSyncStatus(prev => ({
          ...prev,
          pendingEvents: pendingCount,
          lastSync: lastSync,
          syncInProgress: false
        }))
      }, 1000)

    } catch (error) {
      setTestResult(`❌ Test sync failed: ${error}`)
      setSyncStatus(prev => ({ ...prev, syncInProgress: false }))
    }
  }

  // Force sync all offline data
  const forceSync = async () => {
    setSyncStatus(prev => ({ ...prev, syncInProgress: true }))
    
    try {
      await refinedLiveStatTrackerService.syncOfflineData()
      setTestResult('✅ Force sync completed!')
      
      // Refresh status
      setTimeout(() => {
        const offlineStatus = refinedLiveStatTrackerService.getOfflineStatus()
        const pendingCount = refinedLiveStatTrackerService.getPendingEventsCount()
        const lastSync = refinedLiveStatTrackerService.getLastSyncTime()
        
        setSyncStatus(prev => ({
          ...prev,
          pendingEvents: pendingCount,
          lastSync: lastSync,
          syncInProgress: false
        }))
      }, 1000)

    } catch (error) {
      setTestResult(`❌ Force sync failed: ${error}`)
      setSyncStatus(prev => ({ ...prev, syncInProgress: false }))
    }
  }

  // Start a test session for testing
  const startTestSession = async () => {
    try {
      // Start a test game session
      await refinedLiveStatTrackerService.startLiveGame(999, undefined, {
        isPlaying: false,
        currentTime: 0,
        quarter: 1,
        homeScore: 0,
        awayScore: 0,
        opponentScore: 0,
        timeoutHome: 3,
        timeoutAway: 3
      })
      
      setTestResult('✅ Test session started! You can now test sync.')
      
      // Refresh status
      setTimeout(() => {
        const offlineStatus = refinedLiveStatTrackerService.getOfflineStatus()
        const pendingCount = refinedLiveStatTrackerService.getPendingEventsCount()
        const lastSync = refinedLiveStatTrackerService.getLastSyncTime()
        
        setSyncStatus(prev => ({
          ...prev,
          pendingEvents: pendingCount,
          lastSync: lastSync,
          syncInProgress: false
        }))
      }, 1000)
      
    } catch (error) {
      setTestResult(`❌ Failed to start test session: ${error}`)
    }
  }

  // Export offline data for debugging
  const exportOfflineData = () => {
    try {
      const data = refinedLiveStatTrackerService.exportOfflineData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `offline-data-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      setTestResult('✅ Offline data exported!')
    } catch (error) {
      setTestResult(`❌ Export failed: ${error}`)
    }
  }

  return (
    <Card 
      title={
        <Space>
          <CloudSyncOutlined />
          <span>Offline Sync Status</span>
        </Space>
      }
      size="small"
      style={{ marginBottom: 16 }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Online Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>Connection Status:</Text>
          <Badge 
            status={syncStatus.isOnline ? 'success' : 'error'} 
            text={syncStatus.isOnline ? 'Online' : 'Offline'} 
          />
        </div>

        {/* Active Session */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>Active Session:</Text>
          <Badge 
            status={refinedLiveStatTrackerService.hasActiveSession() ? 'success' : 'default'} 
            text={refinedLiveStatTrackerService.hasActiveSession() ? 'Yes' : 'No'} 
          />
        </div>

        {/* Pending Events */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>Pending Events:</Text>
          <Badge 
            count={syncStatus.pendingEvents} 
            style={{ backgroundColor: syncStatus.pendingEvents > 0 ? '#faad14' : '#52c41a' }}
          />
        </div>

        {/* Last Sync */}
        {syncStatus.lastSync && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text>Last Sync:</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {new Date(syncStatus.lastSync).toLocaleTimeString()}
            </Text>
          </div>
        )}

        {/* Action Buttons */}
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Button
            type="primary"
            icon={<SyncOutlined spin={syncStatus.syncInProgress} />}
            onClick={testOfflineSync}
            disabled={syncStatus.syncInProgress}
            size="small"
          >
            Test Sync
          </Button>
          
          <Button
            icon={<CloudSyncOutlined spin={syncStatus.syncInProgress} />}
            onClick={forceSync}
            disabled={syncStatus.syncInProgress || syncStatus.pendingEvents === 0}
            size="small"
          >
            Force Sync
          </Button>
          
          <Button
            icon={<CheckCircleOutlined />}
            onClick={startTestSession}
            disabled={syncStatus.syncInProgress}
            size="small"
          >
            Start Test Session
          </Button>
          
          <Button
            icon={<CheckCircleOutlined />}
            onClick={exportOfflineData}
            size="small"
          >
            Export Data
          </Button>
        </Space>

        {/* Test Results */}
        {testResult && (
          <Alert
            message={testResult}
            type={testResult.includes('✅') ? 'success' : 'error'}
            showIcon
            closable
            onClose={() => setTestResult(null)}
          />
        )}

        {/* Offline Warning */}
        {!syncStatus.isOnline && (
          <Alert
            message="You are currently offline. Stats will be saved locally and synced when connection is restored."
            type="warning"
            showIcon
          />
        )}

        {/* Pending Events Warning */}
        {syncStatus.pendingEvents > 0 && syncStatus.isOnline && (
          <Alert
            message={`You have ${syncStatus.pendingEvents} pending events to sync. Click 'Force Sync' to upload them now.`}
            type="info"
            showIcon
          />
        )}
      </Space>
    </Card>
  )
}

export default OfflineSyncStatus
