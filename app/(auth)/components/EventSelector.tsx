'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Select, Typography, Space, Button, Tag, Alert, Modal } from 'antd';
import { CalendarOutlined, TeamOutlined, EnvironmentOutlined, UserOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

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
}

const EventSelector: React.FC<EventSelectorProps> = ({ 
  onEventSelect, 
  selectedEventId, 
  showTitle = true
}) => {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<number | null>(null);
  const { isOnline, isReconnecting } = useNetworkStatus();
  
  // Fetch events with offline fallback
  const { data: eventsResponse, error, isLoading } = useSWR(
    isOnline ? '/api/events' : null, // Only fetch when online
    createFetcher(isOnline),
    {
      // Don't retry when offline or auth failed
      shouldRetryOnError: (error) => {
        return !error.message.includes('OFFLINE') && 
               !error.message.includes('NO_SESSION') && 
               !error.message.includes('AUTH_FAILED');
      },
      // Reduce retry attempts for network errors
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      // Don't revalidate when offline
      revalidateOnFocus: isOnline,
      revalidateOnReconnect: true,
      // Keep data when going offline
      keepPreviousData: true
    }
  );
  
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
        
        // If no events from API (offline or error), try offline cache
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
        }
        
        setAllEvents(events);
      } catch (error) {
        console.error('❌ Failed to load events:', error);
        // Try to load from cache even if there's an error
        try {
          const { offlineStorage } = await import('../../../src/services/offline-storage');
          const cachedEvents = offlineStorage.getEventsCache();
          if (cachedEvents && Array.isArray(cachedEvents)) {
            console.log('📱 Fallback: Using cached events after error');
            setAllEvents(cachedEvents);
            setIsOfflineMode(true);
            return;
          }
        } catch (cacheError) {
          console.warn('⚠️ Failed to load events from cache after error:', cacheError);
        }
        setAllEvents([]);
      }
    };
    
    loadEvents();
  }, [eventsResponse, error, isOnline]);
  
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
    eventIds.length > 0 && isOnline ? '/api/events/check-data' : null,
    async (url) => {
      console.log('🔍 SWR: Fetching events data for IDs:', eventIds);
      
      // Get authentication token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if we have a valid session
      if (!session?.access_token) {
        console.log('🔐 No valid session, skipping events data check');
        throw new Error('NO_SESSION');
      }
      
      const authHeaders: HeadersInit = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ eventIds })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔐 Authentication failed for events data check');
          throw new Error('AUTH_FAILED');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('🔍 SWR: Events data response:', result);
      return result;
    },
    {
      // Don't retry when offline or auth failed
      shouldRetryOnError: (error) => {
        return !error.message.includes('OFFLINE') && 
               !error.message.includes('NO_SESSION') && 
               !error.message.includes('AUTH_FAILED');
      },
      // Reduce retry attempts for network errors
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      // Don't revalidate when offline
      revalidateOnFocus: isOnline,
      revalidateOnReconnect: true
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

  const handleContinue = useCallback(() => {
    if (pendingEventId) {
      // Just proceed with selecting the event - no resume functionality
      onEventSelect(pendingEventId);
    }
    setShowResumeModal(false);
    setPendingEventId(null);
  }, [pendingEventId, onEventSelect]);

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

  // Handle different error types - but don't block rendering for offline errors
  const isOfflineError = error?.message?.includes('OFFLINE');
  const isAuthError = error?.message?.includes('AUTH_FAILED') || error?.message?.includes('NO_SESSION');
  
  // Only show error alerts for non-offline errors
  if (error && !isOfflineError) {
    if (isAuthError) {
      return (
        <Alert
          message="Authentication Required"
          description="Please log in again to access your events."
          type="error"
          showIcon
          action={
            <Button size="small" type="primary" onClick={() => router.push('/login')}>
              Login
            </Button>
          }
        />
      );
    }
    
    return (
      <Alert
        message="Error loading events"
        description="Failed to load events. Please check your connection and try again."
        type="error"
        showIcon
        action={
          <Button size="small" onClick={() => window.location.reload()}>
            Retry
          </Button>
        }
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
            <Space>
              {isReconnecting && (
                <Tag color="blue" style={{ fontSize: '11px' }}>
                  🔄 Reconnecting...
                </Tag>
              )}
              {!isOnline && (
                <Tag color="orange" style={{ fontSize: '11px' }}>
                  📱 Offline Mode
                </Tag>
              )}
              {isOfflineMode && isOnline && (
                <Tag color="green" style={{ fontSize: '11px' }}>
                  💾 Cached Data
                </Tag>
              )}
            </Space>
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
              <Space>
                {isOfflineMode && (
                  <Button size="small" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                )}
                {!isOfflineMode && (
                  <Button size="small" type="primary" onClick={handleCreateEvent}>
                    Create Event
                  </Button>
                )}
              </Space>
            }
          />
        )}
      </Space>

      {/* Warning Modal - Data Already Exists */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            <span style={{ color: '#ffffff' }}>Data Already Collected</span>
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
              <Button key="continue" type="primary" onClick={handleContinue} style={{
                backgroundColor: '#1890ff',
                borderColor: '#1890ff',
                color: '#ffffff'
              }}>
                Continue
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
            This event already has game data stored.
          </Text>
          
          <Card size="small" style={{ 
            backgroundColor: '#1e3a8a', 
            border: '1px solid #3b82f6',
            borderRadius: '8px'
          }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong style={{ color: '#60a5fa', fontSize: '14px' }}>
                <InfoCircleOutlined style={{ marginRight: 8, color: '#60a5fa' }} />
                Important Notice
              </Text>
              <Text style={{ color: '#bfdbfe', fontSize: '12px' }}>
                Statistics for this event have already been collected and stored. Continuing will show the existing data.
              </Text>
            </Space>
          </Card>
        </Space>
      </Modal>
    </Card>
  );
};

// Helper function for SWR with authentication and offline handling
const createFetcher = (isOnline: boolean) => async (url: string) => {
  try {
    // Check if we're offline first
    if (!isOnline) {
      console.log('📱 Offline detected, skipping API call');
      throw new Error('OFFLINE');
    }

    // Import supabase client
    const { supabase } = await import('@/lib/supabase');
    
    // Get authentication token
    const { data: { session } } = await supabase.auth.getSession();
    
    // Check if we have a valid session
    if (!session?.access_token) {
      console.log('🔐 No valid session, skipping API call');
      throw new Error('NO_SESSION');
    }
    
    const authHeaders: HeadersInit = {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(url, {
      headers: authHeaders
    });
    
    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401) {
        console.log('🔐 Authentication failed, user may need to re-login');
        throw new Error('AUTH_FAILED');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Fetcher error:', error);
    throw error;
  }
};

export default EventSelector;
