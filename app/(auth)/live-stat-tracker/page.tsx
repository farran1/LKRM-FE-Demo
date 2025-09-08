'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Typography, Alert, Button, Space, Modal } from 'antd';
import { TrophyOutlined, BarChartOutlined, TeamOutlined, ExclamationCircleOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import EventSelector from '../components/EventSelector';
import Statistics from './statistics';
import { refinedLiveStatTrackerService } from '../../../src/services/refinedLiveStatTrackerService';



const { Title, Text } = Typography;

export default function StatisticsPage() {
  const [selectedEventId, setSelectedEventId] = useState<number | undefined>();
  const [showStats, setShowStats] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);

  const handleEventSelect = (eventId: number) => {
    setSelectedEventId(eventId);
  };

  const handleStartTracking = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmTracking = () => {
    setShowConfirmModal(false);
    setShowStats(true);
  };

  const handleCancelTracking = () => {
    setShowConfirmModal(false);
  };

  const handleExitRequest = () => {
    console.log('handleExitRequest called! Setting showExitModal to true');
    setShowExitModal(true);
  };

  const handleExitAndSave = async () => {
    try {
      // First try to get the current session ID
      let currentSessionKey = refinedLiveStatTrackerService.getCurrentSessionKey();
      
      // If no current session, try to get the session ID for this event
      if (!currentSessionKey && selectedEventId) {
        const sessionId = await refinedLiveStatTrackerService.getSessionIdForEvent(selectedEventId);
        if (sessionId) {
          currentSessionKey = sessionId.toString();
        }
      }
      
      if (currentSessionKey) {
        // Check if session is already aggregated
        const isAlreadyAggregated = await refinedLiveStatTrackerService.isSessionAlreadyAggregated(parseInt(currentSessionKey));
        
        if (isAlreadyAggregated) {
          console.log('ℹ️ Session already aggregated, just ending live session');
          await refinedLiveStatTrackerService.endLiveGame();
          
          // Show info message
          const { message: antdMessage } = await import('antd');
          antdMessage.info('Game already saved! Stats were previously aggregated.');
        } else {
          // First aggregate the stats, then end the live session
          const result = await refinedLiveStatTrackerService.endGameAndAggregate(parseInt(currentSessionKey));
          console.log('✅ Game stats aggregated and saved successfully. Game ID:', result.gameId);
          
          // Show success message to user
          const { message: antdMessage } = await import('antd');
          antdMessage.success(`Game saved successfully! Stats aggregated into Game ID: ${result.gameId}`);
        }
      } else {
        // Fallback: just end the live session if no session key
        await refinedLiveStatTrackerService.endLiveGame();
        console.log('✅ Game session ended successfully');
      }
    } catch (error) {
      console.error('❌ Failed to save game data:', error);
      // Try to at least end the live session
      try {
        await refinedLiveStatTrackerService.endLiveGame();
        console.log('ℹ️ Game session ended but stats aggregation failed');
      } catch (endError) {
        console.log('ℹ️ Game session was already ended or no active session');
      }
    }
    
    setShowExitModal(false);
    setShowStats(false);
    setSelectedEventId(undefined);
  };

  const handleExitAndCancel = async () => {
    try {
      // Get current session key and discard the data
      const currentSessionKey = refinedLiveStatTrackerService.getCurrentSessionKey();
      if (currentSessionKey && selectedEventId) {
        // Clear the current session data without saving
        refinedLiveStatTrackerService.deleteGameData(selectedEventId);
        console.log('🗑️ Game data discarded successfully');
      }
    } catch (error) {
      console.error('❌ Failed to discard game data:', error);
    }
    
    setShowExitModal(false);
    setShowStats(false);
    setSelectedEventId(undefined);
  };

  const handleCancelExit = () => {
    setShowExitModal(false);
  };

  if (showStats && selectedEventId) {
    return (
      <div style={{ padding: '0px' }}>

        <Statistics eventId={selectedEventId} onExit={handleExitRequest} />
        
        {/* Exit Confirmation Modal */}
        <Modal
          title={
            <Space>
              <ExclamationCircleOutlined style={{ color: '#69b1ff' }} />
              <span style={{ color: '#f5f7fa' }}>Exit Live Stat Tracking</span>
            </Space>
          }
          open={showExitModal}
          onOk={handleExitAndSave}
          onCancel={() => {
            setShowExitModal(false)
            setShowCancelConfirmModal(true)
          }}
          okText="Save & Exit"
          cancelText="Cancel & Discard"
          okButtonProps={{
            type: 'primary',
            icon: <SaveOutlined />,
            style: { backgroundColor: '#52c41a', borderColor: '#52c41a' }
          }}
          cancelButtonProps={{
            danger: true,
            icon: <CloseOutlined />,
            style: { borderColor: '#ff4d4f', color: '#ff4d4f', background: '#17375c' }
          }}
          styles={{
            content: { backgroundColor: '#17375c', color: '#f5f7fa' },
            header: { backgroundColor: '#17375c', color: '#f5f7fa' },
            body: { backgroundColor: '#17375c', color: '#f5f7fa' }
          }}
          width={500}
        >
          <div style={{ padding: '16px 0' }}>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#f5f7fa' }}>
              Are you sure you want to exit live stat tracking for <strong>Event #{selectedEventId}</strong>?
            </Text>
            <br /><br />
            <Text type="secondary" style={{ fontSize: '14px', color: '#dbeafe' }}>
              <strong>Save & Exit:</strong> Your game statistics will be automatically aggregated and saved to the database.<br />
              <strong>Cancel & Discard:</strong> All tracking data will be permanently deleted.<br /><br />
              <em>Note: If the game has already ended, stats will be aggregated from the existing session data.</em>
            </Text>
          </div>
        </Modal>

        {/* Cancel Confirmation Modal - Double confirmation for discarding data */}
        <Modal
          title={
            <Space>
              <ExclamationCircleOutlined style={{ color: '#69b1ff' }} />
              <span style={{ color: '#f5f7fa' }}>Confirm Data Loss</span>
            </Space>
          }
          open={showCancelConfirmModal}
          onOk={handleExitAndCancel}
          onCancel={() => setShowCancelConfirmModal(false)}
          okText="Yes, Discard All Data"
          cancelText="No, Keep Data"
          okButtonProps={{
            danger: true,
            icon: <CloseOutlined />,
            style: { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }
          }}
          cancelButtonProps={{
            style: { borderColor: '#295a8f', color: '#e6f2ff', background: '#0f2e52' }
          }}
          styles={{
            content: { backgroundColor: '#17375c', color: '#f5f7fa' },
            header: { backgroundColor: '#17375c', color: '#f5f7fa' },
            body: { backgroundColor: '#17375c', color: '#f5f7fa' }
          }}
          width={500}
        >
          <div style={{ padding: '16px 0' }}>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#ffb4b4' }}>
              ⚠️ WARNING: This action cannot be undone!
            </Text>
            <br /><br />
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#f5f7fa' }}>
              Are you absolutely sure you want to discard all tracking data for <strong>Event #{selectedEventId}</strong>?
            </Text>
            <br /><br />
            <Text type="secondary" style={{ fontSize: '14px', color: '#dbeafe' }}>
              This will permanently delete all player statistics, game events, and tracking progress.
              Consider saving your data first if you might need it later.
            </Text>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={1}>
              <TrophyOutlined style={{ marginRight: 16, color: '#1890ff' }} />
              Live Stat Tracker
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Select an event to start tracking live statistics for your team
            </Text>
          </div>
        </Col>
      </Row>

      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} lg={18}>
          <EventSelector
            onEventSelect={handleEventSelect}
            selectedEventId={selectedEventId}
            showTitle={false}
          />
          
          {selectedEventId && (
            <Card style={{ marginTop: 16, textAlign: 'center', backgroundColor: '#17375c', border: '1px solid #295a8f' }}
              styles={{
                body: { backgroundColor: '#17375c', color: '#f5f7fa' },
                header: { backgroundColor: '#17375c', color: '#f5f7fa' }
              }}
            >
              <Space direction="vertical" size="large">
                <div>
                  <Title level={3} style={{ color: '#f5f7fa' }}>
                    <BarChartOutlined style={{ marginRight: 12, color: '#52c41a' }} />
                    Ready to Track Stats
                  </Title>
                  <Text type="secondary" style={{ color: '#dbeafe' }}>
                    You've selected an event. Click the button below to start the live stat tracker.
                  </Text>
                </div>
                
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<TeamOutlined />}
                  onClick={handleStartTracking}
                  style={{ height: '48px', fontSize: '16px' }}
                >
                  Start Live Stat Tracking
                </Button>
              </Space>
            </Card>
          )}
        </Col>
      </Row>

      {/* Confirmation Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#69b1ff' }} />
            <span style={{ color: '#f5f7fa' }}>Confirm Live Stat Tracking</span>
          </Space>
        }
        open={showConfirmModal}
        onOk={handleConfirmTracking}
        onCancel={handleCancelTracking}
        okText="Start Tracking"
        cancelText="Cancel"
        okButtonProps={{
          type: 'primary',
          icon: <TeamOutlined />,
          style: { backgroundColor: '#52c41a', borderColor: '#52c41a' }
        }}
        cancelButtonProps={{
          style: { borderColor: '#334155', color: '#e6e6e6', background: '#0f2741' }
        }}
        styles={{
          content: { backgroundColor: '#17375c', color: '#f5f7fa' },
          header: { backgroundColor: '#17375c', color: '#f5f7fa' },
          body: { backgroundColor: '#17375c', color: '#f5f7fa' }
        }}
        width={500}
      >
        <div style={{ padding: '16px 0' }}>
          <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#f5f7fa' }}>
            Are you sure you want to start live stat tracking for <strong>Event #{selectedEventId}</strong>?
          </Text>
          <br /><br />
          <Text type="secondary" style={{ fontSize: '14px', color: '#cbd5e1' }}>
            This will launch the live stat tracker where you can:
          </Text>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li><Text type="secondary" style={{ color: '#cbd5e1' }}>Track player statistics in real-time</Text></li>
            <li><Text type="secondary" style={{ color: '#cbd5e1' }}>Monitor game progress and scoring</Text></li>
            <li><Text type="secondary" style={{ color: '#cbd5e1' }}>Manage player substitutions and lineups</Text></li>
            <li><Text type="secondary" style={{ color: '#cbd5e1' }}>Export game data and analytics</Text></li>
          </ul>
          <Text type="secondary" style={{ fontSize: '14px', color: '#cbd5e1' }}>
            You can return to event selection at any time.
          </Text>
        </div>
      </Modal>
    </div>
  );
} 