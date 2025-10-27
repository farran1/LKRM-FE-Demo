'use client'

import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Input, Select, DatePicker, Statistic, Row, Col, Tag, Tooltip, Modal, Descriptions, Tabs, App } from 'antd'
import { ReloadOutlined, SearchOutlined, FilterOutlined, EyeOutlined, DatabaseOutlined, ApiOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons'
// Note: Service not used on this page; removing import to avoid path/type errors
import CompleteGameLog from './components/CompleteGameLog'

const { Search } = Input
const { RangePicker } = DatePicker

interface GameData {
  id: number
  eventId: number
  opponent: string
  homeScore: number
  awayScore: number
  result: string
  gameDate: string
  season: string
  isPlayoffs: boolean
  notes?: string
  createdAt: string
  createdBy: number
}

interface GameStats {
  id: number
  gameId: number
  playerId: number
  userId: number
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
  quarter?: number
  period?: string
  timestamp?: string
  createdAt: string
  createdBy: number
}

interface Player {
  id: number
  name: string
  jersey_number?: string
  positionId?: number
}

interface AppEvent {
  id: number
  name: string
  startTime: string
  location: string
  venue: string
  oppositionTeam?: string
}

const GameDataTestPage: React.FC = () => {
  const { message } = App.useApp()
  const [games, setGames] = useState<GameData[]>([])
  const [gameStats, setGameStats] = useState<GameStats[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [events, setEvents] = useState<AppEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [filteredGames, setFilteredGames] = useState<GameData[]>([])
  const [filteredStats, setFilteredStats] = useState<GameStats[]>([])
  
  // Filter states
  const [searchText, setSearchText] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null)
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)
  const [resultFilter, setResultFilter] = useState<string | null>(null)
  
  // Modal states
  const [gameDetailModal, setGameDetailModal] = useState(false)
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null)
  const [gameStatsModal, setGameStatsModal] = useState(false)
  const [selectedGameStats, setSelectedGameStats] = useState<GameStats[]>([])

  // Load all data on component mount
  useEffect(() => {
    loadAllData()
  }, [])

  // Apply filters when filter states change
  useEffect(() => {
    applyFilters()
  }, [games, gameStats, searchText, selectedEvent, selectedPlayer, dateRange, resultFilter])

  const loadAllData = async () => {
    setLoading(true)
    try {
      // Load games
      const gamesResponse = await fetch('/api/performance/games')
      if (!gamesResponse.ok) {
        throw new Error(`Games API failed: ${gamesResponse.status}`)
      }
      const gamesData = await gamesResponse.json()
      setGames(Array.isArray(gamesData) ? gamesData : [])
      
      // Load game stats
      const statsResponse = await fetch('/api/performance/game-stats')
      if (!statsResponse.ok) {
        throw new Error(`Game stats API failed: ${statsResponse.status}`)
      }
      const statsData = await statsResponse.json()
      setGameStats(Array.isArray(statsData) ? statsData : [])
      
      // Load players
      const playersResponse = await fetch('/api/performance/players')
      if (!playersResponse.ok) {
        throw new Error(`Players API failed: ${playersResponse.status}`)
      }
      const playersData = await playersResponse.json()
      setPlayers(Array.isArray(playersData) ? playersData : [])
      
      // Load events
      const eventsResponse = await fetch('/api/performance/events')
      if (!eventsResponse.ok) {
        throw new Error(`Events API failed: ${eventsResponse.status}`)
      }
      const eventsData = await eventsResponse.json()
      setEvents(Array.isArray(eventsData) ? eventsData : [])
      
      message.success('Data loaded successfully')
    } catch (error) {
      console.error('Failed to load data:', error)
      message.error('Failed to load data')
      
      // Ensure state is always arrays even on error
      setGames([])
      setGameStats([])
      setPlayers([])
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    // Ensure we're working with arrays
    if (!Array.isArray(games) || !Array.isArray(gameStats)) {
      setFilteredGames([])
      setFilteredStats([])
      return
    }
    
    let filtered = [...games]
    let filteredStats = [...gameStats]

    // Text search filter
    if (searchText) {
      filtered = filtered.filter(game => 
        game.opponent.toLowerCase().includes(searchText.toLowerCase()) ||
        game.season.toLowerCase().includes(searchText.toLowerCase()) ||
        game.notes?.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    // Event filter
    if (selectedEvent) {
      filtered = filtered.filter(game => game.eventId === selectedEvent)
      filteredStats = filteredStats.filter(stat => {
        if (!Array.isArray(games)) return false
        const game = games.find(g => g.id === stat.gameId)
        return game && game.eventId === selectedEvent
      })
    }

    // Player filter
    if (selectedPlayer) {
      filteredStats = filteredStats.filter(stat => stat.playerId === selectedPlayer)
      const gameIds = [...new Set(filteredStats.map(stat => stat.gameId))]
      filtered = filtered.filter(game => gameIds.includes(game.id))
    }

    // Date range filter
    if (dateRange) {
      const [startDate, endDate] = dateRange
      filtered = filtered.filter(game => {
        const gameDate = new Date(game.gameDate)
        return gameDate >= new Date(startDate) && gameDate <= new Date(endDate)
      })
    }

    // Result filter
    if (resultFilter) {
      filtered = filtered.filter(game => game.result === resultFilter)
    }

    setFilteredGames(filtered)
    setFilteredStats(filteredStats)
  }

  const viewGameDetails = (game: GameData) => {
    setSelectedGame(game)
    setGameDetailModal(true)
  }

  const viewGameStats = (game: GameData) => {
    if (!Array.isArray(gameStats)) {
      setSelectedGameStats([])
      setGameStatsModal(true)
      return
    }
    
    const stats = gameStats.filter(stat => stat.gameId === game.id)
    setSelectedGameStats(stats)
    setGameStatsModal(true)
  }

  const getPlayerName = (playerId: number) => {
    if (!Array.isArray(players)) return `Player ${playerId}`
    const player = players.find(p => p.id === playerId)
    return player ? player.name : `Player ${playerId}`
  }

  const getEventName = (eventId: number) => {
    if (!Array.isArray(events)) return `Event ${eventId}`
    const event = events.find((e: AppEvent) => e.id === eventId)
    return event ? event.name : `Event ${eventId}`
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'WIN': return 'success'
      case 'LOSS': return 'error'
      case 'TIE': return 'warning'
      default: return 'default'
    }
  }

  const gameColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Event',
      dataIndex: 'eventId',
      key: 'eventId',
      render: (eventId: number) => getEventName(eventId),
      width: 150,
    },
    {
      title: 'Opponent',
      dataIndex: 'opponent',
      key: 'opponent',
      width: 120,
    },
    {
      title: 'Score',
      key: 'score',
      render: (game: GameData) => `${game.homeScore} - ${game.awayScore}`,
      width: 100,
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => (
        <Tag color={getResultColor(result)}>{result}</Tag>
      ),
      width: 100,
    },
    {
      title: 'Date',
      dataIndex: 'gameDate',
      key: 'gameDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
      width: 120,
    },
    {
      title: 'Season',
      dataIndex: 'season',
      key: 'season',
      width: 100,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (game: GameData) => (
        <Space>
          <Tooltip title="View Game Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => viewGameDetails(game)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="View Game Stats">
            <Button 
              type="text" 
              icon={<DatabaseOutlined />} 
              onClick={() => viewGameStats(game)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
      width: 120,
    },
  ]

  const statsColumns = [
    {
      title: 'Player',
      dataIndex: 'playerId',
      key: 'playerId',
      render: (playerId: number) => getPlayerName(playerId),
      width: 150,
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      width: 80,
    },
    {
      title: 'FG',
      key: 'fg',
      render: (stat: GameStats) => `${stat.fieldGoalsMade}/${stat.fieldGoalsAttempted}`,
      width: 80,
    },
    {
      title: '3P',
      key: '3p',
      render: (stat: GameStats) => `${stat.threePointsMade}/${stat.threePointsAttempted}`,
      width: 80,
    },
    {
      title: 'FT',
      key: 'ft',
      render: (stat: GameStats) => `${stat.freeThrowsMade}/${stat.freeThrowsAttempted}`,
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
  ]

  // Test API endpoints
  const testAPIEndpoints = async () => {
    setLoading(true)
    try {
      // Test basic events endpoint
      const eventsResponse = await fetch('/api/events')
      console.log('Events API response:', eventsResponse.status)
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        console.log('Events data:', eventsData)
        setEvents(eventsData)
      }
      
      // Test games endpoint
      const gamesResponse = await fetch('/api/games')
      console.log('Games API response:', gamesResponse.status)
      
      if (gamesResponse.ok) {
        const gamesData = await gamesResponse.json()
        console.log('Games data:', gamesData)
        setGames(gamesData)
      }
      
      // Test game-stats endpoint
      const statsResponse = await fetch('/api/game-stats')
      console.log('Game stats API response:', statsResponse.status)
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        console.log('Game stats data:', statsData)
        setGameStats(statsData)
      }
      
      message.success('API endpoints tested successfully')
    } catch (error) {
      console.error('Error testing API endpoints:', error)
      message.error('Failed to test API endpoints')
    } finally {
      setLoading(false)
    }
  }

  // Test complete game log endpoint
  const testCompleteGameLog = async (eventId: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/performance/complete-game-log/${eventId}`)
      console.log('Complete game log API response:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Complete game log data:', data)
        message.success('Complete game log loaded successfully')
      } else {
        const errorData = await response.json()
        console.error('Complete game log error:', errorData)
        message.error(`Failed to load game log: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error testing complete game log:', error)
      message.error('Failed to test complete game log endpoint')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title={
          <Space>
            <ApiOutlined />
            <span>Game Data Performance Test</span>
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={loadAllData}
            loading={loading}
          >
            Refresh Data
          </Button>
        }
      >
        {/* Summary Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Statistic 
              title="Total Games" 
              value={games.length} 
              prefix={<DatabaseOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Total Stats Records" 
              value={gameStats.length} 
              prefix={<DatabaseOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Total Players" 
              value={players.length} 
              prefix={<DatabaseOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Total Events" 
              value={events.length} 
              prefix={<DatabaseOutlined />}
            />
          </Col>
        </Row>

        {/* Filters */}
        <Card 
          title={
            <Space>
              <FilterOutlined />
              <span>Filters</span>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Search
                placeholder="Search games..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value as string)}
                allowClear
              />
            </Col>
            <Col span={4}>
                             <Select
                 placeholder="Select Event"
                 value={selectedEvent}
                 onChange={setSelectedEvent}
                 allowClear
                 style={{ width: '100%' }}
               >
                 {Array.isArray(events) && events.map(event => (
                   <Select.Option key={event.id} value={event.id}>
                     {event.name}
                   </Select.Option>
                 ))}
               </Select>
            </Col>
            <Col span={4}>
                             <Select
                 placeholder="Select Player"
                 value={selectedPlayer}
                 onChange={setSelectedPlayer}
                 allowClear
                 style={{ width: '100%' }}
               >
                 {Array.isArray(players) && players.map(player => (
                   <Select.Option key={player.id} value={player.id}>
                     {player.name}
                   </Select.Option>
                 ))}
               </Select>
            </Col>
            <Col span={4}>
              <RangePicker
                onChange={(dates: any) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([dates[0].toDate().toISOString(), dates[1].toDate().toISOString()])
                  } else {
                    setDateRange(null)
                  }
                }}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="Result"
                value={resultFilter}
                onChange={setResultFilter}
                allowClear
                style={{ width: '100%' }}
              >
                <Select.Option value="WIN">Win</Select.Option>
                <Select.Option value="LOSS">Loss</Select.Option>
                <Select.Option value="TIE">Tie</Select.Option>
              </Select>
            </Col>
            <Col span={2}>
              <Button 
                onClick={() => {
                  setSearchText('')
                  setSelectedEvent(null)
                  setSelectedPlayer(null)
                  setDateRange(null)
                  setResultFilter(null)
                }}
              >
                Clear
              </Button>
            </Col>
          </Row>
        </Card>

                 {/* API Testing Section */}
         <Card 
           title="API Testing & Debug" 
           style={{ marginBottom: '24px' }}
           extra={
             <Space>
               <Button 
                 type="primary" 
                 onClick={testAPIEndpoints}
                 loading={loading}
                 icon={<ApiOutlined />}
               >
                 Test API Endpoints
               </Button>
               {events.length > 0 && (
                 <Button 
                   onClick={() => testCompleteGameLog(events[0].id)}
                   loading={loading}
                   icon={<DatabaseOutlined />}
                 >
                   Test Complete Game Log
                 </Button>
               )}
               <Button 
                 onClick={async () => {
                   try {
                     const response = await fetch('/api/test-env')
                     const data = await response.json()
                     console.log('Environment check:', data)
                     message.info('Environment check completed - see console')
                   } catch (error) {
                     message.error('Environment check failed')
                   }
                 }}
                 icon={<ApiOutlined />}
               >
                 Check Env Vars
               </Button>
               <Button 
                 onClick={async () => {
                   try {
                     const response = await fetch('/api/test-db-schema')
                     const data = await response.json()
                     console.log('Database schema check:', data)
                     message.info('Database schema check completed - see console')
                   } catch (error) {
                     message.error('Database schema check failed')
                   }
                 }}
                 icon={<DatabaseOutlined />}
               >
                 Check DB Schema
               </Button>
             </Space>
           }
         >
           <Row gutter={16}>
             <Col span={8}>
               <Statistic 
                 title="Events" 
                 value={events.length} 
                 prefix={<TeamOutlined />} 
               />
             </Col>
             <Col span={8}>
               <Statistic 
                 title="Games" 
                 value={games.length} 
                 prefix={<TrophyOutlined />} 
               />
             </Col>
             <Col span={8}>
               <Statistic 
                 title="Game Stats" 
                 value={gameStats.length} 
                 prefix={<DatabaseOutlined />} 
               />
             </Col>
           </Row>
         </Card>

         {/* Main Content Tabs */}
         <Tabs
           defaultActiveKey="summary"
           items={[
             {
               key: 'summary',
               label: 'Summary Tables',
               children: (
                 <>
                   {/* Games Table */}
                   <Card 
                     title={`Games (${filteredGames.length} of ${games.length})`}
                     style={{ marginBottom: '24px' }}
                   >
                     <Table
                       columns={gameColumns}
                       dataSource={filteredGames}
                       rowKey="id"
                       pagination={{
                         pageSize: 10,
                         showSizeChanger: true,
                         showQuickJumper: true,
                         showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} games`,
                       }}
                       scroll={{ x: 1200 }}
                     />
                   </Card>

                   {/* Game Stats Table */}
                   <Card 
                     title={`Game Statistics (${filteredStats.length} of ${gameStats.length})`}
                   >
                     <Table
                       columns={statsColumns}
                       dataSource={filteredStats}
                       rowKey="id"
                       pagination={{
                         pageSize: 15,
                         showSizeChanger: true,
                         showQuickJumper: true,
                         showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} stats`,
                       }}
                       scroll={{ x: 1000 }}
                     />
                   </Card>
                 </>
               )
             },
             {
               key: 'complete-log',
               label: 'Complete Game Log',
               children: <CompleteGameLog events={events as any[]} />
             }
           ]}
         />
       </Card>

       {/* Game Detail Modal */}
      <Modal
        title="Game Details"
        open={gameDetailModal}
        onCancel={() => setGameDetailModal(false)}
        footer={null}
        width={800}
      >
        {selectedGame && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Game ID">{selectedGame.id}</Descriptions.Item>
            <Descriptions.Item label="Event">{getEventName(selectedGame.eventId)}</Descriptions.Item>
            <Descriptions.Item label="Opponent">{selectedGame.opponent}</Descriptions.Item>
            <Descriptions.Item label="Score">{selectedGame.homeScore} - {selectedGame.awayScore}</Descriptions.Item>
            <Descriptions.Item label="Result">
              <Tag color={getResultColor(selectedGame.result)}>{selectedGame.result}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Date">{new Date(selectedGame.gameDate).toLocaleDateString()}</Descriptions.Item>
            <Descriptions.Item label="Season">{selectedGame.season}</Descriptions.Item>
            <Descriptions.Item label="Playoffs">{selectedGame.isPlayoffs ? 'Yes' : 'No'}</Descriptions.Item>
            <Descriptions.Item label="Created">{new Date(selectedGame.createdAt).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="Notes" span={2}>{selectedGame.notes || 'No notes'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Game Stats Modal */}
      <Modal
        title="Game Statistics"
        open={gameStatsModal}
        onCancel={() => setGameStatsModal(false)}
        footer={null}
        width={1200}
      >
        <Table
          columns={statsColumns}
          dataSource={selectedGameStats}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1000 }}
        />
      </Modal>

      {/* Database Schema Test Button */}
      <Card 
        title="Database Schema Test" 
        style={{ marginTop: '24px' }}
        extra={
          <Button 
            type="primary" 
            onClick={async () => {
              try {
                const response = await fetch('/api/test-db-schema');
                const result = await response.json();
                console.log('Database Schema Test Result:', result);
                message.success('Database schema test completed. Check console for details.');
              } catch (error) {
                console.error('Database schema test failed:', error);
                message.error('Database schema test failed. Check console for details.');
              }
            }}
          >
            Test Database Schema
          </Button>
        }
      >
        <p>Click the button above to test if the required database tables exist and are accessible.</p>
        <p>This will help diagnose issues with the stats dashboard API endpoints.</p>
      </Card>

      {/* API Endpoints Test Button */}
      <Card 
        title="API Endpoints Test" 
        style={{ marginTop: '24px' }}
        extra={
          <Button 
            type="primary" 
            onClick={async () => {
              try {
                const endpoints = [
                  '/api/stats/players?season=2024-25',
                  '/api/stats/team?season=2024-25',
                  '/api/stats/games?season=2024-25&limit=5',
                  '/api/stats/trends?season=2024-25',
                  '/api/stats/advanced?season=2024-25'
                ];

                const results: Record<string, any> = {};
                
                for (const endpoint of endpoints) {
                  try {
                    const response = await fetch(endpoint);
                    const data = await response.json();
                    results[endpoint] = {
                      status: response.status,
                      ok: response.ok,
                      data: data,
                      error: data.error || null
                    };
                  } catch (error) {
                    results[endpoint] = {
                      status: 'ERROR',
                      ok: false,
                      data: null,
                      error: error instanceof Error ? error.message : 'Unknown error'
                    };
                  }
                }

                console.log('API Endpoints Test Results:', results);
                message.success('API endpoints test completed. Check console for details.');
              } catch (error) {
                console.error('API endpoints test failed:', error);
                message.error('API endpoints test failed. Check console for details.');
              }
            }}
          >
            Test API Endpoints
          </Button>
        }
      >
        <p>Click the button above to test all the stats dashboard API endpoints.</p>
        <p>This will help identify which specific endpoints are failing and why.</p>
      </Card>
    </div>
  )
}

export default GameDataTestPage
