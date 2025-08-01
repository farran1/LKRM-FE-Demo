'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import NewTask from '../../tasks/components/new-task';
import PriorityTasksModal from './PriorityTasksModal';
import TaskMentionInput from './TaskMentionInput';

// SVG icon for the add button (from Figma assets)
const AddIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#ffffff"/>
  </svg>
);

interface Next7DaysTasksModuleProps {
  sidebarCollapsed?: boolean;
}

export default function Next7DaysTasksModule({ sidebarCollapsed = false }: Next7DaysTasksModuleProps) {
  const router = useRouter();
  const [isShowNewTask, setIsShowNewTask] = useState(false);
  const [isShowMentionTask, setIsShowMentionTask] = useState(false);
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<{
    name: string;
    id: number;
    color: string;
  } | null>(null);

  // Handle priority button clicks - open modal with filtered tasks
  const handlePriorityClick = (priorityName: string) => {
    // Map display names to priority IDs and colors
    const priorityMap: { [key: string]: { id: number; color: string } } = {
      'High Priority': { id: 1, color: '#ff464d' },
      'Med Priority': { id: 2, color: '#d0d681' }, 
      'Low Priority': { id: 3, color: '#4db8ff' }
    };
    
    const priority = priorityMap[priorityName];
    if (priority) {
      setSelectedPriority({
        name: priorityName,
        id: priority.id,
        color: priority.color
      });
      setIsPriorityModalOpen(true);
    }
  };

  // Handle module click (outside priority buttons and add button) - navigate to tasks page
  const handleModuleClick = (e: React.MouseEvent) => {
    // Only navigate if clicking on the module background, not on buttons
    if ((e.target as HTMLElement).closest('[data-priority-button]') || 
        (e.target as HTMLElement).closest('[data-add-button]')) {
      return;
    }
    router.push('/tasks');
  };

  // Handle add button click - open new task popup with mentions
  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShowMentionTask(true);
  };

  // Handle priority modal close
  const handlePriorityModalClose = () => {
    setIsPriorityModalOpen(false);
    setSelectedPriority(null);
  };

  const handleRefreshTask = () => {
    // You can add refresh logic here if needed
    console.log('Task created, refreshing...');
  };

  // Handle task creation with mentions
  const handleTaskCreate = (task: {
    title: string;
    description: string;
    mentions: any[];
    assignedTo?: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: string;
  }) => {
    console.log('New task created with mentions:', task);
    setIsShowMentionTask(false);
    // Here you would typically save the task to your backend
    // For now, we'll just log it and close the modal
  };

  // Handle task creation cancel
  const handleTaskCancel = () => {
    setIsShowMentionTask(false);
  };

  return (
    <>
      <div
        style={{
          background: '#17375c', // Updated to match sidebar and header
          borderRadius: '16px', // rounded-2xl
          padding: '20px 18px', // Reduced padding to fit better
          display: 'flex',
          flexDirection: 'column',
          gap: '12px', // Reduced gap for better fit
          width: sidebarCollapsed ? '100%' : '350px',
          height: '100%',
          minHeight: '120px', // Reduced min height
          maxHeight: '160px', // Added max height constraint
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
            gap: '12px', // Reduced gap
            minHeight: '20px', // Reduced height
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
                fontWeight: 600, // font-semibold
                fontSize: '16px', // Slightly reduced
                lineHeight: '18px', // Tighter line height
                color: '#ffffff',
                textAlign: 'left',
                whiteSpace: 'nowrap'
              }}
            >
              Team Tasks - Next 7 Days
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
              padding: '6px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
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

        {/* Priority Cards Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '6px', // Reduced gap
            width: '100%',
            alignItems: 'stretch',
            flex: 1 // Take remaining space
          }}
        >
          {/* High Priority Card */}
          <div
            data-priority-button="true"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 6px', // Reduced horizontal padding
              borderRadius: '8px', // Slightly smaller radius
              border: '1px solid #fdfdff',
              flex: 1, // Equal flex distribution
              minWidth: 0, // Allow shrinking
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePriorityClick('High Priority');
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 70, 77, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px', // Reduced gap
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%'
              }}
            >
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '18px',
                  lineHeight: '18px',
                  color: '#ff464d',
                  textAlign: 'center'
                }}
              >
                High
              </div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  textAlign: 'center'
                }}
              >
                Priority
              </div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700, // font-bold
                  fontSize: '20px', // Slightly reduced
                  lineHeight: '24px',
                  color: '#ff464d',
                  textAlign: 'center'
                }}
              >
                3
              </div>
            </div>
          </div>

          {/* Med Priority Card */}
          <div
            data-priority-button="true"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 6px', // Reduced horizontal padding
              borderRadius: '8px', // Slightly smaller radius
              border: '1px solid #fdfdff',
              flex: 1, // Equal flex distribution
              minWidth: 0, // Allow shrinking
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePriorityClick('Med Priority');
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(208, 214, 129, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px', // Reduced gap
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%'
              }}
            >
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '18px',
                  lineHeight: '18px',
                  color: '#d0d681',
                  textAlign: 'center'
                }}
              >
                Medium
              </div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  textAlign: 'center'
                }}
              >
                Priority
              </div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700, // font-bold
                  fontSize: '20px', // Slightly reduced
                  lineHeight: '24px',
                  color: '#d0d681',
                  textAlign: 'center'
                }}
              >
                5
              </div>
            </div>
          </div>

          {/* Low Priority Card */}
          <div
            data-priority-button="true"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 6px', // Reduced horizontal padding
              borderRadius: '8px', // Slightly smaller radius
              border: '1px solid #fdfdff',
              flex: 1, // Equal flex distribution
              minWidth: 0, // Allow shrinking
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePriorityClick('Low Priority');
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(77, 184, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px', // Reduced gap
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%'
              }}
            >
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '18px',
                  lineHeight: '18px',
                  color: '#4db8ff',
                  textAlign: 'center'
                }}
              >
                Low
              </div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  textAlign: 'center'
                }}
              >
                Priority
              </div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700, // font-bold
                  fontSize: '20px', // Slightly reduced
                  lineHeight: '24px',
                  color: '#4db8ff',
                  textAlign: 'center'
                }}
              >
                15
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Task Popup */}
      <NewTask 
        isOpen={isShowNewTask} 
        showOpen={setIsShowNewTask} 
        onRefresh={handleRefreshTask}
        defaultValues={{}}
      />

      {/* Task with Mentions Input */}
      {isShowMentionTask && (
        <TaskMentionInput
          onTaskCreate={handleTaskCreate}
          onCancel={handleTaskCancel}
        />
      )}

      {/* Priority Tasks Modal */}
      {selectedPriority && (
        <PriorityTasksModal
          isOpen={isPriorityModalOpen}
          onClose={handlePriorityModalClose}
          priorityName={selectedPriority.name}
          priorityId={selectedPriority.id}
          priorityColor={selectedPriority.color}
        />
      )}
    </>
  );
} 