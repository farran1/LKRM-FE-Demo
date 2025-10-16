'use client'

import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Button, 
  Badge, 
  Tabs, 
  Alert, 
  Spin, 
  Statistic, 
  Row, 
  Col,
  Table,
  Tag,
  Space,
  Typography
} from 'antd'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Lock, 
  Activity,
  Users,
  Database,
  FileText,
  Clock
} from 'lucide-react'
import { auditLogger, AuditAction, AuditSeverity } from '@/lib/security/audit'

const { Title, Text } = Typography

interface SecurityEvent {
  id: string
  timestamp: string
  event_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  user_id?: string
  ip_address?: string
  user_agent?: string
  details: Record<string, any>
  resolved: boolean
  resolved_at?: string
  resolved_by?: string
}

interface AuditLog {
  id: string
  timestamp: string
  user_id?: string
  user_email?: string
  user_role?: string
  action: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  resource_type?: string
  resource_id?: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  success: boolean
  error_message?: string
}

interface SecurityStats {
  totalEvents: number
  criticalEvents: number
  highSeverityEvents: number
  unresolvedEvents: number
  recentActivity: number
  topActions: Array<{ action: string; count: number }>
  severityBreakdown: Array<{ severity: string; count: number }>
}

export default function SecurityDashboard() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSecurityData()
  }, [])

  const loadSecurityData = async () => {
    try {
      setLoading(true)
      
      // Load security events
      const events = await auditLogger.getSecurityEvents(50)
      setSecurityEvents(events)
      
      // Load audit logs
      const logs = await auditLogger.getAuditLogs({ limit: 100 })
      // Normalize to expected AuditLog type (timestamp as string)
      const normalizedLogs = (logs || []).map((l: any) => ({
        ...l,
        timestamp: typeof l.timestamp === 'string' ? l.timestamp : new Date(l.timestamp).toISOString()
      }))
      setAuditLogs(normalizedLogs)
      
      // Calculate stats
      const stats = calculateSecurityStats(events, normalizedLogs)
      setSecurityStats(stats)
      
    } catch (err) {
      setError('Failed to load security data')
      console.error('Security dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateSecurityStats = (events: SecurityEvent[], logs: AuditLog[]): SecurityStats => {
    const totalEvents = events.length
    const criticalEvents = events.filter(e => e.severity === 'critical').length
    const highSeverityEvents = events.filter(e => e.severity === 'high').length
    const unresolvedEvents = events.filter(e => !e.resolved).length
    
    // Recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentActivity = logs.filter(log => 
      new Date(log.timestamp) > oneDayAgo
    ).length
    
    // Top actions
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const topActions = Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }))
    
    // Severity breakdown
    const severityCounts = logs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const severityBreakdown = Object.entries(severityCounts)
      .map(([severity, count]) => ({ severity, count }))
    
    return {
      totalEvents,
      criticalEvents,
      highSeverityEvents,
      unresolvedEvents,
      recentActivity,
      topActions,
      severityBreakdown
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'processing'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  // Table columns for security events
  const securityEventsColumns = [
    {
      title: 'Event',
      dataIndex: 'event_type',
      key: 'event_type',
      render: (text: string, record: SecurityEvent) => (
        <Space>
          {getSeverityIcon(record.severity)}
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Badge color={getSeverityColor(severity)} text={severity.toUpperCase()} />
      )
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => formatTimestamp(timestamp)
    },
    {
      title: 'Status',
      dataIndex: 'resolved',
      key: 'resolved',
      render: (resolved: boolean) => (
        <Tag color={resolved ? 'green' : 'orange'}>
          {resolved ? 'Resolved' : 'Open'}
        </Tag>
      )
    }
  ]

  // Table columns for audit logs
  const auditLogsColumns = [
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'User',
      dataIndex: 'user_email',
      key: 'user_email',
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Badge color={getSeverityColor(severity)} text={severity.toUpperCase()} />
      )
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => formatTimestamp(timestamp)
    },
    {
      title: 'Success',
      dataIndex: 'success',
      key: 'success',
      render: (success: boolean) => (
        success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        icon={<AlertTriangle className="h-4 w-4" />}
      />
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Title level={2}>Security Dashboard</Title>
          <Text type="secondary">
            Monitor security events and audit logs across your platform
          </Text>
        </div>
        <Button onClick={loadSecurityData} icon={<Activity className="h-4 w-4" />}>
          Refresh
        </Button>
      </div>

      {/* Security Stats */}
      {securityStats && (
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Events"
                value={securityStats.totalEvents}
                prefix={<Shield className="h-4 w-4" />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Critical Events"
                value={securityStats.criticalEvents}
                valueStyle={{ color: '#cf1322' }}
                prefix={<XCircle className="h-4 w-4" />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Unresolved"
                value={securityStats.unresolvedEvents}
                valueStyle={{ color: '#fa8c16' }}
                prefix={<AlertTriangle className="h-4 w-4" />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Recent Activity"
                value={securityStats.recentActivity}
                suffix="last 24h"
                prefix={<Clock className="h-4 w-4" />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Content */}
      <Tabs 
        defaultActiveKey="events"
        items={[
          {
            key: 'events',
            label: 'Security Events',
            children: (
              <Card title="Recent Security Events">
                <Table
                  columns={securityEventsColumns}
                  dataSource={securityEvents}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  locale={{ emptyText: 'No security events found' }}
                />
              </Card>
            )
          },
          {
            key: 'audit',
            label: 'Audit Logs',
            children: (
              <Card title="Audit Logs">
                <Table
                  columns={auditLogsColumns}
                  dataSource={auditLogs}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  locale={{ emptyText: 'No audit logs found' }}
                />
              </Card>
            )
          },
          {
            key: 'stats',
            label: 'Statistics',
            children: securityStats ? (
              <Row gutter={16}>
                <Col span={12}>
                  <Card title="Top Actions">
                    <div className="space-y-2">
                      {securityStats.topActions.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <Text>{item.action}</Text>
                          <Badge count={item.count} />
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="Severity Breakdown">
                    <div className="space-y-2">
                      {securityStats.severityBreakdown.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <Text className="capitalize">{item.severity}</Text>
                          <Badge color={getSeverityColor(item.severity)} count={item.count} />
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
              </Row>
            ) : null
          }
        ]}
      />
    </div>
  )
}
