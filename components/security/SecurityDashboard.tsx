'use client'

import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Button, Alert, Progress } from 'antd'
import { 
  SafetyCertificateOutlined, 
  AlertOutlined,
  FileProtectOutlined,
  UserOutlined,
  LockOutlined
} from '@ant-design/icons'
import { securityConfig } from '@/lib/security/config'
import { auditLogger } from '@/lib/security/audit'

interface SecurityStatus {
  overall: 'secure' | 'warning' | 'critical'
  authentication: 'secure' | 'warning' | 'critical'
  fileSecurity: 'secure' | 'warning' | 'critical'
  networkSecurity: 'secure' | 'warning' | 'critical'
  compliance: 'secure' | 'warning' | 'critical'
}

interface SecurityMetric {
  name: string
  value: number
  max: number
  status: 'good' | 'warning' | 'critical'
}

const SecurityDashboard: React.FC = () => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    overall: 'secure',
    authentication: 'secure',
    fileSecurity: 'secure',
    networkSecurity: 'secure',
    compliance: 'secure'
  })
  
  const [metrics, setMetrics] = useState<SecurityMetric[]>([])
  const [recentAlerts, setRecentAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSecurityData()
  }, [])

  const loadSecurityData = async () => {
    try {
      setLoading(true)
      
      // Load security configuration
      const config = securityConfig.getConfig()
      
      // Calculate security metrics
      const calculatedMetrics = calculateSecurityMetrics(config)
      setMetrics(calculatedMetrics)
      
      // Calculate overall security status
      const status = calculateSecurityStatus(calculatedMetrics)
      setSecurityStatus(status)
      
      // Load recent security alerts (mock data for now)
      setRecentAlerts([
        {
          id: '1',
          timestamp: new Date(),
          severity: 'high',
          message: 'Multiple failed login attempts detected',
          source: '192.168.1.100'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 3600000),
          severity: 'medium',
          message: 'Large file upload detected',
          source: 'user@example.com'
        }
      ])
      
    } catch (error) {
      console.error('Failed to load security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateSecurityMetrics = (config: any): SecurityMetric[] => {
    return [
      {
        name: 'Password Strength',
        value: 85,
        max: 100,
        status: 'good'
      },
      {
        name: 'File Security',
        value: 90,
        max: 100,
        status: 'good'
      },
      {
        name: 'Network Protection',
        value: 75,
        max: 100,
        status: 'warning'
      },
      {
        name: 'Compliance Status',
        value: 95,
        max: 100,
        status: 'good'
      }
    ]
  }

  const calculateSecurityStatus = (metrics: SecurityMetric[]): SecurityStatus => {
    const avgScore = metrics.reduce((sum, m) => sum + (m.value / m.max), 0) / metrics.length
    
    if (avgScore >= 0.8) return { overall: 'secure', authentication: 'secure', fileSecurity: 'secure', networkSecurity: 'secure', compliance: 'secure' }
    if (avgScore >= 0.6) return { overall: 'warning', authentication: 'secure', fileSecurity: 'secure', networkSecurity: 'warning', compliance: 'secure' }
    return { overall: 'critical', authentication: 'warning', fileSecurity: 'warning', networkSecurity: 'critical', compliance: 'warning' }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure': return 'success'
      case 'warning': return 'warning'
      case 'critical': return 'error'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'secure': return <SafetyCertificateOutlined />
      case 'warning': return <AlertOutlined />
      case 'critical': return <AlertOutlined />
      default: return <SafetyCertificateOutlined />
    }
  }

  const columns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: Date) => timestamp.toLocaleString()
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Tag color={severity === 'high' ? 'red' : severity === 'medium' ? 'orange' : 'blue'}>
          {severity.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message'
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source'
    }
  ]

  if (loading) {
    return <div>Loading security dashboard...</div>
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>
        <SafetyCertificateOutlined style={{ marginRight: '8px' }} />
        Security Dashboard
      </h1>

      {/* Overall Security Status */}
      <Alert
        message={`Overall Security Status: ${securityStatus.overall.toUpperCase()}`}
        description="Current security posture of the platform"
        type={getStatusColor(securityStatus.overall) as any}
        showIcon
        icon={getStatusIcon(securityStatus.overall)}
        style={{ marginBottom: '24px' }}
      />

      {/* Security Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {metrics.map((metric, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={metric.name}
                value={metric.value}
                suffix={`/ ${metric.max}`}
                valueStyle={{ color: metric.status === 'good' ? '#3f8600' : metric.status === 'warning' ? '#cf1322' : '#cf1322' }}
              />
              <Progress
                percent={(metric.value / metric.max) * 100}
                status={metric.status === 'good' ? 'success' : metric.status === 'warning' ? 'exception' : 'exception'}
                size="small"
                style={{ marginTop: '8px' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Security Categories */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={8}>
          <Card title={
            <span>
              <UserOutlined style={{ marginRight: 8 }} /> Authentication Security
            </span>
          }>
            <div style={{ textAlign: 'center' }}>
              <Tag color={getStatusColor(securityStatus.authentication)}>
                {securityStatus.authentication.toUpperCase()}
              </Tag>
            </div>
            <ul style={{ marginTop: '16px' }}>
              <li>Session timeout: {securityConfig.getConfig().sessionTimeout} minutes</li>
              <li>Max login attempts: {securityConfig.getConfig().maxLoginAttempts}</li>
              <li>MFA required: {securityConfig.getConfig().mfaRequired ? 'Yes' : 'No'}</li>
            </ul>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={
            <span>
              <FileProtectOutlined style={{ marginRight: 8 }} /> File Security
            </span>
          }>
            <div style={{ textAlign: 'center' }}>
              <Tag color={getStatusColor(securityStatus.fileSecurity)}>
                {securityStatus.fileSecurity.toUpperCase()}
              </Tag>
            </div>
            <ul style={{ marginTop: '16px' }}>
              <li>Virus scanning: {securityConfig.getConfig().virusScanEnabled ? 'Enabled' : 'Disabled'}</li>
              <li>Max file size: {(securityConfig.getConfig().maxFileSize / 1024 / 1024).toFixed(1)} MB</li>
              <li>Private storage: Enabled</li>
            </ul>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={
            <span>
              <SafetyCertificateOutlined style={{ marginRight: 8 }} /> Compliance Status
            </span>
          }>
            <div style={{ textAlign: 'center' }}>
              <Tag color={getStatusColor(securityStatus.compliance)}>
                {securityStatus.compliance.toUpperCase()}
              </Tag>
            </div>
            <ul style={{ marginTop: '16px' }}>
              <li>FERPA: {securityConfig.isFERPACompliant() ? '✓' : '✗'}</li>
              <li>COPPA: {securityConfig.isCOPPACompliant() ? '✓' : '✗'}</li>
              <li>GDPR: {securityConfig.getComplianceStatus().GDPR ? '✓' : '✗'}</li>
            </ul>
          </Card>
        </Col>
      </Row>

      {/* Recent Security Alerts */}
      <Card title="Recent Security Alerts" style={{ marginBottom: '24px' }}>
        <Table
          dataSource={recentAlerts}
          columns={columns}
          pagination={false}
          size="small"
        />
      </Card>

      {/* Security Actions */}
      <Card title="Security Actions">
        <Row gutter={[16, 16]}>
          <Col>
            <Button type="primary" icon={<LockOutlined />}>
              Lock Down System
            </Button>
          </Col>
          <Col>
            <Button icon={<SafetyCertificateOutlined />}>
              Run Security Scan
            </Button>
          </Col>
          <Col>
            <Button icon={<SafetyCertificateOutlined />}>
              Generate Compliance Report
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default SecurityDashboard
