'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Table, Tag, Button, Spin, Typography, Flex } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import api from '@/services/api';
import moment from 'moment';

const { Title, Text } = Typography;

interface GamedayStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusName: string;
  statusId: string;
  statusColor: string;
  eventId?: number;
}

export default function GamedayStatusModal({ 
  isOpen, 
  onClose, 
  statusName, 
  statusId, 
  statusColor,
  eventId = 1 // Default to event ID 1 for the Eagles vs Hawks game
}: GamedayStatusModalProps) {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (isOpen && statusId) {
      fetchTasks();
    }
  }, [isOpen, statusId, eventId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Map status IDs to actual API status values
      const statusMap: { [key: string]: string } = {
        'not-started': 'TODO',
        'in-progress': 'IN_PROGRESS',
        'completed': 'DONE'
      };
      
      const apiStatus = statusMap[statusId] || statusId;
      const params = new URLSearchParams({
        status: apiStatus,
        eventId: eventId.toString(),
        perPage: '50'
      });
      
      const res = await api.get(`/api/tasks?${params}`);
      if (res?.data?.data) {
        // Validate and sanitize the data
        const sanitizedTasks = res.data.data.map((task: any) => ({
          id: task.id || `task-${Date.now()}-${Math.random()}`,
          name: task.name || 'Untitled Task',
          description: task.description || '',
          playerTasks: task.playerTasks || [],
          priority: task.priority || null,
          dueDate: task.dueDate || null,
          status: task.status || 'TODO'
        }));
        setTasks(sanitizedTasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return '#ff6b6b';
      case 'IN_PROGRESS': return '#ffd93d';
      case 'DONE': return '#4ecdc4';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'TODO': return 'Not Started';
      case 'IN_PROGRESS': return 'In Progress';
      case 'DONE': return 'Completed';
      default: return status;
    }
  };

  const columns = [
    {
      title: 'Task Name',
      key: 'name',
      width: '30%',
      render: (record: any) => {
        try {
          return (
            <Text strong style={{ color: '#ffffff', fontSize: '14px' }}>
              {record?.name || 'Untitled Task'}
            </Text>
          );
        } catch (error) {
          console.error('Error rendering task name:', error);
          return (
            <Text strong style={{ color: '#ffffff', fontSize: '14px' }}>
              Untitled Task
            </Text>
          );
        }
      }
    },
    {
      title: 'Description',
      key: 'description',
      width: '25%',
      render: (record: any) => {
        try {
          return (
            <Text 
              style={{ 
                color: 'rgba(255, 255, 255, 0.65)',
                fontSize: '13px'
              }}
              ellipsis={{ tooltip: record?.description || 'No description' }}
            >
              {record?.description || 'No description'}
            </Text>
          );
        } catch (error) {
          console.error('Error rendering description:', error);
          return (
            <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px' }}>
              No description
            </Text>
          );
        }
      }
    },
    {
      title: 'Assignee',
      key: 'assignee',
      width: '20%',
      render: (record: any) => {
        try {
          if (!record?.playerTasks || !Array.isArray(record.playerTasks) || record.playerTasks.length === 0) {
            return <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px' }}>Unassigned</Text>;
          }
          
          const validPlayerTasks = record.playerTasks.filter((item: any) => item && typeof item === 'object');
          
          if (validPlayerTasks.length <= 2) {
            return validPlayerTasks.map((item: any, index: number) => (
              <Tag 
                key={index} 
                style={{ 
                  background: '#1D75D0', 
                  color: '#fff', 
                  border: 'none',
                  marginBottom: 2,
                  fontSize: '12px'
                }}
              >
                {item?.player?.name || 'Unknown Player'}
              </Tag>
            ));
          }
          
          return (
            <>
              {validPlayerTasks.slice(0, 2).map((item: any, index: number) => (
                <Tag 
                  key={index} 
                  style={{ 
                    background: '#1D75D0', 
                    color: '#fff', 
                    border: 'none',
                    marginBottom: 2,
                    fontSize: '12px'
                  }}
                >
                  {item?.player?.name || 'Unknown Player'}
                </Tag>
              ))}
              <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '12px' }}>
                +{validPlayerTasks.length - 2} more
              </Text>
            </>
          );
        } catch (error) {
          console.error('Error rendering assignee:', error);
          return <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px' }}>Unassigned</Text>;
        }
      }
    },
    {
      title: 'Priority',
      key: 'priority',
      width: '15%',
      render: (record: any) => {
        try {
          if (!record?.priority || !record.priority.name) {
            return <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px' }}>No priority</Text>;
          }
          return (
            <Tag 
              style={{ 
                backgroundColor: record.priority.name === 'High' ? '#ff6b6b' : 
                               record.priority.name === 'Medium' ? '#ffd93d' : '#4db8ff',
                color: '#fff',
                border: 'none',
                fontWeight: 500,
                fontSize: '12px'
              }}
            >
              {record.priority.name}
            </Tag>
          );
        } catch (error) {
          console.error('Error rendering priority:', error);
          return <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px' }}>No priority</Text>;
        }
      }
    },
    {
      title: 'Due Date',
      key: 'dueDate',
      width: '10%',
      render: (record: any) => {
        try {
          const date = record?.dueDate;
          if (!date) return <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px' }}>No due date</Text>;
          
          const formatted = moment(date).format('MMM D');
          const isOverdue = moment(date).isBefore(moment(), 'day');
          return (
            <Text style={{ 
              color: isOverdue ? '#ff6b6b' : 'rgba(255, 255, 255, 0.85)',
              fontSize: '13px'
            }}>
              {formatted}
            </Text>
          );
        } catch (error) {
          console.error('Error rendering due date:', error);
          return <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px' }}>No due date</Text>;
        }
      }
    }
  ];

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={1100}
      closeIcon={<CloseOutlined style={{ color: '#ffffff' }} />}
      styles={{
        mask: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        },
        content: {
          backgroundColor: '#032a3f',
          borderRadius: '12px',
          overflow: 'hidden'
        },
        header: {
          backgroundColor: '#032a3f',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '16px'
        },
        body: {
          padding: '24px',
          maxHeight: '85vh',
          overflowY: 'auto',
          backgroundColor: '#032a3f'
        }
      }}
    >
      {/* Custom Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#ffffff', fontSize: '22px', fontWeight: 600 }}>
            {statusName} Tasks - Eagles vs Hawks
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '14px' }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} found for this game
          </Text>
        </div>
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: statusColor,
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}
        />
      </Flex>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" style={{ color: '#1D75D0' }} />
          <div style={{ marginTop: 16 }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
              Loading {statusName.toLowerCase()} tasks for this game...
            </Text>
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '16px',
            opacity: 0.4 
          }}>
            📋
          </div>
          <Title level={4} style={{ color: 'rgba(255, 255, 255, 0.85)', margin: '0 0 8px 0' }}>
            No {statusName.toLowerCase()} tasks found
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
            There are currently no {statusName.toLowerCase()} tasks for this game.
          </Text>
        </div>
      ) : (
        <div style={{ 
          background: '#002032', 
          borderRadius: '8px', 
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Table
            columns={columns}
            dataSource={tasks}
            rowKey="id"
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              showQuickJumper: false,
              showTotal: (total, range) => 
                <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px' }}>
                  {range[0]}-{range[1]} of {total} tasks
                </Text>,
              style: {
                padding: '16px 20px 12px',
                background: '#002032',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }
            }}
            scroll={{ x: 800 }}
            size="middle"
            style={{
              background: 'transparent'
            }}
            className="gameday-status-table"
          />
        </div>
      )}

      <Flex justify="space-between" align="center" style={{ 
        marginTop: 24, 
        paddingTop: 20, 
        borderTop: '1px solid rgba(255, 255, 255, 0.1)' 
      }}>
        <Button 
          type="link" 
          onClick={onClose}
          style={{ 
            color: 'rgba(255, 255, 255, 0.65)', 
            padding: 0,
            fontSize: '14px'
          }}
        >
          ← Back to Dashboard
        </Button>
        <Button 
          type="primary" 
          onClick={() => window.open(`/tasks?eventId=${eventId}`, '_blank')}
          style={{
            backgroundColor: '#1D75D0',
            borderColor: '#1D75D0',
            fontWeight: 600,
            height: '40px',
            borderRadius: '8px'
          }}
        >
          View All Game Tasks
        </Button>
      </Flex>

      <style jsx global>{`
        .gameday-status-table .ant-table {
          background: transparent !important;
          color: #ffffff;
        }
        
        .gameday-status-table .ant-table-thead > tr > th {
          background: rgba(255, 255, 255, 0.08) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
          font-weight: 600;
          font-size: 13px;
          padding: 12px 16px;
        }
        
        .gameday-status-table .ant-table-tbody > tr > td {
          background: transparent !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          color: #ffffff;
          padding: 12px 16px;
        }
        
        .gameday-status-table .ant-table-tbody > tr:hover > td {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        
        .gameday-status-table .ant-pagination .ant-pagination-item {
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
        
        .gameday-status-table .ant-pagination .ant-pagination-item a {
          color: rgba(255, 255, 255, 0.85) !important;
        }
        
        .gameday-status-table .ant-pagination .ant-pagination-item-active {
          background: #1D75D0 !important;
          border-color: #1D75D0 !important;
        }
        
        .gameday-status-table .ant-pagination .ant-pagination-item-active a {
          color: #ffffff !important;
        }
        
        .gameday-status-table .ant-pagination .ant-pagination-prev,
        .gameday-status-table .ant-pagination .ant-pagination-next {
          color: rgba(255, 255, 255, 0.65) !important;
        }
        
        .gameday-status-table .ant-pagination .ant-pagination-prev:hover,
        .gameday-status-table .ant-pagination .ant-pagination-next:hover {
          color: #1D75D0 !important;
        }
      `}</style>
    </Modal>
  );
} 
 