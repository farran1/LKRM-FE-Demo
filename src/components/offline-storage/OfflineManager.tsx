import React, { useState, useEffect } from 'react'
import { Card, Button, Space, Typography, Progress, Alert, Modal, Upload, message, Statistic, Row, Col, Divider, List, Tag } from 'antd'
import { DownloadOutlined, UploadOutlined, DeleteOutlined, SyncOutlined, CloudOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { RcFile } from 'antd/es/upload'

const { Title, Text } = Typography

export interface OfflineDataItem {
  id: string
  type: 'game' | 'event' | 'player' | 'task' | 'budget'
  data: any
  timestamp: number
  lastSynced?: number
  size: number
  metadata: {
    title: string
    description: string
    version: string
  }
}

export interface StorageStatus {
  used: number
  available: number
  percentage: number
  items: number
  lastUpdated: number
}

export interface SyncStatus {
  isOnline: boolean
  lastSync: number
  pendingItems: number
  syncErrors: string[]
}

interface OfflineManagerProps {
  onDataRestore?: (data: OfflineDataItem) => void
  onDataDelete?: (id: string) => void
  onSyncRequest?: () => void
  showAdvanced?: boolean
}

export const OfflineManager: React.FC<OfflineManagerProps> = ({
  onDataRestore,
  onDataDelete,
  onSyncRequest,
  showAdvanced = false
}) => {
  const [storageStatus, setStorageStatus] = useState<StorageStatus>({
    used: 0,
    available: 5 * 1024 * 1024, // 5MB estimate
    percentage: 0,
    items: 0,
    lastUpdated: Date.now()
  })
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: Date.now(),
    pendingItems: 0,
    syncErrors: []
  })
  
  const [offlineData, setOfflineData] = useState<OfflineDataItem[]>([])
  const [showClearModal, setShowClearModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }))
      message.success('Connection restored - data can now be synchronized')
    }
    
    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }))
      message.warning('Connection lost - working in offline mode')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Calculate storage usage
  useEffect(() => {
    const calculateStorage = () => {
      try {
        let used = 0
        let items = 0
        
        // Calculate localStorage usage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key) {
            const value = localStorage.getItem(key)
            if (value) {
              used += new Blob([value]).size
              items++
            }
          }
        }
        
        // Calculate IndexedDB usage if available
        if ('indexedDB' in window) {
          // This would require async calculation in a real implementation
          // For now, we'll estimate based on localStorage
        }
        
        const percentage = Math.round((used / storageStatus.available) * 100)
        
        setStorageStatus(prev => ({
          ...prev,
          used,
          percentage,
          items,
          lastUpdated: Date.now()
        }))
      } catch (error) {
        console.error('Error calculating storage usage:', error)
      }
    }

    calculateStorage()
    const interval = setInterval(calculateStorage, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [storageStatus.available])

  // Scan for offline data
  useEffect(() => {
    const scanOfflineData = () => {
      try {
        const data: OfflineDataItem[] = []
        
        // Scan localStorage for offline data
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('offline-')) {
            try {
              const value = localStorage.getItem(key)
              if (value) {
                const parsed = JSON.parse(value)
                if (parsed && parsed.metadata) {
                  data.push({
                    id: key,
                    type: parsed.type || 'unknown',
                    data: parsed,
                    timestamp: parsed.timestamp || Date.now(),
                    lastSynced: parsed.lastSynced,
                    size: new Blob([value]).size,
                    metadata: parsed.metadata
                  })
                }
              }
            } catch (e) {
              // Skip invalid entries
            }
          }
        }
        
        setOfflineData(data.sort((a, b) => b.timestamp - a.timestamp))
      } catch (error) {
        console.error('Error scanning offline data:', error)
      }
    }

    scanOfflineData()
    const interval = setInterval(scanOfflineData, 10000) // Scan every 10 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Export all offline data
  const exportAllData = async () => {
    setIsExporting(true)
    try {
      const exportData = {
        exportTime: new Date().toISOString(),
        version: '1.0',
        storageStatus,
        syncStatus,
        data: offlineData
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `offline-data-export-${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(url)
      
      message.success('All offline data exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      message.error('Failed to export offline data')
    } finally {
      setIsExporting(false)
    }
  }

  // Import offline data
  const importData = async (file: RcFile) => {
    setIsImporting(true)
    try {
      const text = await file.text()
      const importData = JSON.parse(text)
      
      if (importData.data && Array.isArray(importData.data)) {
        let imported = 0
        let errors = 0
        
        for (const item of importData.data) {
          try {
            if (item.id && item.data) {
              localStorage.setItem(item.id, JSON.stringify(item.data))
              imported++
            }
          } catch (e) {
            errors++
          }
        }
        
        if (imported > 0) {
          message.success(`Imported ${imported} data items successfully`)
          if (errors > 0) {
            message.warning(`${errors} items failed to import`)
          }
        } else {
          message.error('No valid data found in import file')
        }
      } else {
        message.error('Invalid import file format')
      }
    } catch (error) {
      console.error('Import failed:', error)
      message.error('Failed to import data')
    } finally {
      setIsImporting(false)
    }
    
    return false // Prevent default upload behavior
  }

  // Clear all offline data
  const clearAllData = () => {
    try {
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('offline-')) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      setOfflineData([])
      message.success('All offline data cleared successfully')
      setShowClearModal(false)
    } catch (error) {
      console.error('Failed to clear data:', error)
      message.error('Failed to clear offline data')
    }
  }

  // Manual sync request
  const handleSyncRequest = () => {
    if (onSyncRequest) {
      onSyncRequest()
    } else {
      message.info('Sync functionality not implemented yet')
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get type color
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      game: '#52c41a',
      event: '#1890ff',
      player: '#722ed1',
      task: '#fa8c16',
      budget: '#eb2f96'
    }
    return colors[type] || '#666'
  }

  return (
    <div>
      {/* Storage Status */}
      <Card title="Offline Storage Status" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Statistic 
              title="Storage Used" 
              value={storageStatus.percentage} 
              suffix="%" 
              valueStyle={{ 
                color: storageStatus.percentage > 80 ? '#f5222d' : 
                       storageStatus.percentage > 60 ? '#fa8c16' : '#52c41a' 
              }}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Data Items" 
              value={storageStatus.items} 
              suffix="items"
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Connection" 
              value={syncStatus.isOnline ? 'Online' : 'Offline'} 
              valueStyle={{ 
                color: syncStatus.isOnline ? '#52c41a' : '#f5222d' 
              }}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Pending Sync" 
              value={syncStatus.pendingItems} 
              suffix="items"
            />
          </Col>
        </Row>
        
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Storage Usage:</Text>
          <Progress 
            percent={storageStatus.percentage} 
            status={storageStatus.percentage > 80 ? 'exception' : 'normal'}
            strokeColor={storageStatus.percentage > 80 ? '#f5222d' : undefined}
          />
          <Text type="secondary">
            {formatFileSize(storageStatus.used)} / {formatFileSize(storageStatus.available)}
          </Text>
        </div>
      </Card>

      {/* Connection Status */}
      {!syncStatus.isOnline && (
        <Alert
          message="Working Offline"
          description="You are currently offline. All data will be saved locally and synchronized when connection is restored."
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Action Buttons */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={exportAllData}
            loading={isExporting}
          >
            Export All Data
          </Button>
          
          <Upload
            accept=".json"
            beforeUpload={importData}
            showUploadList={false}
          >
            <Button
              icon={<UploadOutlined />}
              loading={isImporting}
            >
              Import Data
            </Button>
          </Upload>
          
          <Button
            icon={<SyncOutlined />}
            onClick={handleSyncRequest}
            disabled={!syncStatus.isOnline}
          >
            Sync Now
          </Button>
          
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => setShowClearModal(true)}
          >
            Clear All Data
          </Button>
        </Space>
      </Card>

      {/* Offline Data List */}
      <Card title="Offline Data Items" size="small">
        {offlineData.length > 0 ? (
          <List
            dataSource={offlineData}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    key="restore"
                    size="small"
                    onClick={() => onDataRestore?.(item)}
                  >
                    Restore
                  </Button>,
                  <Button
                    key="delete"
                    size="small"
                    danger
                    onClick={() => {
                      localStorage.removeItem(item.id)
                      setOfflineData(prev => prev.filter(d => d.id !== item.id))
                      message.success('Data item deleted')
                    }}
                  >
                    Delete
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={getTypeColor(item.type)}>
                        {item.type.toUpperCase()}
                      </Tag>
                      {item.metadata.title}
                    </Space>
                  }
                  description={
                    <div>
                      <div>{item.metadata.description}</div>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Size: {formatFileSize(item.size)} • 
                          Created: {new Date(item.timestamp).toLocaleString()} • 
                          Version: {item.metadata.version}
                        </Text>
                        {item.lastSynced && (
                          <Text type="secondary" style={{ fontSize: '12px', marginLeft: 8 }}>
                            • Synced: {new Date(item.lastSynced).toLocaleString()}
                          </Text>
                        )}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <CloudOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: 16 }} />
            <div>No offline data found</div>
            <Text type="secondary">Data will appear here when saved offline</Text>
          </div>
        )}
      </Card>

      {/* Clear All Modal */}
      <Modal
        title="Clear All Offline Data"
        open={showClearModal}
        onOk={clearAllData}
        onCancel={() => setShowClearModal(false)}
        okText="Clear All"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>This will permanently delete all offline data including:</p>
        <ul>
          <li>Saved games and statistics</li>
          <li>Event data</li>
          <li>Player information</li>
          <li>Task data</li>
          <li>Budget information</li>
        </ul>
        <p><strong>This action cannot be undone!</strong></p>
      </Modal>
    </div>
  )
}

export default OfflineManager
