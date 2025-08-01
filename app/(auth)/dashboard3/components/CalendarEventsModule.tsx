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

export default function CalendarEventsModule({}: CalendarEventsModuleProps) {
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMonthViewVisible, setIsMonthViewVisible] = useState(false);
  const [monthViewDate, setMonthViewDate] = useState<Dayjs>(dayjs());
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const [eventTypes, setEventTypes] = useState([]);
  const [eventFormLoading, setEventFormLoading] = useState(false);
  const [eventForm] = Form.useForm();
  const [isEventDetailModalVisible, setIsEventDetailModalVisible] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<Event | null>(null);
  const router = useRouter();

  // Fetch events using SWR like the existing events page
  const API_KEY = `/api/events?perPage=50`;
  const { data: eventsData, isLoading, mutate } = useSWR(API_KEY);

  useEffect(() => {
    if (eventsData?.data) {
      setEvents(eventsData.data);
    }
  }, [eventsData]);

  useEffect(() => {
    getEventTypes();
  }, []);

  async function getEventTypes() {
    setEventFormLoading(true);
    const res = await api.get('/api/eventTypes');
    if (res?.data?.data.length > 0) {
      const types = res?.data?.data.map((item: any) => ({label: item.name, value: item.id}));
      setEventTypes(types);
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
    return events.filter(event => 
      dayjs(event.startTime).isSame(date, 'day')
    );
  };

  const getUpcomingDays = () => {
    const days = [];
    const today = dayjs();
    for (let i = 1; i <= 3; i++) {
      days.push(today.add(i, 'day'));
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
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setIsEventModalVisible(true);
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
    const daysDiff = date.diff(dayjs(), 'day');
    if (daysDiff === 1) return 'Tomorrow';
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
            size="small"
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
            size="small"
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
              size="small"
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
              size="small"
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
            marginBottom: '12px'
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
                opacity: 0.8
              }}>
                Next few days
              </Text>
            </div>
            
                         <div style={{ 
               flex: 1,
               overflowY: 'auto',
               minHeight: 0
             }}>
               {getUpcomingDays().map((date, index) => {
                 const dayEvents = getEventsForDate(date);
                 if (dayEvents.length === 0) return null;
                 
                 return (
                   <div key={index} style={{ marginBottom: '8px' }}>
                     <Text style={{ 
                       fontSize: '12px', 
                       color: '#ffffff',
                       opacity: 0.8,
                       display: 'block',
                       marginBottom: '4px'
                     }}>
                       {getUpcomingDayTitle(date)} • {date.format('D MMMM')}
                     </Text>
                     {dayEvents.map(renderActivityCard)}
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
           </div>
           

         </div>
       </div>

      {/* Event Creation Modal */}
      <Modal
        title="Create New Event"
        open={isEventModalVisible}
        onCancel={handleEventModalClose}
        footer={null}
        width={1000}
        destroyOnHidden
        styles={{
          content: {
            backgroundColor: '#17375c',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            marginTop: '-10vh',
            transform: 'translateY(-20px)'
          },
          body: {
            padding: '24px',
            backgroundColor: '#17375c'
          },
          header: {
            backgroundColor: '#17375c',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            color: '#ffffff',
            padding: '2px 24px 4px 24px'
          }
        }}
      >
        <Form
          layout="vertical"
          onFinish={handleEventSubmit}
          form={eventForm}
          initialValues={{ isRepeat: false }}
        >
          <Row gutter={24}>
            {/* Left Column */}
            <Col xs={24} lg={12}>
              {/* Basic Information Section */}
              <div style={{ marginBottom: '4px' }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 600, 
                  marginBottom: '4px', 
                  color: '#ffffff',
                  borderBottom: '2px solid rgba(255,255,255,0.2)',
                  paddingBottom: '4px'
                }}>
                  Basic Information
                </div>
                
                <Form.Item name="name" rules={[{ required: true, max: 255 }]} label="Event Name" style={{ marginBottom: '4px' }}>
                  <Input 
                    placeholder="Enter Event Name" 
                    size="middle" 
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff'
                    }}
                  />
                </Form.Item>
                
                <Form.Item name="eventTypeId" rules={[{ required: true, message: 'Please select Event type' }]} label="Event Type" style={{ marginBottom: 0 }}>
                  <TagSelector options={eventTypes} />
                </Form.Item>
              </div>

              {/* Date & Time Section */}
              <div style={{ marginBottom: '4px' }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 600, 
                  marginBottom: '4px', 
                  color: '#ffffff',
                  borderBottom: '2px solid rgba(255,255,255,0.2)',
                  paddingBottom: '4px'
                }}>
                  Date & Time
                </div>
                
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item label="Start Date" name="startDate" rules={[{ required: true, message: 'Please select the start date' }]} style={{ marginBottom: '4px' }}>
                      <DatePicker 
                        placeholder="Start date" 
                        style={{ 
                          width: '100%',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#ffffff'
                        }} 
                        size="middle"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Start Time" name="startTime" rules={[{ required: true, message: 'Please select the start time' }]} style={{ marginBottom: '4px' }}>
                      <TimePicker 
                        placeholder="Start time" 
                        style={{ 
                          width: '100%',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#ffffff'
                        }} 
                        showSecond={false} 
                        use12Hours 
                        size="middle"
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item label="End Date" name="endDate" style={{ marginBottom: '4px' }}>
                      <DatePicker 
                        placeholder="End date" 
                        style={{ 
                          width: '100%',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#ffffff'
                        }} 
                        size="middle"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="End Time" name="endTime" style={{ marginBottom: '4px' }}>
                      <TimePicker 
                        placeholder="End time" 
                        style={{ 
                          width: '100%',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#ffffff'
                        }} 
                        showSecond={false} 
                        use12Hours 
                        size="middle"
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item label="Repeats?" name="isRepeat" style={{ marginBottom: 0 }}>
                      <Select 
                        size="middle"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#ffffff'
                        }}
                      >
                        <Select.Option value={false}>Does not Repeat</Select.Option>
                        <Select.Option value={true}>Repeat</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Occurrences" name="occurence" style={{ marginBottom: 0 }}>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        size="middle"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#ffffff'
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            </Col>

            {/* Right Column */}
            <Col xs={24} lg={12}>
              {/* Location Section */}
              <div style={{ marginBottom: '4px' }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 600, 
                  marginBottom: '4px', 
                  color: '#ffffff',
                  borderBottom: '2px solid rgba(255,255,255,0.2)',
                  paddingBottom: '6px'
                }}>
                  Location Details
                </div>
                
                <Form.Item name="location" rules={[{ required: true, message: 'Please select location' }]} label="Location" style={{ marginBottom: '4px' }}>
                  <TagSelector options={locations} />
                </Form.Item>
                
                <Form.Item name="venue" rules={[{ required: true, max: 255, message: 'Please enter venue name' }]} label="Venue Name" style={{ marginBottom: 0 }}>
                  <Input 
                    placeholder="Enter venue name" 
                    size="middle"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff'
                    }}
                  />
                </Form.Item>
              </div>

              {/* Team & Notifications Section */}
              <div style={{ marginBottom: '4px' }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 600, 
                  marginBottom: '4px', 
                  color: '#ffffff',
                  borderBottom: '2px solid rgba(255,255,255,0.2)',
                  paddingBottom: '6px'
                }}>
                  Team & Notifications
                </div>
                
                <Form.Item name="members" label="Team Members" style={{ marginBottom: '4px' }}>
                  <Input 
                    placeholder="Add team member" 
                    size="middle"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff'
                    }}
                  />
                </Form.Item>
                
                <Flex align="center" justify="space-between" style={{ marginBottom: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#ffffff' }}>Notify Team?</div>
                  <Form.Item name="isNotice" style={{ margin: 0 }}>
                    <Switch />
                  </Form.Item>
                </Flex>

                <Form.Item name="oppositionTeam" label="Opposition Team" style={{ marginBottom: 0 }}>
                  <Input 
                    placeholder="Add Opposition Team" 
                    size="middle"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff'
                    }}
                  />
                </Form.Item>
              </div>
            </Col>
          </Row>

          <Button 
            type="primary" 
            htmlType="submit" 
            block 
            size="middle"
            loading={eventFormLoading}
            style={{ 
              marginTop: '8px',
              height: '40px',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: '#B58842',
              borderColor: '#B58842'
            }}
          >
            Create Event
          </Button>
        </Form>
      </Modal>

      {/* Event Detail Modal */}
      <EventDetailModal
        isShowModal={isEventDetailModalVisible}
        onClose={handleEventDetailModalClose}
        event={selectedEventForDetail}
      />
    </>
  );
} 