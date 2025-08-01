'use client';

import React from 'react';

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

interface RecentActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityItem[];
}

export default function RecentActivityModal({ isOpen, onClose, activities }: RecentActivityModalProps) {
  if (!isOpen) return null;

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
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1D75D0 0%, #4ecdc4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
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

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          background: '#17375c',
          borderRadius: '16px',
          padding: '24px',
          width: '350px',
          maxWidth: '800px',
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
              fontSize: '24px',
              color: '#ffffff'
            }}
          >
            Recent Activity Feed
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
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
                transition: 'background-color 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              {/* User Avatar */}
              {getUserAvatar(activity.user)}

              {/* Activity Content */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  flex: 1,
                  minWidth: 0
                }}
              >
                {/* Main Activity Line */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#ffffff'
                    }}
                  >
                    {activity.user.name}
                  </span>
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '15px',
                      color: 'rgba(255, 255, 255, 0.8)'
                    }}
                  >
                    {activity.action}
                  </span>
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#B58842'
                    }}
                  >
                    {activity.target}
                  </span>
                </div>

                {/* Details */}
                {activity.details && (
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      lineHeight: '1.5',
                      marginTop: '4px'
                    }}
                  >
                    {activity.details}
                  </div>
                )}

                {/* Timestamp and Role */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '8px'
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    {activity.timestamp}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {getActivityIcon(activity.type)}
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontWeight: 500
                      }}
                    >
                      {activity.user.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Scrollbar Styles */}
        <style jsx>{`
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-track {
            background: #17375c;
          }
          div::-webkit-scrollbar-thumb {
            background: #1e425c;
            border-radius: 6px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: #2a4a6b;
          }
        `}</style>
      </div>
    </div>
  );
} 
 