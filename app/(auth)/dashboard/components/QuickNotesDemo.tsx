import React from 'react'
import { Card, Typography, Space, Button } from 'antd'
import { BulbOutlined, UserOutlined, TagOutlined } from '@ant-design/icons'
import EnhancedStickyNotesModule from './EnhancedStickyNotesModule'
import NotificationBell from './NotificationBell'

const { Title, Text, Paragraph } = Typography

export default function QuickNotesDemo() {
  return (
    <div style={{ padding: '20px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2}>
              <BulbOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Quick Notes & Coach Tagging System
            </Title>
            <Paragraph>
              A full-stack sticky notes system with coach tagging and mention capabilities, 
              powered by Supabase.
            </Paragraph>
          </div>

          <div>
            <Title level={3}>Features</Title>
            <Space wrap>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserOutlined style={{ color: '#52c41a' }} />
                <Text>Coach Mentions (@username)</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TagOutlined style={{ color: '#1890ff' }} />
                <Text>Custom Tags</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BulbOutlined style={{ color: '#faad14' }} />
                <Text>Real-time Notifications</Text>
              </div>
            </Space>
          </div>

          <div>
            <Title level={4}>How to Use</Title>
            <ol>
              <li>Click "Add Note" to create a new sticky note</li>
              <li>Type @ followed by a username to mention a coach</li>
              <li>Click "Tags" to create and manage custom tags</li>
              <li>Use the notification bell to see mentions</li>
              <li>Pin important notes for easy access</li>
            </ol>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <EnhancedStickyNotesModule />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Card title="Notifications" size="small" style={{ width: '200px' }}>
                <div style={{ textAlign: 'center' }}>
                  <NotificationBell />
                  <div style={{ marginTop: '8px' }}>
                    <Text type="secondary">Click to view mentions</Text>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div style={{ 
            background: '#f5f5f5', 
            padding: '16px', 
            borderRadius: '8px',
            border: '1px solid #d9d9d9'
          }}>
            <Title level={5}>Setup Instructions</Title>
            <Paragraph>
              <strong>Note:</strong> This system requires the database migration to be applied first.
              Run the migration file: <code>supabase/migrations/20250120000000_create_quick_notes_and_coach_tagging_system.sql</code>
            </Paragraph>
            <Paragraph>
              The system includes:
            </Paragraph>
            <ul>
              <li>Quick notes with drag & drop positioning</li>
              <li>Coach tagging system with custom colors</li>
              <li>@mention functionality with real-time search</li>
              <li>Notification system for mentions</li>
              <li>Full CRUD operations via REST API</li>
              <li>Row Level Security (RLS) policies</li>
            </ul>
          </div>
        </Space>
      </Card>
    </div>
  )
}
