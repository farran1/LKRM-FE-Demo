'use client'

import api from '@/services/api'
import { memo, useEffect, useState, useCallback } from 'react'
import style from './style.module.scss'
import { Button, Card, Col, Flex, Row, Skeleton, Select, DatePicker, Divider, Alert, Table } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import ArrowIcon from '@/components/icon/arrow_left.svg'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
 
 
import DefaultAvatar from '@/components/icon/avatar.svg'
import AddIcon from '@/components/icon/plus-circle.svg'
import Setting from './components/setting'
import EditPlayer from './components/edit-player'
import AddNote from './components/add-note'
import AddGoal from './components/add-goal'
import NoteList from '@/components/note-list'


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
  const [selectedStats, setSelectedStats] = useState<[string, string, string, string]>(['rebounds', 'steals', 'blocks', 'fouls'])

  const availableStats = [
    { key: 'rebounds', label: 'Rebounds' },
    { key: 'assists', label: 'Assists' },
    { key: 'steals', label: 'Steals' },
    { key: 'blocks', label: 'Blocks' },
    { key: 'turnovers', label: 'Turnovers' },
    { key: 'fouls', label: 'Fouls' },
    { key: 'points', label: 'Points' },
    { key: 'efficiency', label: 'EFF' },
    { key: 'fgMade', label: 'FG Made' },
    { key: 'threeMade', label: '3PT Made' },
    { key: 'ftMade', label: 'FT Made' }
  ]

  const getStatValue = (statKey: string) => {
    if (statKey === 'efficiency') {
      const totalEff = (stats?.totals?.points || 0) + (stats?.totals?.rebounds || 0) + (stats?.totals?.assists || 0) + (stats?.totals?.steals || 0) + (stats?.totals?.blocks || 0) - (stats?.totals?.turnovers || 0) - (stats?.totals?.fouls || 0);
      const games = stats?.games || 1;
      return games > 0 ? Math.round((totalEff / games) * 10) / 10 : 0;
    }
    switch (statKey) {
      case 'rebounds': return stats?.totals?.rebounds ?? 0
      case 'assists': return stats?.totals?.assists ?? 0
      case 'steals': return stats?.totals?.steals ?? 0
      case 'blocks': return stats?.totals?.blocks ?? 0
      case 'turnovers': return stats?.totals?.turnovers ?? 0
      case 'fouls': return stats?.totals?.fouls ?? 0
      case 'points': return stats?.totals?.points ?? 0
      case 'fgMade': return stats?.totals?.fgMade ?? 0
      case 'threeMade': return stats?.totals?.threeMade ?? 0
      case 'ftMade': return stats?.totals?.ftMade ?? 0
      default: return 0
    }
  }

  const getStatLabel = (statKey: string) => {
    const stat = availableStats.find(s => s.key === statKey)
    return stat ? stat.label : statKey
  }

  const handleStatChange = (index: number, newStatKey: string) => {
    const newSelectedStats = [...selectedStats] as [string, string, string, string]
    newSelectedStats[index] = newStatKey
    setSelectedStats(newSelectedStats)
  }

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

  const fetchStats = async (override?: { timeRange?: 'season' | 'last30days' | 'custom'; customRange?: [string, string] | null }) => {
    try {
      const tr = override?.timeRange ?? timeRange
      const cr = override?.customRange !== undefined ? override.customRange : customRange
      const params: any = { season: '2024-25', timeRange: tr, _: Date.now() }
      if (tr === 'custom' && cr) {
        params.startDate = cr[0]
        params.endDate = cr[1]
      }
      const qs = new URLSearchParams(params).toString()
      const res: any = await api.get(`/api/stats/player/${playerId}?${qs}`)
      // Debug: confirm server-side filtering inputs/outputs
      if (res?.data?.debug) {
        console.log('Player stats debug:', res.data.debug)
      } else {
        console.log('Player stats response (no debug):', res?.data)
      }
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

  const fetchNotes = useCallback(async () => {
    setLoadingNote(true)
    console.log('Fetching notes for player ID:', playerId)
    try {
      // Add cache-busting parameter to ensure fresh data
      const timestamp = Date.now()
      const res: any = await api.get(`/api/players/${playerId}/notes?t=${timestamp}`)
      console.log('Notes API response:', res.data)
      console.log('Notes data structure:', JSON.stringify(res.data, null, 2))
      console.log('Notes array:', res.data.notes)
      setNotes(res.data.notes || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
      setNotes([])
    }
    setLoadingNote(false)
  }, [playerId])

  const fetchGoals = useCallback(async () => {
    setLoadingGoal(true)
    console.log('Fetching goals for player ID:', playerId)
    try {
      // Add cache-busting parameter to ensure fresh data
      const timestamp = Date.now()
      const res: any = await api.get(`/api/players/${playerId}/goals?t=${timestamp}`)
      console.log('Goals API response:', res.data)
      setGoals(res.data.goals || [])
    } catch (error) {
      console.error('Error fetching goals:', error)
      setGoals([])
    }
    setLoadingGoal(false)
  }, [playerId])

  const handleNoteDeleted = useCallback((noteId: number) => {
    console.log('handleNoteDeleted called with noteId:', noteId)
    // Refresh the notes list when a note is deleted
    fetchNotes()
  }, [fetchNotes])

  const handleGoalDeleted = useCallback((goalId: number) => {
    console.log('handleGoalDeleted called with goalId:', goalId)
    // Refresh the goals list when a goal is deleted
    fetchGoals()
  }, [fetchGoals])

  const goBack = () => {
    router.back()
  }

  const onChangeTimeRange = (val: any) => {
    console.log('TimeRange change requested:', val)
    setTimeRange(val)
    if (val !== 'custom') {
      setCustomRange(null)
    }
    // Trigger an immediate fetch to avoid stale UI during state batching
    setTimeout(() => {
      fetchStats({ timeRange: val, customRange: val === 'custom' ? customRange : null })
    }, 0)
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
             {selectedStats.map((statKey, index) => (
               <Col xs={6} key={`stat-${statKey}-${index}`}>
                 <Card className={style.stateGeneral} style={{ position: 'relative' }}>
                   <div className={style.title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                     <span>{getStatLabel(statKey)}</span>
                     <EditOutlined style={{ fontSize: '12px', color: '#1890ff', marginLeft: '4px' }} />
                   </div>
                   <Flex justify='space-between' align='center'>
                     <div className={style.value} style={{ 
                       color: statKey === 'efficiency' ? 
                         (getStatValue(statKey) >= 0 ? '#52c41a' : '#ff4d4f') : 
                         undefined 
                     }}>
                       {getStatValue(statKey)}
                     </div>
                   </Flex>
                   <Select
                     size="small"
                     value={statKey}
                     onChange={(value) => handleStatChange(index, value)}
                     style={{ 
                       position: 'absolute', 
                       top: 0, 
                       left: 0, 
                       right: 0, 
                       height: '100%', 
                       opacity: 0, 
                       cursor: 'pointer',
                       zIndex: 1
                     }}
                     styles={{
                       popup: {
                         root: {
                           fontSize: '12px',
                           background: 'rgba(0, 0, 0, 0.85)',
                           border: '1px solid rgba(255, 255, 255, 0.2)',
                           borderRadius: '8px',
                           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                         }
                       }
                     }}
                     classNames={{
                       popup: {
                         root: "custom-stat-dropdown"
                       }
                     }}
                   >
                     {availableStats.map(stat => (
                       <Select.Option 
                         key={stat.key} 
                         value={stat.key}
                         style={{
                           color: '#ffffff',
                           background: 'transparent',
                           padding: '8px 12px',
                           fontSize: '13px'
                         }}
                       >
                         {stat.label}
                       </Select.Option>
                     ))}
                   </Select>
                 </Card>
               </Col>
             ))}
           </Row>
          <Row 
            key={`${timeRange}:${customRange ? customRange.join('|') : ''}:${stats?.debug?.eventCount ?? stats?.games ?? 0}`}
            gutter={[12, 12]} 
            style={{ marginBottom: 12 }}
          >
            <Col xs={24}>
              <Card className={style.chart}>
                <div className={style.title2}>Stat Summary</div>
                <Divider style={{ margin: '12px 0' }} />
                {stats && stats.games === 0 ? (
                  <Alert type="info" message="No games in selected range" showIcon />
                ) : (
                 <Row 
                   key={`summary-${timeRange}:${customRange ? customRange.join('|') : ''}:${stats?.debug?.eventCount ?? stats?.games ?? 0}`}
                   gutter={[12, 12]}
                 >
                   <Col xs={12} md={6}><strong>Games</strong><div>{stats?.games ?? 0}</div></Col>
                   <Col xs={12} md={6}><strong>Points</strong><div>{stats?.totals?.points ?? 0}</div></Col>
                   <Col xs={12} md={6}><strong>Assists</strong><div>{stats?.totals?.assists ?? 0}</div></Col>
                   <Col xs={12} md={6}><strong>Rebounds</strong><div>{stats?.totals?.rebounds ?? 0}</div></Col>
                   <Col xs={12} md={6}><strong>Steals</strong><div>{stats?.totals?.steals ?? 0}</div></Col>
                   <Col xs={12} md={6}><strong>Blocks</strong><div>{stats?.totals?.blocks ?? 0}</div></Col>
                   <Col xs={12} md={6}><strong>Fouls</strong><div>{stats?.totals?.fouls ?? 0}</div></Col>
                   <Col xs={12} md={6}><strong>Turnovers</strong><div>{stats?.totals?.turnovers ?? 0}</div></Col>
                   <Col xs={12} md={6}><strong>FG</strong><div>{stats ? `${stats.totals?.fgMade||0}/${stats.totals?.fgAttempted||0} (${stats.percentages?.fgPct||0}%)` : '-'}</div></Col>
                   <Col xs={12} md={6}><strong>3PT</strong><div>{stats ? `${stats.totals?.threeMade||0}/${stats.totals?.threeAttempted||0} (${stats.percentages?.threePct||0}%)` : '-'}</div></Col>
                   <Col xs={12} md={6}><strong>FT</strong><div>{stats ? `${stats.totals?.ftMade||0}/${stats.totals?.ftAttempted||0} (${stats.percentages?.ftPct||0}%)` : '-'}</div></Col>
                   <Col xs={12} md={6}><strong>EFF</strong><div style={{ color: (() => {
                     const totalEff = (stats?.totals?.points || 0) + (stats?.totals?.rebounds || 0) + (stats?.totals?.assists || 0) + (stats?.totals?.steals || 0) + (stats?.totals?.blocks || 0) - (stats?.totals?.turnovers || 0) - (stats?.totals?.fouls || 0);
                     const games = stats?.games || 1;
                     const avgEff = games > 0 ? totalEff / games : 0;
                     return avgEff >= 0 ? '#52c41a' : '#ff4d4f';
                   })(), fontWeight: 600 }}>
                     {(() => {
                       const totalEff = (stats?.totals?.points || 0) + (stats?.totals?.rebounds || 0) + (stats?.totals?.assists || 0) + (stats?.totals?.steals || 0) + (stats?.totals?.blocks || 0) - (stats?.totals?.turnovers || 0) - (stats?.totals?.fouls || 0);
                       const games = stats?.games || 1;
                       return games > 0 ? Math.round((totalEff / games) * 10) / 10 : 0;
                     })()}
                   </div></Col>
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
                   rowKey={(r:any)=>`${r.gameId}-${r.gameDate}`}
                   dataSource={stats?.gameStats || []}
                   columns={[
                     { title: 'Date', dataIndex: 'gameDate', render: (date: string) => new Date(date).toLocaleDateString() },
                     { 
                       title: 'Game', 
                       dataIndex: 'gameName',
                       render: (gameName: string, record: any) => (
                         <Link 
                           href={`/stats-dashboard/game-analysis/${record.gameId}`}
                           style={{ 
                             color: '#1890ff', 
                             textDecoration: 'underline',
                             fontWeight: 500
                           }}
                         >
                           {gameName}
                         </Link>
                       )
                     },
                     { title: 'PTS', dataIndex: 'points' },
                     { title: 'REB', dataIndex: 'rebounds' },
                     { title: 'AST', dataIndex: 'assists' },
                     { title: 'STL', dataIndex: 'steals' },
                     { title: 'BLK', dataIndex: 'blocks' },
                     { title: 'TOV', dataIndex: 'turnovers' },
                     { title: 'FLS', dataIndex: 'fouls' },
                     { title: 'FG', render: (r:any)=>`${r.fgMade}/${r.fgAttempted}` },
                     { title: '3PT', render: (r:any)=>`${r.threeMade}/${r.threeAttempted}` },
                     { title: 'FT', render: (r:any)=>`${r.ftMade}/${r.ftAttempted}` },
                     { 
                       title: 'EFF', 
                       render: (r:any) => {
                         const eff = (r.points || 0) + (r.rebounds || 0) + (r.assists || 0) + (r.steals || 0) + (r.blocks || 0) - (r.turnovers || 0) - (r.fouls || 0);
                         return <span style={{ color: eff >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>{eff}</span>;
                       }
                     },
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
              {!loadingNote && notes && notes.length > 0 && player && (
                <NoteList 
                  notes={notes} 
                  onNoteDeleted={handleNoteDeleted}
                  playerId={player.id}
                  itemType="note"
                />
              )}
              {!loadingNote && (!notes || notes.length === 0) && (
                <div style={{ color: '#999', fontStyle: 'italic', padding: '16px 0' }}>
                  No notes yet. Click the + button to add one.
                </div>
              )}
            </div>
            <div className={style.goals}>
              <Flex justify='space-between' style={{ marginBottom: 12 }}>
                <div className={style.title2}>Goals</div>
                <AddIcon className={style.addIcon} onClick={addGoal} />
              </Flex>
              {loadingGoal && <Skeleton />}
              {!loadingGoal && goals && goals.length > 0 && player && (
                <NoteList 
                  notes={goals} 
                  onNoteDeleted={handleGoalDeleted}
                  playerId={player.id}
                  itemType="goal"
                />
              )}
              {!loadingGoal && (!goals || goals.length === 0) && (
                <div style={{ color: '#999', fontStyle: 'italic', padding: '16px 0' }}>
                  No goals yet. Click the + button to add one.
                </div>
              )}
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