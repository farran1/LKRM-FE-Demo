import { Button, Col, ColorPicker, Flex, Form, Input, Modal, Row, Skeleton, Tooltip } from 'antd'
import { memo, useEffect, useState } from 'react'
import style from './style.module.scss'
import CloseIcon from '@/components/icon/close.svg'
import CalendarIcon from '@/components/icon/calendar.svg'
import MapIcon from '@/components/icon/map-pin.svg'
import UserIcon from '@/components/icon/users-round.svg'
import TaskIcon from '@/components/icon/credit-card.svg'
import api from '@/services/api'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { EditFilled } from '@ant-design/icons'

function EventDetailModal({isShowModal, onClose, event, openEdit}: any) {
  // const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [playerLoading, setPlayerLoading] = useState(false)
  const [players, setPlayers] = useState<Array<{id: number, name: string, position: string}>>([]);
  const [tasks, setTasks] = useState<Array<any>>([])
  const router = useRouter()

  useEffect(() => {
    if (!event) {
      return
    }

    // fetch attendees/coaches only for meeting/practice types
    const type = event?.event_types?.name?.toLowerCase()
    if (type === 'meeting' || type === 'practice' || type === 'workout') {
      fetchPlayer()
    }
    // always fetch tasks linked to this event
    fetchTasks()
  }, [event])

  // const fetchDetail = async () => {
  //   setLoading(true)
  //   const res = await api.get('/api/events/' + eventId)
  //   setEvent(res.data.event)
  //   setLoading(false)
  // }

  const fetchPlayer = async () => {
    setPlayerLoading(true)
    // Use originalEventId for recurring instances, otherwise use the regular id
    const eventId = event.originalEventId || event.id
    const res = await api.get(`/api/events/${eventId}/players`)
    setPlayers((res as any).data.data)
    setPlayerLoading(false)
  }

  const fetchTasks = async () => {
    try {
      // Use originalEventId for recurring instances, otherwise use the regular id
      const eventId = event.originalEventId || event.id
      const res = await api.get('/api/tasks', { params: { eventId: eventId } })
      // normalize envelope { data } or direct array
      const list = Array.isArray((res as any)?.data) ? (res as any).data : (Array.isArray((res as any)?.data?.data) ? (res as any).data.data : [])
      setTasks(list)
    } catch (e) {
      setTasks([])
    }
  }

  const openEventLanding = () => {
    router.push('/events/' + event.id)
  }

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
          <Flex className={style.header} justify="space-between" align='flex-end' style={{ marginBottom: 16 }}>
            <Flex gap={8}>
              <div className={style.title}>{event?.name}</div>
              <Tooltip title="Edit Event">
                <EditFilled className={style.edit} onClick={openEdit} />
              </Tooltip>
            </Flex>
            <CloseIcon onClick={onClose} />
          </Flex>
          <div>
            <div className={style.subtitle}>
              <span className={style.eventType} style={{ backgroundColor: event?.event_types?.color || '#1890ff', color: '#ffffff' }}>{event?.event_types?.name || 'Unknown'}</span>
              <span>{event?.isRepeat ? 'Weekly' : 'Only'} on {dayjs(event?.startTime).format('dddd')}</span>
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
                  <div className={style.title}><UserIcon /><span>{players?.length || 0} Coaches</span></div>
                </Flex>
                {playerLoading && <Skeleton active />}
                {players && players.map((item: any) => (
                  <Row key={item.id}>
                    <Col span={14}>👤 {item.name}</Col>
                    <Col span={10} style={{ textAlign: 'right' }}>{item.position?.name || ''}</Col>
                  </Row>
                ))}
              </div>
            )}
            <div className={style.line}></div>
            <div className={style.sectionBudget}>
              <div className={style.title}>Budget</div>
              <div className={style.card}>No Expected Spends</div>
            </div>
            <div className={style.sectionTask}>
              <div className={style.title}>Tasks</div>
              {tasks.length === 0 && <div className={style.card}>No Tasks Linked</div>}
              {tasks.map((t) => (
                <div key={t.userId || t.id} className={style.task}>
                  <Flex align='center'>
                    <TaskIcon />
                    <div>
                      <div className={style.title}>{t.name}</div>
                      <div className={style.value}>{t.users?.username ? `👤 ${t.users.username}` : ''}</div>
                    </div>
                  </Flex>
                </div>
              ))}
            </div>
            <div className={style.sectionExpenses}>
              <div className={style.title}>Expenses</div>
              <div className={style.card}>No Expenses Linked</div>
            </div>
            <Button type="primary" block onClick={openEventLanding}>
              View Full Screen
            </Button>
          </div>
        </>
      }
    </Modal>
  )
}

export default memo(EventDetailModal)