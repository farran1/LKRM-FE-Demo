'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ActivityItem {
  id: string;
  type: 'player_note' | 'task_created' | 'event_updated' | 'goal_set' | 'stats_uploaded' | 'roster_change';
  user: {
    name: string;
    role: string;
    initials: string;
    avatar?: string;
  };
  action: string;
  target: string;
  timestamp: string;
  originalTimestamp: string; // Store the original timestamp for filtering
  details?: string;
  // Navigation properties
  entityId?: number; // ID of the related entity (task, event, player, etc.)
  entityType?: 'task' | 'event' | 'player'; // Type of entity for navigation
}

export default function RecentActivityModule() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate cutoff date (3 days ago or since last login)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      // Get user's last login time
      const { data: { user } } = await supabase.auth.getUser();
      let lastLoginTime = null;
      
      if (user?.last_sign_in_at) {
        lastLoginTime = new Date(user.last_sign_in_at);
      }
      
      // Use the more recent of last login or 3 days ago
      const cutoffDate = lastLoginTime && lastLoginTime > threeDaysAgo ? lastLoginTime : threeDaysAgo;
      
      console.log('Last login time:', lastLoginTime?.toLocaleDateString() || 'Not available');
      console.log('Three days ago:', threeDaysAgo.toLocaleDateString());
      console.log('Using cutoff date:', cutoffDate.toLocaleDateString());
      
      // Fetch recent activities from multiple sources
      const [tasksRes, eventsRes, playersRes] = await Promise.all([
        fetch('/api/tasks?perPage=50'),
        fetch('/api/events?perPage=50'),
        fetch('/api/players?perPage=10')
      ]);

      if (!tasksRes.ok || !eventsRes.ok || !playersRes.ok) {
        throw new Error('Failed to fetch recent activities');
      }

      const [tasksData, eventsData, playersData] = await Promise.all([
        tasksRes.json(),
        eventsRes.json(),
        playersRes.json()
      ]);

      console.log('Recent Activity - Tasks data:', tasksData);
      console.log('Recent Activity - Events data:', eventsData);
      console.log('Recent Activity - Players data:', playersData);

      // Transform data into activity items
      const transformedActivities: ActivityItem[] = [];
      
      // Add recent tasks
      const tasks = Array.isArray(tasksData) ? tasksData : (tasksData.data || []);
      if (tasks.length > 0) {
        console.log('Recent Activity - Task data structure:', tasks[0]);
        
        // Fetch user data from auth.users for tasks
        const taskUserIds = tasks.slice(0, 3).map((task: any) => {
          // Parse the createdBy JSON string to get user ID
          let createdByUser = null;
          try {
            createdByUser = typeof task.createdBy === 'string' ? JSON.parse(task.createdBy) : task.createdBy;
            return createdByUser?.id;
          } catch (e) {
            console.warn('Failed to parse createdBy:', task.createdBy);
            return null;
          }
        }).filter(Boolean);
        
        let taskUserMap = new Map();
        if (taskUserIds.length > 0) {
          try {
            const usersRes = await fetch(`/api/users?ids=${taskUserIds.join(',')}`);
            if (usersRes.ok) {
              const usersData = await usersRes.json();
              usersData.users.forEach((user: any) => {
                taskUserMap.set(user.id, {
                  name: user.name,
                  email: user.email,
                  username: user.username
                });
              });
            }
          } catch (error) {
            console.warn('Failed to fetch auth users for tasks:', error);
          }
        }
        
        tasks.slice(0, 3).forEach((task: any) => {
          // Skip tasks without valid IDs
          if (!task.userId && !task.id) {
            console.warn('Skipping task without valid ID:', task);
            return;
          }

          // Parse the createdBy JSON string to get user info
          let createdByUser = null as any;
          try {
            createdByUser = typeof task.createdBy === 'string' ? JSON.parse(task.createdBy) : task.createdBy;
          } catch (e) {
            console.warn('Failed to parse createdBy:', task.createdBy);
          }

          // Get user info from auth.users
          const userInfo = createdByUser?.id ? taskUserMap.get(createdByUser.id) : undefined;
          const userName = (createdByUser && createdByUser.name) || (userInfo && userInfo.name) || 'Unknown User';

          transformedActivities.push({
            id: `task-${task.userId || task.id || Math.random()}`,
            type: 'task_created',
            user: { 
              name: userName, 
              role: 'Member', 
              initials: userName.split(' ').map((n: string) => n && n[0]).join('') 
            },
            action: 'created a task',
            target: task.name || 'New Task',
            timestamp: formatTimestamp(task.createdAt),
            originalTimestamp: task.createdAt,
            details: task.description,
            entityId: task.userId || task.id,
            entityType: 'task'
          });
        });
      }

      // Add recent events
      const events = Array.isArray(eventsData) ? eventsData : (eventsData.data || []);
      if (events.length > 0) {
        // Fetch user data from auth.users for events
        const eventUserIds = events
          .slice(0, 3)
          .map((event: any) => {
            try {
              const createdByParsed = typeof event.createdBy === 'string' && event.createdBy.trim().startsWith('{')
                ? JSON.parse(event.createdBy)
                : event.createdBy;
              return createdByParsed && createdByParsed.id ? createdByParsed.id : event.createdBy;
            } catch {
              return event.createdBy;
            }
          })
          .filter(Boolean);
        let userMap = new Map();
        
        if (eventUserIds.length > 0) {
          try {
            const usersRes = await fetch(`/api/users?ids=${eventUserIds.join(',')}`);
            if (usersRes.ok) {
              const usersData = await usersRes.json();
              usersData.users.forEach((user: any) => {
                userMap.set(user.id, {
                  name: user.name,
                  email: user.email,
                  username: user.username
                });
              });
            }
          } catch (error) {
            console.warn('Failed to fetch auth users:', error);
          }
        }

        events.slice(0, 3).forEach((event: any) => {
          // Try to parse createdBy for name and id
          let createdByParsed: any = null;
          try {
            createdByParsed = typeof event.createdBy === 'string' && event.createdBy.trim().startsWith('{')
              ? JSON.parse(event.createdBy)
              : event.createdBy;
          } catch {}

          const userInfo = (createdByParsed && createdByParsed.id) ? userMap.get(createdByParsed.id) : userMap.get(event.createdBy);
          const userName = (createdByParsed && createdByParsed.name) || (userInfo && userInfo.name) || 'Unknown User';

          transformedActivities.push({
            id: `event-${event.id || Math.random()}`,
            type: 'event_updated',
            user: { 
              name: userName, 
              role: 'Member', 
              initials: userName.split(' ').map((n: string) => n && n[0]).join('') 
            },
            action: 'created event',
            target: event.name || 'New Event',
            timestamp: formatTimestamp(event.createdAt),
            originalTimestamp: event.createdAt,
            details: `${event.location} - ${event.venue}`,
            entityId: event.id,
            entityType: 'event'
          });
        });
      }

      // Add recent player activities (if available)
      const players = Array.isArray(playersData) ? playersData : (playersData.data || []);
      if (players.length > 0) {
        // Fetch user data from auth.users for player activities
        const playerUserIds = players.slice(0, 2).map((player: any) => player.user_id).filter(Boolean);
        let playerUserMap = new Map();
        
        if (playerUserIds.length > 0) {
          try {
            const usersRes = await fetch(`/api/users?ids=${playerUserIds.join(',')}`);
            if (usersRes.ok) {
              const usersData = await usersRes.json();
              usersData.users.forEach((user: any) => {
                playerUserMap.set(user.id, {
                  name: user.name,
                  email: user.email,
                  username: user.username
                });
              });
            }
          } catch (error) {
            console.warn('Failed to fetch auth users for players:', error);
          }
        }
        
        players.slice(0, 2).forEach((player: any) => {
          // Get user info from auth.users
          const userInfo = playerUserMap.get(player.user_id) || {
            name: 'Team Member',
            email: 'unknown@example.com'
          };
          const userName = userInfo.name;

          transformedActivities.push({
            id: `player-${player.id || Math.random()}`,
            type: 'roster_change',
            user: { 
              name: userName, 
              role: 'Team Member', 
              initials: userName.split(' ').map((n: string) => n[0]).join('') 
            },
            action: 'updated roster',
            target: player.name || `${player.first_name} ${player.last_name}`,
            timestamp: formatTimestamp(player.updatedAt || player.createdAt),
            originalTimestamp: player.updatedAt || player.createdAt,
            details: 'Player information updated',
            entityId: player.id,
            entityType: 'player'
          });
        });
      }

      // Filter activities by cutoff date (client-side filtering)
      const filteredActivities = transformedActivities.filter(activity => {
        if (!activity.originalTimestamp) return false;
        
        const activityDate = new Date(activity.originalTimestamp);
        return activityDate >= cutoffDate;
      });

      // Sort by original timestamp (most recent first)
      filteredActivities.sort((a, b) => new Date(b.originalTimestamp).getTime() - new Date(a.originalTimestamp).getTime());
      
      console.log(`Found ${filteredActivities.length} activities since ${cutoffDate.toLocaleDateString()}`);
      setActivities(filteredActivities);
    } catch (err) {
      console.error('Error fetching recent activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recent activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    console.log('formatTimestamp called with:', timestamp);
    if (!timestamp) return 'Unknown time';

    const now = new Date();
    const activityTime = new Date(timestamp);

    if (isNaN(activityTime.getTime())) {
      console.warn('Invalid timestamp:', timestamp);
      return 'Invalid Date';
    }

    const diffMs = now.getTime() - activityTime.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    // Older than a week: include time for clarity
    return activityTime.toLocaleString();
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'player_note':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C13.1 2 14 2.9 14 4V8L12 6L10 8V4C10 2.9 10.9 2 12 2Z" fill="#B58842"/>
            <path d="M21 5V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H8V9L10.5 7.5L13 9V3H19C20.1 3 21 3.9 21 5Z" fill="#B58842"/>
          </svg>
        );
      case 'task_created':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.89 20.1 3 19 3ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="#4ecdc4"/>
          </svg>
        );
      case 'event_updated':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19Z" fill="#1D75D0"/>
          </svg>
        );
      case 'goal_set':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="#FFD700"/>
          </svg>
        );
      case 'stats_uploaded':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 18H21V20H3V18ZM3 6V8H21V6H3ZM3 13H13V11H3V13ZM15 11V13H17V16L22 12L17 8V11H15Z" fill="#95E1D3"/>
          </svg>
        );
      case 'roster_change':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M16 4C18.2 4 20 5.8 20 8S18.2 12 16 12S12 10.2 12 8S13.8 4 16 4ZM16 14C20.42 14 24 15.79 24 18V20H8V18C8 15.79 11.58 14 16 14Z" fill="#FF6B6B"/>
            <path d="M12.51 8.16C12.83 9.24 13.66 10.08 14.73 10.43C13.3 10.79 12.14 11.55 11.29 12.64C9.16 12.04 8 10.75 8 8C8 5.25 9.16 3.96 11.29 3.36C12.14 4.45 13.3 5.21 14.73 5.57C13.66 5.92 12.83 6.76 12.51 7.84L12.51 8.16Z" fill="#FF6B6B"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#B58842"/>
          </svg>
        );
    }
  };

  const getUserAvatar = (user: ActivityItem['user']) => {
    return (
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1D75D0 0%, #4ecdc4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 600,
          color: '#ffffff',
          flexShrink: 0,
          border: '2px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {user.initials}
      </div>
    );
  };

  const handleModuleClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleActivityClick = (activity: ActivityItem) => {
    if (!activity.entityId || !activity.entityType) {
      console.warn('Activity missing entity information:', activity);
      return;
    }

    // Navigate to the appropriate page based on entity type
    switch (activity.entityType) {
      case 'task':
        router.push(`/tasks?id=${activity.entityId}`);
        break;
      case 'event':
        router.push(`/events/${activity.entityId}`);
        break;
      case 'player':
        router.push(`/players/${activity.entityId}`);
        break;
      default:
        console.warn('Unknown entity type:', activity.entityType);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          background: '#17375c',
          borderRadius: '16px',
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          height: '100%',
          minHeight: '320px',
          maxHeight: '400px',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#fff' }}>
          Loading recent activities...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: '#17375c',
          borderRadius: '16px',
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          height: '100%',
          minHeight: '320px',
          maxHeight: '400px',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#f5222d' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          background: '#17375c',
          borderRadius: '16px',
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          height: '100%',
          minHeight: '320px',
          maxHeight: '400px',
          overflow: 'hidden',
          boxSizing: 'border-box',
          cursor: 'pointer'
        }}
        onClick={handleModuleClick}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '20px',
            width: '100%',
            flexShrink: 0
          }}
        >
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '18px',
              color: '#ffffff',
              textAlign: 'left'
            }}
          >
            Recent Activity
          </div>

          {/* View All Button */}
          <button
            style={{
              background: 'rgba(181, 136, 66, 0.9)',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: '#ffffff',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(181, 136, 66, 1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(181, 136, 66, 0.9)';
            }}
          >
            View All
          </button>
        </div>

        {/* Activity Feed Preview */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflow: 'auto',
            flex: 1,
            scrollbarWidth: 'thin',
            scrollbarColor: '#1e425c #17375c',
            paddingRight: '8px'
          }}
        >
          {activities.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 0',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '14px'
            }}>
              No recent activities
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s ease',
                  cursor: activity.entityId && activity.entityType ? 'pointer' : 'default'
                }}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent module click
                  if (activity.entityId && activity.entityType) {
                    handleActivityClick(activity);
                  }
                }}
                onMouseEnter={(e) => {
                  if (activity.entityId && activity.entityType) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  } else {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Activity Icon */}
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                  {getActivityIcon(activity.type)}
                </div>

                {/* Activity Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '13px',
                      lineHeight: '16px',
                      color: '#ffffff',
                      marginBottom: '4px'
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{activity.user.name}</span>
                    {' '}{activity.action}{' '}
                    <span style={{ color: '#B58842' }}>{activity.target}</span>
                  </div>
                  
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 400,
                      fontSize: '11px',
                      lineHeight: '14px',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}
                  >
                    {activity.timestamp}
                  </div>
                </div>

                {/* User Avatar and Click Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {activity.entityId && activity.entityType && (
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255, 255, 255, 0.4)',
                        transition: 'color 0.2s ease'
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  {getUserAvatar(activity.user)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Full Activity Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={handleModalClose}
        >
          <div
            style={{
              background: '#17375c',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '20px',
                  color: '#ffffff'
                }}
              >
                Recent Activity Feed
              </div>
              
              {/* Close Button */}
              <button
                onClick={handleModalClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  color: '#ffffff'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Activity Feed */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                overflow: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: '#1e425c #17375c',
                paddingRight: '8px'
              }}
            >
              {activities.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '16px'
                }}>
                  No recent activities
                </div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.2s ease',
                      cursor: activity.entityId && activity.entityType ? 'pointer' : 'default'
                    }}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent modal close
                      if (activity.entityId && activity.entityType) {
                        handleActivityClick(activity);
                        handleModalClose(); // Close modal after navigation
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (activity.entityId && activity.entityType) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      } else {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Activity Icon */}
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      {getActivityIcon(activity.type)}
                    </div>

                    {/* Activity Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: '14px',
                          lineHeight: '18px',
                          color: '#ffffff',
                          marginBottom: '6px'
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{activity.user.name}</span>
                        {' '}{activity.action}{' '}
                        <span style={{ color: '#B58842' }}>{activity.target}</span>
                      </div>
                      
                      {activity.details && (
                        <div
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 400,
                            fontSize: '13px',
                            lineHeight: '16px',
                            color: 'rgba(255, 255, 255, 0.8)',
                            marginBottom: '6px'
                          }}
                        >
                          {activity.details}
                        </div>
                      )}
                      
                      <div
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 400,
                          fontSize: '12px',
                          lineHeight: '14px',
                          color: 'rgba(255, 255, 255, 0.6)'
                        }}
                      >
                        {activity.timestamp}
                      </div>
                    </div>

                    {/* User Avatar and Click Indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {activity.entityId && activity.entityType && (
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'rgba(255, 255, 255, 0.4)',
                            transition: 'color 0.2s ease'
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                      {getUserAvatar(activity.user)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 