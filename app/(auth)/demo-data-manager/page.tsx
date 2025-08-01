'use client';

import React, { useState } from 'react';
import { Button, Card, Space, Typography, Popconfirm, message, Row, Col, Statistic } from 'antd';
import { ReloadOutlined, DeleteOutlined, InfoCircleOutlined, DatabaseOutlined, BarChartOutlined } from '@ant-design/icons';
import { localStorageService } from '@/services/local-storage';

const { Title, Text, Paragraph } = Typography;

export default function DemoDataManagerPage() {
  const [isResetting, setIsResetting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      localStorageService.resetToDefaults();
      message.success('Demo data has been reset to defaults!');
      // Reload the page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      message.error('Failed to reset data');
    }
    setIsResetting(false);
  };

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      localStorageService.clearAllData();
      message.success('All demo data has been cleared!');
      // Reload the page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      message.error('Failed to clear data');
    }
    setIsClearing(false);
  };

  const getDataStats = () => {
    const events = localStorageService.getEvents();
    const tasks = localStorageService.getTasks();
    const players = localStorageService.getPlayers();
    const priorities = localStorageService.getPriorities();
    const positions = localStorageService.getPositions();
    const eventTypes = localStorageService.getEventTypes();
    
    return {
      events: events.length,
      tasks: tasks.length,
      players: players.length,
      priorities: priorities.length,
      positions: positions.length,
      eventTypes: eventTypes.length
    };
  };

  const getDetailedStats = () => {
    const tasks = localStorageService.getTasks();
    const todoTasks = tasks.filter(t => t.status === 'TODO');
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
    const completedTasks = tasks.filter(t => t.status === 'DONE');
    const gameTasks = tasks.filter(t => t.eventId === 1);
    
    return {
      todoTasks: todoTasks.length,
      inProgressTasks: inProgressTasks.length,
      completedTasks: completedTasks.length,
      gameTasks: gameTasks.length
    };
  };

  const stats = getDataStats();
  const detailedStats = getDetailedStats();

  return (
    <div style={{ 
      padding: '24px', 
      minHeight: 'calc(100vh - 64px)',
      background: '#f5f5f5'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ color: '#032a3f', marginBottom: '8px' }}>
            <DatabaseOutlined style={{ marginRight: '12px' }} />
            Demo Data Manager
          </Title>
          <Paragraph style={{ color: '#666', fontSize: '16px', marginBottom: 0 }}>
            Manage your offline demo data stored in browser localStorage. Perfect for demonstrations, testing, and development.
          </Paragraph>
        </div>

        {/* Status Overview */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChartOutlined style={{ color: '#1D75D0' }} />
              <span>Data Overview</span>
            </div>
          }
          style={{ marginBottom: '24px' }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={6}>
              <Statistic
                title="Events"
                value={stats.events}
                valueStyle={{ color: '#4ecdc4' }}
                prefix={<span style={{ fontSize: '14px' }}>📅</span>}
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Statistic
                title="Tasks"
                value={stats.tasks}
                valueStyle={{ color: '#ffd93d' }}
                prefix={<span style={{ fontSize: '14px' }}>📋</span>}
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Statistic
                title="Players"
                value={stats.players}
                valueStyle={{ color: '#ff6b6b' }}
                prefix={<span style={{ fontSize: '14px' }}>👤</span>}
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Statistic
                title="Priorities"
                value={stats.priorities}
                valueStyle={{ color: '#4db8ff' }}
                prefix={<span style={{ fontSize: '14px' }}>⭐</span>}
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Statistic
                title="Positions"
                value={stats.positions}
                valueStyle={{ color: '#9c88ff' }}
                prefix={<span style={{ fontSize: '14px' }}>🎯</span>}
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Statistic
                title="Event Types"
                value={stats.eventTypes}
                valueStyle={{ color: '#ff9f43' }}
                prefix={<span style={{ fontSize: '14px' }}>🏷️</span>}
              />
            </Col>
          </Row>
        </Card>

        {/* Task Breakdown */}
        <Card
          title="Task Status Breakdown"
          style={{ marginBottom: '24px' }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Statistic
                title="To Do"
                value={detailedStats.todoTasks}
                valueStyle={{ color: '#ff464d' }}
                prefix={<span style={{ fontSize: '14px' }}>⏳</span>}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="In Progress"
                value={detailedStats.inProgressTasks}
                valueStyle={{ color: '#d0d681' }}
                prefix={<span style={{ fontSize: '14px' }}>🔄</span>}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Completed"
                value={detailedStats.completedTasks}
                valueStyle={{ color: '#4db8ff' }}
                prefix={<span style={{ fontSize: '14px' }}>✅</span>}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Game Tasks"
                value={detailedStats.gameTasks}
                valueStyle={{ color: '#4ecdc4' }}
                prefix={<span style={{ fontSize: '14px' }}>🏀</span>}
                suffix="/ Eagles vs Hawks"
              />
            </Col>
          </Row>
        </Card>

        {/* Management Actions */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <InfoCircleOutlined style={{ color: '#1D75D0' }} />
              <span>Data Management</span>
            </div>
          }
          style={{ marginBottom: '24px' }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Paragraph style={{ marginBottom: '16px' }}>
                Use these actions to manage your demo data. All changes will take effect immediately 
                and persist across browser sessions.
              </Paragraph>

              <Space size="middle" wrap>
                <Popconfirm
                  title="Reset Demo Data"
                  description="This will restore all demo data to defaults. Any changes you made will be lost."
                  onConfirm={handleResetData}
                  okText="Reset"
                  cancelText="Cancel"
                  okButtonProps={{ 
                    style: { backgroundColor: '#1D75D0', borderColor: '#1D75D0' } 
                  }}
                >
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    loading={isResetting}
                    size="large"
                    style={{
                      backgroundColor: '#1D75D0',
                      borderColor: '#1D75D0',
                      fontWeight: 600
                    }}
                  >
                    Reset to Defaults
                  </Button>
                </Popconfirm>

                <Popconfirm
                  title="Clear All Data"
                  description="This will permanently delete all demo data. You'll need to refresh to get defaults back."
                  onConfirm={handleClearData}
                  okText="Clear"
                  cancelText="Cancel"
                  okButtonProps={{ 
                    danger: true 
                  }}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={isClearing}
                    size="large"
                    style={{ fontWeight: 600 }}
                  >
                    Clear All Data
                  </Button>
                </Popconfirm>
              </Space>
            </div>

            <div style={{ 
              background: 'rgba(29, 117, 208, 0.1)', 
              border: '1px solid rgba(29, 117, 208, 0.3)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <Text style={{ color: '#1D75D0', fontWeight: 600, fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                💡 Demo Mode Information
              </Text>
              <Paragraph style={{ color: '#666', fontSize: '14px', marginBottom: 0 }}>
                This application is running in <strong>Local Storage Demo Mode</strong>. All data is stored 
                locally in your browser and persists across sessions. This is perfect for offline 
                demonstrations, development, and testing new features without requiring a backend database.
              </Paragraph>
            </div>
          </Space>
        </Card>

        {/* Quick Links */}
        <Card title="Quick Navigation">
          <Space wrap>
            <Button href="/dashboard3" type="link">
              Dashboard 3 (Main Demo)
            </Button>
            <Button href="/tasks" type="link">
              Tasks Management
            </Button>
            <Button href="/events" type="link">
              Events
            </Button>
            <Button href="/players" type="link">
              Players
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  );
} 
 