'use client';

import React, { useState, useEffect } from 'react';
import { 
  getNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead,
  Notification 
} from '../../../../utils/mentions';

interface NotificationBellProps {
  style?: React.CSSProperties;
}

export default function NotificationBell({ style }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications and count
  useEffect(() => {
    loadNotifications();
  }, []);

  // Refresh notifications every 5 seconds
  useEffect(() => {
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    const allNotifications = getNotifications();
    setNotifications(allNotifications);
    setUnreadCount(getUnreadNotificationCount());
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
      loadNotifications();
    }
    // Here you could navigate to the context (task, note, etc.)
    console.log('Navigate to:', notification.context, notification.contextId);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M16 7.85C16 6.83 15.17 6 14.15 6C13.65 6 13.2 6.2 12.86 6.55L11.24 8.17L9.62 6.55C9.27 6.2 8.82 6 8.32 6C7.3 6 6.47 6.83 6.47 7.85C6.47 8.35 6.67 8.8 7.02 9.15L10.59 12.72C11.37 13.5 12.63 13.5 13.41 12.72L16.98 9.15C17.33 8.8 17.53 8.35 17.53 7.85H16Z" fill="#B58842"/>
          </svg>
        );
      case 'assignment':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6C4.89 2 4 2.89 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14 2Z" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="14,2 14,8 20,8" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="16" y1="13" x2="8" y2="13" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="16" y1="17" x2="8" y2="17" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="10,9 9,10 7,8" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'deadline':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#FF9800" strokeWidth="2"/>
            <polyline points="12,6 12,12 16,14" stroke="#FF9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'priority':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#F44336"/>
          </svg>
        );
      case 'completion':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4905 2.02168 11.3363C2.16356 9.18203 2.99721 7.13214 4.39828 5.49883C5.79935 3.86553 7.69279 2.72636 9.79619 2.24223C11.8996 1.75809 14.1003 1.95185 16.07 2.79L18 1" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="22,4 12,14.01 9,11.01" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#6B7280" strokeWidth="2"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="16" x2="12.01" y2="16" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    switch (notification.type) {
      case 'mention':
        return `mentioned you ${notification.context}`;
      case 'assignment':
        return `assigned you a task`;
      case 'deadline':
        return `Task due soon`;
      case 'priority':
        return notification.context; // Already formatted like "changed task priority to high"
      case 'completion':
        return `completed a task`;
      default:
        return notification.context;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#B58842';
    }
  };

  return (
    <div style={{ position: 'relative', ...style }}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          borderRadius: '8px',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
          color: '#ffffff',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.73 21A2 2 0 0 1 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              background: '#B58842',
              color: '#ffffff',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '8px',
            background: '#17375c',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            minWidth: '350px',
            maxHeight: '400px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: 600,
                color: '#ffffff'
              }}
            >
              Notifications
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Notifications List */}
          <div
            style={{
              maxHeight: '320px',
              overflow: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#1e425c #17375c'
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px'
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '8px' }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.73 21A2 2 0 0 1 10.27 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>No notifications yet</div>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    backgroundColor: notification.read ? 'transparent' : 'rgba(181, 136, 66, 0.1)',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notification.read ? 'transparent' : 'rgba(181, 136, 66, 0.1)';
                  }}
                >
                  {/* Notification Icon */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: `rgba(${notification.type === 'mention' ? '181, 136, 66' : 
                        notification.type === 'assignment' ? '76, 175, 80' :
                        notification.type === 'deadline' ? '255, 152, 0' :
                        notification.type === 'priority' ? '244, 67, 54' :
                        notification.type === 'completion' ? '76, 175, 80' : '107, 114, 128'}, 0.2)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        fontWeight: notification.read ? 400 : 600,
                        color: '#ffffff',
                        marginBottom: '4px',
                        lineHeight: '1.4'
                      }}
                    >
                      <span style={{ color: getPriorityColor(notification.priority) }}>{notification.fromUserName}</span> {getNotificationMessage(notification)}
                      {notification.priority && (
                        <span style={{ 
                          fontSize: '11px',
                          color: getPriorityColor(notification.priority),
                          marginLeft: '4px',
                          fontWeight: 600
                        }}>
                          [{notification.priority.toUpperCase()}]
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '13px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        marginBottom: '6px',
                        lineHeight: '1.3'
                      }}
                    >
                      "{notification.content}"
                    </div>
                    <div
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.5)'
                      }}
                    >
                      {formatTimestamp(notification.timestamp)}
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notification.read && (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#B58842',
                        flexShrink: 0,
                        marginTop: '4px'
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
 