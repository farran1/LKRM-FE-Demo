/**
 * Storage Quota Management Component
 * Allows users to monitor and manage localStorage usage
 */

import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Progress, Button, Space, Typography, Alert, Modal, Table, Tag, Tooltip, Statistic } from 'antd'
import { 
  DatabaseOutlined, 
  DeleteOutlined, 
  DownloadOutlined, 
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { offlineStorage, StorageUsage } from '@/services/offline-storage'
import { cacheService, CacheInfo } from '@/services/cache-service'
import { syncService } from '@/services/sync-service'

const { Title, Text } = Typography

interface StorageQuotaManagerProps {
  onClose?: () => void
  showAsModal?: boolean
}

const StorageQuotaManager: React.FC<StorageQuotaManagerProps> = ({ 
  onClose, 
  showAsModal = false 
}) => {
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null)
  const [cacheInfo, setCacheInfo] = useState<Record<string, CacheInfo>>({})
  const [sessions, setSessions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  useEffect(() => {
    loadStorageData()
  }, [])

  const loadStorageData = async () => {
    setIsLoading(true)
    try {
      const usage = offlineStorage.getStorageUsage()
      const cache = cacheService.getCacheInfo()
      const sessionList = offlineStorage.getAllSessions()

      setStorageUsage(usage)
      setCacheInfo(cache)
      setSessions(sessionList)
    } catch (error) {
      console.error('Failed to load storage data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString()
  }

  const getQuotaColor = (percentage: number): string => {
    if (percentage < 50) return '#52c41a' // Green
    if (percentage < 80) return '#faad14' // Orange
    return '#ff4d4f' // Red
  }

  const handleCleanupOldSessions = async () => {
    setIsLoading(true)
    try {
      const deletedCount = offlineStorage.cleanupOldSessions(5) // Keep last 5 sessions
      await loadStorageData()
      
      // Show success message
      const { message } = await import('antd')
      message.success(`Cleaned up ${deletedCount} old sessions`)
    } catch (error) {
      console.error('Cleanup failed:', error)
      const { message } = await import('antd')
      message.error('Failed to cleanup old sessions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearCache = async () => {
    setIsLoading(true)
    try {
      cacheService.clearCache()
      await loadStorageData()
      
      const { message } = await import('antd')
      message.success('Cache cleared successfully')
    } catch (error) {
      console.error('Cache clear failed:', error)
      const { message } = await import('antd')
      message.error('Failed to clear cache')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    setIsLoading(true)
    try {
      offlineStorage.deleteSession(sessionId)
      await loadStorageData()
      
      const { message } = await import('antd')
      message.success('Session deleted successfully')
      setShowDeleteModal(false)
      setSelectedSession(null)
    } catch (error) {
      console.error('Session deletion failed:', error)
      const { message } = await import('antd')
      message.error('Failed to delete session')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      const allSessions = offlineStorage.getAllSessions()
      const exportData = {
        sessions: allSessions,
        cacheInfo: cacheService.getCacheInfo(),
        storageUsage: offlineStorage.getStorageUsage(),
        exportDate: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lkrm-storage-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const { message } = await import('antd')
      message.success('Data exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      const { message } = await import('antd')
      message.error('Failed to export data')
    }
  }

  const sessionColumns = [
    {
      title: 'Session ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Text code style={{ fontSize: '12px' }}>
          {id.substring(0, 8)}...
        </Text>
      )
    },
    {
      title: 'Event ID',
      dataIndex: 'eventId',
      key: 'eventId',
      render: (eventId: number) => <Tag color="blue">#{eventId}</Tag>
    },
    {
      title: 'Started',
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: (date: string) => formatDate(date)
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Ended'}
        </Tag>
      )
    },
    {
      title: 'Device',
      dataIndex: 'deviceId',
      key: 'deviceId',
      render: (deviceId: string) => (
        <Text code style={{ fontSize: '11px' }}>
          {deviceId.substring(0, 6)}...
        </Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setSelectedSession(record.id)
              setShowDeleteModal(true)
            }}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ]

  const content = (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        {/* Storage Overview */}
        <Col span={24}>
          <Card title={
            <Space>
              <DatabaseOutlined />
              <span>Storage Overview</span>
            </Space>
          }>
            {storageUsage && (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <Statistic
                    title="Total Storage Used"
                    value={formatBytes(storageUsage.totalBytes)}
                    valueStyle={{ color: getQuotaColor(storageUsage.quotaUsed) }}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Statistic
                    title="Sessions Stored"
                    value={storageUsage.sessionCount}
                    suffix="games"
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Statistic
                    title="Quota Used"
                    value={storageUsage.quotaUsed}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: getQuotaColor(storageUsage.quotaUsed) }}
                  />
                </Col>
              </Row>
            )}
            
            {storageUsage && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Storage Usage:</Text>
                <Progress
                  percent={storageUsage.quotaUsed}
                  strokeColor={getQuotaColor(storageUsage.quotaUsed)}
                  showInfo={false}
                  style={{ marginTop: 8 }}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {formatBytes(storageUsage.totalBytes)} of ~5MB used
                </Text>
              </div>
            )}

            {storageUsage && storageUsage.quotaUsed > 80 && (
              <Alert
                message="Storage Nearly Full"
                description="Consider cleaning up old sessions or clearing cache to free up space."
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
                action={
                  <Button size="small" onClick={handleCleanupOldSessions}>
                    Cleanup
                  </Button>
                }
              />
            )}
          </Card>
        </Col>

        {/* Cache Information */}
        <Col span={24}>
          <Card title={
            <Space>
              <SettingOutlined />
              <span>Cache Information</span>
            </Space>
          }>
            <Row gutter={[16, 16]}>
              {Object.entries(cacheInfo).map(([key, info]) => (
                <Col xs={24} sm={12} md={8} key={key}>
                  <Card size="small" title={key.charAt(0).toUpperCase() + key.slice(1)}>
                    <Statistic
                      title="Items"
                      value={info.itemCount}
                      suffix="cached"
                    />
                    <Statistic
                      title="Size"
                      value={formatBytes(info.sizeBytes)}
                      valueStyle={{ fontSize: '14px' }}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Updated: {info.lastUpdated ? formatDate(info.lastUpdated) : 'Never'}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
            
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadStorageData}
                  loading={isLoading}
                >
                  Refresh
                </Button>
                <Button
                  icon={<DeleteOutlined />}
                  onClick={handleClearCache}
                  loading={isLoading}
                >
                  Clear Cache
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleExportData}
                >
                  Export Data
                </Button>
              </Space>
            </div>
          </Card>
        </Col>

        {/* Session Management */}
        <Col span={24}>
          <Card title={
            <Space>
              <InfoCircleOutlined />
              <span>Stored Sessions</span>
            </Space>
          }>
            <Table
              columns={sessionColumns}
              dataSource={sessions}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              loading={isLoading}
              size="small"
            />
            
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                onClick={handleCleanupOldSessions}
                loading={isLoading}
              >
                Cleanup Old Sessions (Keep Last 5)
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>Delete Session</span>
          </Space>
        }
        open={showDeleteModal}
        onOk={() => selectedSession && handleDeleteSession(selectedSession)}
        onCancel={() => {
          setShowDeleteModal(false)
          setSelectedSession(null)
        }}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this session?</p>
        <p style={{ color: '#ff4d4f' }}>
          <WarningOutlined /> This action cannot be undone.
        </p>
        {selectedSession && (
          <Text code style={{ fontSize: '12px' }}>
            Session: {selectedSession.substring(0, 8)}...
          </Text>
        )}
      </Modal>
    </div>
  )

  if (showAsModal) {
    return (
      <Modal
        title={
          <Space>
            <DatabaseOutlined />
            <span>Storage Management</span>
          </Space>
        }
        open={true}
        onCancel={onClose}
        footer={null}
        width={1000}
        style={{ top: 20 }}
      >
        {content}
      </Modal>
    )
  }

  return content
}

export default StorageQuotaManager



