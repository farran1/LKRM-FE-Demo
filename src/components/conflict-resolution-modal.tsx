/**
 * Conflict Resolution Modal Component
 * Handles multi-device session conflicts
 */

import React, { useState, useEffect } from 'react'
import { Modal, Card, Row, Col, Button, Space, Typography, Radio, Alert, Tag, Divider, Timeline } from 'antd'
import { 
  ExclamationCircleOutlined, 
  MergeOutlined, 
  DesktopOutlined, 
  MobileOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { multiDeviceResumeService, ResumeOption, ConflictResolution } from '@/services/multi-device-resume-service'

const { Title, Text } = Typography

interface ConflictResolutionModalProps {
  eventId: number
  visible: boolean
  onResolve: (resolution: ConflictResolution) => void
  onCancel: () => void
}

const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  eventId,
  visible,
  onResolve,
  onCancel
}) => {
  const [availableSessions, setAvailableSessions] = useState<ResumeOption[]>([])
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResolving, setIsResolving] = useState(false)

  useEffect(() => {
    if (visible) {
      loadAvailableSessions()
    }
  }, [visible, eventId])

  const loadAvailableSessions = async () => {
    setIsLoading(true)
    try {
      const sessions = await multiDeviceResumeService.findAvailableSessions(eventId)
      setAvailableSessions(sessions)
      
      // Auto-select the first option
      if (sessions.length > 0) {
        setSelectedOption(sessions[0].session.id)
      }
    } catch (error) {
      console.error('Failed to load available sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolve = async () => {
    if (!selectedOption) return

    setIsResolving(true)
    try {
      const chosenSession = availableSessions.find(s => s.session.id === selectedOption)
      if (!chosenSession) return

      let resolution: ConflictResolution

      if (chosenSession.source === 'merged') {
        // Handle merge case
        const localSession = availableSessions.find(s => s.source === 'local')?.session
        const remoteSession = availableSessions.find(s => s.source === 'remote')?.session
        
        if (localSession && remoteSession) {
          const mergedSession = await multiDeviceResumeService.mergeSessions(localSession, remoteSession)
          resolution = {
            chosenSession: mergedSession,
            resolution: 'merged',
            conflictsResolved: 1
          }
        } else {
          resolution = {
            chosenSession: chosenSession.session,
            resolution: chosenSession.source,
            conflictsResolved: 0
          }
        }
      } else {
        resolution = {
          chosenSession: chosenSession.session,
          resolution: chosenSession.source,
          conflictsResolved: 0
        }
      }

      onResolve(resolution)
    } catch (error) {
      console.error('Failed to resolve conflict:', error)
    } finally {
      setIsResolving(false)
    }
  }

  const getDeviceIcon = (deviceId: string) => {
    const isCurrentDevice = deviceId === 'current_device' // This would be determined by comparing with current device ID
    return isCurrentDevice ? <DesktopOutlined /> : <MobileOutlined />
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'local': return 'green'
      case 'remote': return 'blue'
      case 'merged': return 'purple'
      default: return 'default'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getSessionStatus = (session: any) => {
    if (session.isActive) {
      return <Tag color="green">Active</Tag>
    }
    return <Tag color="red">Ended</Tag>
  }

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#faad14' }} />
          <span>Resume Game Session</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="resolve"
          type="primary"
          onClick={handleResolve}
          loading={isResolving}
          disabled={!selectedOption}
        >
          Resume Selected Session
        </Button>
      ]}
    >
      <div style={{ padding: '16px 0' }}>
        <Alert
          message="Multiple Game Sessions Found"
          description="We found multiple sessions for this event. Choose which session you'd like to resume from."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text>Loading available sessions...</Text>
          </div>
        ) : (
          <Radio.Group
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {availableSessions.map((option, index) => (
                <Card
                  key={option.session.id}
                  size="small"
                  style={{
                    border: selectedOption === option.session.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedOption(option.session.id)}
                >
                  <Row gutter={[16, 8]} align="middle">
                    <Col>
                      <Radio value={option.session.id} />
                    </Col>
                    <Col flex="auto">
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Row justify="space-between" align="middle">
                          <Col>
                            <Space>
                              {getDeviceIcon(option.deviceId)}
                              <Text strong>
                                {option.source === 'local' ? 'This Device' : 
                                 option.source === 'remote' ? 'Other Device' : 
                                 'Merged Session'}
                              </Text>
                              <Tag color={getSourceColor(option.source)}>
                                {option.source.toUpperCase()}
                              </Tag>
                              {getSessionStatus(option.session)}
                            </Space>
                          </Col>
                          <Col>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {option.eventCount} events
                            </Text>
                          </Col>
                        </Row>
                        
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {option.description}
                        </Text>

                        {option.session.gameState && (
                          <Row gutter={[16, 4]}>
                            <Col span={8}>
                              <Text style={{ fontSize: '12px' }}>
                                <TeamOutlined /> Home: {option.session.gameState.homeScore || 0}
                              </Text>
                            </Col>
                            <Col span={8}>
                              <Text style={{ fontSize: '12px' }}>
                                <TeamOutlined /> Away: {option.session.gameState.awayScore || 0}
                              </Text>
                            </Col>
                            <Col span={8}>
                              <Text style={{ fontSize: '12px' }}>
                                <ClockCircleOutlined /> Q{option.session.gameState.currentQuarter || 1}
                              </Text>
                            </Col>
                          </Row>
                        )}
                      </Space>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          </Radio.Group>
        )}

        {availableSessions.length > 1 && (
          <div style={{ marginTop: 24 }}>
            <Divider />
            <Title level={5}>
              <InfoCircleOutlined /> Session Details
            </Title>
            <Timeline>
              {availableSessions.map((option, index) => (
                <Timeline.Item
                  key={option.session.id}
                  color={selectedOption === option.session.id ? '#1890ff' : '#d9d9d9'}
                >
                  <Text style={{ fontSize: '12px' }}>
                    <strong>{option.source === 'local' ? 'This Device' : 
                             option.source === 'remote' ? 'Other Device' : 
                             'Merged Session'}</strong> • 
                    Last modified: {formatDate(option.lastModified)} • 
                    {option.eventCount} events
                  </Text>
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default ConflictResolutionModal



