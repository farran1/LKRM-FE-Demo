'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Space, Typography, Tag } from 'antd'
import { WifiOutlined, DisconnectOutlined, ReloadOutlined } from '@ant-design/icons'

const { Text, Title } = Typography

interface NetworkDebuggerProps {
  onRetry?: () => void
}

export function NetworkDebugger({ onRetry }: NetworkDebuggerProps) {
  const [networkStatus, setNetworkStatus] = useState({
    online: navigator.onLine,
    lastChecked: new Date().toISOString(),
    connectionType: null as string | null
  })

  const [testResults, setTestResults] = useState<{
    apiTest: 'pending' | 'success' | 'failed' | 'skipped'
    cacheTest: 'pending' | 'success' | 'failed' | 'skipped'
  }>({
    apiTest: 'pending',
    cacheTest: 'pending'
  })

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        online: true,
        lastChecked: new Date().toISOString()
      }))
    }

    const handleOffline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        online: false,
        lastChecked: new Date().toISOString()
      }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const testAPI = async () => {
    setTestResults(prev => ({ ...prev, apiTest: 'pending' }))
    
    try {
      const response = await fetch('/api/events', {
        method: 'HEAD',
        cache: 'no-cache'
      })
      
      if (response.ok) {
        setTestResults(prev => ({ ...prev, apiTest: 'success' }))
      } else {
        setTestResults(prev => ({ ...prev, apiTest: 'failed' }))
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, apiTest: 'failed' }))
    }
  }

  const testCache = async () => {
    setTestResults(prev => ({ ...prev, cacheTest: 'pending' }))
    
    try {
      const { offlineStorage } = await import('@/services/offline-storage')
      const cachedEvents = offlineStorage.getEventsCache()
      
      if (cachedEvents && Array.isArray(cachedEvents)) {
        setTestResults(prev => ({ ...prev, cacheTest: 'success' }))
      } else {
        setTestResults(prev => ({ ...prev, cacheTest: 'failed' }))
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, cacheTest: 'failed' }))
    }
  }

  const runAllTests = async () => {
    await Promise.all([testAPI(), testCache()])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success'
      case 'failed': return 'error'
      case 'pending': return 'processing'
      case 'skipped': return 'default'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅'
      case 'failed': return '❌'
      case 'pending': return '⏳'
      case 'skipped': return '⏭️'
      default: return '❓'
    }
  }

  return (
    <Card 
      title="Network Debugger" 
      size="small"
      style={{ marginBottom: 16 }}
      extra={
        <Space>
          <Button size="small" icon={<ReloadOutlined />} onClick={runAllTests}>
            Test All
          </Button>
          {onRetry && (
            <Button size="small" type="primary" onClick={onRetry}>
              Retry App
            </Button>
          )}
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Network Status */}
        <div>
          <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
            Network Status
          </Title>
          <Space>
            <Tag 
              color={networkStatus.online ? 'success' : 'error'}
              icon={networkStatus.online ? <WifiOutlined /> : <DisconnectOutlined />}
            >
              {networkStatus.online ? 'Online' : 'Offline'}
            </Tag>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Last checked: {new Date(networkStatus.lastChecked).toLocaleTimeString()}
            </Text>
          </Space>
        </div>

        {/* Test Results */}
        <div>
          <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
            Test Results
          </Title>
          <Space direction="vertical" size="small">
            <Space>
              <Tag color={getStatusColor(testResults.apiTest)}>
                {getStatusIcon(testResults.apiTest)} API Test
              </Tag>
              <Button size="small" onClick={testAPI} disabled={testResults.apiTest === 'pending'}>
                Test API
              </Button>
            </Space>
            <Space>
              <Tag color={getStatusColor(testResults.cacheTest)}>
                {getStatusIcon(testResults.cacheTest)} Cache Test
              </Tag>
              <Button size="small" onClick={testCache} disabled={testResults.cacheTest === 'pending'}>
                Test Cache
              </Button>
            </Space>
          </Space>
        </div>

        {/* Debug Info */}
        <div>
          <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
            Debug Info
          </Title>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
            navigator.onLine: {navigator.onLine.toString()}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
            User Agent: {navigator.userAgent.substring(0, 50)}...
          </Text>
        </div>
      </Space>
    </Card>
  )
}







