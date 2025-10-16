import React, { useState, useEffect } from 'react'
import { Badge, Dropdown, List, Button, Typography, Space, Avatar } from 'antd'
import { BellOutlined, UserOutlined, CheckOutlined, AimOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import api from '@/services/api'

const { Text } = Typography

interface Notification {
  id: number
  type?: 'mention' | 'generic' | 'GOAL_AT_RISK' | 'GOAL_OFF_TRACK' | 'GOAL_ACHIEVED' | 'GOAL_TREND_IMPROVING'
  noteId?: number
  goalId?: number
  mentionedBy?: {
    id: string
    name: string
    email: string
    initials: string
  }
  note?: {
    id: number
    content: string
    color: string
    created_at: string
  }
  goal?: {
    id: number
    target_value: number
    comparison_operator: string
    stat_metrics?: {
      name: string
    }
  }
  title?: string
  message?: string
  data?: any
  isRead: boolean
  createdAt: string
  readAt?: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Ask for desktop notification permission once
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {})
      }
    }

    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/notifications')
      const allNotifications = (response as any).data?.notifications || []
      setNotifications(allNotifications)
      setUnreadCount(allNotifications.filter((n: Notification) => !n.isRead).length)

      // Show a desktop notification for new unread items (simple heuristic)
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const newest = allNotifications.find((n: Notification) => !n.isRead)
        if (newest) {
          let body = ''
          if (newest.type?.startsWith('GOAL_')) {
            body = newest.message || newest.title || 'Goal status update'
          } else {
            body = newest.note?.content || (newest.type === 'mention' ? 'You were mentioned' : 'You have a new assignment/reminder')
          }
          try {
            new Notification('LKRM Notification', { body })
          } catch {}
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationIds: number[]) => {
    try {
      if (notificationIds.length === 1) {
        await api.put(`/api/notifications/${notificationIds[0]}/read`)
      } else {
        await api.put('/api/notifications', {
          notificationIds,
          markAsRead: true
        })
      }
      
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      )
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const markAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
    if (unreadIds.length > 0) {
      markAsRead(unreadIds)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read first
    if (!notification.isRead) {
      markAsRead([notification.id])
    }

    // Navigate based on notification type
    if (notification.type?.startsWith('GOAL_') && notification.goalId) {
      // Navigate to stats dashboard with goals view
      router.push('/stats-dashboard?view=goals&goalId=' + notification.goalId)
    } else if (notification.noteId) {
      // Navigate to notebook or specific note
      router.push('/notebook')
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const truncateContent = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const getGoalIcon = (type: string) => {
    switch (type) {
      // COMMENTED OUT: Goal-related notifications disabled
      // case 'GOAL_AT_RISK':
      //   return <ExclamationCircleOutlined style={{ color: '#faad14' }} />
      // case 'GOAL_OFF_TRACK':
      //   return <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
      // case 'GOAL_ACHIEVED':
      //   return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      // case 'GOAL_TREND_IMPROVING':
      //   return <AimOutlined style={{ color: '#52c41a' }} />
      default:
        return <AimOutlined style={{ color: '#4ecdc4' }} />
    }
  }

  const notificationItems = notifications.map((notification) => (
    <List.Item
      key={notification.id}
      onClick={() => handleNotificationClick(notification)}
      style={{
        padding: '12px 16px',
        backgroundColor: notification.isRead ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
        borderLeft: notification.isRead ? 'none' : '3px solid #4ecdc4',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        color: '#ffffff',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = notification.isRead ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = notification.isRead ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'
      }}
    >
      {/* Mark Read Check Icon - Top Right */}
      {!notification.isRead && (
        <Button
          type="text"
          size="small"
          icon={<CheckOutlined />}
          onClick={() => markAsRead([notification.id])}
          style={{ 
            position: 'absolute',
            top: '8px',
            right: '8px',
            color: '#4ecdc4',
            backgroundColor: 'rgba(78, 205, 196, 0.1)',
            border: '1px solid rgba(78, 205, 196, 0.3)',
            borderRadius: '4px',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            zIndex: 1
          }}
        />
      )}
      
      <List.Item.Meta
        avatar={
          notification.type?.startsWith('GOAL_') ? (
            <Avatar
              size="small"
              style={{
                backgroundColor: 'rgba(78, 205, 196, 0.2)',
                fontSize: '10px',
                color: '#4ecdc4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {getGoalIcon(notification.type)}
            </Avatar>
          ) : (
            <Avatar
              size="small"
              style={{
                backgroundColor: notification.mentionedBy?.initials ? '#4ecdc4' : '#666',
                fontSize: '10px',
                color: '#ffffff'
              }}
            >
              {notification.mentionedBy?.initials || <UserOutlined />}
            </Avatar>
          )
        }
        title={
          <Space>
            <Text strong style={{ fontSize: '12px', color: '#ffffff' }}>
              {notification.type?.startsWith('GOAL_') 
                ? (notification.title || 'Goal Update')
                : (notification.mentionedBy?.name || 'System')
              }
            </Text>
            <Text style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
              {notification.type?.startsWith('GOAL_') 
                ? 'goal status update'
                : (notification.type === 'mention' ? 'mentioned you' : 'updated your assignments')
              }
            </Text>
          </Space>
        }
        description={
          <div>
            {notification.type?.startsWith('GOAL_') ? (
              <div
                style={{
                  fontSize: '11px',
                  color: '#ffffff',
                  marginBottom: '4px',
                  padding: '6px 8px',
                  backgroundColor: 'rgba(78, 205, 196, 0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(78, 205, 196, 0.3)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {notification.message || 'Goal status has changed'}
              </div>
            ) : notification.note ? (
              <div
                style={{
                  fontSize: '11px',
                  color: '#ffffff',
                  marginBottom: '4px',
                  padding: '6px 8px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {truncateContent(notification.note.content)}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>
                You were assigned a task or added to an event
              </div>
            )}
            <Text style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
              {formatTimeAgo(notification.createdAt)}
            </Text>
          </div>
        }
      />
    </List.Item>
  ))

  const dropdownContent = (
    <div style={{ 
      width: '320px', 
      maxHeight: '400px', 
      background: '#1a2332', 
      border: '1px solid #2a4a6b', 
      borderRadius: 12, 
      boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
      overflow: 'hidden'
    }}>
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#ffffff',
          background: 'linear-gradient(135deg, #2a4a6b, #1a2332)'
        }}
      >
        <Text strong style={{ color: '#ffffff', fontSize: '14px' }}>Notifications</Text>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            onClick={markAllAsRead}
            style={{ 
              padding: 0, 
              height: 'auto', 
              color: '#4ecdc4',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            Mark all read
          </Button>
        )}
      </div>
      
      {notifications.length === 0 ? (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.7)',
            background: 'rgba(255,255,255,0.02)'
          }}
        >
          <BellOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#4ecdc4' }} />
          <div style={{ fontSize: '14px' }}>No notifications yet</div>
        </div>
      ) : (
        <List
          dataSource={notificationItems}
          renderItem={(item) => item}
          style={{ 
            maxHeight: '300px', 
            overflowY: 'auto', 
            background: 'transparent',
            color: '#ffffff'
          }}
        />
      )}
    </div>
  )

  return (
    <Dropdown
      menu={{ items: [] }}
      trigger={['click']}
      placement="bottomRight"
      popupRender={() => dropdownContent}
    >
      <Badge count={unreadCount} size="small">
        <Button
          type="text"
          icon={<BellOutlined />}
          style={{
            color: '#ffffff',
            fontSize: '16px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      </Badge>
    </Dropdown>
  )
} 