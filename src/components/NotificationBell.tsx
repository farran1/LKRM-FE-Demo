import React, { useState, useEffect } from 'react'
import { Badge, Dropdown, List, Button, Typography, Space, Avatar } from 'antd'
import { BellOutlined, UserOutlined, CheckOutlined } from '@ant-design/icons'
import api from '@/services/api'

const { Text } = Typography

interface Notification {
  id: number
  type?: 'mention' | 'generic'
  noteId: number
  mentionedBy: {
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
  isRead: boolean
  createdAt: string
  readAt?: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

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
          const body = newest.note?.content || (newest.type === 'mention' ? 'You were mentioned' : 'You have a new assignment/reminder')
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

  const notificationItems = notifications.map((notification) => (
    <List.Item
      key={notification.id}
            style={{
        padding: '12px 16px',
        backgroundColor: notification.isRead ? 'transparent' : '#f0f8ff',
        borderLeft: notification.isRead ? 'none' : '3px solid #1890ff'
      }}
      actions={[
        !notification.isRead && (
          <Button
            type="text"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => markAsRead([notification.id])}
            style={{ color: '#1890ff' }}
          >
            Mark Read
          </Button>
        )
      ].filter(Boolean)}
    >
      <List.Item.Meta
        avatar={
          <Avatar
            size="small"
            style={{
              backgroundColor: notification.mentionedBy.initials ? '#1890ff' : '#ccc',
              fontSize: '10px'
            }}
          >
            {notification.mentionedBy.initials || <UserOutlined />}
          </Avatar>
        }
        title={
          <Space>
            <Text strong style={{ fontSize: '12px' }}>
              {notification.mentionedBy.name}
            </Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {notification.type === 'mention' ? 'mentioned you' : 'updated your assignments'}
            </Text>
          </Space>
        }
        description={
          <div>
            {notification.note ? (
              <div
                style={{
                  fontSize: '11px',
                  color: '#666',
                  marginBottom: '4px',
                  padding: '4px 8px',
                  backgroundColor: notification.note.color,
                  borderRadius: '4px',
                  border: '1px solid #e8e8e8'
                }}
              >
                {truncateContent(notification.note.content)}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                You were assigned a task or added to an event
              </div>
            )}
            <Text type="secondary" style={{ fontSize: '10px' }}>
              {formatTimeAgo(notification.createdAt)}
            </Text>
          </div>
        }
      />
    </List.Item>
  ))

  const dropdownContent = (
    <div style={{ width: '320px', maxHeight: '400px', background: '#17375c', border: '1px solid #2a4a6b', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.35)' }}>
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#ffffff'
        }}
      >
        <Text strong style={{ color: '#ffffff' }}>Notifications</Text>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            onClick={markAllAsRead}
            style={{ padding: 0, height: 'auto', color: '#4ecdc4' }}
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
            color: 'rgba(255,255,255,0.7)'
          }}
        >
          <BellOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#ffffff' }} />
          <div>No notifications yet</div>
        </div>
      ) : (
        <List
          dataSource={notificationItems}
          renderItem={(item) => item}
          style={{ maxHeight: '300px', overflowY: 'auto', background: 'transparent', color: '#ffffff' }}
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