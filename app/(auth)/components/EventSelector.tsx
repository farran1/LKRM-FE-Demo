'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Select, Typography, Space, Button, Tag, Alert, Modal, Divider } from 'antd';
import { CalendarOutlined, TeamOutlined, TrophyOutlined, EnvironmentOutlined, UserOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
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
  hasExistingData?: boolean;
  isPastEvent?: boolean;
}

interface EventSelectorProps {
  onEventSelect: (eventId: number) => void;
  selectedEventId?: number;
  showTitle?: boolean;
  onResumeGame?: (eventId: number) => void;
  onStartOver?: (eventId: number) => void;
}

const EventSelector: React.FC<EventSelectorProps> = ({ 
  onEventSelect, 
  selectedEventId, 
  showTitle = true,
  onResumeGame,
  onStartOver
}) => {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<number | null>(null);
  
  // Fetch events with offline fallback
  const { data: eventsResponse, error, isLoading } = useSWR('/api/events', fetcher);
  
  // Get events from API or offline cache
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  useEffect(() => {
    const loadEvents = async () => {
      try {
        // Try to get events from API response first
        let events: Event[] = [];
        
        if (eventsResponse) {
          // Normalize events: handle both array and { data: [] } shapes
          const rawEvents = Array.isArray(eventsResponse)
            ? (eventsResponse as any[])
            : (Array.isArray((eventsResponse as any)?.data) ? (eventsResponse as any).data : []);
          
          // Transform events to match expected interface
          events = rawEvents.map((event: any) => ({
            ...event,
            eventType: event.event_types ? {
              name: event.event_types.name,
              color: event.event_types.color
            } : null
          }));
        }
        
        // If no events from API or API failed, try offline cache
        if (events.length === 0) {
          try {
            const { offlineStorage } = await import('../../../src/services/offline-storage');
            const cachedEvents = offlineStorage.getEventsCache();
            if (cachedEvents && Array.isArray(cachedEvents)) {
              console.log('📱 Using cached events from offline storage');
              events = cachedEvents;
              setIsOfflineMode(true);
            }
          } catch (offlineError) {
            console.warn('⚠️ Failed to load events from offline storage:', offlineError);
          }
        } else {
          // Cache events when successfully fetched from API
          try {
            const { offlineStorage } = await import('../../../src/services/offline-storage');
            offlineStorage.saveEventsCache(events);
            console.log('💾 Events cached for offline use');
            setIsOfflineMode(false);
          } catch (cacheError) {
            console.warn('⚠️ Failed to cache events:', cacheError);
          }
        }
        
        setAllEvents(events);
      } catch (error) {
        console.error('❌ Failed to load events:', error);
        setAllEvents([]);
      }
    };
    
    loadEvents();
  }, [eventsResponse, error]);
  
  // Filter events to only show Game and Scrimmage types
  const filteredEvents: Event[] = useMemo(() => {
    return allEvents.filter((event: Event) => {
      const eventTypeName = event.eventType?.name?.toLowerCase();
      return eventTypeName === 'game' || eventTypeName === 'scrimmage';
    });
  }, [allEvents]);

  // Memoize event IDs for SWR key
  const eventIds = useMemo(() => filteredEvents.map(e => e.id), [filteredEvents]);
  
  // Check for existing data for each event
  const { data: eventsWithData, error: eventsDataError } = useSWR(
    eventIds.length > 0 ? '/api/events/check-data' : null,
    async (url) => {
      console.log('🔍 SWR: Fetching events data for IDs:', eventIds);
      
      // Get authentication token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const authHeaders: HeadersInit = session?.access_token ? {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ eventIds })
      });
      const result = await response.json();
      console.log('🔍 SWR: Events data response:', result);
      return result;
    }
  );

  // Debug SWR state
  if (eventsDataError) {
    console.error('🔍 SWR: Error fetching events data:', eventsDataError);
  }

  // Process events with past event detection and data status
  const events: Event[] = useMemo(() => {
    return filteredEvents.map((event: Event) => {
      const now = new Date();
      const eventStartTime = new Date(event.startTime);
      const timeDiffMinutes = (now.getTime() - eventStartTime.getTime()) / (1000 * 60);
      
      const isPastEvent = timeDiffMinutes > 15;
      const hasExistingData = eventsWithData?.data?.[event.id] || false;
      
      // Debug logging
      if (event.id === 16) { // Replace with the event ID you're testing
        console.log('🔍 Debug event data detection:', {
          eventId: event.id,
          eventName: event.name,
          isPastEvent,
          hasExistingData,
          eventsWithData: eventsWithData?.data,
          timeDiffMinutes
        });
      }
      
      // Debug logging removed to prevent potential re-render issues
      
      return {
        ...event,
        isPastEvent,
        hasExistingData
      };
    });
  }, [filteredEvents, eventsWithData]);

  // Separate current and past events
  const currentEvents = useMemo(() => events.filter(event => !event.isPastEvent), [events]);
  const pastEvents = useMemo(() => events.filter(event => event.isPastEvent), [events]);
  
  // Find selected event details
  useEffect(() => {
    if (selectedEventId && events && events.length) {
      const event = events.find((e: Event) => e.id === selectedEventId);
      setSelectedEvent(event || null);
    }
  }, [selectedEventId, events]);

  const handleEventChange = useCallback((eventId: number) => {
    const event = events.find((e: Event) => e.id === eventId);
    setSelectedEvent(event || null);
    
    // Check if this event has existing data (regardless of past/current/future)
    if (event?.hasExistingData) {
      // Showing resume modal for any event with data
      setPendingEventId(eventId);
      setShowResumeModal(true);
    } else {
      // Event selected - calling onEventSelect
      // Call onEventSelect for events without data
      onEventSelect(eventId);
    }
  }, [events, onEventSelect]);

  const handleResumeGame = useCallback(() => {
    if (pendingEventId) {
      if (onResumeGame) {
        onResumeGame(pendingEventId);
      }
      // Also call onEventSelect to show the "Ready to Track Stats" box
      onEventSelect(pendingEventId);
    }
    setShowResumeModal(false);
    setPendingEventId(null);
  }, [pendingEventId, onResumeGame, onEventSelect]);

  const handleStartOver = useCallback(() => {
    if (pendingEventId) {
      if (onStartOver) {
        onStartOver(pendingEventId);
      }
      // Also call onEventSelect to show the "Ready to Track Stats" box
      onEventSelect(pendingEventId);
    }
    setShowResumeModal(false);
    setPendingEventId(null);
  }, [pendingEventId, onStartOver, onEventSelect]);

  const handleCancelResume = useCallback(() => {
    setShowResumeModal(false);
    setPendingEventId(null);
  }, []);

  const handleCreateEvent = useCallback(() => {
    router.push('/events');
  }, [router]);

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
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* Event Selection Dropdown */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <Text strong style={{ color: '#ffffff' }}>Choose an event:</Text>
            {isOfflineMode && (
              <Tag color="orange" style={{ fontSize: '11px' }}>
                📱 Offline Mode
              </Tag>
            )}
          </div>
          <Select
            placeholder="Select an event to track stats for..."
            style={{ width: '100%', marginTop: 4, backgroundColor: '#0f2e52', color: '#ffffff', border: '1px solid #295a8f', borderRadius: 8, height: 40 }}
            styles={{ 
              popup: { 
                root: { 
                  backgroundColor: '#0f2e52', 
                  color: '#ffffff', 
                  border: '1px solid #295a8f',
                  borderRadius: '8px',
                  zIndex: 1050
                } 
              } 
            }}
            listHeight={250}
            value={selectedEventId}
            onChange={handleEventChange}
            loading={isLoading}
            showSearch
            placement="bottomLeft"
            popupMatchSelectWidth={true}
            getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {/* Current Events */}
            {currentEvents.length > 0 && (
              <Option disabled key="current-header" value="current-header">
                <Text strong style={{ color: '#69b1ff', textDecoration: 'underline' }}>Current Events</Text>
              </Option>
            )}
            {currentEvents.map((event: Event) => (
              <Option key={event.id} value={event.id}>
                <Space>
                  <span>{event.name}</span>
                  <Tag color={event.eventType?.color || '#1890ff'}>
                    {event.eventType?.name || 'Event'}
                  </Tag>
                  {event.hasExistingData && (
                    <InfoCircleOutlined 
                      style={{ color: '#ff4d4f' }} 
                      title="Data Already Stored"
                    />
                  )}
                </Space>
              </Option>
            ))}
            
            {/* Past Events */}
            {pastEvents.length > 0 && (
              <Option disabled key="past-header" value="past-header" style={{ marginTop: currentEvents.length > 0 ? '0px' : '0px' }}>
                <Text strong style={{ color: '#ffa940', textDecoration: 'underline' }}>Past Events</Text>
              </Option>
            )}
            {pastEvents.map((event: Event) => (
              <Option key={event.id} value={event.id}>
                <Space>
                  <span>{event.name}</span>
                  <Tag color={event.eventType?.color || '#1890ff'}>
                    {event.eventType?.name || 'Event'}
                  </Tag>
                  {event.hasExistingData && (
                    <InfoCircleOutlined 
                      style={{ color: '#ff4d4f' }} 
                      title="Data Already Stored"
                    />
                  )}
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
              color: '#ffffff',
              marginTop: 8
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={5} style={{ margin: 0, color: '#ffffff' }}>
                  {selectedEvent.name}
                </Title>
                <Tag color={selectedEvent.eventType?.color || '#1890ff'}>
                  {selectedEvent.eventType?.name}
                </Tag>
              </div>
              
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Space size="small">
                  <CalendarOutlined style={{ color: '#69b1ff' }} />
                  <Text style={{ color: '#e6f2ff', fontSize: '12px' }}>{formatDate(selectedEvent.startTime)}</Text>
                </Space>
                
                <Space size="small">
                  <EnvironmentOutlined style={{ color: '#69b1ff' }} />
                  <Text style={{ color: '#e6f2ff', fontSize: '12px' }}>{selectedEvent.venue}</Text>
                </Space>
                
                {selectedEvent.oppositionTeam && (
                  <Space size="small">
                    <TeamOutlined style={{ color: '#69b1ff' }} />
                    <Text style={{ color: '#e6f2ff', fontSize: '12px' }}>vs {selectedEvent.oppositionTeam}</Text>
                  </Space>
                )}
              </div>
              
              {selectedEvent.description && (
                <Text style={{ color: '#dbeafe', fontSize: '12px' }}>{selectedEvent.description}</Text>
              )}
            </Space>
          </Card>
        )}

        {/* No Events Message */}
        {!isLoading && events.length === 0 && (
          <Alert
            message={isOfflineMode ? "No cached events available" : "No events found"}
            description={isOfflineMode 
              ? "You're offline and no events are cached. Connect to the internet to load events, or create a new event when online."
              : "Create your first event to start tracking stats."
            }
            type={isOfflineMode ? "warning" : "info"}
            showIcon
            action={
              !isOfflineMode && (
                <Button size="small" type="primary" onClick={handleCreateEvent}>
                  Create Event
                </Button>
              )
            }
          />
        )}
      </Space>

      {/* Resume/Start Over Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            <span style={{ color: '#ffffff' }}>Event Has Existing Data</span>
          </Space>
        }
        open={showResumeModal}
        onCancel={handleCancelResume}
        footer={
          <div style={{ paddingTop: '4px' }}>
            <Space>
              <Button key="cancel" onClick={handleCancelResume} style={{ 
                backgroundColor: '#1f2937', 
                borderColor: '#374151', 
                color: '#ffffff' 
              }}>
                Cancel
              </Button>
              <Button key="startOver" danger onClick={handleStartOver} style={{
                backgroundColor: '#dc2626',
                borderColor: '#dc2626',
                color: '#ffffff'
              }}>
                Start Over
              </Button>
              <Button key="resume" type="primary" onClick={handleResumeGame} style={{
                backgroundColor: '#1890ff',
                borderColor: '#1890ff',
                color: '#ffffff'
              }}>
                Resume
              </Button>
            </Space>
          </div>
        }
        width={500}
        styles={{
          content: {
            backgroundColor: '#0f2e52',
            color: '#ffffff'
          },
          header: {
            backgroundColor: '#0f2e52',
            borderBottom: '1px solid #295a8f'
          },
          footer: {
            backgroundColor: '#0f2e52',
            borderTop: '1px solid #295a8f'
          }
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text style={{ color: '#e6f2ff', fontSize: '14px' }}>
            This event already has game data stored. What would you like to do?
          </Text>
          
          <Card size="small" style={{ 
            backgroundColor: '#1e3a8a', 
            border: '1px solid #3b82f6',
            borderRadius: '8px'
          }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong style={{ color: '#60a5fa', fontSize: '14px' }}>
                <TrophyOutlined style={{ marginRight: 8, color: '#fbbf24' }} />
                Resume Game
              </Text>
              <Text style={{ color: '#bfdbfe', fontSize: '12px' }}>
                Continue tracking from where you left off. All existing data will be preserved.
              </Text>
            </Space>
          </Card>
          
          <Card size="small" style={{ 
            backgroundColor: '#7f1d1d', 
            border: '1px solid #dc2626',
            borderRadius: '8px'
          }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong style={{ color: '#fca5a5', fontSize: '14px' }}>
                <ExclamationCircleOutlined style={{ marginRight: 8, color: '#f87171' }} />
                Start Over
              </Text>
              <Text style={{ color: '#fecaca', fontSize: '12px' }}>
                ⚠️ This will reset and delete all existing statistics for this event. This action cannot be undone.
              </Text>
            </Space>
          </Card>
        </Space>
      </Modal>
    </Card>
  );
};

// Helper function for SWR with authentication
const fetcher = async (url: string) => {
  try {
    // Import supabase client
    const { supabase } = await import('@/lib/supabase');
    
    // Get authentication token
    const { data: { session } } = await supabase.auth.getSession();
    const authHeaders: HeadersInit = session?.access_token ? {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(url, {
      headers: authHeaders
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Fetcher error:', error);
    throw error;
  }
};

export default EventSelector;
