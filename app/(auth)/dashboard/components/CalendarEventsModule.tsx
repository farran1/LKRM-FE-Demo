'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Flex, Typography, Select, Badge, Tag, Space, Tooltip, Avatar, Modal, Form, Input, Row, Col, DatePicker, TimePicker, Switch } from 'antd';
import { CalendarOutlined, LeftOutlined, RightOutlined, PlusOutlined, ClockCircleOutlined, EnvironmentOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import api from '@/services/api';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import moment from 'moment';
import TagSelector from '@/components/tag-selector';
import { convertDateTime } from '@/utils/app';
import { locations } from '@/utils/constants';
import EventDetailModal from './EventDetailModal';
import { safeMapData } from '@/utils/api-helpers';
import styles from './CalendarEventsModule.module.scss';
import NewEvent from '../../events/components/new-event';
import EditEvent from '../../events/components/edit-event';
import { useDashboardRefresh } from '@/contexts/DashboardRefreshContext';

const { Title, Text } = Typography;
const { Option } = Select;

interface Event {
  id: number;
  name: string;
  startTime: string;
  endTime?: string;
  location?: string;
  venue?: string;
  eventType: {
    id: number;
    name: string;
    color: string;
    txtColor: string;
  };
  oppositionTeam?: string;
  status?: string;
}

interface CalendarEventsModuleProps {
  // Add props if needed
}

export default function CalendarEventsModule() {
  const router = useRouter();
  const { refreshAll } = useDashboardRefresh();
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMonthViewVisible, setIsMonthViewVisible] = useState(false);
  const [monthViewDate, setMonthViewDate] = useState<Dayjs>(dayjs());
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const [eventTypes, setEventTypes] = useState<Array<{label: string, value: number}>>([]);
  const [eventFormLoading, setEventFormLoading] = useState(false);
  const [eventForm] = Form.useForm();
  const [isEventDetailModalVisible, setIsEventDetailModalVisible] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<Event | null>(null);
  
  // Dynamic height state
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const maxHeight = 280; // Current fixed height
  
  // New Event Drawer state
  const [isNewEventDrawerVisible, setIsNewEventDrawerVisible] = useState(false);
  
  // Edit Event state
  const [isEditEventVisible, setIsEditEventVisible] = useState(false);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<Event | null>(null);
  
  // Fetch events using SWR like the existing events page
  const API_KEY = `/api/events?perPage=50`;
  const { data: eventsData, isLoading, error, mutate } = useSWR(API_KEY);

  useEffect(() => {
    if (eventsData?.data) {
      // Transform events to match expected interface
      const transformedEvents = eventsData.data.map((event: any) => ({
        ...event,
        eventType: event.event_types ? {
          id: event.event_types.id,
          name: event.event_types.name,
          color: event.event_types.color,
          txtColor: '#ffffff' // Default text color
        } : null
      }));
      setEvents(transformedEvents);
    }
  }, [eventsData]);

  // Debug logging for SWR state
  useEffect(() => {
    console.log('CalendarEventsModule - SWR State:', {
      isLoading,
      error,
      hasData: !!eventsData,
      dataLength: eventsData?.data?.length || 0
    });
  }, [isLoading, error, eventsData]);

  useEffect(() => {
    getEventTypes();
  }, []);

  // Measure content height for dynamic sizing
  useEffect(() => {
    if (containerRef) {
      const measureHeight = () => {
        const contentElement = containerRef.querySelector('[data-content="events-content"]');
        if (contentElement) {
          const height = contentElement.scrollHeight;
          setContentHeight(height);
        }
      };
      
      // Measure after events are loaded
      if (events.length > 0) {
        setTimeout(measureHeight, 100); // Small delay to ensure DOM is updated
      }
    }
  }, [events, containerRef]);

  async function getEventTypes() {
    setEventFormLoading(true);
    try {
      const res = await api.get('/api/eventTypes');
      const eventTypeOptions = safeMapData(
        res, 
        (item: any) => ({label: item.name, value: item.id}), 
        []
      );
      setEventTypes(eventTypeOptions);
    } catch (error) {
      console.error('Error fetching event types:', error);
      setEventTypes([]);
    }
    setEventFormLoading(false);
  }

  const handleEventModalClose = () => {
    setIsEventModalVisible(false);
    eventForm.resetFields();
  };

  const handleEventDetailModalClose = () => {
    setIsEventDetailModalVisible(false);
    setSelectedEventForDetail(null);
  };

  const handleEditEvent = () => {
    if (selectedEventForDetail) {
      setSelectedEventForEdit(selectedEventForDetail);
      setIsEditEventVisible(true);
      setIsEventDetailModalVisible(false);
    }
  };

  const handleEditEventClose = () => {
    setIsEditEventVisible(false);
    setSelectedEventForEdit(null);
  };

  const handleEventRefresh = () => {
    mutate(); // Refresh the events data
    refreshAll(); // Refresh all dashboard components
  };

  // New Event Drawer handlers
  const handleNewEventDrawerOpen = () => {
    setIsNewEventDrawerVisible(true);
  };

  const handleNewEventDrawerClose = () => {
    setIsNewEventDrawerVisible(false);
  };

  const handleNewEventRefresh = () => {
    mutate(); // Refresh events data
    refreshAll(); // Refresh all dashboard components
  };

  const handleEventClick = (event: Event) => {
    console.log('Event clicked:', event);
    setSelectedEventForDetail(event);
    setIsEventDetailModalVisible(true);
  };

  const handleEventSubmit = async (payload: any) => {
    const startTime = convertDateTime(payload.startDate, payload.startTime);
    let endTime = undefined;
    if (payload.endDate && payload.endTime) {
      endTime = convertDateTime(payload.endDate, payload.endTime);
    }

    delete payload.startDate;
    delete payload.endDate;
    payload.startTime = startTime;
    payload.endTime = endTime;

    setEventFormLoading(true);
    try {
      const res = await api.post('/api/events', payload);
      setIsEventModalVisible(false);
      eventForm.resetFields();
      mutate(); // Refresh events data
    } catch (error) {
      console.error('Error creating event:', error);
    }
    setEventFormLoading(false);
  };

  const eventTypeTitle = (
    <>
      <span>Event Type</span>
      <PlusOutlined style={{ marginLeft: '8px', cursor: 'pointer' }} />
    </>
  );

  const getEventTypeColor = (eventType: any) => {
    return eventType?.color || '#1890ff';
  };

  const getEventTypeTextColor = (eventType: any) => {
    return eventType?.txtColor || '#ffffff';
  };

  const getEventTypeLabel = (eventType: any) => {
    return eventType?.name || 'Event';
  };

  const getEventIcon = (eventType: any) => {
    // Return different icons based on event type
    const typeName = eventType?.name?.toLowerCase() || '';
    if (typeName.includes('game') || typeName.includes('match')) {
      return '🏈';
    } else if (typeName.includes('practice')) {
      return '⚽';
    } else if (typeName.includes('meeting')) {
      return '📋';
    } else {
      return '📅';
    }
  };

  const getEventsForDate = (date: Dayjs) => {
    if (!Array.isArray(events)) return []
    const dateStr = date.format('YYYY-MM-DD')
    
    const eventsForDate: any[] = []
    
    events.forEach((entry: any) => {
      if (!entry.startTime) return
      
      const eventDate = dayjs(entry.startTime).format('YYYY-MM-DD')
      
      // Check if this is a repeating event
      if (entry.isRepeat && entry.occurence > 0) {
        // Generate recurring instances
        const startDate = dayjs(entry.startTime)
        const occurrences = entry.occurence || 1
        
        // Use the stored repeatType from the database, fallback to smart detection
        let repeatType = entry.repeatType || 'weekly' // Use stored repeatType, default to weekly
        
        // Fallback to smart detection if repeatType is not available
        if (!entry.repeatType) {
          // Special case: If event name contains "daily" or "practice", assume daily
          if (entry.name.toLowerCase().includes('daily') || 
              entry.name.toLowerCase().includes('practice') ||
              entry.name.toLowerCase().includes('training')) {
            repeatType = 'daily'
          }
          // If occurrence is very high (like 30+), it's likely daily
          else if (occurrences >= 30) {
            repeatType = 'daily'
          }
          // If occurrence is moderate (like 12-24), it's likely monthly  
          else if (occurrences >= 12 && occurrences <= 24) {
            repeatType = 'monthly'
          }
          // If occurrence is very low (like 1-2), it's likely yearly
          else if (occurrences <= 2) {
            repeatType = 'yearly'
          }
          // For events with 3-6 occurrences, be more aggressive about daily detection
          else if (occurrences >= 3 && occurrences <= 6) {
            const startDate = dayjs(entry.startTime)
            const daysSinceStart = dayjs().diff(startDate, 'day')
            
            // If it's a recent event (within 2 weeks) with multiple occurrences, assume daily
            if (daysSinceStart <= 14) {
              repeatType = 'daily'
            } 
            // If it's an older event but has many occurrences relative to time span, assume daily
            else if (occurrences >= 5) {
              repeatType = 'daily'
            } 
            // Otherwise assume weekly
            else {
              repeatType = 'weekly'
            }
          }
          // Default to weekly for other cases
          else {
            repeatType = 'weekly'
          }
        }
        
        // Handle different repeat types
        if (repeatType === 'weekly' && entry.daysOfWeek && Array.isArray(entry.daysOfWeek) && entry.daysOfWeek.length > 0) {
          // Weekly with specific days of the week
          const daysOfWeek = entry.daysOfWeek.map((d: any) => parseInt(d))
          const startOfWeek = startDate.startOf('week')
          
          // Generate instances for each selected day of the week, respecting occurrence limits
          let occurrenceCount = 0
          let weekOffset = 0
          
          while (occurrenceCount < occurrences) {
            for (const dayOfWeek of daysOfWeek) {
              if (occurrenceCount >= occurrences) break
              
              const recurringDate = startOfWeek.add(weekOffset, 'week').add(dayOfWeek, 'day')
              
              // Check if this occurrence is within the end date (if specified)
              if (entry.endDate && recurringDate.isAfter(dayjs(entry.endDate), 'day')) {
                break
              }
              
              if (recurringDate.format('YYYY-MM-DD') === dateStr) {
                eventsForDate.push({
                  ...entry,
                  id: `${entry.id}-${weekOffset}-${dayOfWeek}`, // Unique ID for each occurrence
                  startTime: recurringDate.toISOString(),
                  isRecurringInstance: true,
                  originalEventId: entry.id,
                  occurrenceNumber: occurrenceCount + 1
                })
              }
              
              occurrenceCount++
            }
            weekOffset++
          }
        } else {
          // Regular repeating (daily, monthly, yearly, or weekly without specific days)
          for (let i = 0; i < occurrences; i++) {
            let recurringDate: Dayjs
            
            switch (repeatType) {
              case 'daily':
                recurringDate = startDate.add(i, 'day')
                break
              case 'weekly':
                recurringDate = startDate.add(i, 'week')
                break
              case 'monthly':
                recurringDate = startDate.add(i, 'month')
                break
              case 'yearly':
                recurringDate = startDate.add(i, 'year')
                break
              default:
                recurringDate = startDate.add(i, 'week') // Default to weekly
            }
            
            // Check if this occurrence is within the end date (if specified)
            if (entry.endDate && recurringDate.isAfter(dayjs(entry.endDate), 'day')) {
              break
            }
            
            if (recurringDate.format('YYYY-MM-DD') === dateStr) {
              eventsForDate.push({
                ...entry,
                id: `${entry.id}-${i}`, // Unique ID for each occurrence
                startTime: recurringDate.toISOString(),
                isRecurringInstance: true,
                originalEventId: entry.id,
                occurrenceNumber: i + 1
              })
            }
          }
        }
      } else {
        // Non-repeating event - check exact date match
        if (eventDate === dateStr) {
          eventsForDate.push(entry)
        }
      }
    })
    
    return eventsForDate
  };

  const getUpcomingDays = () => {
    const days = [];
    const today = dayjs().startOf('day');
    
    // Generate next 3 days explicitly
    for (let i = 1; i <= 3; i++) {
      const futureDate = today.add(i, 'day');
      days.push(futureDate);
    }
    
    return days;
  };

  const formatTimeRange = (startTime: string, endTime?: string) => {
    const start = moment(startTime).format('h:mm A');
    if (endTime) {
      const end = moment(endTime).format('h:mm A');
      return `${start} - ${end}`;
    }
    return start;
  };

  const renderActivityCard = (event: Event) => {
    const backgroundColor = getEventTypeColor(event.eventType);
    const textColor = getEventTypeTextColor(event.eventType);
    
    return (
      <div
        key={event.id}
        style={{
          background: backgroundColor,
          borderRadius: '26px',
          padding: '4px',
          marginBottom: '4px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease',
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleEventClick(event);
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <Flex align="center" gap="small">
          <Avatar
            size={32}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: textColor,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {getEventIcon(event.eventType)}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Text strong style={{ 
              fontSize: '12px', 
              color: textColor,
              display: 'block',
              marginBottom: '1px'
            }}>
              {event.name}
            </Text>
            <Flex align="center" gap="small" style={{ marginBottom: '0px' }}>
              <ClockCircleOutlined style={{ color: textColor, opacity: 0.8, fontSize: '10px' }} />
              <Text style={{ fontSize: '10px', color: textColor, opacity: 0.9 }}>
                {formatTimeRange(event.startTime, event.endTime)}
              </Text>
              {(event.location || event.venue) && (
                <>
                  <Text style={{ fontSize: '10px', color: textColor, opacity: 0.6, margin: '0 4px' }}>•</Text>
                  <EnvironmentOutlined style={{ color: textColor, opacity: 0.8, fontSize: '10px' }} />
                  <Text style={{ fontSize: '10px', color: textColor, opacity: 0.9 }}>
                    {event.location} {event.venue && `- ${event.venue}`}
                  </Text>
                </>
              )}
            </Flex>
          </div>
        </Flex>
      </div>
    );
  };

  const renderDaySection = (date: Dayjs, title: string, showAddButton = false) => {
    const dayEvents = getEventsForDate(date);
    const isToday = date.isSame(dayjs(), 'day');
    
    return (
      <div style={{ marginBottom: '8px' }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: '8px' }}>
          <div>
            <Text strong style={{ 
              fontSize: '16px', 
              color: '#ffffff',
              display: 'block'
            }}>
              {title}
            </Text>
            <Text style={{ 
              fontSize: '12px', 
              color: '#ffffff',
              opacity: 0.8
            }}>
              {date.format('dddd')} • {date.format('D MMMM')}
            </Text>
          </div>
          {showAddButton && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleNewEventDrawerOpen();
              }}
              style={{
                borderRadius: '16px',
                height: '28px',
                background: '#B58842',
                border: 'none',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 500,
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Add Event
            </Button>
          )}
        </Flex>
        
        {dayEvents.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '6px',
            textAlign: 'center',
            border: '1px dashed rgba(255,255,255,0.2)'
          }}>
            <Text style={{ color: '#ffffff', opacity: 0.6, fontSize: '12px' }}>
              No events
            </Text>
          </div>
        ) : (
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {dayEvents.map(renderActivityCard)}
          </div>
        )}
      </div>
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
      ? currentDate.subtract(1, 'month') 
      : currentDate.add(1, 'month');
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
      ? currentDate.subtract(1, 'week') 
      : currentDate.add(1, 'week');
    setCurrentDate(newDate);
  };

  const navigateMonthView = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
      ? monthViewDate.subtract(1, 'month') 
      : monthViewDate.add(1, 'month');
    setMonthViewDate(newDate);
  };

  const getUpcomingDayTitle = (date: Dayjs) => {
    const today = dayjs().startOf('day');
    const targetDate = date.startOf('day');
    const daysDiff = targetDate.diff(today, 'day');
    
    if (daysDiff === 1) return 'Tomorrow';
    if (daysDiff === 2) return 'Day After Tomorrow';
    if (daysDiff === 3) return 'In 3 Days';
    
    // For dates further out, show the day name
    return date.format('dddd');
  };

  // Get the week containing the current date
  const getCurrentWeek = () => {
    const weekStart = currentDate.startOf('week');
    return Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));
  };

  // Get the week range for display
  const getWeekRange = () => {
    const weekStart = currentDate.startOf('week');
    const weekEnd = currentDate.endOf('week');
    return `${weekStart.format('MMM D')} - ${weekEnd.format('MMM D, YYYY')}`;
  };

  // Get all days for month view
  const getMonthDays = () => {
    const monthStart = monthViewDate.startOf('month');
    const monthEnd = monthViewDate.endOf('month');
    
    // Get the first day of the week that contains the first day of the month
    // This ensures we start from Sunday (0) of the week containing the month start
    const firstDayOfWeek = monthStart.day(); // 0 = Sunday, 1 = Monday, etc.
    const startDate = monthStart.subtract(firstDayOfWeek, 'day');
    
    // Get the last day of the week that contains the last day of the month
    const lastDayOfWeek = monthEnd.day();
    const daysToAdd = 6 - lastDayOfWeek; // 6 = Saturday
    const endDate = monthEnd.add(daysToAdd, 'day');
    
    const days = [];
    let day = startDate;
    while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
      days.push(day);
      day = day.add(1, 'day');
    }
    return days;
  };

  const handleMonthHeaderClick = () => {
    setMonthViewDate(currentDate);
    setIsMonthViewVisible(!isMonthViewVisible);
  };

  const handleMonthDayClick = (day: Dayjs) => {
    setCurrentDate(day);
    setIsMonthViewVisible(false);
  };

  const renderMonthCalendar = () => {
    const days = getMonthDays();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div style={{ 
        padding: '16px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        marginTop: '4px'
      }}>
        {/* Month Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <Button
            icon={<LeftOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              navigateMonthView('prev');
            }}
            style={{
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff'
            }}
          />
          <Text strong style={{ 
            fontSize: '16px',
            color: '#ffffff'
          }}>
            {monthViewDate.format('MMMM YYYY')}
          </Text>
          <Button
            icon={<RightOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              navigateMonthView('next');
            }}
            style={{
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff'
            }}
          />
        </div>

        {/* Day Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '3px',
          marginBottom: '6px'
        }}>
          {weekDays.map(dayName => (
            <div key={dayName} style={{
              padding: '6px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.8)',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '4px'
            }}>
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '3px'
        }}>
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isToday = day.isSame(dayjs(), 'day');
            const isCurrentMonth = day.isSame(monthViewDate, 'month');
            const isSelected = day.isSame(currentDate, 'day');
            
            return (
              <div
                key={index}
                style={{
                  padding: '6px 3px',
                  border: isSelected ? '2px solid #1890ff' : '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  background: isSelected ? 'rgba(24, 144, 255, 0.3)' : 'rgba(255,255,255,0.05)',
                  minHeight: '48px',
                  textAlign: 'center',
                  opacity: isCurrentMonth ? 1 : 0.4,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMonthDayClick(day);
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = isSelected ? 'rgba(24, 144, 255, 0.3)' : 'rgba(255,255,255,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = isSelected ? 'rgba(24, 144, 255, 0.3)' : 'rgba(255,255,255,0.05)';
                  }
                }}
              >
                <div style={{
                  fontSize: '12px',
                  color: isToday ? '#1890ff' : (isCurrentMonth ? '#ffffff' : 'rgba(255,255,255,0.5)'),
                  fontWeight: isToday ? 600 : 400,
                  marginBottom: '2px'
                }}>
                  {day.format('D')}
                </div>
                {dayEvents.length > 0 && (
                  <div style={{
                    width: '4px',
                    height: '4px',
                    background: '#1890ff',
                    borderRadius: '50%',
                    margin: '0 auto',
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          background: '#17375c',
          borderRadius: '12px',
          padding: '20px',
          cursor: 'pointer',
          position: 'relative',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '400px',
          maxHeight: '600px'
        }}
        onClick={() => router.push('/events')}
      >
        {/* Header with Month Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CalendarOutlined style={{ fontSize: '20px', color: '#ffffff' }} />
            <h2 
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleMonthHeaderClick();
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              {currentDate.format('MMMM YYYY')}
              {isMonthViewVisible ? <UpOutlined /> : <DownOutlined />}
            </h2>
          </div>
          <Flex gap="small">
            <Button
              icon={<LeftOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                navigateWeek('prev');
              }}
              style={{
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#ffffff'
              }}
            />
            <Button
              icon={<RightOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                navigateWeek('next');
              }}
              style={{
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#ffffff'
              }}
            />
          </Flex>
        </div>

        {/* Month Calendar View */}
        {isMonthViewVisible && renderMonthCalendar()}

        {/* Single Column Layout */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          height: 'calc(100% - 120px)',
          overflow: 'hidden'
        }}>
          {/* Week Navigation Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px',
            marginBottom: '12px',
            padding: '6px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            {getCurrentWeek().map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isToday = day.isSame(dayjs(), 'day');
              const isSelected = day.isSame(currentDate, 'day');
              
              return (
                <div
                  key={index}
                  style={{
                    textAlign: 'center',
                    padding: '4px 2px',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(24, 144, 255, 0.3)' : 'transparent',
                    border: isSelected ? '2px solid #1890ff' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: '0', // Allow shrinking
                    overflow: 'hidden' // Prevent text overflow
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentDate(day);
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{
                    fontSize: '9px',
                    color: isSelected ? '#1890ff' : '#ffffff',
                    opacity: 0.8,
                    marginBottom: '1px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {day.format('ddd')}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: isSelected ? '#1890ff' : '#ffffff',
                    marginBottom: '1px'
                  }}>
                    {day.format('D')}
                  </div>
                  {dayEvents.length > 0 && (
                    <div style={{
                      width: '3px',
                      height: '3px',
                      background: '#1890ff',
                      borderRadius: '50%',
                      margin: '0 auto',
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Today's Activities */}
          {renderDaySection(currentDate, "Today's Activities", true)}

          {/* Upcoming Events Section */}
          <div style={{ 
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '16px',
            marginBottom: '12px',
            position: 'relative'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <Text strong style={{ 
                fontSize: '16px', 
                color: '#ffffff',
                display: 'block',
                marginBottom: '4px'
              }}>
                Upcoming Events
              </Text>
              <Text style={{ 
                fontSize: '12px', 
                color: '#ffffff',
                opacity: 0.8,
                display: 'block',
                marginBottom: '8px'
              }}>
                Next few days
              </Text>
            </div>
            
            <div 
              ref={setContainerRef}
              className={styles.upcomingEventsScroll}
              style={{ 
                height: contentHeight > maxHeight ? `${maxHeight}px` : 'auto',
                maxHeight: `${maxHeight}px`,
                overflowY: contentHeight > maxHeight ? 'auto' : 'visible',
                overflowX: 'hidden',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                position: 'relative',
                scrollbarWidth: 'thin',
                msOverflowStyle: 'scrollbar',
                transition: 'height 0.3s ease-in-out'
              }}>
              {isLoading && !eventsData ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  color: '#ffffff',
                  opacity: 0.7
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '12px'
                  }}></div>
                  <div style={{
                    fontSize: '12px',
                    textAlign: 'center'
                  }}>
                    Loading events...
                  </div>
                </div>
              ) : error ? (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: '#ff4d4f',
                  opacity: 0.8,
                  fontSize: '12px'
                }}>
                  Error loading events
                </div>
              ) : (
                <div data-content="events-content" style={{ paddingBottom: '20px' }}>
                  {getUpcomingDays().map((date, index) => {
                    const dayEvents = getEventsForDate(date);
                    if (dayEvents.length === 0) return null;
                    
                    return (
                      <div key={index} style={{ marginBottom: '12px' }}>
                        <Text style={{ 
                          fontSize: '12px', 
                          color: '#ffffff',
                          opacity: 0.8,
                          display: 'block',
                          marginBottom: '6px',
                          fontWeight: '500'
                        }}>
                          {getUpcomingDayTitle(date)} • {date.format('D MMMM')}
                        </Text>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {dayEvents.map(renderActivityCard)}
                        </div>
                      </div>
                    );
                  })}
                  {getUpcomingDays().every(date => getEventsForDate(date).length === 0) && (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      color: '#ffffff',
                      opacity: 0.6,
                      fontSize: '12px'
                    }}>
                      No upcoming events
                    </div>
                  )}
                </div>
              )}
            </div>
           </div>
           

         </div>
       </div>

      {/* Event Creation Modal - COMMENTED OUT: We're using the NewEvent drawer instead of this popup modal for now */}
        
      {/* New Event Drawer - Using the existing NewEvent component instead of the popup modal */}
      <NewEvent
        isOpen={isNewEventDrawerVisible}
        showOpen={setIsNewEventDrawerVisible}
        onRefresh={handleNewEventRefresh}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        isShowModal={isEventDetailModalVisible}
        onClose={handleEventDetailModalClose}
        event={selectedEventForDetail}
        openEdit={handleEditEvent}
      />
      
      {/* Edit Event Drawer */}
      <EditEvent
        event={selectedEventForEdit}
        isOpen={isEditEventVisible}
        showOpen={setIsEditEventVisible}
        onRefresh={handleEventRefresh}
      />
    </>
  );
} 