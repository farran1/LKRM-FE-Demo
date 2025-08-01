'use client';

import React, { useState } from 'react';
import { Button, Card, Space, Typography, Popconfirm, message } from 'antd';
import { ReloadOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { localStorageService } from '@/services/local-storage';

const { Title, Text, Paragraph } = Typography;

export default function DemoDataManager() {
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
    
    return {
      events: events.length,
      tasks: tasks.length,
      players: players.length,
      priorities: priorities.length
    };
  };

  const stats = getDataStats();

  return (
    <Card
      style={{
        background: '#17375c',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '24px'
      }}
      styles={{
        body: {
          padding: '20px'
        }
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <InfoCircleOutlined style={{ color: '#1D75D0', fontSize: '18px' }} />
            <Title level={4} style={{ margin: 0, color: '#ffffff' }}>
              Demo Data Manager
            </Title>
          </div>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
            Manage your offline demo data stored in browser localStorage. Perfect for demonstrations and testing.
          </Paragraph>
        </div>

        <div>
          <Text style={{ color: '#ffffff', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            Current Data Stats:
          </Text>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: '8px 12px', 
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Text style={{ color: '#4ecdc4', fontWeight: 600 }}>{stats.events}</Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)', marginLeft: '4px' }}>Events</Text>
            </div>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: '8px 12px', 
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Text style={{ color: '#ffd93d', fontWeight: 600 }}>{stats.tasks}</Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)', marginLeft: '4px' }}>Tasks</Text>
            </div>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: '8px 12px', 
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Text style={{ color: '#ff6b6b', fontWeight: 600 }}>{stats.players}</Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)', marginLeft: '4px' }}>Players</Text>
            </div>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: '8px 12px', 
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Text style={{ color: '#4db8ff', fontWeight: 600 }}>{stats.priorities}</Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)', marginLeft: '4px' }}>Priorities</Text>
            </div>
          </div>
        </div>

        <Space size="middle">
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
              style={{
                backgroundColor: '#1D75D0',
                borderColor: '#1D75D0',
                height: '36px',
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
              style={{
                height: '36px',
                fontWeight: 600
              }}
            >
              Clear All Data
            </Button>
          </Popconfirm>
        </Space>

        <div style={{ 
          background: 'rgba(29, 117, 208, 0.1)', 
          border: '1px solid rgba(29, 117, 208, 0.3)',
          borderRadius: '8px',
          padding: '12px'
        }}>
          <Text style={{ color: '#1D75D0', fontWeight: 600, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
            💡 Demo Mode Active
          </Text>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>
            All data is stored locally in your browser. Changes persist across sessions until manually reset. 
            Perfect for offline demonstrations and testing new features.
          </Text>
        </div>
      </Space>
    </Card>
  );
} 