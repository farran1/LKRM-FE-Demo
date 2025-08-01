'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Table, Tag, Button, Spin, Typography, Flex } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import api from '@/services/api';
import moment from 'moment';

const { Title, Text } = Typography;

interface PriorityTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  priorityName: string;
  priorityId: number;
  priorityColor: string;
}

export default function PriorityTasksModal({ 
  isOpen, 
  onClose, 
  priorityName, 
  priorityId, 
  priorityColor 
}: PriorityTasksModalProps) {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (isOpen && priorityId) {
      fetchTasks();
    }
  }, [isOpen, priorityId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/tasks?priorityId=${priorityId}&perPage=50`);
      if (res?.data?.data) {
        setTasks(res.data.data);
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
      case 'TODO': return 'To Do';
      case 'IN_PROGRESS': return 'In Progress';
      case 'DONE': return 'Done';
      default: return status;
    }
  };

  const columns = [
    {
      title: 'Task Name',
      dataIndex: 'name',
      key: 'name',
      width: '25%',
      render: (text: string) => (
        <Text strong style={{ color: '#ffffff', fontSize: '14px' }}>{text}</Text>
      )
    },
    {
      title: 'Assignee',
      key: 'assignee',
      width: '20%',
      render: (record: any) => {
        if (!record.playerTasks || !record.playerTasks.length) {
          return <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px' }}>Unassigned</Text>;
        }
        if (record.playerTasks.length <= 2) {
          return record.playerTasks.map((item: any, index: number) => (
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
              {item.player.name}
            </Tag>
          ));
        }
        return (
          <>
            {record.playerTasks.slice(0, 2).map((item: any, index: number) => (
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
                {item.player.name}
              </Tag>
            ))}
            <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '12px' }}>
              +{record.playerTasks.length - 2} more
            </Text>
          </>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      render: (status: string) => (
        <Tag 
          style={{ 
            backgroundColor: getStatusColor(status),
            color: '#fff',
            border: 'none',
            fontWeight: 500,
            fontSize: '12px'
          }}
        >
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: '18%',
      render: (date: string) => {
        if (!date) return <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px' }}>No due date</Text>;
        const formatted = moment(date).format('MMM D, YYYY');
        const isOverdue = moment(date).isBefore(moment(), 'day');
        return (
          <Text style={{ 
            color: isOverdue ? '#ff6b6b' : 'rgba(255, 255, 255, 0.85)',
            fontSize: '13px'
          }}>
            {formatted}
          </Text>
        );
      }
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '22%',
      render: (text: string) => (
        <Text 
          style={{ 
            color: 'rgba(255, 255, 255, 0.65)',
            fontSize: '13px'
          }}
          ellipsis={{ tooltip: text }}
        >
          {text || 'No description'}
        </Text>
      )
    }
  ];

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={1000}
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
          maxHeight: '75vh',
          overflowY: 'auto',
          backgroundColor: '#032a3f'
        }
      }}
    >
      {/* Custom Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#ffffff', fontSize: '22px', fontWeight: 600 }}>
            {priorityName === 'Med Priority' ? 'Medium Priority Tasks' : `${priorityName} Tasks`}
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '14px' }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} found
          </Text>
        </div>
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: priorityColor,
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}
        />
      </Flex>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" style={{ color: '#1D75D0' }} />
          <div style={{ marginTop: 16 }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
              Loading {priorityName.toLowerCase()} tasks...
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
            No {priorityName.toLowerCase()} tasks found
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
            There are currently no tasks with {priorityName.toLowerCase()} priority.
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
            className="priority-tasks-table"
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
          onClick={() => window.open('/tasks', '_blank')}
          style={{
            backgroundColor: '#1D75D0',
            borderColor: '#1D75D0',
            fontWeight: 600,
            height: '40px',
            borderRadius: '8px'
          }}
        >
          View All Tasks
        </Button>
      </Flex>

      <style jsx global>{`
        .priority-tasks-table .ant-table {
          background: transparent !important;
          color: #ffffff;
        }
        
        .priority-tasks-table .ant-table-thead > tr > th {
          background: rgba(255, 255, 255, 0.08) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
          font-weight: 600;
          font-size: 13px;
          padding: 12px 16px;
        }
        
        .priority-tasks-table .ant-table-tbody > tr > td {
          background: transparent !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          color: #ffffff;
          padding: 12px 16px;
        }
        
        .priority-tasks-table .ant-table-tbody > tr:hover > td {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        
        .priority-tasks-table .ant-pagination .ant-pagination-item {
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
        
        .priority-tasks-table .ant-pagination .ant-pagination-item a {
          color: rgba(255, 255, 255, 0.85) !important;
        }
        
        .priority-tasks-table .ant-pagination .ant-pagination-item-active {
          background: #1D75D0 !important;
          border-color: #1D75D0 !important;
        }
        
        .priority-tasks-table .ant-pagination .ant-pagination-item-active a {
          color: #ffffff !important;
        }
        
        .priority-tasks-table .ant-pagination .ant-pagination-prev,
        .priority-tasks-table .ant-pagination .ant-pagination-next {
          color: rgba(255, 255, 255, 0.65) !important;
        }
        
        .priority-tasks-table .ant-pagination .ant-pagination-prev:hover,
        .priority-tasks-table .ant-pagination .ant-pagination-next:hover {
          color: #1D75D0 !important;
        }
      `}</style>
    </Modal>
  );
} 