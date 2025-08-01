'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  details?: string;
}

export default function RecentActivityModule() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock activity data
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'player_note',
      user: { name: 'Coach Johnson', role: 'Head Coach', initials: 'CJ' },
      action: 'added a note',
      target: 'Marcus Johnson',
      timestamp: '2 hours ago',
      details: 'Great performance in practice today. Keep up the energy!'
    },
    {
      id: '2',
      type: 'task_created',
      user: { name: 'Sarah Wilson', role: 'Assistant Coach', initials: 'SW' },
      action: 'created a task',
      target: 'Team Meeting',
      timestamp: '4 hours ago',
      details: 'Weekly strategy review for upcoming game'
    },
    {
      id: '3',
      type: 'event_updated',
      user: { name: 'Mike Davis', role: 'Team Manager', initials: 'MD' },
      action: 'updated event',
      target: 'Practice Session',
      timestamp: '6 hours ago',
      details: 'Changed time from 3:00 PM to 4:00 PM'
    },
    {
      id: '4',
      type: 'goal_set',
      user: { name: 'Coach Johnson', role: 'Head Coach', initials: 'CJ' },
      action: 'set a goal',
      target: 'Tyler Williams',
      timestamp: '1 day ago',
      details: 'Improve shooting accuracy to 75% by end of season'
    },
    {
      id: '5',
      type: 'stats_uploaded',
      user: { name: 'Analytics Team', role: 'Data Analyst', initials: 'AT' },
      action: 'uploaded stats',
      target: 'Game vs Eagles',
      timestamp: '2 days ago',
      details: 'Complete game statistics and performance metrics'
    }
  ];

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
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: '#ffffff',
              fontSize: '11px',
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
           {activities.map((activity) => (
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
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
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

              {/* User Avatar */}
              {getUserAvatar(activity.user)}
            </div>
          ))}
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
              {activities.map((activity) => (
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
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
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

                  {/* User Avatar */}
                  {getUserAvatar(activity.user)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 