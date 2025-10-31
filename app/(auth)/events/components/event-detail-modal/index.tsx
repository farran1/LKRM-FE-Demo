import { Button, Col, ColorPicker, Flex, Form, Input, Modal, Row, Skeleton, Tooltip, List, Typography } from 'antd'
import { memo, useEffect, useState } from 'react'
import style from './style.module.scss'
import CloseIcon from '@/components/icon/close.svg'
import CalendarIcon from '@/components/icon/calendar.svg'
import MapIcon from '@/components/icon/map-pin.svg'
import UserIcon from '@/components/icon/users-round.svg'
import TaskIcon from '@/components/icon/credit-card.svg'
import TrashIcon from '@/components/icon/trash.svg'
import api from '@/services/api'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { EditFilled } from '@ant-design/icons'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'

function EventDetailModal({isShowModal, onClose, event, openEdit, onDelete}: any) {
  // const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState<Array<any>>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [expenses, setExpenses] = useState<Array<any>>([])
  const [expensesLoading, setExpensesLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!event || !isShowModal) {
      return
    }

    // always fetch tasks and expenses linked to this event
    fetchTasks()
    fetchExpenses()
  }, [event, isShowModal])

  // const fetchDetail = async () => {
  //   setLoading(true)
  //   const res = await api.get('/api/events/' + eventId)
  //   setEvent(res.data.event)
  //   setLoading(false)
  // }


  const fetchTasks = async () => {
    if (!event?.id) return
    
    setTasksLoading(true)
    try {
      // Use originalEventId for recurring instances, otherwise use the regular id
      const eventId = event.id
      const res = await api.get('/api/tasks', { params: { eventId: eventId } })
      // normalize envelope { data } or direct array
      const list = Array.isArray((res as any)?.data) ? (res as any).data : (Array.isArray((res as any)?.data?.data) ? (res as any).data.data : [])
      setTasks(list)
    } catch (e) {
      console.error('Error fetching tasks for event:', e)
      setTasks([])
    } finally {
      setTasksLoading(false)
    }
  }

  const fetchExpenses = async () => {
    setExpensesLoading(true)
    try {
      // Use originalEventId for recurring instances, otherwise use the regular id
      const eventId = event.id
      const res = await api.get(`/api/events/${eventId}/expenses`)
      const expensesData = (res as any)?.data?.data || []
      setExpenses(Array.isArray(expensesData) ? expensesData : [])
    } catch (e) {
      setExpenses([])
    }
    setExpensesLoading(false)
  }

  // COMMENTED OUT: Full screen event detail pages are temporarily disabled
  // const openEventLanding = () => {
  //   router.push('/events/' + event.id)
  // }

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

  return (
    <Modal
      closeIcon={null}
      open={isShowModal}
      footer={null}
      className={style.container}
      destroyOnHidden
      maskClosable={true}
      onCancel={onClose}
    >
      {loading && <Skeleton active />}
      {!loading &&
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
              <span className={style.eventType} style={{ backgroundColor: event?.event_types?.color || '#1890ff', color: '#ffffff' }}>{event?.event_types?.name || 'Unknown'}</span>
              <span>{event?.isRepeat ? (event?.repeatType || 'Weekly') : 'Only'} on {dayjs(event?.startTime).format('dddd')}</span>
            </div>
            <div className={style.time}>
              <CalendarIcon /><span>{dayjs(event?.startTime).format('MMM D, h:mm A')}</span>
            </div>
            <div className={style.address}>
              <MapIcon /><span>{event?.venue}</span>
            </div>
            {(event?.event_types?.name?.toLowerCase() === 'meeting' || event?.event_types?.name?.toLowerCase() === 'practice' || event?.event_types?.name?.toLowerCase() === 'workout') && (
              <div className={style.sectionPlayer}>
                <Flex justify="space-between" align="center" className={style.header}>
                  <div className={style.title}><UserIcon /><span>Attendees:</span></div>
                </Flex>
                {event?.event_coaches && event.event_coaches.length > 0 ? (
                  <div style={{ padding: '8px 0' }}>
                    {event.event_coaches.map((coach: any, index: number) => {
                      const coachName = coach?.user?.name || coach?.user?.full_name || 
                        `${coach?.user?.first_name || ''} ${coach?.user?.last_name || ''}`.trim() || 
                        coach.coachUsername?.split('@')[0] || 'Coach'
                      const coachEmail = coach?.user?.email || coach.coachUsername
                      const coachAvatar = coach?.user?.avatar_url
                      const initials = coachName
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)

                      return (
                        <div key={index} className={style.task} style={{ marginBottom: '12px' }}>
                          <Flex align='center' gap={12}>
                            {coachAvatar ? (
                              <img 
                                src={coachAvatar} 
                                alt={coachName}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 600,
                                flexShrink: 0
                              }}>
                                {initials}
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className={style.title} style={{ marginBottom: '4px' }}>{coachName}</div>
                              <div className={style.value} style={{ fontSize: '12px', color: '#999' }}>{coachEmail}</div>
                            </div>
                          </Flex>
                        </div>
                      )
                    })}
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
                loading={tasksLoading}
                dataSource={tasks.slice(0, 2)}
                locale={{ emptyText: 'No tasks linked to this event.' }}
                renderItem={(item) => (
                  <List.Item 
                    className={style.taskItem} 
                    onClick={() => router.push(`/tasks/${item.userId || item.id}`)}
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
            {/* COMMENTED OUT: Full screen event detail pages are temporarily disabled */}
            {/* <Button type="primary" block onClick={openEventLanding}>
              View Full Screen
            </Button> */}
          </div>
        </>
      }
      
      <DeleteConfirmationModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteEvent}
        title="Delete Event"
        itemName={event?.name || ''}
        itemType="event"
        loading={deleteLoading}
      />
    </Modal>
  )
}

export default memo(EventDetailModal)