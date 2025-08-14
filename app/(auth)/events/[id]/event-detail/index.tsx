'use client'

import { Button, Card, Flex, Input, Progress, Skeleton } from 'antd'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import style from './style.module.scss'
import ArrowIcon from '@/components/icon/arrow_left.svg'
import SearchIcon from '@/components/icon/search.svg'
import UploadIcon from '@/components/icon/arrow-up-tray.svg'
import CalendarIcon from '@/components/icon/calendar.svg'
import PlusIcon from '@/components/icon/plus.svg'
import MapIcon from '@/components/icon/map-pin.svg'
import CreditIcon from '@/components/icon/credit-card.svg'
import api from '@/services/api'
import dayjs from 'dayjs'
import BaseTable from '@/components/base-table'
import NewPlayer from '../../components/new-player'
import ProfileIcon from '@/components/icon/profile.svg'
import NewVolunteer from '../../components/new-volunteer'
import { useRouter } from 'next/navigation'
import SortIcon from '@/components/icon/sort.svg'
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'

function EventDetail({
  eventId,
}: {
  eventId: number
}) {
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [playerLoading, setPlayerLoading] = useState(false)
  const [players, setPlayers] = useState([])
  const [isShowNewPlayer, showNewPlayer] = useState(false)
  const [sortHeaderPlayer, setSortHeaderPlayer] = useState<any>(null)

  useEffect(() => {
    if (!eventId) {
      return
    }

    fetchDetail()
    fetchPlayer()
  }, [eventId])

  const fetchDetail = async () => {
    setLoading(true)
    const res = await api.get('/api/events/' + eventId)
    setEvent(res.data.event)
    setLoading(false)
  }

  const fetchPlayer = async (sortParams: any = null) => {
    setPlayerLoading(true)
    let res
    if (sortParams?.sortBy && sortParams?.sortDirection) {
      res = await api.get(`/api/events/${eventId}/players?sortBy=${sortParams.sortBy}&sortDirection=${sortParams.sortDirection}`)
    } else {
      res = await api.get(`/api/events/${eventId}/players`)
    }
    setPlayers(res.data)
    setPlayerLoading(false)
  }

  const addPlayer = () => {
    showNewPlayer(true)
  }

  const sortPlayer = useCallback((sortBy: string, sortDirection = 'desc') => {
    setSortHeaderPlayer({ sortBy, sortDirection })
    fetchPlayer({ sortBy, sortDirection })
    }, [])

  const renderHeaderPlayer = useCallback((title: string, dataIndex: string) => {
    return (
      <Flex className={style.header} justify='space-between' align='center'>
        <span>{title}</span>
        {(!sortHeaderPlayer?.sortBy || sortHeaderPlayer?.sortBy !== dataIndex) && <SortIcon onClick={() => sortPlayer(dataIndex)} />}
        {(sortHeaderPlayer?.sortBy === dataIndex && sortHeaderPlayer?.sortDirection === 'desc') && <ArrowUpOutlined onClick={() => sortPlayer(dataIndex, 'asc')} />}
        {(sortHeaderPlayer?.sortBy === dataIndex && sortHeaderPlayer?.sortDirection === 'asc') && <ArrowDownOutlined onClick={() => sortPlayer(dataIndex, 'desc')} />}
      </Flex>
    )
  }, [sortHeaderPlayer])

  const playerColumns = useMemo(() => [
    {
      title: 'Image',
      render: (data: any) => {
        return data?.avatar ? <img src={data.avatar} width={24} height={24} className={style.avatar} /> : <ProfileIcon />
      }
    },
    {
      title: renderHeaderPlayer('Name', 'name'),
      dataIndex: 'name',
    },
    {
      title: renderHeaderPlayer('Position', 'position'),
      render: (data: any) => {
        return data?.position?.name
      }
    },
    {
      title: renderHeaderPlayer('Jersey #', 'jersey'),
      dataIndex: 'jersey',
    },
    {
      title: renderHeaderPlayer('Weight', 'weight'),
      render: (data: any) => {
        return data?.weight ? data?.weight + 'lb' : ''
      }
    },
    {
      title: 'Status',
      render: (data: any) => {
        return <span className={style.pending}>Pending</span>
      }
    },
  ], [sortHeaderPlayer])

  const refreshPlayer = () => {
    fetchPlayer()
  }

  const goBack = () => {
    router.back()
  }

  const share = () => {
    const link = window.location.origin + window.location.pathname
    const subject = encodeURIComponent('Check this out!')
    const body = encodeURIComponent(`Hi,\n\nI wanted to share the comming event with you.\n\nLink: ${link}`)

    const mailto = `mailto:?subject=${subject}&body=${body}`
    window.location.href = mailto
  }

  return (
    <>
      <div className={style.container}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
          <Flex align='center' gap={16}>
            <ArrowIcon onClick={goBack} style={{ cursor: 'pointer' }} />
            <div className={style.title}>Event Details</div>
          </Flex>
          <Flex align='center' gap={10}>
            {/* <Input prefix={<SearchIcon />} placeholder="Search" className={style.search} /> */}
            <Button type="primary" icon={<UploadIcon />} onClick={share}>Share Event</Button>
          </Flex>
        </Flex>
        <Flex>
          <div style={{ marginRight: 20, flex: 1 }}>
            <Card style={{ marginBottom: 20 }}>
              {loading && <Skeleton />}
              {!loading &&
                <>
                  <Flex align="center" gap={16} style={{ marginBottom: 20 }}>
                    <div className={style.eventName}>{event?.name}</div>
                    <span className={style.eventType} style={{ backgroundColor: event?.eventType.color, color: event?.eventType.txtColor }}>{event?.eventType.name}</span>
                  </Flex>
                  <Flex gap={55} className={style.locationDate}>
                    <Flex gap={12} align="center">
                      <CalendarIcon />
                      <div>
                        <div className={style.subtitle}>Date and Time</div>
                        <div className={style.value}>{dayjs(event?.startTime).format('MMM D, h:mm A')}</div>
                      </div>
                    </Flex>
                    <Flex gap={12} align="center">
                      <MapIcon />
                      <div>
                        <div className={style.subtitle}>Location</div>
                        <div className={style.value}>{event?.venue}</div>
                      </div>
                    </Flex>
                  </Flex>
                  {event?.note &&
                    <div className={style.note}>
                      <div className={style.subtitle}>Additional Notes</div>
                      <div className={style.value}>{event?.note}</div>
                    </div>
                  }
                </>
              }
            </Card>
            <Card>
              <Flex align='center' justify='space-between' style={{ marginBottom: 24 }}>
                <div className={style.title2}>Players</div>
                <Button icon={<PlusIcon />} onClick={addPlayer}>Add Player</Button>
              </Flex>
              <BaseTable
                style={{ marginBottom: 24 }}
                dataSource={players}
                columns={playerColumns}
                loading={playerLoading}
              />
            </Card>
          </div>
          <div className={style.right}>
            <Card style={{ marginBottom: 12 }}>
              <div className={style.title2} style={{ marginBottom: 32 }}>Budget & Expenses</div>
              <div className={style.equiment}>
                <div className={style.title}>Equipment & Uniforms</div>
                <div className={style.value}><CalendarIcon /><span>Quarterly (Jan - March)</span></div>
              </div>
              <div className={style.budget}>
                <Flex justify='space-between' className={style.title}>
                  <div>Total Budget</div>
                  <div>$5,200</div>
                </Flex>
                <Flex justify='space-between' className={style.value}>
                  <div>Expenses</div>
                  <div>$7,900</div>
                </Flex>
                <Progress percent={50} showInfo={false} strokeColor='#F59E0C' />
                <Flex justify='space-between' className={style.value}>
                  <div>Budget Remaining</div>
                  <div>$2,100</div>
                </Flex>
                <Progress percent={50} showInfo={false} strokeColor='#fff' />
              </div>
              <div className={style.receipt}>
                <div className={style.title2} style={{ marginBottom: 32 }}>Receipts</div>
                <div className={style.tool}>
                  <Flex align='center'>
                    <img src="/imgs/bill.png" alt="login_bg.jpg" loading="lazy" />
                    <div>
                      <div className={style.title}>New Tools Purchase</div>
                      <div className={style.value}>$ 450 Mar . 12, 2025</div>
                    </div>
                  </Flex>
                </div>
                <div className={style.tool}>
                  <Flex align='center'>
                    <img src="/imgs/bill.png" alt="login_bg.jpg" loading="lazy" />
                    <div>
                      <div className={style.title}>New Tools Purchase</div>
                      <div className={style.value}>$ 450 Mar . 12, 2025</div>
                    </div>
                  </Flex>
                </div>
              </div>
            </Card>
            <Card>
              <div className={style.title2} style={{ marginBottom: 32 }}>Tasks</div>
              <div className={style.task}>
                <Flex align='center'>
                  <CreditIcon />
                  <div>
                    <div className={style.title}>Strength Training</div>
                    <div className={style.value}>👤 Jake Reynolds</div>
                  </div>
                </Flex>
              </div>
              <div className={style.task}>
                <Flex align='center'>
                  <CreditIcon />
                  <div>
                    <div className={style.title}>Strength Training</div>
                    <div className={style.value}>👤 Jake Reynolds</div>
                  </div>
                </Flex>
              </div>
              <div className={style.task}>
                <Flex align='center'>
                  <CreditIcon />
                  <div>
                    <div className={style.title}>Strength Training</div>
                    <div className={style.value}>👤 Jake Reynolds</div>
                  </div>
                </Flex>
              </div>
            </Card>
          </div>
        </Flex>
      </div>
      <NewPlayer isOpen={isShowNewPlayer} showOpen={showNewPlayer} onRefresh={refreshPlayer} eventId={eventId} />
    </>
  )
}

export default memo(EventDetail)