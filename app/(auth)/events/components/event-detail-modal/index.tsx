import { Button, Col, ColorPicker, Flex, Form, Input, Modal, Row, Skeleton, Tooltip } from 'antd'
import { memo, useEffect, useState } from 'react'
import style from './style.module.scss'
import CloseIcon from '@/components/icon/close.svg'
import CalendarIcon from '@/components/icon/calendar.svg'
import MapIcon from '@/components/icon/map-pin.svg'
import UserIcon from '@/components/icon/users-round.svg'
import api from '@/services/api'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { EditFilled } from '@ant-design/icons'

function EventDetailModal({isShowModal, onClose, event, openEdit}: any) {
  // const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [playerLoading, setPlayerLoading] = useState(false)
  const [players, setPlayers] = useState([])
  const router = useRouter()

  useEffect(() => {
    if (!event) {
      return
    }

    // fetchDetail()
    fetchPlayer()
  }, [event])

  // const fetchDetail = async () => {
  //   setLoading(true)
  //   const res = await api.get('/api/events/' + eventId)
  //   setEvent(res.data.event)
  //   setLoading(false)
  // }

  const fetchPlayer = async () => {
    setPlayerLoading(true)
    const res = await api.get(`/api/events/${event.id}/players`)
    setPlayers(res.data.data)
    setPlayerLoading(false)
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
              <span className={style.eventType} style={{ backgroundColor: event?.eventType.color, color: event?.eventType.txtColor }}>{event?.eventType.name}</span>
              <span>{event?.isRepeat ? 'Weekly' : 'Only'} on {dayjs(event?.startTime).format('dddd')}</span>
            </div>
            <div className={style.time}>
              <CalendarIcon /><span>{dayjs(event?.startTime).format('MMM D, h:mm A')}</span>
            </div>
            <div className={style.address}>
              <MapIcon /><span>{event?.venue}</span>
            </div>
            <div className={style.sectionPlayer}>
              <Flex justify="space-between" align="center" className={style.header}>
                <div className={style.title}><UserIcon /><span>{players.length} Players</span></div>
                {players.length > 0 && <div>0 yes, 0 no, {players.length} awaiting</div>}
              </Flex>
              {playerLoading && <Skeleton active />}
              {players.map((item: any) =>
                <Row key={item.id}>
                  <Col span={8}>👤 {item.name}</Col>
                  <Col span={6}>Going</Col>
                  <Col span={10} style={{ textAlign: 'right' }}>{item.position.name}</Col>
                </Row>
              )}
            </div>
            <div className={style.line}></div>
            <div className={style.sectionBudget}>
              <div className={style.title}>Budget</div>
              <div className={style.card}>Empty</div>
            </div>
            <div className={style.sectionTask}>
              <div className={style.title}>Task</div>
              <div className={style.card}>Empty</div>
            </div>
            <div className={style.sectionExpenses}>
              <div className={style.title}>Expenses</div>
              <div className={style.card}>Empty</div>
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