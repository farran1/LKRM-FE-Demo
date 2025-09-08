'use client'

import React, { useState, useEffect } from 'react'
import { Card, Table, Select, Space, Tag, Timeline, Statistic, Row, Col, Descriptions, Button, Spin, Empty, App } from 'antd'
import { 
  PlayCircleOutlined, 
  TrophyOutlined, 
  TeamOutlined, 
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons'

interface LiveGameEvent {
  id: number
  event_type: string
  event_value: number
  quarter: number
  game_time: number
  is_opponent_event: boolean
  opponent_jersey?: string
  metadata: any
  created_at: string
  players?: {
    name: string
    jersey: string
  }
}

interface GameStat {
  id: number
  playerId: number
  points: number
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  threePointsMade: number
  threePointsAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  rebounds: number
  offensiveRebounds: number
  defensiveRebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
  minutesPlayed: number
  plusMinus: number
  players?: {
    name: string
    jersey: string
  }
}

interface Game {
  id: number
  homeScore: number
  awayScore: number
  result: string
  gameDate: string
  season: string
  notes?: string
}

interface Event {
  id: number
  name: string
  description: string
  startTime: string
  venue: string
  oppositionTeam: string
  location: string
}

interface CompleteGameLog {
  event: Event
  liveSession: any
  playByPlay: LiveGameEvent[]
  game: Game | null
  playerStats: GameStat[]
}

interface CompleteGameLogProps { events: any[] }

const CompleteGameLog: React.FC<CompleteGameLogProps> = ({ events }) => {
  const { message } = App.useApp()
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null)
  const [gameLog, setGameLog] = useState<CompleteGameLog | null>(null)
  const [loading, setLoading] = useState(false)

  const loadCompleteGameLog = async (eventId: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/performance/complete-game-log/${eventId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch game log: ${response.status}`)
      }
      const data = await response.json()
      setGameLog(data)
      message.success('Game log loaded successfully')
    } catch (error) {
      console.error('Error loading game log:', error)
      message.error('Failed to load game log')
      setGameLog(null)
    } finally {
      setLoading(false)
    }
  }

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case '2pt_made':
      case '2pt_miss':
        return <TrophyOutlined style={{ color: '#52c41a' }} />
      case '3pt_made':
      case '3pt_miss':
        return <TrophyOutlined style={{ color: '#1890ff' }} />
      case 'ft_made':
      case 'ft_miss':
        return <TrophyOutlined style={{ color: '#faad14' }} />
      case 'rebound':
        return <TrophyOutlined style={{ color: '#722ed1' }} />
      case 'assist':
        return <TeamOutlined style={{ color: '#13c2c2' }} />
      case 'steal':
        return <PlayCircleOutlined style={{ color: '#eb2f96' }} />
      case 'block':
        return <TrophyOutlined style={{ color: '#fa8c16' }} />
      case 'foul':
        return <ClockCircleOutlined style={{ color: '#f5222d' }} />
      case 'turnover':
        return <ClockCircleOutlined style={{ color: '#fa541c' }} />
      default:
        return <PlayCircleOutlined />
    }
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case '2pt_made':
      case '3pt_made':
      case 'ft_made':
        return 'success'
      case '2pt_miss':
      case '3pt_miss':
      case 'ft_miss':
        return 'error'
      case 'rebound':
      case 'assist':
      case 'steal':
      case 'block':
        return 'processing'
      case 'foul':
      case 'turnover':
        return 'warning'
      default:
        return 'default'
    }
  }

  const formatGameTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getEventDescription = (event: LiveGameEvent) => {
    // player_id is optional for opponent or team events
    const playerId = (event as any)?.player_id
    const playerName = event.players?.name || (playerId ? `Player ${playerId}` : 'Unknown Player')
    const jersey = event.players?.jersey || ''
    const playerDisplay = jersey ? `${playerName} (#${jersey})` : playerName

    switch (event.event_type.toLowerCase()) {
      case '2pt_made':
        return `${playerDisplay} made 2-point field goal`
      case '2pt_miss':
        return `${playerDisplay} missed 2-point field goal`
      case '3pt_made':
        return `${playerDisplay} made 3-point field goal`
      case '3pt_miss':
        return `${playerDisplay} missed 3-point field goal`
      case 'ft_made':
        return `${playerDisplay} made free throw`
      case 'ft_miss':
        return `${playerDisplay} missed free throw`
      case 'rebound':
        return `${playerDisplay} got ${event.metadata?.rebound_type || 'rebound'}`
      case 'assist':
        return `${playerDisplay} recorded assist`
      case 'steal':
        return `${playerDisplay} recorded steal`
      case 'block':
        return `${playerDisplay} recorded block`
      case 'foul':
        return `${playerDisplay} committed foul`
      case 'turnover':
        return `${playerDisplay} committed turnover`
      default:
        return `${playerDisplay} - ${event.event_type}`
    }
  }

  const playerStatsColumns = [
    {
      title: 'Player',
      dataIndex: 'players',
      key: 'player',
      render: (players: any) => (
        <Space>
          <UserOutlined />
          <span>{players?.name || 'Unknown Player'}</span>
          {players?.jersey && <Tag color="blue">#{players.jersey}</Tag>}
        </Space>
      ),
      width: 150,
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      width: 80,
      render: (points: number) => <strong>{points}</strong>
    },
    {
      title: 'FG',
      key: 'fg',
      render: (stat: GameStat) => `${stat.fieldGoalsMade}/${stat.fieldGoalsAttempted}`,
      width: 80,
    },
    {
      title: '3P',
      key: '3p',
      render: (stat: GameStat) => `${stat.threePointsMade}/${stat.threePointsAttempted}`,
      width: 80,
    },
    {
      title: 'FT',
      key: 'ft',
      render: (stat: GameStat) => `${stat.freeThrowsMade}/${stat.freeThrowsAttempted}`,
      width: 80,
    },
    {
      title: 'Reb',
      dataIndex: 'rebounds',
      key: 'rebounds',
      width: 80,
    },
    {
      title: 'Ast',
      dataIndex: 'assists',
      key: 'assists',
      width: 80,
    },
    {
      title: 'Stl',
      dataIndex: 'steals',
      key: 'steals',
      width: 80,
    },
    {
      title: 'Blk',
      dataIndex: 'blocks',
      key: 'blocks',
      width: 80,
    },
    {
      title: 'TO',
      dataIndex: 'turnovers',
      key: 'turnovers',
      width: 80,
    },
    {
      title: 'Fouls',
      dataIndex: 'fouls',
      key: 'fouls',
      width: 80,
    },
    {
      title: '+/-',
      dataIndex: 'plusMinus',
      key: 'plusMinus',
      width: 80,
      render: (plusMinus: number) => (
        <Tag color={plusMinus >= 0 ? 'success' : 'error'}>
          {plusMinus >= 0 ? '+' : ''}{plusMinus}
        </Tag>
      )
    },
  ]

  return (
    <div>
      <Card 
        title={
          <Space>
            <PlayCircleOutlined />
            <span>Complete Game Log</span>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <strong>Select Event:</strong>
            <Select
              placeholder="Choose an event to view complete game log"
              value={selectedEvent}
              onChange={(value) => {
                setSelectedEvent(value)
                if (value) {
                  loadCompleteGameLog(value)
                }
              }}
              style={{ width: 300, marginLeft: 16 }}
              allowClear
            >
              {events.map(event => (
                <Select.Option key={event.id} value={event.id}>
                  {event.name} vs {event.oppositionTeam}
                </Select.Option>
              ))}
            </Select>
            
            <Button 
              type="link" 
              size="small"
              onClick={async () => {
                try {
                  const response = await fetch('/api/performance/live-events')
                  const data = await response.json()
                  console.log('Live Events Structure:', data)
                  message.info('Check console for live events structure')
                } catch (error) {
                  message.error('Failed to check live events structure')
                }
              }}
              style={{ marginLeft: 16 }}
            >
              Check Live Events Structure
            </Button>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>Loading complete game log...</div>
            </div>
          )}

          {gameLog && !loading && (
            <div>
              {/* Event & Game Summary */}
              <Card 
                title="Game Summary" 
                style={{ marginBottom: '16px' }}
                size="small"
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic 
                      title="Event" 
                      value={gameLog.event.name}
                      prefix={<TeamOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="Opponent" 
                      value={gameLog.event.oppositionTeam}
                      prefix={<TrophyOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="Venue" 
                      value={gameLog.event.venue}
                      prefix={<ClockCircleOutlined />}
                    />
                  </Col>
                </Row>
                
                {gameLog.game && (
                  <Row gutter={16} style={{ marginTop: '16px' }}>
                    <Col span={8}>
                      <Statistic 
                        title="Score" 
                        value={`${gameLog.game.homeScore} - ${gameLog.game.awayScore}`}
                        prefix={<TrophyOutlined />}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic 
                        title="Result" 
                        value={gameLog.game.result}
                        prefix={<TrophyOutlined />}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic 
                        title="Season" 
                        value={gameLog.game.season}
                        prefix={<ClockCircleOutlined />}
                      />
                    </Col>
                  </Row>
                )}
              </Card>

              {/* Play-by-Play Timeline */}
              <Card 
                title={`Play-by-Play (${gameLog.playByPlay.length} events)`}
                style={{ marginBottom: '16px' }}
                size="small"
              >
                {gameLog.playByPlay.length > 0 ? (
                  <Timeline
                    items={gameLog.playByPlay.map((event, index) => ({
                      key: index,
                      dot: getEventTypeIcon(event.event_type),
                      children: (
                        <div>
                          <Space>
                            <Tag color={getEventTypeColor(event.event_type)}>
                              Q{event.quarter} - {formatGameTime(event.game_time)}
                            </Tag>
                            <span>{getEventDescription(event)}</span>
                            {event.is_opponent_event && (
                              <Tag color="orange">Opponent</Tag>
                            )}
                          </Space>
                        </div>
                      ),
                    }))}
                  />
                ) : (
                  <Empty description="No play-by-play events recorded" />
                )}
              </Card>

              {/* Final Player Statistics */}
              <Card 
                title={`Final Player Statistics (${gameLog.playerStats.length} players)`}
                size="small"
              >
                {gameLog.playerStats.length > 0 ? (
                  <Table
                    columns={playerStatsColumns}
                    dataSource={gameLog.playerStats}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 1200 }}
                    size="small"
                  />
                ) : (
                  <Empty description="No player statistics recorded" />
                )}
              </Card>

              {/* Debug Information */}
              <Card 
                title="Debug Information" 
                style={{ marginTop: '16px' }}
                size="small"
                // Ant Design Card in this version doesn't support collapsible props; remove for types
              >
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Event ID">{gameLog.event.id}</Descriptions.Item>
                  <Descriptions.Item label="Live Session ID">{gameLog.liveSession?.id || 'None'}</Descriptions.Item>
                  <Descriptions.Item label="Game ID">{gameLog.game?.id || 'None'}</Descriptions.Item>
                  <Descriptions.Item label="Play-by-Play Events">{gameLog.playByPlay.length}</Descriptions.Item>
                  <Descriptions.Item label="Player Stats Records">{gameLog.playerStats.length}</Descriptions.Item>
                  <Descriptions.Item label="Raw Data">
                    <pre style={{ fontSize: '10px', maxHeight: '200px', overflow: 'auto' }}>
                      {JSON.stringify(gameLog, null, 2)}
                    </pre>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </div>
          )}

          {!gameLog && !loading && selectedEvent && (
            <Empty description="No game log data found for this event" />
          )}
        </Space>
      </Card>
    </div>
  )
}

export default CompleteGameLog
