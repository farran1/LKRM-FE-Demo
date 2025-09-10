'use client';

import { Button, Col, Flex, Modal, Row, Skeleton, Tooltip } from 'antd';
import { memo, useEffect, useState } from 'react';
import CloseIcon from '@/components/icon/close.svg';
import CalendarIcon from '@/components/icon/calendar.svg';
import MapIcon from '@/components/icon/map-pin.svg';
import UserIcon from '@/components/icon/users-round.svg';
import api from '@/services/api';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { EditFilled, CloseOutlined } from '@ant-design/icons';

interface Event {
  id: number;
  name: string;
  eventType?: {
    color?: string;
    txtColor?: string;
    name?: string;
  };
  isRepeat?: boolean;
  startTime: string;
  venue?: string;
}

interface Player {
  id: number;
  name: string;
  position?: {
    name: string;
  };
}

interface EventDetailModalProps {
  isShowModal: boolean;
  onClose: () => void;
  event: Event | null;
  openEdit?: () => void;
}

function EventDetailModal({ isShowModal, onClose, event, openEdit }: EventDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!event) {
      return;
    }
    fetchPlayer();
    fetchTasks();
    fetchExpenses();
  }, [event]);

  // Don't render if no event is selected
  if (!event) {
    return null;
  }

  const fetchPlayer = async () => {
    setPlayerLoading(true);
    try {
      const res = await api.get(`/api/events/${event.id}/players`);
      // Ensure players is always an array
      setPlayers((res as any)?.data?.data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
      setPlayers([]);
    }
    setPlayerLoading(false);
  };

  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      const res = await api.get(`/api/tasks?eventId=${event.id}`);
      const tasksData = (res as any)?.data?.tasks || (res as any)?.data || [];
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    }
    setTasksLoading(false);
  };


  const fetchExpenses = async () => {
    setExpensesLoading(true);
    try {
      const res = await api.get(`/api/events/${event.id}/expenses`);
      const expensesData = (res as any)?.data?.data || [];
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    }
    setExpensesLoading(false);
  };

  // COMMENTED OUT: Full screen event detail pages are temporarily disabled
  // const openEventLanding = () => {
  //   router.push('/events/' + event.id);
  // };

  // Ensure players is always an array for safety
  const safePlayers = Array.isArray(players) ? players : [];

  return (
    <Modal
      closeIcon={<CloseOutlined style={{ color: '#fff', fontSize: 22 }} />}
      open={isShowModal}
      footer={null}
      destroyOnHidden
      maskClosable={true}
      onCancel={onClose}
      width={900}
      styles={{
        mask: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        },
        content: {
          backgroundColor: '#073853',
          borderRadius: '12px',
          color: '#ffffff'
        },
        body: {
          fontSize: '12px',
          padding: '24px'
        }
      }}
    >
      {loading && <Skeleton active />}
      {!loading && (
        <>
          <Flex 
            justify="space-between" 
            align="flex-start" 
            style={{ marginBottom: 16 }}
          >
            <Flex gap={8} align="center">
              <div style={{ 
                fontWeight: 600, 
                fontSize: '20px',
                color: '#ffffff'
              }}>
                {event.name}
              </div>
              {openEdit && (
                <Tooltip title="Edit Event">
                  <EditFilled 
                    style={{ 
                      fontSize: '20px',
                      cursor: 'pointer',
                      color: '#ffffff'
                    }}
                    onClick={openEdit}
                  />
                </Tooltip>
              )}
            </Flex>
          </Flex>
          <Row gutter={24}>
            {/* Left Column */}
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ 
                  fontWeight: 600, 
                  marginBottom: '10px',
                  color: '#ffffff'
                }}>
                  <span 
                    style={{ 
                      backgroundColor: event.eventType?.color || '#1D75D0', 
                      color: event.eventType?.txtColor || '#ffffff',
                      padding: '1px 1px',
                      borderRadius: '3px',
                      fontSize: '12px',
                      marginRight: '8px',
                      fontWeight: 'normal'
                    }}
                  >
                    {event.eventType?.name || 'Event'}
                  </span>
                  <span>
                    {event.isRepeat ? 'Weekly' : 'Only'} on {dayjs(event.startTime).format('dddd')}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '5px',
                  color: '#b0c4d4',
                  fontSize: '14px'
                }}>
                  <CalendarIcon style={{ marginRight: '4px' }} />
                  <span>{dayjs(event.startTime).format('MMM D, h:mm A')}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '16px',
                  color: '#b0c4d4',
                  fontSize: '14px'
                }}>
                  <MapIcon style={{ marginRight: '4px' }} />
                  <span>{event.venue}</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    fontWeight: 600, 
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#1D75D0'
                  }}>
                    <UserIcon style={{ marginRight: '10px' }} />
                    <span>{safePlayers.length} Players</span>
                  </div>
                  {safePlayers.length > 0 && (
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      0 yes, 0 no, {safePlayers.length} awaiting
                    </div>
                  )}
                </div>
                {playerLoading && <Skeleton active />}
                {safePlayers.map((item: Player) => (
                  <Row key={item.id} style={{ color: '#ffffff', marginBottom: '4px' }}>
                    <Col span={8}>👤 {item.name}</Col>
                    <Col span={6}>Going</Col>
                    <Col span={10} style={{ textAlign: 'right' }}>
                      {item.position?.name}
                    </Col>
                  </Row>
                ))}
              </div>
            </Col>
            {/* Right Column */}
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: 600, 
                  marginBottom: '12px',
                  color: '#ffffff'
                }}>
                  Task
                </div>
                <div style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                  padding: '8px 12px', 
                  borderRadius: '8px',
                  color: '#ffffff',
                  marginBottom: 16
                }}>
                  {tasksLoading ? 'Loading...' : tasks.length === 0 ? 'No Linked Tasks' : (
                    <div>
                      {tasks.slice(0, 3).map((task, index) => (
                        <div key={task.id || index} style={{ marginBottom: index < Math.min(tasks.length, 3) - 1 ? '8px' : '0' }}>
                          <div style={{ fontSize: '14px', fontWeight: 500 }}>{task.name}</div>
                          {task.description && (
                            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>{task.description}</div>
                          )}
                        </div>
                      ))}
                      {tasks.length > 3 && (
                        <div 
                          style={{ 
                            marginTop: '8px', 
                            fontSize: '12px', 
                            opacity: 0.8, 
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                          onClick={() => router.push(`/tasks?eventId=${event.id}`)}
                        >
                          & {tasks.length - 3} more...
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: 600, 
                  marginBottom: '12px',
                  color: '#ffffff'
                }}>
                  Expenses
                </div>
                <div style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                  padding: '8px 12px', 
                  borderRadius: '8px',
                  color: '#ffffff',
                  marginBottom: 32
                }}>
                  {expensesLoading ? 'Loading...' : expenses.length === 0 ? 'No Linked Expenses' : (
                    <div>
                      {expenses.slice(0, 3).map((expense, index) => (
                        <div key={expense.id || index} style={{ marginBottom: index < Math.min(expenses.length, 3) - 1 ? '8px' : '0' }}>
                          <div style={{ fontSize: '14px', fontWeight: 500 }}>{expense.merchant}</div>
                          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>
                            ${expense.amount} • {new Date(expense.date).toLocaleDateString()}
                          </div>
                          {expense.description && (
                            <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '2px' }}>{expense.description}</div>
                          )}
                        </div>
                      ))}
                      {expenses.length > 3 && (
                        <div 
                          style={{ 
                            marginTop: '8px', 
                            fontSize: '12px', 
                            opacity: 0.8, 
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                          onClick={() => router.push(`/expenses?eventId=${event.id}`)}
                        >
                          & {expenses.length - 3} more...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Col>
          </Row>
          {/* COMMENTED OUT: Full screen event detail pages are temporarily disabled */}
          {/* <Button 
            type="primary" 
            block 
            onClick={openEventLanding}
            style={{
              backgroundColor: '#1D75D0',
              borderColor: '#1D75D0',
              height: '40px',
              fontWeight: 600,
              marginTop: 8
            }}
          >
            View Full Screen
          </Button> */}
        </>
      )}
    </Modal>
  );
}

export default memo(EventDetailModal);
