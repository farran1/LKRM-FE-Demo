'use client';

import React, { useState, useEffect } from 'react';
import { Card, List, Badge, Button, Empty, Spin, Alert } from 'antd';
import { 
  BellOutlined, 
  CloseOutlined, 
  EyeOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: {
    goalId?: number;
  };
  createdAt: string;
}

interface GoalAlertsProps {
  onGoalClick: (goalId: number) => void;
}

const GoalAlerts: React.FC<GoalAlertsProps> = ({ onGoalClick }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/stats/team-goals/dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.recentNotifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (notificationId: number) => {
    setDismissedIds(prev => new Set([...prev, notificationId]));
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.data?.goalId) {
      onGoalClick(notification.data.goalId);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'GOAL_AT_RISK':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'GOAL_OFF_TRACK':
        return <ExclamationCircleOutlined style={{ color: '#f5222d' }} />;
      case 'GOAL_ACHIEVED':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'GOAL_TREND_IMPROVING':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      default:
        return <BellOutlined />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'GOAL_AT_RISK':
        return '#faad14';
      case 'GOAL_OFF_TRACK':
        return '#f5222d';
      case 'GOAL_ACHIEVED':
        return '#52c41a';
      case 'GOAL_TREND_IMPROVING':
        return '#52c41a';
      default:
        return '#1890ff';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const visibleNotifications = notifications.filter(n => !dismissedIds.has(n.id));

  if (loading) {
    return (
      <Card title="Recent Alerts" size="small" style={{ marginBottom: 16 }}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin size="small" />
          <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
            Loading alerts...
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Recent Alerts" size="small" style={{ marginBottom: 16 }}>
        <Alert
          message="Error Loading Alerts"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={fetchNotifications}>
              Retry
            </Button>
          }
        />
      </Card>
    );
  }

  if (visibleNotifications.length === 0) {
    return (
      <Card title="Recent Alerts" size="small" style={{ marginBottom: 16 }}>
        <Empty
          description="No recent alerts"
          imageStyle={{ height: 40 }}
        />
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BellOutlined />
          <span>Recent Alerts</span>
          <Badge count={visibleNotifications.length} size="small" />
        </div>
      } 
      size="small" 
      style={{ marginBottom: 16 }}
      extra={
        <Button 
          type="text" 
          size="small" 
          icon={<BellOutlined />}
          onClick={fetchNotifications}
        >
          Refresh
        </Button>
      }
    >
      <List
        size="small"
        dataSource={visibleNotifications.slice(0, 5)} // Show only last 5
        renderItem={(notification) => (
          <List.Item
            style={{ 
              padding: '8px 0',
              cursor: notification.data?.goalId ? 'pointer' : 'default',
              borderRadius: 4,
              paddingLeft: 8,
              paddingRight: 8,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (notification.data?.goalId) {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onClick={() => handleNotificationClick(notification)}
            actions={[
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss(notification.id);
                }}
              />
            ]}
          >
            <List.Item.Meta
              avatar={getNotificationIcon(notification.type)}
              title={
                <div style={{ fontSize: '13px', fontWeight: 500 }}>
                  {notification.title}
                </div>
              }
              description={
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>
                    {notification.message}
                  </div>
                  <div style={{ fontSize: '11px', color: '#999' }}>
                    {formatTimeAgo(notification.createdAt)}
                  </div>
                </div>
              }
            />
            {notification.data?.goalId && (
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onGoalClick(notification.data!.goalId!);
                }}
              />
            )}
          </List.Item>
        )}
      />
      
      {visibleNotifications.length > 5 && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Button type="link" size="small">
            View All Alerts ({visibleNotifications.length})
          </Button>
        </div>
      )}
    </Card>
  );
};

export default GoalAlerts;
