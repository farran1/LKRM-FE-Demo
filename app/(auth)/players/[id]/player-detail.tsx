'use client'

import api from '@/services/api'
import { memo, useEffect, useState } from 'react'
import style from './style.module.scss'
import { Button, Card, Col, Flex, Input, Row, Skeleton } from 'antd'
import ArrowIcon from '@/components/icon/arrow_left.svg'
import { useRouter } from 'next/navigation'
import UploadIcon from '@/components/icon/arrow-up-tray.svg'
import SearchIcon from '@/components/icon/search.svg'
import ArrowRiseIcon from '@/components/icon/ArrowRise.svg'
import ArrowFallIcon from '@/components/icon/ArrowFall.svg'
import OffensiveStatsLine from '@/components/offensive-stats-line'
import LineChart from './components/line-chart'
import BarChart from './components/bar-chart'
import DefaultAvatar from '@/components/icon/avatar.svg'
import AddIcon from '@/components/icon/plus-circle.svg'
import Setting from './components/setting'
import EditPlayer from './components/edit-player'
import AddNote from './components/add-note'
import AddGoal from './components/add-goal'


function Detail({
  playerId,
}: {
  playerId: number
}) {
  const [loading, setLoading] = useState(true)
  const [player, setPlayer] = useState<any>(null)
  const router = useRouter()
  const [isShowEditPlayer, showEditPlayer] = useState(false)
  const [isShowAddNote, showAddNote] = useState(false)
  const [isShowAddGoal, showAddGoal] = useState(false)

  const [loadingNote, setLoadingNote] = useState(true)
  const [notes, setNotes] = useState<Array<any>>([])
  const [loadingGoal, setLoadingGoal] = useState(true)
  const [goals, setGoals] = useState<Array<any>>([])

  useEffect(() => {
    if (!playerId) {
      return
    }

    fetchDetail()
    fetchNotes()
    fetchGoals()
  }, [playerId])

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/players/' + playerId)
      setPlayer(res.data.player)
    } catch (error) {
      console.error('Error fetching player:', error)
      setPlayer(null)
    }
    setLoading(false)
  }

  const fetchNotes = async () => {
    setLoadingNote(true)
    try {
      const res = await api.get(`/api/players/${playerId}/notes`)
      setNotes(res.data.notes || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
      setNotes([])
    }
    setLoadingNote(false)
  }

  const fetchGoals = async () => {
    setLoadingGoal(true)
    try {
      const res = await api.get(`/api/players/${playerId}/goals`)
      setGoals(res.data.goals || [])
    } catch (error) {
      console.error('Error fetching goals:', error)
      setGoals([])
    }
    setLoadingGoal(false)
  }

  const goBack = () => {
    router.back()
  }

  const uploadStats = () => {
  }

  const onEdit = () => {
    showEditPlayer(true)
  }

  const addNote = () => {
    showAddNote(true)
  }

  const addGoal = () => {
    showAddGoal(true)
  }

  return (
    <div className={style.container}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
        <Flex align='center' gap={16}>
          <ArrowIcon onClick={goBack} style={{ cursor: 'pointer' }} />
          <div className={style.title}>Players</div>
          {!loading ? <div className={style.playerName}>{'/' + player?.name}</div> : <Skeleton /> }
        </Flex>
        <Flex align='center' gap={10}>
          <Input prefix={<SearchIcon />} placeholder="Search" className={style.search} />
          <Button type="primary" icon={<UploadIcon />} onClick={uploadStats}>Upload Player Stats</Button>
        </Flex>
      </Flex>
      <Flex>
        <div style={{ marginRight: 12, flex: 1 }}>
          <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
            <Col xs={6}>
              <Card className={style.stateGeneral}>
                <div className={style.title}>Rebounds</div>
                <Flex justify='space-between' align='center'>
                  <div className={style.value}>100</div>
                  <div className={style.percent}>+11.01% <ArrowRiseIcon /></div>
                </Flex>
              </Card>
            </Col>
            <Col xs={6}>
              <Card className={style.stateGeneral}>
                <div className={style.title}>Steals</div>
                <Flex justify='space-between' align='center'>
                  <div className={style.value}>120</div>
                  <div className={style.percent}>-0.03% <ArrowFallIcon /></div>
                </Flex>
              </Card>
            </Col>
            <Col xs={6}>
              <Card className={style.stateGeneral}>
                <div className={style.title}>Blocks</div>
                <Flex justify='space-between' align='center'>
                  <div className={style.value}>400</div>
                  <div className={style.percent}>+15.03% <ArrowRiseIcon /></div>
                </Flex>
              </Card>
            </Col>
            <Col xs={6}>
              <Card className={style.stateGeneral}>
                <div className={style.title}>Fouls</div>
                <Flex justify='space-between' align='center'>
                  <div className={style.value}>30</div>
                  <div className={style.percent}>+6.08% <ArrowRiseIcon /></div>
                </Flex>
              </Card>
            </Col>
          </Row>
          <Row gutter={[12, 12]} style={{ marginBottom: 12, maxHeight: 484 }}>
            <Col xs={16}>
              <Card className={style.chart}>
                <LineChart />
              </Card>
            </Col>
            <Col xs={8}>
              <Card className={style.offensiveStats}>
                  <div className={style.title2}>Offensive Stats</div>
                  <Row gutter={12} align='middle'>
                    <Col span={10}>Points scored</Col>
                    <Col span={6}>XXXXX</Col>
                    <Col span={8}><OffensiveStatsLine /></Col>
                  </Row>
                  <Row gutter={12} align='middle'>
                    <Col span={10}>Assists</Col>
                    <Col span={6}>XXXXX</Col>
                    <Col span={8}><OffensiveStatsLine /></Col>
                  </Row>
                  <Row gutter={12} align='middle'>
                    <Col span={10}>FGM/FGA</Col>
                    <Col span={6}>XXXXX</Col>
                    <Col span={8}><OffensiveStatsLine /></Col>
                  </Row>
                  <Row gutter={12} align='middle'>
                    <Col span={10}>TPM/TPA</Col>
                    <Col span={6}>XXXXX</Col>
                    <Col span={8}><OffensiveStatsLine /></Col>
                  </Row>
                  <Row gutter={12} align='middle'>
                    <Col span={10}>FTM/FTA</Col>
                    <Col span={6}>XXXXX</Col>
                    <Col span={8}><OffensiveStatsLine /></Col>
                  </Row>
                  <Row gutter={12} align='middle'>
                    <Col span={10}>Turnovers</Col>
                    <Col span={6}>XXXXX</Col>
                    <Col span={8}><OffensiveStatsLine /></Col>
                  </Row>
              </Card>
            </Col>
          </Row>
          <Row style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card className={style.chart}>
                <BarChart />
              </Card>
            </Col>
          </Row>
        </div>
        <div className={style.right}>
          <Card style={{ marginBottom: 12 }}>
            <Flex justify='space-between'>
              <div className={style.title2}>Profile</div>
              <Setting onEdit={onEdit} />
            </Flex>
            <div className={style.profile}>
              <div className={style.avatar}>
                {!player?.avatar && <DefaultAvatar />}
                {player?.avatar && <img src={player.avatar} loading='lazy' alt='avatar' />}
              </div>
              <div className={style.name}>{player?.name}</div>
              <div className={style.position}>Position: {player?.position?.name}</div>
            </div>
            <Flex gap={12} style={{ marginBottom: 32 }}>
              <Button block onClick={addGoal}>Set Goals</Button>
              <Button block type='primary' onClick={addNote}>Leave a Note</Button>
            </Flex>
            <div className={style.personalInfo}>
              <div className={style.item}>
                <div>Jersey #</div>
                <div className={style.value}>{player?.jersey}</div>
              </div>
              <div className={style.item}>
                <div>Phone Number</div>
                <div className={style.value}>{player?.phoneNumber}</div>
              </div>
              <div className={style.item}>
                <div>Height</div>
                <div className={style.value}>{player?.height}</div>
              </div>
            </div>
            <div className={style.notes}>
              <Flex justify='space-between' style={{ marginBottom: 12 }}>
                <div className={style.title2}>Notes</div>
                <AddIcon className={style.addIcon} onClick={addNote} />
              </Flex>
              {loadingNote && <Skeleton />}
              {!loadingNote && notes && notes.map((item: any) => (
                <div className={style.note} key={item.id}>
                  <div>{item.note}</div>
                  <div className={style.author}>By Coach {item.createdUser.profile.firstName}</div>
                </div>
              ))}
            </div>
            <div className={style.goals}>
              <Flex justify='space-between' style={{ marginBottom: 12 }}>
                <div className={style.title2}>Goals</div>
                <AddIcon className={style.addIcon} onClick={addGoal} />
              </Flex>
              {loadingGoal && <Skeleton />}
              {!loadingGoal && goals && goals.map((item: any) => (
                <div className={style.goal} key={item.id}>
                  <div>{item.note}</div>
                  <div className={style.author}>By Coach {item.createdUser.profile.firstName}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Flex>
      <EditPlayer player={player} isOpen={isShowEditPlayer} showOpen={showEditPlayer} onRefresh={fetchDetail} />
      <AddNote notes={notes} player={player} isOpen={isShowAddNote} showOpen={showAddNote} onRefresh={fetchNotes} />
      <AddGoal goals={goals} player={player} isOpen={isShowAddGoal} showOpen={showAddGoal} onRefresh={fetchGoals} />
    </div>
  )
}

export default memo(Detail)