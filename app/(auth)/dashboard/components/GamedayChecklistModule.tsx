'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GamedayStatusModal from './GamedayStatusModal';
import EventDetailModal from './EventDetailModal';
import NewTask from '../../tasks/components/new-task';
import EditEvent from '../../events/components/edit-event';
import api from '@/services/api';
import { useDashboardRefresh } from '@/contexts/DashboardRefreshContext';

// SVG Icons for status buttons
const NotStartedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const InProgressIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CompletedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
  </svg>
);

// Add button icon
const AddIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#ffffff"/>
  </svg>
);

interface GamedayChecklistModuleProps {
  sidebarCollapsed?: boolean;
}

export default function GamedayChecklistModule({ sidebarCollapsed = false }: GamedayChecklistModuleProps) {
  const router = useRouter();
  const { refreshAll } = useDashboardRefresh();
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<{
    name: string;
    id: string;
    color: string;
  } | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isShowNewTask, setIsShowNewTask] = useState(false);
  const [statusCounts, setStatusCounts] = useState({
    notStarted: 0,
    inProgress: 0,
    completed: 0
  });

  const [eventId, setEventId] = useState<number | null>(null);

  // Fetch real event details from API
  const [eventData, setEventData] = useState<any>(null);
  const [eventLoading, setEventLoading] = useState(true);
  
  // Edit Event state
  const [isEditEventVisible, setIsEditEventVisible] = useState(false);

  // Fetch the next upcoming game event
  useEffect(() => {
    fetchNextGameEvent();
  }, []);

  const fetchNextGameEvent = async () => {
    try {
      setEventLoading(true);
      // Fetch the next upcoming game event (filter to Game and Scrimmage types only)
      // Only get events that are in the future (startTime > now)
      const nowIso = new Date().toISOString();
      console.log('Gameday Checklist - Fetching FUTURE Game/Scrimmage events from:', nowIso);
      
      // First, let's check what event types exist and their IDs
      const eventTypesRes = await api.get('/api/eventTypes');
      console.log('Gameday Checklist - Available event types:', eventTypesRes?.data);
      
      // Find Game and Scrimmage event type IDs dynamically
      const eventTypes = (eventTypesRes as any)?.data?.data || [];
      const gameType = eventTypes.find((et: any) => et.name.toLowerCase() === 'game');
      const scrimmageType = eventTypes.find((et: any) => et.name.toLowerCase() === 'scrimmage');
      
      console.log('Gameday Checklist - Game type:', gameType);
      console.log('Gameday Checklist - Scrimmage type:', scrimmageType);
      
      if (!gameType && !scrimmageType) {
        console.log('Gameday Checklist - No Game or Scrimmage event types found');
        setEventId(null);
        setEventData(null);
        return;
      }
      
      const gameScrimmageIds = [gameType?.id, scrimmageType?.id].filter(Boolean);
      console.log('Gameday Checklist - Using eventTypeIds:', gameScrimmageIds);
      
      // Fetch only future Game/Scrimmage events
      // We need to provide both startDate and endDate for the API filter to work
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1); // Look ahead 1 year
      const futureDateIso = futureDate.toISOString();
      
      console.log('Gameday Checklist - Date range:', { now: nowIso, future: futureDateIso });
      
      // Get more events to see the full list and ensure we get the most upcoming one
      const eventsRes = await api.get(`/api/events?eventTypeIds=${gameScrimmageIds.join(',')}&startDate=${encodeURIComponent(nowIso)}&endDate=${encodeURIComponent(futureDateIso)}&perPage=10&sortBy=startTime&sortOrder=asc`);
      const allEvents = (eventsRes?.data as any)?.data || [];
      
      console.log('Gameday Checklist - All future Game/Scrimmage events:', allEvents);
      
      // Filter out any events that might be in the past (client-side safety check)
      const now = new Date();
      const futureEvents = allEvents.filter((event: any) => {
        const eventTime = new Date(event.startTime);
        const isFuture = eventTime > now;
        console.log(`Gameday Checklist - Event "${event.name}" at ${event.startTime}: ${isFuture ? 'FUTURE' : 'PAST'}`);
        return isFuture;
      });
      
      console.log('Gameday Checklist - Client-side filtered future events:', futureEvents);
      
      if (futureEvents.length > 0) {
        // Sort by startTime to ensure we get the most upcoming one
        futureEvents.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        const nextGame = futureEvents[0];
        
        console.log('Gameday Checklist - Most upcoming game/scrimmage:', nextGame);
        console.log('Gameday Checklist - Event start time:', nextGame.startTime);
        console.log('Gameday Checklist - Time until event:', new Date(nextGame.startTime).getTime() - now.getTime(), 'ms');
        
        setEventId(nextGame.id);
        setEventData({
          id: nextGame.id,
          name: nextGame.name,
          venue: nextGame.venue,
          startTime: nextGame.startTime,
          isRepeat: nextGame.isRepeat || false,
          eventType: nextGame.eventType || nextGame.event_types || {
            name: nextGame.eventType?.name || nextGame.event_types?.name || "Game",
            color: nextGame.eventType?.color || nextGame.event_types?.color || "#4ecdc4",
            txtColor: nextGame.eventType?.txtColor || nextGame.event_types?.txtColor || "#ffffff"
          }
        });
      } else {
        // No upcoming games found
        console.log('Gameday Checklist - No upcoming Game or Scrimmage events found');
        setEventId(null);
        setEventData(null);
      }
    } catch (error) {
      console.error('Error fetching next game event:', error);
      setEventId(null);
      setEventData(null);
    } finally {
      setEventLoading(false);
    }
  };

  const eventDetails = eventData ? {
    opponent: eventData.name.includes(' vs ') ? `vs ${eventData.name.split(' vs ')[1]}` : eventData.name,
    date: new Date(eventData.startTime).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    time: new Date(eventData.startTime).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }),
    location: eventData.venue
  } : {
    opponent: "No Upcoming Games/Scrimmages",
    date: "TBD",
    time: "TBD",
    location: "TBD"
  };

  // Fetch status counts for the specific event
  useEffect(() => {
    if (eventId) {
      fetchStatusCounts();
    }
  }, [eventId]);

  const fetchStatusCounts = async () => {
    if (!eventId) return;
    
    console.log('Fetching status counts for eventId:', eventId);
    
    try {
      // Fetch tasks for each status for this specific event
      const [todoRes, inProgressRes, doneRes] = await Promise.all([
        api.get(`/api/tasks?eventId=${eventId}&status=TODO`),
        api.get(`/api/tasks?eventId=${eventId}&status=IN_PROGRESS`),
        api.get(`/api/tasks?eventId=${eventId}&status=DONE`)
      ]);

      console.log('Gameday task responses:', {
        todoRes: todoRes?.data,
        inProgressRes: inProgressRes?.data,
        doneRes: doneRes?.data
      });

      setStatusCounts({
        notStarted: (todoRes?.data as any)?.data?.length || 0,
        inProgress: (inProgressRes?.data as any)?.data?.length || 0,
        completed: (doneRes?.data as any)?.data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching status counts:', error);
      setStatusCounts({
        notStarted: 0,
        inProgress: 0,
        completed: 0
      });
    }
  };

  // Status data with real counts
  const statusData = [
    {
      id: 'not-started',
      label: 'Not Started',
      count: statusCounts.notStarted,
      color: '#ff6b6b',
      icon: <NotStartedIcon />
    },
    {
      id: 'in-progress', 
      label: 'In Progress',
      count: statusCounts.inProgress,
      color: '#ffd93d',
      icon: <InProgressIcon />
    },
    {
      id: 'completed',
      label: 'Completed',
      count: statusCounts.completed,
      color: '#4ecdc4',
      icon: <CompletedIcon />
    }
  ];


  // Handle status button clicks - open modal
  const handleStatusClick = (statusId: string, statusLabel: string, statusColor: string) => {
    setSelectedStatus({
      name: statusLabel,
      id: statusId,
      color: statusColor
    });
    setIsStatusModalOpen(true);
  };

  // Handle modal close
  const handleStatusModalClose = () => {
    setIsStatusModalOpen(false);
    setSelectedStatus(null);
  };

  // Handle event details click - open event modal
  const handleEventClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEventModalOpen(true);
  };

  // Handle event modal close
  const handleEventModalClose = () => {
    setIsEventModalOpen(false);
  };

  const handleEditEvent = () => {
    setIsEditEventVisible(true);
    setIsEventModalOpen(false);
  };

  const handleEditEventClose = () => {
    setIsEditEventVisible(false);
  };

  const handleEventRefresh = () => {
    fetchNextGameEvent(); // Refresh the event data
    refreshAll(); // Refresh all dashboard components
  };

  // Handle module click (navigate to tasks)
  const handleModuleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-status-button]') || 
        (e.target as HTMLElement).closest('[data-add-button]') ||
        (e.target as HTMLElement).closest('[data-event-details]')) {
      return;
    }
    // Navigate to tasks filtered by this event
    if (eventId) {
      router.push(`/tasks?eventId=${eventId}`);
    } else {
      router.push('/tasks');
    }
  };

  // Handle add button click - open new task popup
  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShowNewTask(true);
  };

  // Handle task creation refresh - update status counts
  const handleTaskRefresh = () => {
    console.log('Task created, refreshing gameday checklist...');
    fetchStatusCounts(); // Refresh the counts after task creation
    refreshAll(); // Refresh all dashboard components
  };

  return (
    <>
      <div
        style={{
          background: '#17375c', // Match sidebar/header color
          borderRadius: '16px',
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          width: '100%',
          height: '100%',
          minHeight: '280px', // Increased from 200px
          maxHeight: '320px', // Increased from 250px
          overflow: 'hidden',
          boxSizing: 'border-box',
          cursor: 'pointer'
        }}
        onClick={handleModuleClick}
      >
        {/* Header Section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            minHeight: '20px',
            width: '100%',
            flexShrink: 0
          }}
        >
          {/* Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              flexGrow: 1
            }}
          >
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '16px',
                lineHeight: '18px',
                color: '#ffffff',
                textAlign: 'left',
                whiteSpace: 'nowrap'
              }}
            >
              Gameday Checklist
            </div>
          </div>

          {/* Add Button */}
          <button
            data-add-button="true"
            onClick={handleAddClick}
            style={{
              background: 'rgba(181, 136, 66, 0.9)', // LKRM Orange with transparency
              border: 'none',
              borderRadius: '20px', // Pill shape
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: '#ffffff',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(181, 136, 66, 1)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(181, 136, 66, 0.9)';
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Add Task
          </button>
        </div>

        {/* Event Details - Now Clickable */}
        {eventLoading ? (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60px'
            }}
          >
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              Loading next game...
            </div>
          </div>
        ) : (
          <div
            data-event-details="true"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onClick={handleEventClick}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '16px',
                color: '#ffffff',
                marginBottom: '2px'
              }}
            >
              {eventDetails.opponent}
            </div>
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: '1.4',
                margin: 0,
                padding: 0
              }}
            >
              {eventDetails.date} • {eventDetails.time}
              <br />
              {eventDetails.location}
            </div>
          </div>
        )}

        {/* Status Buttons - Vertically Stacked */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '100%',
            flex: 1
          }}
        >
          {statusData.map((status) => (
            <div
              key={status.id}
              data-status-button="true"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                minHeight: '44px'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusClick(status.id, status.label, status.color);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${status.color}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              {/* Left side - Icon and Label */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: `${status.color}20`,
                    border: `1px solid ${status.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: status.color,
                    flexShrink: 0
                  }}
                >
                  {status.icon}
                </div>
                <div
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: '13px',
                    lineHeight: '16px',
                    color: '#ffffff'
                  }}
                >
                  {status.label}
                </div>
              </div>

              {/* Right side - Count */}
              <div
                style={{
                  minWidth: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: status.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#000000',
                  flexShrink: 0
                }}
              >
                {status.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Modal */}
      {selectedStatus && (
        <GamedayStatusModal
          isOpen={isStatusModalOpen}
          onCloseAction={handleStatusModalClose}
          statusName={selectedStatus.name}
          statusId={selectedStatus.id}
          statusColor={selectedStatus.color}
          eventId={eventId ?? undefined}
        />
      )}

      {/* Event Detail Modal */}
      <EventDetailModal
        isShowModal={isEventModalOpen}
        onClose={handleEventModalClose}
        event={eventData}
        openEdit={handleEditEvent}
      />

      {/* Edit Event Drawer */}
      <EditEvent
        event={eventData}
        isOpen={isEditEventVisible}
        showOpen={setIsEditEventVisible}
        onRefresh={handleEventRefresh}
      />

      {/* New Task Drawer */}
      <NewTask 
        isOpen={isShowNewTask} 
        showOpen={setIsShowNewTask} 
        onRefresh={handleTaskRefresh}
        defaultValues={{
          eventId: eventId ?? undefined // Pre-populate with the current event ID if available
        }}
      />
    </>
  );
} 