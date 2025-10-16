'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Row, Col, Typography, Alert, Button, Space, Modal } from 'antd';
import { ExclamationCircleOutlined, SaveOutlined, CloseOutlined, ArrowLeftOutlined, StopOutlined } from '@ant-design/icons';
import Statistics from '../offline-statistics';
import { liveGameDataService } from '@/services/live-game-data-service';
import { syncService } from '@/services/sync-service';

const { Title, Text } = Typography;

export default function LiveStatTrackingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get('eventId');
  const eventId = eventIdParam ? parseInt(eventIdParam) : 0;
  const choice = (searchParams.get('choice') as 'resume' | 'startOver' | null) || undefined;
  
  const [showExitModal, setShowExitModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Initialize Supabase client and prepare tracking session
  useEffect(() => {
    const prepareTracking = async () => {
      if (!eventId || isNaN(eventId) || eventId <= 0) {
        setInitError(`Invalid event ID provided: ${eventIdParam || 'undefined'}`);
        setIsInitializing(false);
        return;
      }

      try {
        // Simplified initialization - UI only
        console.log('✅ Tracking preparation completed successfully');
        setIsInitializing(false);
      } catch (error) {
        console.error('❌ Failed to prepare tracking:', error);
        setInitError(`Failed to prepare tracking session: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsInitializing(false);
      }
    };

    prepareTracking();
  }, []); // Empty dependency array - only run once on mount


  const handleExitRequest = () => {
    setShowExitModal(true);
  };

  const handleExitAndSave = async () => {
    try {
      // Get current session ID from our offline system
      const currentSessionId = liveGameDataService.getCurrentSessionId();
      
      if (currentSessionId) {
        // End the game session (this will save all data locally and sync if online)
        await liveGameDataService.endGame();
        
        console.log('✅ Game stats saved successfully');
        
        // Show success message to user
        const { message: antdMessage } = await import('antd');
        antdMessage.success('Game saved successfully! You can resume this game later.');
      } else {
        console.log('ℹ️ No active session to save');
      }
    } catch (error) {
      console.error('❌ Failed to save game data:', error);
      const { message: antdMessage } = await import('antd');
      antdMessage.error('Failed to save game data');
    }
    
    setShowExitModal(false);
    router.push('/live-stat-tracker');
  };

  const handleEndGame = async () => {
    try {
      // Get current session ID from our offline system
      const currentSessionId = liveGameDataService.getCurrentSessionId();
      
      if (currentSessionId) {
        // End the game session (this will save all data locally and sync if online)
        await liveGameDataService.endGame();
        
        console.log('✅ Game ended successfully');
        
        // Show success message to user
        const { message: antdMessage } = await import('antd');
        antdMessage.success('Game ended successfully! Stats have been saved.');
      } else {
        console.log('ℹ️ No active session to end');
      }
    } catch (error) {
      console.error('❌ Failed to end game:', error);
      const { message: antdMessage } = await import('antd');
      antdMessage.error('Failed to end game');
    }
    
    setShowExitModal(false);
    router.push('/live-stat-tracker');
  };

  const handleFinalEndGame = async () => {
    try {
      // Get current session ID from our offline system
      const currentSessionId = liveGameDataService.getCurrentSessionId();
      
      if (currentSessionId) {
        // End the game session permanently (no resume)
        await liveGameDataService.endGame();
        
        console.log('✅ Game ended permanently');
        
        // Show success message to user
        const { message: antdMessage } = await import('antd');
        antdMessage.success('Game ended permanently! Stats have been saved.');
      } else {
        console.log('ℹ️ No active session to end');
      }
    } catch (error) {
      console.error('❌ Failed to end game:', error);
      const { message: antdMessage } = await import('antd');
      antdMessage.error('Failed to end game');
    }
    
    setShowExitModal(false);
    router.push('/live-stat-tracker');
  };

  const handleExitAndCancel = async () => {
    try {
      // Get current session ID from our offline system
      const currentSessionId = liveGameDataService.getCurrentSessionId();
      
      if (currentSessionId) {
        // Delete the session data without saving
        const { offlineStorage } = await import('@/services/offline-storage');
        offlineStorage.deleteSession(currentSessionId);
        console.log('🗑️ Game data discarded successfully');
      }
    } catch (error) {
      console.error('❌ Failed to discard game data:', error);
    }
    
    setShowExitModal(false);
    router.push('/live-stat-tracker');
  };

  const handleCancelExit = () => {
    setShowExitModal(false);
  };

  const handleBackToSelector = () => {
    router.push('/live-stat-tracker');
  };

  if (isInitializing) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Card>
          <Space direction="vertical" size="large">
            <Title level={3}>Preparing Live Stat Tracking...</Title>
            <Text type="secondary">
              {choice === 'resume' ? 'Checking for existing game data...' : 
               choice === 'startOver' ? 'Preparing fresh start...' : 
               'Setting up tracking session...'}
            </Text>
          </Space>
        </Card>
      </div>
    );
  }

  // Remove the redundant start screen - Statistics component will handle it

  if (initError) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Failed to Initialize Tracking"
          description={initError}
          type="error"
          showIcon
          action={
            <Button onClick={handleBackToSelector} icon={<ArrowLeftOutlined />}>
              Back to Event Selection
            </Button>
          }
        />
      </div>
    );
  }

  if (!eventId) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Invalid Event"
          description="No event ID provided. Please select an event first."
          type="error"
          showIcon
          action={
            <Button onClick={handleBackToSelector} icon={<ArrowLeftOutlined />}>
              Back to Event Selection
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '0px' }}>
      <Statistics eventId={eventId} onExit={handleExitRequest} autoStart={true} choice={choice} />
      
      {/* Exit Confirmation Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#69b1ff' }} />
            <span style={{ color: '#f5f7fa' }}>Exit Live Stat Tracking</span>
          </Space>
        }
        open={showExitModal}
        onCancel={handleCancelExit}
        footer={[
          <Button
            key="cancel"
            danger
            icon={<CloseOutlined />}
            onClick={() => {
              setShowExitModal(false);
              setShowCancelConfirmModal(true);
            }}
            style={{ borderColor: '#ff4d4f', color: '#ff4d4f', background: '#17375c' }}
          >
            Cancel & Discard
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleExitAndSave}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Save & Exit
          </Button>,
          <Button
            key="end"
            type="primary"
            danger
            icon={<StopOutlined />}
            onClick={handleEndGame}
            style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
          >
            End Game
          </Button>,
          //<Button
            //key="final"
            //type="primary"
            //danger
            //icon={<CloseOutlined />}
            //onClick={handleFinalEndGame}
            //style={{ backgroundColor: '#8c8c8c', borderColor: '#8c8c8c' }}
          //>
            //</div>Final End (No Resume)
          //</Button>
        ]}
        styles={{
          content: { backgroundColor: '#17375c', color: '#f5f7fa' },
          header: { backgroundColor: '#17375c', color: '#f5f7fa' },
          body: { backgroundColor: '#17375c', color: '#f5f7fa' }
        }}
        width={500}
      >
        <div style={{ padding: '16px 0' }}>
          <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#f5f7fa' }}>
            Are you sure you want to exit live stat tracking for <strong>Event #{eventId}</strong>?
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
            Are you absolutely sure you want to discard all tracking data for <strong>Event #{eventId}</strong>?
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
