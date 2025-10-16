'use client';

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Button, Space } from 'antd';
import { TrophyOutlined, BarChartOutlined, TeamOutlined } from '@ant-design/icons';
import EventSelector from '../components/EventSelector';
import { useRouter } from 'next/navigation';
import { cacheService } from '@/services/cache-service';



const { Title, Text } = Typography;

export default function LiveStatTrackerPage() {
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState<number | undefined>();
  const [resumeChoice, setResumeChoice] = useState<'resume' | 'startOver' | null>(null);

  // Refresh roster and events cache when the page is opened
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([
          cacheService.refreshRoster(),
          cacheService.refreshEvents(),
        ])
        console.log('Live tracker page: refreshed roster and events cache')
      } catch (e) {
        console.warn('Live tracker page: cache refresh failed (possibly offline)', e)
      }
    })()
  }, [])

  const handleEventSelect = (eventId: number) => {
    setSelectedEventId(eventId);
  };

  const handleResumeGame = async (eventId: number) => {
    // Only select event and mark intent to resume; do not open tracker yet
    setSelectedEventId(eventId);
    setResumeChoice('resume');
  };

  const handleStartOver = async (eventId: number) => {
    // Only select event and mark intent to start over; do not open tracker yet
    setSelectedEventId(eventId);
    setResumeChoice('startOver');
  };

  const handleStartTracking = () => {
    console.log('🚀 Start tracking clicked:', { selectedEventId, resumeChoice });
    
    if (!selectedEventId) {
      console.error('❌ No event selected');
      return;
    }
    
    // Navigate to the tracking page with the selected event and choice
    const params = new URLSearchParams({
      eventId: selectedEventId.toString(),
      ...(resumeChoice && { choice: resumeChoice })
    });
    
    const url = `/live-stat-tracker/track?${params.toString()}`;
    console.log('🔗 Navigating to:', url);
    
    router.push(url);
  };

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
            onResumeGame={handleResumeGame}
            onStartOver={handleStartOver}
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
                  {resumeChoice && (
                    <div style={{ marginTop: 8 }}>
                      <Text style={{ color: resumeChoice === 'resume' ? '#52c41a' : '#faad14' }}>
                        {resumeChoice === 'resume' ? '📋 Will resume existing game data' : '🔄 Will start fresh (existing data will be cleared)'}
                      </Text>
                    </div>
                  )}
                </div>
                
                <Space>
                  <Button 
                    size="large" 
                    onClick={() => setSelectedEventId(undefined)}
                    style={{ height: '48px', fontSize: '16px' }}
                  >
                    Select Different Event
                  </Button>
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
              </Space>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
} 