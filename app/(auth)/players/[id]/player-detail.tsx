'use client'

import api from '@/services/api'
import { memo, useEffect, useState } from 'react'
import style from './style.module.scss'
import { Button, Card, Col, Flex, Row, Skeleton, Select, DatePicker, Divider, Alert, Table } from 'antd'
import ArrowIcon from '@/components/icon/arrow_left.svg'
import { useRouter } from 'next/navigation'
 
 
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

  // const ComingSoonOverlay = () => (
  //   <div
  //     style={{
  //       position: 'absolute',
  //       inset: 0,
  //       background: 'rgba(23, 55, 92, 0.55)',
  //       backdropFilter: 'blur(4px)',
  //       WebkitBackdropFilter: 'blur(4px)',
  //       borderRadius: 8,
  //       display: 'flex',
  //       alignItems: 'center',
  //       justifyContent: 'center',
  //       zIndex: 2,
  //     }}
  //   >
  //     <div
  //       style={{
  //         padding: '12px 18px',
  //         borderRadius: 12,
  //         border: '1px solid rgba(255,255,255,0.25)',
  //         background: 'rgba(0,0,0,0.25)',
  //         color: '#fff',
  //         fontWeight: 600,
  //         letterSpacing: 0.3,
  //       }}
  //     >
  //       Player Stat Profile View Coming Soon...
  //     </div>
  //   </div>
  // )

  const [loadingNote, setLoadingNote] = useState(true)
  const [notes, setNotes] = useState<Array<any>>([])
  const [loadingGoal, setLoadingGoal] = useState(true)
  const [goals, setGoals] = useState<Array<any>>([])
  const [stats, setStats] = useState<any>(null)
  const [timeRange, setTimeRange] = useState<'season' | 'last30days' | 'custom'>('season')
  const [customRange, setCustomRange] = useState<[string, string] | null>(null)

  useEffect(() => {
    if (!playerId) {
      return
    }

    fetchDetail()
    fetchNotes()
    fetchGoals()
    fetchStats()
  }, [playerId])
  useEffect(() => {
    if (!playerId) return
    fetchStats()
  }, [playerId, timeRange, customRange])

  const fetchStats = async () => {
    try {
      const params: any = { season: '2024-25', timeRange, _: Date.now() }
      if (timeRange === 'custom' && customRange) {
        params.startDate = customRange[0]
        params.endDate = customRange[1]
      }
      const res: any = await api.get(`/api/stats/player/${playerId}`, { params })
      setStats(res.data)
    } catch (e) {
      console.error('Failed to load player stats', e)
      setStats(null)
    }
  }

  const fetchDetail = async () => {
    setLoading(true)
    console.log('Fetching player details for ID:', playerId)
    try {
      const res: any = await api.get('/api/players/' + playerId)
      console.log('Player API response:', res)
      console.log('Player data:', res.data)
      setPlayer(res.data.player || res.data.data)
    } catch (error) {
      console.error('Error fetching player:', error)
      setPlayer(null)
    }
    setLoading(false)
  }

  const fetchNotes = async () => {
    setLoadingNote(true)
    console.log('Fetching notes for player ID:', playerId)
    try {
      const res: any = await api.get(`/api/players/${playerId}/notes`)
      console.log('Notes API response:', res.data)
      console.log('Notes data structure:', JSON.stringify(res.data, null, 2))
      console.log('Notes array:', res.data.notes)
      setNotes(res.data.notes || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
      setNotes([])
    }
    setLoadingNote(false)
  }

  const fetchGoals = async () => {
    setLoadingGoal(true)
    console.log('Fetching goals for player ID:', playerId)
    try {
      const res: any = await api.get(`/api/players/${playerId}/goals`)
      console.log('Goals API response:', res.data)
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

  const onChangeTimeRange = (val: any) => {
    setTimeRange(val)
    if (val !== 'custom') {
      setCustomRange(null)
    }
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
          {!loading && player ? (
            <div className={style.title}>
              {player.first_name && player.last_name 
                ? `${player.first_name} ${player.last_name}`
                : player.name || 'Player'
              }
            </div>
          ) : (
            <Skeleton.Input style={{ width: 200 }} active />
          )}
        </Flex>
        <Flex align='center' gap={10}>
          <Select
            value={timeRange}
            onChange={onChangeTimeRange}
            options={[
              { label: 'Season', value: 'season' },
              { label: 'Last 30 days', value: 'last30days' },
              { label: 'Custom Range', value: 'custom' },
            ]}
            style={{ width: 160 }}
          />
          {timeRange === 'custom' && (
            <DatePicker.RangePicker onChange={(v:any)=>{
              if (!v || v.length!==2) { setCustomRange(null); return }
              setCustomRange([v[0].format('YYYY-MM-DD'), v[1].format('YYYY-MM-DD')])
            }} />
          )}
        </Flex>
      </Flex>
      <Flex>
        <div style={{ marginRight: 12, flex: 1, position: 'relative' }}>
          <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
            <Col xs={6}>
              <Card className={style.stateGeneral}>
                <div className={style.title}>Rebounds</div>
                <Flex justify='space-between' align='center'>
                  <div className={style.value}>{stats?.rebounds ?? 0}</div>
                </Flex>
              </Card>
            </Col>
            <Col xs={6}>
              <Card className={style.stateGeneral}>
                <div className={style.title}>Steals</div>
                <Flex justify='space-between' align='center'>
                  <div className={style.value}>{stats?.steals ?? 0}</div>
                </Flex>
              </Card>
            </Col>
            <Col xs={6}>
              <Card className={style.stateGeneral}>
                <div className={style.title}>Blocks</div>
                <Flex justify='space-between' align='center'>
                  <div className={style.value}>{stats?.blocks ?? 0}</div>
                </Flex>
              </Card>
            </Col>
            <Col xs={6}>
              <Card className={style.stateGeneral}>
                <div className={style.title}>Fouls</div>
                <Flex justify='space-between' align='center'>
                  <div className={style.value}>{stats?.fouls ?? 0}</div>
                </Flex>
              </Card>
            </Col>
          </Row>
          <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
            <Col xs={24}>
              <Card className={style.chart}>
                <div className={style.title2}>Stat Summary</div>
                <Divider style={{ margin: '12px 0' }} />
                {stats && stats.games === 0 ? (
                  <Alert type="info" message="No games in selected range" showIcon />
                ) : (
                <Row gutter={[12, 12]}>
                  <Col xs={12} md={6}><strong>Games</strong><div>{stats?.games ?? 0}</div></Col>
                  <Col xs={12} md={6}><strong>Points</strong><div>{stats?.points ?? 0}</div></Col>
                  <Col xs={12} md={6}><strong>Assists</strong><div>{stats?.assists ?? 0}</div></Col>
                  <Col xs={12} md={6}><strong>Rebounds</strong><div>{stats?.rebounds ?? 0}</div></Col>
                  <Col xs={12} md={6}><strong>Steals</strong><div>{stats?.steals ?? 0}</div></Col>
                  <Col xs={12} md={6}><strong>Blocks</strong><div>{stats?.blocks ?? 0}</div></Col>
                  <Col xs={12} md={6}><strong>Fouls</strong><div>{stats?.fouls ?? 0}</div></Col>
                  <Col xs={12} md={6}><strong>Turnovers</strong><div>{stats?.turnovers ?? 0}</div></Col>
                  <Col xs={12} md={8}><strong>FG</strong><div>{stats ? `${stats.fg?.made||0}/${stats.fg?.att||0} (${stats.fg?.pct||0}%)` : '-'}</div></Col>
                  <Col xs={12} md={8}><strong>3PT</strong><div>{stats ? `${stats.tp?.made||0}/${stats.tp?.att||0} (${stats.tp?.pct||0}%)` : '-'}</div></Col>
                  <Col xs={12} md={8}><strong>FT</strong><div>{stats ? `${stats.ft?.made||0}/${stats.ft?.att||0} (${stats.ft?.pct||0}%)` : '-'}</div></Col>
                </Row>
                )}
              </Card>
            </Col>
          </Row>
          <Row style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card className={style.chart}>
                <div className={style.title2}>Per-Game Log</div>
                <Divider style={{ margin: '12px 0' }} />
                <Table
                  size="small"
                  pagination={{ pageSize: 10 }}
                  rowKey={(r:any)=>`${r.gameId}-${r.date}`}
                  dataSource={stats?.perGame || []}
                  columns={[
                    { title: 'Date', dataIndex: 'date' },
                    { title: 'PTS', dataIndex: 'points' },
                    { title: 'REB', dataIndex: 'rebounds' },
                    { title: 'AST', dataIndex: 'assists' },
                    { title: 'STL', dataIndex: 'steals' },
                    { title: 'BLK', dataIndex: 'blocks' },
                    { title: 'TOV', dataIndex: 'turnovers' },
                    { title: 'FLS', dataIndex: 'fouls' },
                    { title: 'FG', render: (r:any)=>`${r.fgMade}/${r.fgAtt}` },
                    { title: '3PT', render: (r:any)=>`${r.tpMade}/${r.tpAtt}` },
                    { title: 'FT', render: (r:any)=>`${r.ftMade}/${r.ftAtt}` },
                  ]}
                />
              </Card>
            </Col>
          </Row>
          {/* <ComingSoonOverlay /> */}
        </div>
        <div className={style.right}>
          <Card style={{ marginBottom: 12 }}>
            <Flex justify='space-between'>
              <div className={style.title2}>Profile</div>
              <Setting onEdit={onEdit} player={player} />
            </Flex>
            <Flex gap={12} style={{ marginBottom: 16 }}>
              <Button block onClick={addGoal}>Set Goals</Button>
              <Button block type='primary' onClick={addNote}>Leave a Note</Button>
            </Flex>
            <div className={style.name} style={{ marginBottom: 16, fontSize: '1.2rem', fontWeight: 600, textAlign: 'center' }}>
              {player?.first_name && player?.last_name 
                ? `${player.first_name} ${player.last_name}`
                : player?.name || 'Player'
              }
            </div>
            <div className={style.personalInfo}>
              <div className={style.item}>
                <div>Position</div>
                <div className={style.value}>{player?.position?.name || 'Not assigned'}</div>
              </div>
              <div className={style.item}>
                <div>Jersey #</div>
                <div className={style.value}>{player?.jersey_number || player?.jersey || 'Not assigned'}</div>
              </div>
              <div className={style.item}>
                <div>School Year</div>
                <div className={style.value}>
                  {player?.school_year 
                    ? player.school_year.charAt(0).toUpperCase() + player.school_year.slice(1)
                    : 'Not assigned'
                  }
                </div>
              </div>
            </div>
            <div className={style.notes}>
              <Flex justify='space-between' style={{ marginBottom: 12 }}>
                <div className={style.title2}>Notes</div>
                <AddIcon className={style.addIcon} onClick={addNote} />
              </Flex>
              {loadingNote && <Skeleton />}
              {!loadingNote && notes && notes.map((item: any, idx: number) => (
                <div className={style.note} key={`${item.id}-${item.created_at || item.createdAt || idx}`}>
                  <div>{item.note || item.note_text || 'No content'}</div>
                  <div className={style.author}>By Coach Andrew</div>
                </div>
              ))}
            </div>
            <div className={style.goals}>
              <Flex justify='space-between' style={{ marginBottom: 12 }}>
                <div className={style.title2}>Goals</div>
                <AddIcon className={style.addIcon} onClick={addGoal} />
              </Flex>
              {loadingGoal && <Skeleton />}
              {!loadingGoal && goals && goals.map((item: any, idx: number) => (
                <div className={style.goal} key={`${item.id}-${item.created_at || item.createdAt || idx}`}>
                  <div>{item.goal || item.goal_text || 'No content'}</div>
                  <div className={style.author}>By Coach Andrew</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Flex>
      <EditPlayer player={player} isOpen={isShowEditPlayer} showOpen={showEditPlayer} onRefresh={fetchDetail} />
      {player && (
        <>
          <AddNote notes={notes} player={player} isOpen={isShowAddNote} showOpen={showAddNote} onRefresh={fetchNotes} />
          <AddGoal goals={goals} player={player} isOpen={isShowAddGoal} showOpen={showAddGoal} onRefresh={fetchGoals} />
        </>
      )}
    </div>
  )
}

export default memo(Detail)