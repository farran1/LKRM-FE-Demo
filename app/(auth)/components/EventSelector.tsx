'use client';

import React, { useState, useEffect } from 'react';
import { Card, Select, Typography, Space, Button, Tag, Alert } from 'antd';
import { CalendarOutlined, TeamOutlined, TrophyOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

const { Title, Text } = Typography;
const { Option } = Select;

interface Event {
  id: number;
  name: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location: string;
  venue: string;
  oppositionTeam?: string;
  eventType: {
    name: string;
    color: string;
  };
}

interface EventSelectorProps {
  onEventSelect: (eventId: number) => void;
  selectedEventId?: number;
  showTitle?: boolean;
}

const EventSelector: React.FC<EventSelectorProps> = ({ 
  onEventSelect, 
  selectedEventId, 
  showTitle = true 
}) => {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Fetch events
  const { data: eventsResponse, error, isLoading } = useSWR('/api/events', fetcher);
  // Normalize events: handle both array and { data: [] } shapes
  const allEvents: Event[] = Array.isArray(eventsResponse)
    ? (eventsResponse as Event[])
    : (Array.isArray((eventsResponse as any)?.data) ? (eventsResponse as any).data : []);
  
  // Filter events to only show Game and Scrimmage types
  const events: Event[] = allEvents.filter((event: Event) => {
    const eventTypeName = event.eventType?.name?.toLowerCase();
    return eventTypeName === 'game' || eventTypeName === 'scrimmage';
  });
  
  // Find selected event details
  useEffect(() => {
    if (selectedEventId && events && events.length) {
      const event = events.find((e: Event) => e.id === selectedEventId);
      setSelectedEvent(event || null);
    }
  }, [selectedEventId, events]);

  const handleEventChange = (eventId: number) => {
    const event = events.find((e: Event) => e.id === eventId);
    setSelectedEvent(event || null);
    onEventSelect(eventId);
  };

  const handleCreateEvent = () => {
    router.push('/events');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (error) {
    return (
      <Alert
        message="Error loading events"
        description="Failed to load events. Please try again."
        type="error"
        showIcon
      />
    );
  }

  return (
    <Card 
      title={showTitle ? "Select Event for Stats Tracking" : undefined}
      style={{ 
        marginBottom: 16,
        backgroundColor: '#17375c',
        border: '1px solid #295a8f'
      }}
      styles={{
        header: {
          backgroundColor: '#17375c',
          borderBottom: '1px solid #295a8f',
          color: '#ffffff'
        },
        body: {
          backgroundColor: '#17375c',
          color: '#ffffff'
        }
      }}
      extra={
        <Button 
          type="primary" 
          size="small" 
          onClick={handleCreateEvent}
        >
          Create New Event
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Event Selection Dropdown */}
        <div>
          <Text strong style={{ color: '#ffffff' }}>Choose an event:</Text>
          <Select
            placeholder="Select an event to track stats for..."
            style={{ width: '100%', marginTop: 8, backgroundColor: '#0f2e52', color: '#ffffff', border: '1px solid #295a8f', borderRadius: 8, height: 44 }}
            styles={{ popup: { root: { backgroundColor: '#0f2e52', color: '#ffffff', border: '1px solid #295a8f' } } }}
            listHeight={256}
            value={selectedEventId}
            onChange={handleEventChange}
            loading={isLoading}
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {events.map((event: Event) => (
              <Option key={event.id} value={event.id}>
                <Space>
                  <span>{event.name}</span>
                  <Tag color={event.eventType?.color || '#1890ff'}>
                    {event.eventType?.name || 'Event'}
                  </Tag>
                </Space>
              </Option>
            ))}
          </Select>
          <Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block', color: '#dbeafe' }}>
            Only games and scrimmages are shown for stats tracking
          </Text>
        </div>

        {/* Selected Event Details */}
        {selectedEvent && (
          <Card 
            size="small" 
            style={{ 
              backgroundColor: '#17375c',
              border: `2px solid ${selectedEvent.eventType?.color || '#295a8f'}`,
              color: '#ffffff'
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0, color: '#ffffff' }}>
                  {selectedEvent.name}
                </Title>
                <Tag color={selectedEvent.eventType?.color || '#1890ff'}>
                  {selectedEvent.eventType?.name}
                </Tag>
              </div>
              
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <Space>
                  <CalendarOutlined style={{ color: '#69b1ff' }} />
                  <Text style={{ color: '#e6f2ff' }}>{formatDate(selectedEvent.startTime)}</Text>
                </Space>
                
                <Space>
                  <EnvironmentOutlined style={{ color: '#69b1ff' }} />
                  <Text style={{ color: '#e6f2ff' }}>{selectedEvent.venue}</Text>
                </Space>
                
                {selectedEvent.oppositionTeam && (
                  <Space>
                    <TeamOutlined style={{ color: '#69b1ff' }} />
                    <Text style={{ color: '#e6f2ff' }}>vs {selectedEvent.oppositionTeam}</Text>
                  </Space>
                )}
              </div>
              
              {selectedEvent.description && (
                <Text style={{ color: '#dbeafe' }}>{selectedEvent.description}</Text>
              )}
            </Space>
          </Card>
        )}

        {/* No Events Message */}
        {!isLoading && events.length === 0 && (
          <Alert
            message="No events found"
            description="Create your first event to start tracking stats."
            type="info"
            showIcon
            action={
              <Button size="small" type="primary" onClick={handleCreateEvent}>
                Create Event
              </Button>
            }
          />
        )}
      </Space>
    </Card>
  );
};

// Helper function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default EventSelector;
