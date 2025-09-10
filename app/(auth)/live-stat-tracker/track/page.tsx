'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Row, Col, Typography, Alert, Button, Space, Modal } from 'antd';
import { ExclamationCircleOutlined, SaveOutlined, CloseOutlined, ArrowLeftOutlined, StopOutlined } from '@ant-design/icons';
import Statistics from '../statistics';
import { refinedLiveStatTrackerService } from '../../../../src/services/refinedLiveStatTrackerService';
import { createClient } from '@supabase/supabase-js';

const { Title, Text } = Typography;

export default function LiveStatTrackingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get('eventId');
  const eventId = eventIdParam ? parseInt(eventIdParam) : 0;
  const choice = searchParams.get('choice') as 'resume' | 'startOver' | null;
  
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
        // Initialize Supabase client
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        // Set the client in the service
        refinedLiveStatTrackerService.setSupabaseClient(supabase);
        console.log('🔌 Supabase client initialized for tracking page');

        // Now proceed with tracking preparation
        if (choice === 'resume') {
          // Check if there's existing data to resume
          console.log('🔍 Checking for existing session data for event:', eventId);
          const sessionKey = await refinedLiveStatTrackerService.getSessionKeyForEvent(eventId);
          if (sessionKey) {
            console.log('✅ Found existing session data - ready to resume:', sessionKey);
          } else {
            console.log('ℹ️ No existing session found - ready to start fresh');
          }
        } else if (choice === 'startOver') {
          // Clear existing data and prepare for fresh start
          console.log('🗑️ Clearing existing data for event:', eventId);
          await refinedLiveStatTrackerService.deleteGameData(eventId);
          console.log('✅ Cleared existing data for event:', eventId);
        }
        
        console.log('✅ Tracking preparation completed successfully');
        setIsInitializing(false);
      } catch (error) {
        console.error('❌ Failed to prepare tracking:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          eventId,
          choice
        });
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
      // First try to get the current session ID
      let currentSessionKey = refinedLiveStatTrackerService.getCurrentSessionKey();
      
      // If no current session, try to get the session ID for this event
      if (!currentSessionKey && eventId) {
        const sessionKey = await refinedLiveStatTrackerService.getSessionKeyForEvent(eventId);
        if (sessionKey) {
          currentSessionKey = sessionKey;
        }
      }
      
      if (currentSessionKey) {
        // Aggregate stats without ending the session (so it can be resumed)
        const result = await refinedLiveStatTrackerService.aggregateStatsOnly(parseInt(currentSessionKey));
        
        console.log('✅ Game stats aggregated successfully. Game ID:', result.gameId);
        
        // Show success message to user
        const { message: antdMessage } = await import('antd');
        antdMessage.success(`Game saved successfully! Stats aggregated to Game ID: ${result.gameId}. You can resume this game later.`);
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
    router.push('/live-stat-tracker');
  };

  const handleEndGame = async () => {
    try {
      // First try to get the current session ID
      let currentSessionKey = refinedLiveStatTrackerService.getCurrentSessionKey();
      
      // If no current session, try to get the session ID for this event
      if (!currentSessionKey && eventId) {
        const sessionKey = await refinedLiveStatTrackerService.getSessionKeyForEvent(eventId);
        if (sessionKey) {
          currentSessionKey = sessionKey;
        }
      }
      
      if (currentSessionKey) {
        // Aggregate stats but keep session active (so it can be resumed)
        const result = await refinedLiveStatTrackerService.aggregateStatsOnly(parseInt(currentSessionKey));
        
        console.log('✅ Game stats aggregated successfully. Game ID:', result.gameId);
        
        // Show success message to user
        const { message: antdMessage } = await import('antd');
        antdMessage.success(`Game ended successfully! Stats aggregated to Game ID: ${result.gameId}. You can resume this game later.`);
      } else {
        // Fallback: just end the live session if no session key
        await refinedLiveStatTrackerService.endLiveGame();
        console.log('✅ Game session ended successfully');
      }
    } catch (error) {
      console.error('❌ Failed to end game:', error);
      // Try to at least end the live session
      try {
        await refinedLiveStatTrackerService.endLiveGame();
        console.log('✅ Game session ended successfully (fallback)');
      } catch (fallbackError) {
        console.error('❌ Failed to end live session (fallback):', fallbackError);
      }
    }
    
    setShowExitModal(false);
    router.push('/live-stat-tracker');
  };

  const handleFinalEndGame = async () => {
    try {
      // First try to get the current session ID
      let currentSessionKey = refinedLiveStatTrackerService.getCurrentSessionKey();
      
      // If no current session, try to get the session ID for this event
      if (!currentSessionKey && eventId) {
        const sessionKey = await refinedLiveStatTrackerService.getSessionKeyForEvent(eventId);
        if (sessionKey) {
          currentSessionKey = sessionKey;
        }
      }
      
      if (currentSessionKey) {
        // End the game and aggregate stats (final end - no resume)
        const result = await refinedLiveStatTrackerService.endGameAndAggregate(parseInt(currentSessionKey));
        
        console.log('✅ Game ended and stats aggregated successfully. Game ID:', result.gameId);
        
        // Show success message to user
        const { message: antdMessage } = await import('antd');
        antdMessage.success(`Game ended permanently! Stats aggregated to Game ID: ${result.gameId}.`);
      } else {
        // Fallback: just end the live session if no session key
        await refinedLiveStatTrackerService.endLiveGame();
        console.log('✅ Game session ended successfully');
      }
    } catch (error) {
      console.error('❌ Failed to end game:', error);
      // Try to at least end the live session
      try {
        await refinedLiveStatTrackerService.endLiveGame();
        console.log('✅ Game session ended successfully (fallback)');
      } catch (fallbackError) {
        console.error('❌ Failed to end live session (fallback):', fallbackError);
      }
    }
    
    setShowExitModal(false);
    router.push('/live-stat-tracker');
  };

  const handleExitAndCancel = async () => {
    try {
      // Get current session key and discard the data
      const currentSessionKey = refinedLiveStatTrackerService.getCurrentSessionKey();
      if (currentSessionKey && eventId) {
        // Clear the current session data without saving
        refinedLiveStatTrackerService.deleteGameData(eventId);
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
