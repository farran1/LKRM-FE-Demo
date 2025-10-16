'use client';

import { Button, Col, ColorPicker, Flex, Form, Input, Modal, Row, Skeleton, Tooltip, List, Typography } from 'antd';
import { memo, useEffect, useState } from 'react';
import style from './style.module.scss';
import CloseIcon from '@/components/icon/close.svg';
import CalendarIcon from '@/components/icon/calendar.svg';
import MapIcon from '@/components/icon/map-pin.svg';
import UserIcon from '@/components/icon/users-round.svg';
import TaskIcon from '@/components/icon/credit-card.svg';
import TrashIcon from '@/components/icon/trash.svg';
import api from '@/services/api';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { EditFilled } from '@ant-design/icons';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import TaskDetailModal from '../../tasks/components/detail-modal';

interface Event {
  id: number;
  name: string;
  eventType?: {
    color?: string;
    txtColor?: string;
    name?: string;
  };
  event_types?: {
    color?: string;
    txtColor?: string;
    name?: string;
  };
  isRepeat?: boolean;
  repeatType?: string;
  startTime: string;
  venue?: string;
  event_coaches?: Array<{coachUsername: string}>;
}


interface EventDetailModalProps {
  isShowModal: boolean;
  onClose: () => void;
  event: Event | null;
  openEdit?: () => void;
  onDelete?: (eventId: number) => Promise<void>;
}

function EventDetailModal({ isShowModal, onClose, event, openEdit, onDelete }: EventDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Task detail modal state
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    if (!event) {
      return;
    }

    // always fetch tasks and expenses linked to this event
    fetchTasks();
    fetchExpenses();
  }, [event]);

  // Don't render if no event is selected
  if (!event) {
    return null;
  }


  const fetchTasks = async () => {
    try {
      const res = await api.get('/api/tasks', { params: { eventId: event.id } });
      // normalize envelope { data } or direct array
      const list = Array.isArray((res as any)?.data) ? (res as any).data : (Array.isArray((res as any)?.data?.data) ? (res as any).data.data : []);
      setTasks(list);
    } catch (e) {
      setTasks([]);
    }
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

  const handleDeleteEvent = async () => {
    if (!event || !onDelete) return;

    setDeleteLoading(true);
    try {
      await onDelete(event.id);
      setShowDeleteModal(false);
      onClose(); // Close the detail modal after successful deletion
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTaskClick = async (task: any) => {
    try {
      // Fetch full task details
      const taskRes = await api.get(`/api/tasks/${task.userId || task.id}`);
      if (taskRes.status === 200) {
        const taskData = taskRes.data as { data: { task: any } };
        setSelectedTask(taskData.data.task);
        setIsTaskDetailOpen(true);
      } else {
        console.error('Failed to fetch task details');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
    }
  };

  const handleTaskDetailClose = () => {
    setIsTaskDetailOpen(false);
    setSelectedTask(null);
  };


  return (
    <Modal
      closeIcon={null}
      open={isShowModal}
      footer={null}
      className={style.container}
      destroyOnHidden
      maskClosable={true}
      onCancel={onClose}
      zIndex={2000}
    >
      {loading && <Skeleton active />}
      {!loading && (
        <>
          <Flex className={style.header} justify="space-between" align='center' style={{ marginBottom: 16 }}>
            <Flex align="center" gap={12}>
              <div className={style.title}>{event?.name}</div>
              <Flex align="center" gap={8}>
                <Tooltip title="Edit Event">
                  <EditFilled 
                    className={style.edit} 
                    onClick={openEdit}
                    style={{ 
                      cursor: 'pointer', 
                      color: '#1890ff',
                      fontSize: '16px'
                    }}
                  />
                </Tooltip>
                {onDelete && (
                  <Tooltip title="Delete Event">
                    <TrashIcon 
                      onClick={() => setShowDeleteModal(true)}
                      style={{ 
                        cursor: 'pointer', 
                        color: '#ff4d4f',
                        width: '16px',
                        height: '16px'
                      }}
                    />
                  </Tooltip>
                )}
              </Flex>
            </Flex>
            <CloseIcon onClick={onClose} />
          </Flex>
          <div>
            <div className={style.subtitle}>
              <span className={style.eventType} style={{ backgroundColor: event?.event_types?.color || event?.eventType?.color || '#1890ff', color: '#ffffff' }}>
                {event?.event_types?.name || event?.eventType?.name || 'Unknown'}
              </span>
              <span>{event?.isRepeat ? (event?.repeatType || 'Weekly') : 'Only'} on {dayjs(event?.startTime).format('dddd')}</span>
            </div>
            <div className={style.time}>
              <CalendarIcon /><span>{dayjs(event?.startTime).format('MMM D, h:mm A')}</span>
            </div>
            <div className={style.address}>
              <MapIcon /><span>{event?.venue}</span>
            </div>
            {(event?.event_types?.name?.toLowerCase() === 'meeting' || event?.event_types?.name?.toLowerCase() === 'practice' || event?.event_types?.name?.toLowerCase() === 'workout' || 
              event?.eventType?.name?.toLowerCase() === 'meeting' || event?.eventType?.name?.toLowerCase() === 'practice' || event?.eventType?.name?.toLowerCase() === 'workout') && (
              <div className={style.sectionPlayer}>
                <Flex justify="space-between" align="center" className={style.header}>
                  <div className={style.title}><UserIcon /><span>Attendees:</span></div>
                </Flex>
                {event?.event_coaches && event.event_coaches.length > 0 ? (
                  <div style={{ padding: '8px 0' }}>
                    {event.event_coaches.map((coach: any, index: number) => (
                      <div key={index} className={style.task}>
                        <Flex align='center'>
                          <UserIcon />
                          <div>
                            <div className={style.title}>{coach.coachUsername}</div>
                            <div className={style.value}>Coach</div>
                          </div>
                        </Flex>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#666', fontSize: '14px', padding: '8px 0' }}>
                    No coaches assigned
                  </div>
                )}
              </div>
            )}
            <div className={style.line}></div>
            <div className={style.sectionTask}>
              <Typography.Title level={5} className={style.title}>Tasks</Typography.Title>
              <List
                className={style.taskList}
                loading={false}
                dataSource={tasks.slice(0, 2)}
                locale={{ emptyText: 'No tasks linked to this event.' }}
                renderItem={(item) => (
                  <List.Item 
                    className={style.taskItem} 
                    onClick={() => handleTaskClick(item)}
                    style={{ cursor: 'pointer' }}
                  >
                    <List.Item.Meta
                      title={
                        <span className={style.taskTitle}>
                          {(() => {
                            const title = item.name || 'Untitled Task'
                            return title.length > 35 ? `${title.substring(0, 35)}...` : title
                          })()}
                        </span>
                      }
                      description={
                        <span className={style.taskMeta}>
                          {(() => {
                            const parts = []
                            if (item.description) {
                              parts.push(item.description)
                            }
                            if (item.dueDate) {
                              parts.push(new Date(item.dueDate).toLocaleDateString())
                            }
                            if (item.task_priorities?.name) {
                              parts.push(item.task_priorities.name)
                            }
                            return parts.join(' • ')
                          })()}
                        </span>
                      }
                    />
                    <div className={`${style.taskStatus} ${style[item.status]}`}>
                      {item.status}
                    </div>
                  </List.Item>
                )}
              />
              {tasks.length > 2 && (
                <div 
                  className={style.moreButton}
                  onClick={() => {
                    router.push(`/tasks?eventId=${event.id}`)
                    onClose()
                  }}
                >
                  & {tasks.length - 2} more...
                </div>
              )}
            </div>
            <div className={style.sectionExpenses}>
              <Typography.Title level={5} className={style.title}>Expenses</Typography.Title>
              <List
                className={style.expenseList}
                loading={expensesLoading}
                dataSource={expenses.slice(0, 2)}
                locale={{ emptyText: 'No expenses linked to this event.' }}
                renderItem={(item) => (
                  <List.Item 
                    className={style.expenseItem} 
                    onClick={() => router.push(`/expenses/${item.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <List.Item.Meta
                      title={
                        <span className={style.expenseTitle}>
                          {(() => {
                            const title = item.description || item.merchant || 'Untitled Expense'
                            return title.length > 35 ? `${title.substring(0, 35)}...` : title
                          })()}
                        </span>
                      }
                      description={
                        <span className={style.expenseMeta}>
                          {(() => {
                            const parts = []
                            if (item.merchant && item.description !== item.merchant) {
                              parts.push(item.merchant)
                            }
                            if (item.date) {
                              parts.push(new Date(item.date).toLocaleDateString())
                            }
                            if (item.budgets?.name) {
                              parts.push(item.budgets.name)
                            }
                            return parts.join(' • ')
                          })()}
                        </span>
                      }
                    />
                    <div className={style.expenseAmount}>
                      ${Number(item.amount || 0).toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </div>
                  </List.Item>
                )}
              />
              {expenses.length > 2 && (
                <div 
                  className={style.moreButton}
                  onClick={() => {
                    router.push(`/expenses?eventId=${event.id}`)
                    onClose()
                  }}
                >
                  & {expenses.length - 2} more...
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      <DeleteConfirmationModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteEvent}
        title="Delete Event"
        itemName={event?.name || ''}
        itemType="event"
        loading={deleteLoading}
      />
      
      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isShowModal={isTaskDetailOpen}
          onClose={handleTaskDetailClose}
        />
      )}
    </Modal>
  );
}

export default memo(EventDetailModal);
