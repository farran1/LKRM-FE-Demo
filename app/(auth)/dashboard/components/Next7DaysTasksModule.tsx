'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NewTask from '../../tasks/components/new-task';
import PriorityTasksModal from './PriorityTasksModal';
import { useDashboardRefresh } from '@/contexts/DashboardRefreshContext';
import api from '@/services/api';

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
  const { refreshAll } = useDashboardRefresh();
  const [isShowNewTask, setIsShowNewTask] = useState(false);
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<{
    name: string;
    id: number;
    color: string;
  } | null>(null);
  
  // Task counts for next 7 days
  const [taskCounts, setTaskCounts] = useState({
    high: 0,
    medium: 0,
    low: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch task counts for next 7 days
  useEffect(() => {
    fetchTaskCounts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTaskCounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate date range for next 7 days
      const today = new Date();
      const next7Days = new Date();
      next7Days.setDate(today.getDate() + 7);
      
      const startDate = today.toISOString().split('T')[0];
      const endDate = next7Days.toISOString().split('T')[0];
      
      console.log('Fetching tasks from', startDate, 'to', endDate);
      
      // Use API's built-in date filtering instead of fetching all tasks
      const response = await api.get(`/api/tasks?startDate=${startDate}&endDate=${endDate}&perPage=100`);
      
      if (response.status !== 200) {
        throw new Error('Failed to fetch tasks');
      }
      
      const payload = response.data as any;
      const taskArray = Array.isArray(payload?.data) ? payload.data : [];
      
      console.log('Tasks in next 7 days (from API):', taskArray.length);
      
      // Count tasks by priority
      const counts = {
        high: 0,
        medium: 0,
        low: 0
      };
      
      taskArray.forEach((task: any) => {
        // Map priority IDs to names based on actual database mapping:
        // priorityId: 1 = Low (weight: 1), priorityId: 2 = Medium (weight: 2), priorityId: 3 = High (weight: 3)
        if (task.priorityId === 1) counts.low++;
        else if (task.priorityId === 2) counts.medium++;
        else if (task.priorityId === 3) counts.high++;
      });
      
      console.log('Task counts for next 7 days:', counts);
      setTaskCounts(counts);
      
    } catch (err) {
      console.error('Error fetching task counts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load task counts');
    } finally {
      setLoading(false);
    }
  };

  // Handle priority button clicks - open modal with filtered tasks
  const handlePriorityClick = (priorityName: string) => {
    // Map display names to priority IDs and colors
    // priorityId: 1 = Low (weight: 1), priorityId: 2 = Medium (weight: 2), priorityId: 3 = High (weight: 3)
    const priorityMap: { [key: string]: { id: number; color: string } } = {
      'High Priority': { id: 3, color: '#ff464d' },
      'Medium Priority': { id: 2, color: '#d0d681' }, 
      'Low Priority': { id: 1, color: '#4db8ff' }
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

  // Handle module click (outside priority buttons and add button) - navigate to tasks page with next 7 days filter
  const handleModuleClick = (e: React.MouseEvent) => {
    // Only navigate if clicking on the module background, not on buttons
    if ((e.target as HTMLElement).closest('[data-priority-button]') || 
        (e.target as HTMLElement).closest('[data-add-button]')) {
      return;
    }
    
    // Calculate date range for next 7 days
    const today = new Date();
    const next7Days = new Date();
    next7Days.setDate(today.getDate() + 7);
    
    const startDate = today.toISOString().split('T')[0];
    const endDate = next7Days.toISOString().split('T')[0];
    
    // Navigate to tasks page with date filter
    router.push(`/tasks?startDate=${startDate}&endDate=${endDate}`);
  };

  // Handle add button click - open new task drawer
  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShowNewTask(true);
  };

  // Handle priority modal close
  const handlePriorityModalClose = () => {
    setIsPriorityModalOpen(false);
    setSelectedPriority(null);
  };

  const handleRefreshTask = () => {
    console.log('Task created, refreshing...');
    fetchTaskCounts(); // Refetch task counts when a new task is created
    refreshAll(); // Refresh all dashboard components
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
          width: '100%',
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
              Tasks - Next 7 Days
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

        {/* Error Display */}
        {error && (
          <div
            style={{
              color: '#ff6b6b',
              fontSize: '12px',
              textAlign: 'center',
              padding: '8px',
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(255, 107, 107, 0.3)'
            }}
          >
            {error}
          </div>
        )}

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
                {loading ? '...' : taskCounts.high}
              </div>
            </div>
          </div>

          {/* Medium Priority Card */}
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
              handlePriorityClick('Medium Priority');
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
                {loading ? '...' : taskCounts.medium}
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
                {loading ? '...' : taskCounts.low}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Task Drawer */}
      <NewTask 
        isOpen={isShowNewTask} 
        showOpen={setIsShowNewTask} 
        onRefresh={handleRefreshTask}
        defaultValues={{}}
      />

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