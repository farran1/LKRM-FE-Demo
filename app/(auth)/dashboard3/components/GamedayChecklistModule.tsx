'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GamedayStatusModal from './GamedayStatusModal';
import EventDetailModal from './EventDetailModal';
import TaskMentionInput from './TaskMentionInput';
import api from '@/services/api';

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

  const eventId = 1; // Eagles vs Hawks game event ID

  // Mock event details - structured like real event data
  const mockEventData = {
    id: 1,
    name: "Eagles vs Hawks",
    venue: "Lincoln High School Gymnasium",
    startTime: "2025-03-15T19:00:00Z",
    isRepeat: false,
    eventType: {
      name: "Game",
      color: "#4ecdc4",
      txtColor: "#ffffff"
    }
  };

  const eventDetails = {
    opponent: "vs Hawks",
    date: "Mar 15, 2025",
    time: "7:00 PM",
    location: "Lincoln High School Gymnasium"
  };

  // Fetch status counts for the specific event
  useEffect(() => {
    fetchStatusCounts();
  }, []);

  const fetchStatusCounts = async () => {
    try {
      // Fetch tasks for each status for this specific event
      const [todoRes, inProgressRes, doneRes] = await Promise.all([
        api.get(`/api/tasks?eventId=${eventId}&status=TODO`),
        api.get(`/api/tasks?eventId=${eventId}&status=IN_PROGRESS`),
        api.get(`/api/tasks?eventId=${eventId}&status=DONE`)
      ]);

      setStatusCounts({
        notStarted: todoRes?.data?.data?.length || 0,
        inProgress: inProgressRes?.data?.data?.length || 0,
        completed: doneRes?.data?.data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching status counts:', error);
      // Fallback to match new demo data structure
      setStatusCounts({
        notStarted: 2,  // 2 TODO tasks for event 1
        inProgress: 1,  // 1 IN_PROGRESS task for event 1
        completed: 12   // 12 DONE tasks for event 1
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

  // Handle module click (navigate to tasks)
  const handleModuleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-status-button]') || 
        (e.target as HTMLElement).closest('[data-add-button]') ||
        (e.target as HTMLElement).closest('[data-event-details]')) {
      return;
    }
    // Navigate to tasks filtered by this event
    router.push(`/tasks?eventId=${eventId}`);
  };

  // Handle add button click - open new task popup
  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShowNewTask(true);
  };

  // Handle task creation refresh - update status counts
  const handleRefreshTask = () => {
    fetchStatusCounts(); // Refresh the counts after task creation
  };

  // Handle task creation
  const handleTaskCreate = (task: {
    title: string;
    description: string;
    mentions: any[];
    assignedTo?: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: string;
    event?: string;
  }) => {
    console.log('New task created:', task);
    setIsShowNewTask(false);
    handleRefreshTask(); // Refresh the counts after task creation
    // Here you would typically save the task to your backend
    // For now, we'll just log it and close the modal
  };

  // Handle task creation cancel
  const handleTaskCancel = () => {
    setIsShowNewTask(false);
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
          width: sidebarCollapsed ? '100%' : '350px',
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
            Add Item
          </button>
        </div>

        {/* Event Details - Now Clickable */}
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
          onClose={handleStatusModalClose}
          statusName={selectedStatus.name}
          statusId={selectedStatus.id}
          statusColor={selectedStatus.color}
          eventId={eventId}
        />
      )}

      {/* Event Detail Modal */}
      <EventDetailModal
        isShowModal={isEventModalOpen}
        onClose={handleEventModalClose}
        event={mockEventData}
      />

      {/* New Task Popup */}
      {isShowNewTask && (
        <TaskMentionInput 
          onTaskCreate={handleTaskCreate}
          onCancel={handleTaskCancel}
        />
      )}
    </>
  );
} 