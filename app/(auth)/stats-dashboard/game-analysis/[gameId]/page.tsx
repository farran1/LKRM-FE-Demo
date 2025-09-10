'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Statistic, Table, Tag, Button, Spin, Alert, Tabs, Card, Row, Col, Divider, Tooltip } from 'antd';
import { 
  ArrowLeftOutlined,
  TrophyOutlined,
  UserOutlined,
  TeamOutlined,
  BarChartOutlined,
  PlayCircleOutlined,
  StarOutlined,
  SwapOutlined,
  CalendarOutlined,
  AimOutlined,
  InboxOutlined,
  ThunderboltOutlined,
  StopOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import TeamComparisonTable, { ComparisonStats } from '../components/TeamComparisonTable';

export default function GameAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  
  const [gameAnalysisData, setGameAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gameId) {
      fetchGameAnalysis();
    }
  }, [gameId]);

  // Debug quarter breakdown data
  useEffect(() => {
    if (gameAnalysisData?.quarterBreakdown) {
      console.log('Quarter Breakdown Data:', gameAnalysisData.quarterBreakdown);
      console.log('Consistency Score:', gameAnalysisData.quarterBreakdown.analysis?.consistency);
      console.log('Strongest Quarter:', gameAnalysisData.quarterBreakdown.analysis?.strongestQuarter);
      console.log('Weakest Quarter:', gameAnalysisData.quarterBreakdown.analysis?.weakestQuarter);
    }
  }, [gameAnalysisData]);

  const fetchGameAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/stats/game-analysis/${gameId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch game analysis: ${response.status}`);
      }
      
      const gameData = await response.json();
      
      if (gameData.error) {
        throw new Error(gameData.error);
      }
      
      setGameAnalysisData(gameData);
    } catch (error) {
      console.error('Failed to load game analysis:', error);
      setError(error instanceof Error ? error.message : 'Failed to load game analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main style={{ padding: '0 24px 24px 0', minHeight: '100vh', background: '#202c3e' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spin size="large" />
        </div>
      </main>
    );
  }

  if (error || !gameAnalysisData) {
    return (
      <main style={{ padding: '0 24px 24px 0', minHeight: '100vh', background: '#202c3e' }}>
        <Alert
          message="Error Loading Game Analysis"
          description={error || 'No game data available'}
          type="error"
          showIcon
          action={
            <Button danger onClick={fetchGameAnalysis}>
              Retry
            </Button>
          }
        />
      </main>
    );
  }

  const { gameInfo, teamStats, playerStats, playByPlay, standoutInfo, lineupComparison } = gameAnalysisData;

  return (
    <main style={{ padding: '0 24px 24px 0', minHeight: '100vh', background: '#202c3e' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '2px 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push('/stats-dashboard')}
            style={{ 
              background: 'rgba(255,255,255,0.1)', 
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff'
            }}
          >
            Back to Dashboard
          </Button>
          <div>
            <h1 style={{ color: '#fff', margin: 0, fontSize: '28px', fontWeight: '600' }}>
              Game Analysis
            </h1>
            <p style={{ color: '#b0b0b0', margin: '4px 0 0 0', fontSize: '14px' }}>
              vs {gameInfo?.opponent || 'Unknown'} • {gameInfo?.date ? new Date(gameInfo.date).toLocaleDateString() : 'Unknown Date'}
            </p>
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1890ff', marginBottom: '4px' }}>
            {gameInfo?.score || '0-0'}
          </div>
          <Tag 
            color={gameInfo?.result === 'W' ? 'success' : gameInfo?.result === 'L' ? 'error' : 'warning'} 
            style={{ 
              fontSize: '16px', 
              padding: '4px 12px',
              border: 'none'
            }}
          >
            {gameInfo?.result === 'W' ? 'WIN' : gameInfo?.result === 'L' ? 'LOSS' : 'TIE'}
          </Tag>
        </div>
      </div>

      {/* Top 3 Shooting Percentage Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col span={8}>
          <Card style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: '#b0b0b0', fontSize: 16 }}>Field Goals</span>
              <span style={{ color: '#52c41a', fontSize: 16,fontWeight: 700 }}>{teamStats?.fieldGoals?.percentage || 0}%</span>
            </div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              {(teamStats?.fieldGoals?.made || 0)}/{(teamStats?.fieldGoals?.attempted || 0)}
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${teamStats?.fieldGoals?.percentage || 0}%`, height: '100%', background: '#52c41a' }} />
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: '#b0b0b0', fontSize: 16 }}>Three Pointers</span>
              <span style={{ color: '#1890ff', fontSize: 16,fontWeight: 700 }}>{teamStats?.threePointers?.percentage || 0}%</span>
            </div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              {(teamStats?.threePointers?.made || 0)}/{(teamStats?.threePointers?.attempted || 0)}
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${teamStats?.threePointers?.percentage || 0}%`, height: '100%', background: '#1890ff' }} />
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: '#b0b0b0', fontSize: 16 }}>Free Throws</span>
              <span style={{ color: '#faad14', fontSize: 16, fontWeight: 700 }}>{teamStats?.freeThrows?.percentage || 0}%</span>
            </div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              {(teamStats?.freeThrows?.made || 0)}/{(teamStats?.freeThrows?.attempted || 0)}
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${teamStats?.freeThrows?.percentage || 0}%`, height: '100%', background: '#faad14' }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 5 Smaller Stats Blocks Below */}
      <Row gutter={[12, 8]} style={{ marginBottom: '24px' }}>
        <Col span={5}>
          <Card style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 500 }}>Rebounds</span>
              <TeamOutlined style={{ color: '#B58842', fontSize: 16 }} />
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700 }}>
              {(teamStats?.rebounds?.offensive || 0) + (teamStats?.rebounds?.defensive || 0)}
            </div>
          </Card>
        </Col>
        <Col span={5}>
          <Card style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 500 }}>Assists</span>
              <UserOutlined style={{ color: '#B58842', fontSize: 16 }} />
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700 }}>
              {teamStats?.assists || 0}
            </div>
          </Card>
        </Col>
        <Col span={5}>
          <Card style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 500 }}>Turnovers</span>
              <SwapOutlined style={{ color: '#B58842', fontSize: 16 }} />
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700 }}>
              {teamStats?.turnovers || 0}
            </div>
          </Card>
        </Col>
        <Col span={5}>
          <Card style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 500 }}>Steals</span>
              <TeamOutlined style={{ color: '#B58842', fontSize: 16 }} />
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700 }}>
              {teamStats?.steals || 0}
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 500 }}>Blocks</span>
              <TeamOutlined style={{ color: '#B58842', fontSize: 16 }} />
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700 }}>
              {teamStats?.blocks || 0}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card style={{ 
        background: 'rgba(255,255,255,0.05)', 
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px'
      }}>
        <Tabs
          defaultActiveKey="team-stats"
          items={[
            {
              key: 'team-stats',
              label: (
                <span style={{ color: '#fff' }}>
                  <TeamOutlined style={{ marginRight: '8px' }} />
                  Team Stats
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <Row gutter={[16, 16]}>
                    {/* Shooting Breakdown temporarily disabled to reduce duplication with header tiles. */}
                    {/* <Col span={12}>
                      <Card title="Shooting Breakdown" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        ...
                      </Card>
                    </Col> */}
                    
                  </Row>

                  {gameAnalysisData?.opponentStats ? (
                    <div style={{ marginTop: 16 }}>
                      <TeamComparisonTable 
                        teamStats={{
                          fgMade: teamStats?.fieldGoals?.made,
                          fgAttempted: teamStats?.fieldGoals?.attempted,
                          fgPercentage: teamStats?.fieldGoals?.percentage,
                          twoPointMade: (teamStats?.fieldGoals?.made || 0) - (teamStats?.threePointers?.made || 0),
                          twoPointAttempted: (teamStats?.fieldGoals?.attempted || 0) - (teamStats?.threePointers?.attempted || 0),
                          twoPointPercentage: (() => {
                            const made = (teamStats?.fieldGoals?.made || 0) - (teamStats?.threePointers?.made || 0);
                            const attempted = (teamStats?.fieldGoals?.attempted || 0) - (teamStats?.threePointers?.attempted || 0);
                            return attempted > 0 ? Math.round((made / attempted) * 100) : 0;
                          })(),
                          threePointMade: teamStats?.threePointers?.made,
                          threePointAttempted: teamStats?.threePointers?.attempted,
                          threePointPercentage: teamStats?.threePointers?.percentage,
                          ftMade: teamStats?.freeThrows?.made,
                          ftAttempted: teamStats?.freeThrows?.attempted,
                          ftPercentage: teamStats?.freeThrows?.percentage,
                          totalRebounds: (teamStats?.rebounds?.offensive || 0) + (teamStats?.rebounds?.defensive || 0),
                          totalAssists: teamStats?.assists,
                          totalSteals: teamStats?.steals,
                          totalBlocks: teamStats?.blocks,
                          totalTurnovers: teamStats?.turnovers,
                          totalFouls: teamStats?.fouls,
                          pointsInPaint: teamStats?.pointsInPaint,
                          secondChancePoints: teamStats?.secondChancePoints,
                          pointsOffTurnovers: teamStats?.pointsOffTurnovers,
                          benchPoints: teamStats?.benchPoints,
                        }}
                        opponentStats={{
                          fgMade: gameAnalysisData.opponentStats?.fieldGoals?.made,
                          fgAttempted: gameAnalysisData.opponentStats?.fieldGoals?.attempted,
                          fgPercentage: gameAnalysisData.opponentStats?.fieldGoals?.percentage,
                          twoPointMade: (gameAnalysisData.opponentStats?.fieldGoals?.made || 0) - (gameAnalysisData.opponentStats?.threePointers?.made || 0),
                          twoPointAttempted: (gameAnalysisData.opponentStats?.fieldGoals?.attempted || 0) - (gameAnalysisData.opponentStats?.threePointers?.attempted || 0),
                          twoPointPercentage: (() => {
                            const made = (gameAnalysisData.opponentStats?.fieldGoals?.made || 0) - (gameAnalysisData.opponentStats?.threePointers?.made || 0);
                            const attempted = (gameAnalysisData.opponentStats?.fieldGoals?.attempted || 0) - (gameAnalysisData.opponentStats?.threePointers?.attempted || 0);
                            return attempted > 0 ? Math.round((made / attempted) * 100) : 0;
                          })(),
                          threePointMade: gameAnalysisData.opponentStats?.threePointers?.made,
                          threePointAttempted: gameAnalysisData.opponentStats?.threePointers?.attempted,
                          threePointPercentage: gameAnalysisData.opponentStats?.threePointers?.percentage,
                          ftMade: gameAnalysisData.opponentStats?.freeThrows?.made,
                          ftAttempted: gameAnalysisData.opponentStats?.freeThrows?.attempted,
                          ftPercentage: gameAnalysisData.opponentStats?.freeThrows?.percentage,
                          totalRebounds: (gameAnalysisData.opponentStats?.rebounds?.offensive || 0) + (gameAnalysisData.opponentStats?.rebounds?.defensive || 0),
                          totalAssists: gameAnalysisData.opponentStats?.assists,
                          totalSteals: gameAnalysisData.opponentStats?.steals,
                          totalBlocks: gameAnalysisData.opponentStats?.blocks,
                          totalTurnovers: gameAnalysisData.opponentStats?.turnovers,
                          totalFouls: gameAnalysisData.opponentStats?.fouls,
                          pointsInPaint: gameAnalysisData.opponentStats?.pointsInPaint,
                          secondChancePoints: gameAnalysisData.opponentStats?.secondChancePoints,
                          pointsOffTurnovers: gameAnalysisData.opponentStats?.pointsOffTurnovers,
                          benchPoints: gameAnalysisData.opponentStats?.benchPoints,
                        }}
                        teamName={gameInfo?.name || "TEAM"}
                        opponentName={gameInfo?.opponent || "OPPONENT"}
                      />
                    </div>
                  ) : null}
                </div>
              )
            },
            {
              key: 'player-stats',
              label: (
                <span style={{ color: '#fff' }}>
                  <UserOutlined style={{ marginRight: '8px' }} />
                  Player Stats
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <Table
                    dataSource={playerStats || []}
                    columns={[
                      { 
                        title: (<Tooltip title="Player name"><span style={{ color: '#fff' }}>Player</span></Tooltip>),
                        dataIndex: 'name', 
                        key: 'name',
                        sorter: (a: any, b: any) => a.name.localeCompare(b.name),
                        width: 150,
                        render: (text: string, record: any) => (
                          <div>
                            <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>
                              {text}
                            </div>
                            <div style={{ color: '#b0b0b0', fontSize: '12px' }}>
                              {record.position} #{record.number}
                            </div>
                          </div>
                        )
                      },
                      { 
                        title: (<Tooltip title="Jersey number"><span style={{ color: '#fff' }}>#</span></Tooltip>),
                        dataIndex: 'number', 
                        key: 'number',
                        sorter: (a: any, b: any) => Number(a.number) - Number(b.number),
                        width: 60,
                        render: (value: any) => <span style={{ color: '#fff' }}>{value}</span>
                      },
                      { 
                        title: (<Tooltip title="Player position"><span style={{ color: '#fff' }}>Pos</span></Tooltip>),
                        dataIndex: 'position', 
                        key: 'position',
                        sorter: (a: any, b: any) => (a.position || '').localeCompare(b.position || ''),
                        width: 75,
                        render: (value: any) => <span style={{ color: '#fff' }}>{value}</span>
                      },
                      { 
                        title: (<Tooltip title="Total points scored"><span style={{ color: '#fff' }}>PTS</span></Tooltip>), 
                        dataIndex: 'points', 
                        key: 'points', 
                        sorter: (a: any, b: any) => a.points - b.points,
                        render: (text: any, record: any) => record.points === 0 ? '' : <span style={{ color: '#1890ff', fontWeight: '600' }}>{record.points}</span>
                      },
                      { 
                        title: (<Tooltip title="Total rebounds (offensive + defensive)"><span style={{ color: '#fff' }}>REB</span></Tooltip>), 
                        dataIndex: 'rebounds', 
                        key: 'rebounds', 
                        sorter: (a: any, b: any) => a.rebounds - b.rebounds,
                        render: (text: any, record: any) => record.rebounds === 0 ? '' : record.rebounds
                      },
                      { 
                        title: (<Tooltip title="Total assists"><span style={{ color: '#fff' }}>AST</span></Tooltip>), 
                        dataIndex: 'assists', 
                        key: 'assists', 
                        sorter: (a: any, b: any) => a.assists - b.assists,
                        render: (text: any, record: any) => record.assists === 0 ? '' : record.assists
                      },
                      { 
                        title: (<Tooltip title="Total steals"><span style={{ color: '#fff' }}>STL</span></Tooltip>), 
                        dataIndex: 'steals', 
                        key: 'steals', 
                        sorter: (a: any, b: any) => a.steals - b.steals,
                        render: (text: any, record: any) => record.steals === 0 ? '' : record.steals
                      },
                      { 
                        title: (<Tooltip title="Total blocks"><span style={{ color: '#fff' }}>BLK</span></Tooltip>), 
                        dataIndex: 'blocks', 
                        key: 'blocks', 
                        sorter: (a: any, b: any) => a.blocks - b.blocks,
                        render: (text: any, record: any) => record.blocks === 0 ? '' : record.blocks
                      },
                      { 
                        title: (<Tooltip title="Total turnovers"><span style={{ color: '#fff' }}>TO</span></Tooltip>), 
                        dataIndex: 'turnovers', 
                        key: 'turnovers', 
                        sorter: (a: any, b: any) => a.turnovers - b.turnovers,
                        render: (text: any, record: any) => record.turnovers === 0 ? '' : record.turnovers
                      },
                      { 
                        title: (<Tooltip title="Personal Fouls"><span style={{ color: '#fff' }}>PF</span></Tooltip>), 
                        dataIndex: 'fouls', 
                        key: 'fouls', 
                        sorter: (a: any, b: any) => a.fouls - b.fouls,
                        render: (text: any, record: any) => record.fouls === 0 ? '' : record.fouls
                      },
                      { 
                        title: (<Tooltip title="Field goal percentage: FG made / FG attempted"><span style={{ color: '#fff' }}>FG</span></Tooltip>), 
                        key: 'fgPercentage',
                        render: (text: any, record: any) => {
                          const fgAttempted = record.fgAttempted || record.fieldGoals?.attempted || 0;
                          const fgMade = record.fgMade || record.fieldGoals?.made || 0;
                          return fgAttempted > 0 ? `${Math.round((fgMade / fgAttempted) * 100)}%` : '0%';
                        },
                        sorter: (a: any, b: any) => {
                          const aPct = (a.fgAttempted || a.fieldGoals?.attempted || 0) > 0 ? (a.fgMade || a.fieldGoals?.made || 0) / (a.fgAttempted || a.fieldGoals?.attempted || 0) : 0;
                          const bPct = (b.fgAttempted || b.fieldGoals?.attempted || 0) > 0 ? (b.fgMade || b.fieldGoals?.made || 0) / (b.fgAttempted || b.fieldGoals?.attempted || 0) : 0;
                          return aPct - bPct;
                        }
                      },
                      { 
                        title: (<Tooltip title="Team point differential while the player is on court"><span style={{ color: '#fff' }}>+/-</span></Tooltip>), 
                        dataIndex: 'plusMinus', 
                        key: 'plusMinus', 
                        sorter: (a: any, b: any) => a.plusMinus - b.plusMinus,
                        render: (text: any, record: any) => record.plusMinus === 0 ? '' : <span style={{ color: record.plusMinus >= 0 ? '#52c41a' : '#ff4d4f' }}>{record.plusMinus}</span>,
                        width: 70
                      },
                      { 
                        title: (<Tooltip title="EFF = PTS + REB + AST + STL + BLK - Missed FG - Missed FT − TO"><span style={{ color: '#fff' }}>EFF</span></Tooltip>),
                        key: 'efficiency', 
                        render: (text: any, record: any) => {
                          // Use flattened structure first, fallback to nested
                          const fgAttempted = record.fgAttempted || record.fieldGoals?.attempted || 0;
                          const fgMade = record.fgMade || record.fieldGoals?.made || 0;
                          const ftAttempted = record.ftAttempted || record.freeThrows?.attempted || 0;
                          const ftMade = record.ftMade || record.freeThrows?.made || 0;
                          const missedFg = fgAttempted - fgMade;
                          const missedFt = ftAttempted - ftMade;
                          const efficiency = (record.points || 0) + (record.rebounds || 0) + (record.assists || 0) + (record.steals || 0) + (record.blocks || 0) - missedFg - missedFt - (record.turnovers || 0);
                          return <span style={{ color: '#fff' }}>{isNaN(efficiency) ? 0 : efficiency}</span>;
                        },
                        sorter: (a: any, b: any) => {
                          const effA = (a.points || 0) + (a.rebounds || 0) + (a.assists || 0) + (a.steals || 0) + (a.blocks || 0) - ((a.fgAttempted || a.fieldGoals?.attempted || 0) - (a.fgMade || a.fieldGoals?.made || 0)) - ((a.ftAttempted || a.freeThrows?.attempted || 0) - (a.ftMade || a.freeThrows?.made || 0)) - (a.turnovers || 0);
                          const effB = (b.points || 0) + (b.rebounds || 0) + (b.assists || 0) + (b.steals || 0) + (b.blocks || 0) - ((b.fgAttempted || b.fieldGoals?.attempted || 0) - (b.fgMade || b.fieldGoals?.made || 0)) - ((b.ftAttempted || b.freeThrows?.attempted || 0) - (b.ftMade || b.freeThrows?.made || 0)) - (b.turnovers || 0);
                          return effA - effB;
                        }
                      }
                    ]}
                    pagination={false}
                    size="middle"
                    style={{ background: 'transparent' }}
                    showSorterTooltip={false}
                    components={{
                      body: {
                        row: ({ children, ...props }: any) => (
                          <tr {...props} style={{ 
                            background: 'rgba(255,255,255,0.05)', 
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff'
                          }}>
                            {children}
                          </tr>
                        ),
                        cell: ({ children, ...props }: any) => (
                          <td {...props} style={{ 
                            padding: '12px 16px', 
                            color: '#fff',
                            fontSize: '14px'
                          }}>
                            {children}
                          </td>
                        )
                      }
                    }}
                  />
                  
                  {/* Opponent Box Score */}
                  {gameAnalysisData?.opponentStats && (
                    <div style={{ marginTop: '24px' }}>
                      <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                        {gameInfo?.opponent || 'OPPONENT'} Box Score
                      </h3>
                      <Table
                        dataSource={gameAnalysisData?.opponentPlayerStats || []}
                        columns={[
                          { 
                            title: (<Tooltip title="Player name"><span style={{ color: '#fff' }}>Player</span></Tooltip>),
                            dataIndex: 'name', 
                            key: 'name',
                            sorter: (a: any, b: any) => a.name.localeCompare(b.name),
                            width: 150,
                            render: (text: string, record: any) => (
                              <div>
                                <div style={{ color: '#ff7875', fontSize: '14px', fontWeight: '600' }}>
                                  {text}
                                </div>
                                <div style={{ color: '#b0b0b0', fontSize: '12px' }}>
                                  {record.position} #{record.number}
                                </div>
                </div>
              )
            },
            {
                            title: (<Tooltip title="Jersey number"><span style={{ color: '#fff' }}>#</span></Tooltip>),
                            dataIndex: 'number', 
                            key: 'number',
                            sorter: (a: any, b: any) => Number(a.number) - Number(b.number),
                            width: 60,
                            render: (value: any) => <span style={{ color: '#fff' }}>{value}</span>
                          },
                          { 
                            title: (<Tooltip title="Player position"><span style={{ color: '#fff' }}>Pos</span></Tooltip>),
                            dataIndex: 'position', 
                            key: 'position',
                            sorter: (a: any, b: any) => (a.position || '').localeCompare(b.position || ''),
                            width: 75,
                            render: (value: any) => <span style={{ color: '#fff' }}>{value}</span>
                          },
                          { 
                            title: (<Tooltip title="Total points scored"><span style={{ color: '#fff' }}>PTS</span></Tooltip>), 
                            dataIndex: 'points', 
                            key: 'points', 
                            sorter: (a: any, b: any) => a.points - b.points,
                            render: (text: any, record: any) => record.points === 0 ? '' : <span style={{ color: '#ff4d4f', fontWeight: '600' }}>{record.points}</span>
                          },
                          { 
                            title: (<Tooltip title="Total rebounds (offensive + defensive)"><span style={{ color: '#fff' }}>REB</span></Tooltip>), 
                            dataIndex: 'rebounds', 
                            key: 'rebounds', 
                            sorter: (a: any, b: any) => a.rebounds - b.rebounds,
                            render: (text: any, record: any) => record.rebounds === 0 ? '' : record.rebounds
                          },
                          { 
                            title: (<Tooltip title="Total assists"><span style={{ color: '#fff' }}>AST</span></Tooltip>), 
                            dataIndex: 'assists', 
                            key: 'assists', 
                            sorter: (a: any, b: any) => a.assists - b.assists,
                            render: (text: any, record: any) => record.assists === 0 ? '' : record.assists
                          },
                          { 
                            title: (<Tooltip title="Total steals"><span style={{ color: '#fff' }}>STL</span></Tooltip>), 
                            dataIndex: 'steals', 
                            key: 'steals', 
                            sorter: (a: any, b: any) => a.steals - b.steals,
                            render: (text: any, record: any) => record.steals === 0 ? '' : record.steals
                          },
                          { 
                            title: (<Tooltip title="Total blocks"><span style={{ color: '#fff' }}>BLK</span></Tooltip>), 
                            dataIndex: 'blocks', 
                            key: 'blocks', 
                            sorter: (a: any, b: any) => a.blocks - b.blocks,
                            render: (text: any, record: any) => record.blocks === 0 ? '' : record.blocks
                          },
                          { 
                            title: (<Tooltip title="Total turnovers"><span style={{ color: '#fff' }}>TO</span></Tooltip>), 
                            dataIndex: 'turnovers', 
                            key: 'turnovers', 
                            sorter: (a: any, b: any) => a.turnovers - b.turnovers,
                            render: (text: any, record: any) => record.turnovers === 0 ? '' : record.turnovers
                          },
                          { 
                            title: (<Tooltip title="Personal Fouls"><span style={{ color: '#fff' }}>PF</span></Tooltip>), 
                            dataIndex: 'fouls', 
                            key: 'fouls', 
                            sorter: (a: any, b: any) => a.fouls - b.fouls,
                            render: (text: any, record: any) => record.fouls === 0 ? '' : record.fouls
                          },
                          { 
                            title: (<Tooltip title="Field goal percentage: FG made / FG attempted"><span style={{ color: '#fff' }}>FG</span></Tooltip>), 
                            key: 'fgPercentage',
                            render: (text: any, record: any) => {
                              const fgAttempted = record.fgAttempted || record.fieldGoals?.attempted || 0;
                              const fgMade = record.fgMade || record.fieldGoals?.made || 0;
                              return fgAttempted > 0 ? `${Math.round((fgMade / fgAttempted) * 100)}%` : '0%';
                            },
                            sorter: (a: any, b: any) => {
                              const aPct = (a.fgAttempted || a.fieldGoals?.attempted || 0) > 0 ? (a.fgMade || a.fieldGoals?.made || 0) / (a.fgAttempted || a.fieldGoals?.attempted || 0) : 0;
                              const bPct = (b.fgAttempted || b.fieldGoals?.attempted || 0) > 0 ? (b.fgMade || b.fieldGoals?.made || 0) / (b.fgAttempted || b.fieldGoals?.attempted || 0) : 0;
                              return aPct - bPct;
                            }
                          },
                          { 
                            title: (<Tooltip title="Team point differential while the player is on court"><span style={{ color: '#fff' }}>+/-</span></Tooltip>), 
                            dataIndex: 'plusMinus', 
                            key: 'plusMinus', 
                            sorter: (a: any, b: any) => a.plusMinus - b.plusMinus,
                            render: (text: any, record: any) => record.plusMinus === 0 ? '' : <span style={{ color: record.plusMinus >= 0 ? '#52c41a' : '#ff4d4f' }}>{record.plusMinus}</span>,
                            width: 70
                          },
                          { 
                            title: (<Tooltip title="EFF = PTS + REB + AST + STL + BLK - Missed FG - Missed FT − TO"><span style={{ color: '#fff' }}>EFF</span></Tooltip>),
                            key: 'efficiency', 
                            render: (text: any, record: any) => {
                              // Use flattened structure first, fallback to nested
                              const fgAttempted = record.fgAttempted || record.fieldGoals?.attempted || 0;
                              const fgMade = record.fgMade || record.fieldGoals?.made || 0;
                              const ftAttempted = record.ftAttempted || record.freeThrows?.attempted || 0;
                              const ftMade = record.ftMade || record.freeThrows?.made || 0;
                              const missedFg = fgAttempted - fgMade;
                              const missedFt = ftAttempted - ftMade;
                              const efficiency = (record.points || 0) + (record.rebounds || 0) + (record.assists || 0) + (record.steals || 0) + (record.blocks || 0) - missedFg - missedFt - (record.turnovers || 0);
                              return <span style={{ color: '#fff' }}>{isNaN(efficiency) ? 0 : efficiency}</span>;
                            },
                            sorter: (a: any, b: any) => {
                              const effA = (a.points || 0) + (a.rebounds || 0) + (a.assists || 0) + (a.steals || 0) + (a.blocks || 0) - ((a.fgAttempted || a.fieldGoals?.attempted || 0) - (a.fgMade || a.fieldGoals?.made || 0)) - ((a.ftAttempted || a.freeThrows?.attempted || 0) - (a.ftMade || a.freeThrows?.made || 0)) - (a.turnovers || 0);
                              const effB = (b.points || 0) + (b.rebounds || 0) + (b.assists || 0) + (b.steals || 0) + (b.blocks || 0) - ((b.fgAttempted || b.fieldGoals?.attempted || 0) - (b.fgMade || b.fieldGoals?.made || 0)) - ((b.ftAttempted || b.freeThrows?.attempted || 0) - (b.ftMade || b.freeThrows?.made || 0)) - (b.turnovers || 0);
                              return effA - effB;
                            }
                          }
                        ]}
                          pagination={false}
                        size="middle"
                          style={{ background: 'transparent' }}
                        showSorterTooltip={false}
                          components={{
                            body: {
                              row: ({ children, ...props }: any) => (
                                <tr {...props} style={{ 
                                background: 'rgba(255,77,79,0.05)', 
                                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                                  color: '#fff'
                                }}>
                                  {children}
                                </tr>
                              ),
                              cell: ({ children, ...props }: any) => (
                                <td {...props} style={{ 
                                padding: '12px 16px', 
                                  color: '#fff',
                                fontSize: '14px'
                                }}>
                                  {children}
                                </td>
                              )
                            }
                          }}
                      />
                    </div>
                  )}
                </div>
              )
            },
            // Advanced Metrics tab - commented out
            // {
            //   key: 'advanced-metrics',
            //   label: (
            //     <span style={{ color: '#fff' }}>
            //       <BarChartOutlined style={{ marginRight: '8px' }} />
            //       Advanced Metrics
            //     </span>
            //   ),
            //   children: (
            //     <div style={{ padding: '16px 0' }}>
            //       <Row gutter={[16, 16]}>
            //         <Col span={12}>
            //           <Card title="Team Efficiency" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
            //               <div><strong>Points per Possession:</strong> {gameAnalysisData?.advancedMetrics?.teamEfficiency?.pointsPerPossession || 0}</div>
            //               <div><strong>True Shooting %:</strong> {gameAnalysisData?.advancedMetrics?.teamEfficiency?.trueShootingPercentage || 0}%</div>
            //               <div><strong>Offensive Efficiency:</strong> {gameAnalysisData?.advancedMetrics?.teamEfficiency?.offensiveEfficiency || 0}</div>
            //               <div><strong>Defensive Efficiency:</strong> {gameAnalysisData?.advancedMetrics?.teamEfficiency?.defensiveEfficiency || 0}</div>
            //               <div><strong>Pace:</strong> {gameAnalysisData?.advancedMetrics?.teamEfficiency?.pace || 0}</div>
            //             </div>
            //           </Card>
            //         </Col>
            //         <Col span={12}>
            //           <Card title="Position Performance" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
            //               <div><strong>Guards:</strong> {gameAnalysisData?.advancedMetrics?.positionMetrics?.guards?.count || 0} players, {gameAnalysisData?.advancedMetrics?.positionMetrics?.guards?.points || 0} pts, {gameAnalysisData?.advancedMetrics?.positionMetrics?.guards?.fgPct || 0}% FG</div>
            //               <div><strong>Forwards:</strong> {gameAnalysisData?.advancedMetrics?.positionMetrics?.forwards?.count || 0} players, {gameAnalysisData?.advancedMetrics?.positionMetrics?.forwards?.points || 0} pts, {gameAnalysisData?.advancedMetrics?.positionMetrics?.forwards?.fgPct || 0}% FG</div>
            //               <div><strong>Centers:</strong> {gameAnalysisData?.advancedMetrics?.positionMetrics?.centers?.count || 0} players, {gameAnalysisData?.advancedMetrics?.positionMetrics?.centers?.points || 0} pts, {gameAnalysisData?.advancedMetrics?.positionMetrics?.centers?.fgPct || 0}% FG</div>
            //             </div>
            //           </Card>
            //         </Col>
            //       </Row>
            //       
            //       <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            //         <Col span={24}>
            //           <Card title="Player Efficiency Ratings" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             <Table
            //               dataSource={gameAnalysisData?.advancedMetrics?.playerEfficiencyRatings || []}
            //               pagination={false}
            //               size="small"
            //               style={{ background: 'transparent' }}
            //               components={{
            //                 body: {
            //                   row: ({ children, ...props }: any) => (
            //                     <tr {...props} style={{ 
            //                       background: 'rgba(255,255,255,0.05)', 
            //                       borderBottom: '1px solid rgba(255,255,255,0.1)',
            //                       color: '#fff'
            //                     }}>
            //                       {children}
            //                     </tr>
            //                   ),
            //                   cell: ({ children, ...props }: any) => (
            //                     <td {...props} style={{ 
            //                       padding: '8px 12px', 
            //                       color: '#fff',
            //                       fontSize: '12px'
            //                     }}>
            //                       {children}
            //                     </td>
            //                   )
            //                 }
            //               }}
            //             >
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Player</span>}
            //                 dataIndex="name" 
            //                 key="name"
            //                 render={(text: string) => <span style={{ color: '#fff', fontWeight: '600' }}>{text}</span>}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Offensive</span>}
            //                 dataIndex="offensiveRating" 
            //                 key="offensiveRating"
            //                 render={(value: number) => <span style={{ color: '#1890ff' }}>{value}</span>}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Defensive</span>}
            //                 dataIndex="defensiveRating" 
            //                 key="defensiveRating"
            //                 render={(value: number) => <span style={{ color: '#52c41a' }}>{value}</span>}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>True Shooting</span>}
            //                 dataIndex="trueShootingPercentage" 
            //                 key="trueShootingPercentage"
            //                 render={(value: number) => <span style={{ color: '#722ed1' }}>{value}%</span>}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Usage Rate</span>}
            //                 dataIndex="usageRate" 
            //                 key="usageRate"
            //                 render={(value: number) => <span style={{ color: '#faad14' }}>{value}%</span>}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Overall</span>}
            //                 dataIndex="efficiency" 
            //                 key="efficiency"
            //                 render={(value: number) => <span style={{ color: '#ff4d4f', fontWeight: '600' }}>{value}</span>}
            //               />
            //             </Table>
            //           </Card>
            //         </Col>
            //       </Row>
            //     </div>
            //   )
            // },
            {
              key: 'quarter-breakdown',
              label: (
                <span style={{ color: '#fff' }}>
                  <CalendarOutlined style={{ marginRight: '8px' }} />
                  Quarter Breakdown
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <Card title="Quarter Performance" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Row gutter={[16, 16]}>
                          {gameAnalysisData?.quarterBreakdown?.quarters?.map((quarter: any) => (
                            <Col span={6} key={quarter.quarter}>
                              <Card 
                                style={{ 
                                  background: 'rgba(255,255,255,0.05)', 
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  textAlign: 'center'
                                }}
                              >
                                <div style={{ color: '#1890ff', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                                  Q{quarter.quarter}
                                </div>
                                <div style={{ color: '#fff', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
                                  {quarter.points}
                                </div>
                                <div style={{ color: '#b0b0b0', fontSize: '12px', marginBottom: '4px' }}>
                                  {quarter.fgPct}% FG
                                </div>
                                <div style={{ color: '#b0b0b0', fontSize: '12px', marginBottom: '4px' }}>
                                  {quarter.turnovers} Turnovers
                                </div>
                                <div style={{ color: '#b0b0b0', fontSize: '12px', marginBottom: '4px' }}>
                                  {quarter.timeouts || 0} Timeouts
                                </div>
                                {/* Quarter momentum display - commented out */}
                                {/* <div style={{ 
                                  color: quarter.momentum === 'positive' ? '#52c41a' : '#ff4d4f', 
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}>
                                  {quarter.momentum === 'positive' ? '↗' : '↘'} {quarter.momentum}
                                </div> */}
                              </Card>
                            </Col>
                          ))}
                        </Row>
                        
                        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                          <Col span={12}>
                            <Card title="First Half" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <div style={{ fontSize: '16px', lineHeight: '2', color: '#fff' }}>
                                <div><strong>Points:</strong> {gameAnalysisData?.quarterBreakdown?.firstHalf?.points || 0}</div>
                                <div><strong>FG%:</strong> {gameAnalysisData?.quarterBreakdown?.firstHalf?.fgPct || 0}%</div>
                                <div><strong>Turnovers:</strong> {gameAnalysisData?.quarterBreakdown?.firstHalf?.turnovers || 0}</div>
                              </div>
                            </Card>
                          </Col>
                          <Col span={12}>
                            <Card title="Second Half" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <div style={{ fontSize: '16px', lineHeight: '2', color: '#fff' }}>
                                <div><strong>Points:</strong> {gameAnalysisData?.quarterBreakdown?.secondHalf?.points || 0}</div>
                                <div><strong>FG%:</strong> {gameAnalysisData?.quarterBreakdown?.secondHalf?.fgPct || 0}%</div>
                                <div><strong>Turnovers:</strong> {gameAnalysisData?.quarterBreakdown?.secondHalf?.turnovers || 0}</div>
                              </div>
                            </Card>
                          </Col>
                        </Row>
                        
                        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                          <Col span={24}>
                            <Card 
                              title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                  <Tooltip title="Analysis of team performance across all four quarters of the game">
                                    <span style={{ color: '#fff', cursor: 'help' }}>Quarter Performance</span>
                                  </Tooltip>
                                  <Tooltip title="Measures how consistent the team's performance is across quarters. Higher scores indicate more steady performance, while lower scores show dramatic swings between quarters.">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'help', minWidth: '120px' }}>
                                      <div style={{ 
                                        width: '80px', 
                                        height: '8px', 
                                        background: 'rgba(255,255,255,0.2)', 
                                        borderRadius: '4px',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(255,255,255,0.3)'
                                      }}>
                                        <div style={{ 
                                          width: `${gameAnalysisData?.quarterBreakdown?.analysis?.consistency || 0}%`, 
                                          height: '100%', 
                                          background: 'linear-gradient(90deg, #ff4d4f, #faad14, #52c41a)',
                                          transition: 'width 0.3s ease'
                                        }} />
                                      </div>
                                      <span style={{ 
                                        color: gameAnalysisData?.quarterBreakdown?.analysis?.consistency >= 70 ? '#52c41a' : 
                                               gameAnalysisData?.quarterBreakdown?.analysis?.consistency >= 40 ? '#faad14' : '#ff4d4f',
                                        fontWeight: '700',
                                        fontSize: '16px',
                                        minWidth: '40px',
                                        textAlign: 'center'
                                      }}>
                                        {gameAnalysisData?.quarterBreakdown?.analysis?.consistency || 0}%
                                      </span>
                                    </div>
                                  </Tooltip>
                                </div>
                              } 
                              style={{ 
                                background: 'rgba(255,255,255,0.08)', 
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', padding: '20px 0', minHeight: '120px' }}>
                                <Tooltip title="The quarter where the team scored the most points">
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 1 }}>
                                    <div style={{ 
                                      width: '60px', 
                                      height: '60px', 
                                      borderRadius: '50%', 
                                      background: 'linear-gradient(135deg, #52c41a, #73d13d)',
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)',
                                      border: '2px solid rgba(255,255,255,0.2)'
                                    }}>
                                      <TrophyOutlined style={{ fontSize: '24px', color: '#fff' }} />
                                    </div>
                                    <span style={{ color: '#52c41a', fontWeight: '600', fontSize: '14px' }}>
                                      Q{gameAnalysisData?.quarterBreakdown?.analysis?.strongestQuarter || 0}
                                    </span>
                                    <span style={{ color: '#b0b0b0', fontSize: '12px' }}>Strongest</span>
                                  </div>
                                </Tooltip>
                                
                                <div style={{ width: '2px', height: '60px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px' }} />
                                
                                <Tooltip title="The quarter where the team scored the fewest points">
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 1 }}>
                                    <div style={{ 
                                      width: '60px', 
                                      height: '60px', 
                                      borderRadius: '50%', 
                                      background: 'linear-gradient(135deg, #ff4d4f, #ff7875)',
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)',
                                      border: '2px solid rgba(255,255,255,0.2)'
                                    }}>
                                      <SwapOutlined style={{ fontSize: '24px', color: '#fff' }} />
                                    </div>
                                    <span style={{ color: '#ff4d4f', fontWeight: '600', fontSize: '14px' }}>
                                      Q{gameAnalysisData?.quarterBreakdown?.analysis?.weakestQuarter || 0}
                                    </span>
                                    <span style={{ color: '#b0b0b0', fontSize: '12px' }}>Weakest</span>
                                  </div>
                                </Tooltip>
                              </div>
                            </Card>
                          </Col>
                        </Row>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )
            },
            // Strategic Insights tab - commented out
            // {
            //   key: 'strategic-insights',
            //   label: (
            //     <span style={{ color: '#fff' }}>
            //       <SwapOutlined style={{ marginRight: '8px' }} />
            //       Strategic Insights
            //     </span>
            //   ),
            //   children: (
            //     <div style={{ padding: '16px 0' }}>
            //       <Row gutter={[16, 16]}>
            //         <Col span={12}>
            //           <Card title="Lineup Effectiveness" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
            //               <div><strong>Most Effective Lineups:</strong></div>
            //               {gameAnalysisData?.strategicInsights?.lineupEffectiveness?.mostEffective?.map((lineup: any, index: number) => (
            //                 <div key={index} style={{ marginLeft: '16px', marginBottom: '8px' }}>
            //                   • {lineup.players.join(', ')} (+{lineup.plusMinus}, {lineup.minutes} min)
            //                 </div>
            //               ))}
            //               <div style={{ marginTop: '12px' }}>
            //                 <strong>Average +/-:</strong> {gameAnalysisData?.strategicInsights?.lineupEffectiveness?.averagePlusMinus || 0}
            //               </div>
            //             </div>
            //           </Card>
            //         </Col>
            //         <Col span={12}>
            //           <Card title="Game Flow" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
            //               <div><strong>Largest Lead:</strong> +{gameAnalysisData?.strategicInsights?.gameFlow?.largestLead || 0}</div>
            //               <div><strong>Largest Deficit:</strong> -{gameAnalysisData?.strategicInsights?.gameFlow?.largestDeficit || 0}</div>
            //               <div><strong>Momentum Shifts:</strong> {gameAnalysisData?.strategicInsights?.gameFlow?.momentumShifts || 0}</div>
            //               <div><strong>Scoring Runs:</strong> {gameAnalysisData?.strategicInsights?.gameFlow?.scoringRuns?.length || 0}</div>
            //             </div>
            //           </Card>
            //         </Col>
            //       </Row>
            //       
            //       <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            //         <Col span={12}>
            //           <Card title="Defensive Insights" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
            //               <div><strong>Steals/Turnovers Ratio:</strong> {gameAnalysisData?.strategicInsights?.defensiveInsights?.stealsToTurnoversRatio || 0}</div>
            //               <div><strong>Blocks:</strong> {gameAnalysisData?.strategicInsights?.defensiveInsights?.blocksPerGame || 0}</div>
            //               <div><strong>Defensive Rebound %:</strong> {Math.round(gameAnalysisData?.strategicInsights?.defensiveInsights?.defensiveReboundPercentage || 0)}%</div>
            //               <div><strong>Fouls per Minute:</strong> {gameAnalysisData?.strategicInsights?.defensiveInsights?.foulsPerMinute || 0}</div>
            //             </div>
            //           </Card>
            //         </Col>
            //         <Col span={12}>
            //           <Card title="Substitution Patterns" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
            //               <div><strong>Average Stint Length:</strong> {gameAnalysisData?.strategicInsights?.substitutionPatterns?.averageStintLength || 0} min</div>
            //               <div><strong>Substitution Frequency:</strong> {gameAnalysisData?.strategicInsights?.substitutionPatterns?.substitutionFrequency || 'Unknown'}</div>
            //               <div><strong>Rest Periods:</strong></div>
            //               {gameAnalysisData?.strategicInsights?.substitutionPatterns?.restPeriods?.slice(0, 3).map((rest: any, index: number) => (
            //                 <div key={index} style={{ marginLeft: '16px', marginBottom: '4px' }}>
            //                   • {rest.player}: {rest.duration} min rest
            //                 </div>
            //               ))}
            //             </div>
            //           </Card>
            //         </Col>
            //       </Row>
            //       
            //       <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            //         <Col span={24}>
            //           <Card title="Coach Recommendations" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             {gameAnalysisData?.strategicInsights?.recommendations?.length > 0 ? (
            //               gameAnalysisData.strategicInsights.recommendations.map((rec: any, index: number) => (
            //                 <div key={index} style={{ 
            //                   marginBottom: '16px', 
            //                   padding: '16px', 
            //                   background: 'rgba(255,255,255,0.05)', 
            //                   borderRadius: '8px',
            //                   border: `1px solid ${rec.priority === 'high' ? '#ff4d4f' : rec.priority === 'medium' ? '#faad14' : '#52c41a'}`
            //                 }}>
            //                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            //                     <span style={{ 
            //                       color: '#fff', 
            //                       fontSize: '16px', 
            //                       fontWeight: '600' 
            //                     }}>
            //                       {rec.category}
            //                     </span>
            //                     <Tag color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'success'}>
            //                       {rec.priority.toUpperCase()}
            //                     </Tag>
            //                   </div>
            //                   <div style={{ color: '#b0b0b0', fontSize: '14px', marginBottom: '8px' }}>
            //                     {rec.message}
            //                   </div>
            //                   <div style={{ color: '#1890ff', fontSize: '14px', fontStyle: 'italic' }}>
            //                     💡 {rec.actionable}
            //                   </div>
            //                 </div>
            //               ))
            //             ) : (
            //               <div style={{ textAlign: 'center', color: '#b0b0b0', padding: '20px' }}>
            //                 No specific recommendations at this time
            //               </div>
            //             )}
            //           </Card>
            //         </Col>
            //       </Row>
            //     </div>
            //   )
            // },
            {
              key: 'standout-info',
              label: (
                <span style={{ color: '#fff' }}>
                  <StarOutlined style={{ marginRight: '8px' }} />
                  LKRM Leaders
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Card title="Top Scorer" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ textAlign: 'center', color: '#fff' }}>
                          <div style={{ color: '#1890ff', fontWeight: '600', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                              <TrophyOutlined />
                              Top Scorer
                            </div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1890ff', marginBottom: '8px' }}>
                              {standoutInfo?.topScorer?.name || 'N/A'}
                            </div>
                          <div style={{ color: '#b0b0b0', fontSize: '16px' }}>
                              {standoutInfo?.topScorer?.points || 0} points
                            </div>
                          </div>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card title="Top Rebounder" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ textAlign: 'center', color: '#fff' }}>
                          <div style={{ color: '#52c41a', fontWeight: '600', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                              <InboxOutlined />
                              Top Rebounder
                            </div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: '#52c41a', marginBottom: '8px' }}>
                              {standoutInfo?.topRebounder?.name || 'N/A'}
                            </div>
                          <div style={{ color: '#b0b0b0', fontSize: '16px' }}>
                              {standoutInfo?.topRebounder?.rebounds || 0} rebounds
                            </div>
                          </div>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card title="Top Assister" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ textAlign: 'center', color: '#fff' }}>
                          <div style={{ color: '#722ed1', fontWeight: '600', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                              <AimOutlined />
                              Top Assister
                            </div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: '#722ed1', marginBottom: '8px' }}>
                              {standoutInfo?.topAssister?.name || 'N/A'}
                            </div>
                          <div style={{ color: '#b0b0b0', fontSize: '16px' }}>
                              {standoutInfo?.topAssister?.assists || 0} assists
                            </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                  <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                    <Col span={8}>
                      <Card title="Most Steals" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ textAlign: 'center', color: '#fff' }}>
                          <div style={{ color: '#fa8c16', fontWeight: '600', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                            <AimOutlined />
                            Most Steals
                          </div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: '#fa8c16', marginBottom: '8px' }}>
                            {standoutInfo?.mostSteals?.name || 'N/A'}
                          </div>
                          <div style={{ color: '#b0b0b0', fontSize: '16px' }}>
                            {standoutInfo?.mostSteals?.steals || 0} steals
                          </div>
                        </div>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card title="Highest FG Points" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ textAlign: 'center', color: '#fff' }}>
                          <div style={{ color: '#13c2c2', fontWeight: '600', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                              <BarChartOutlined />
                            Highest FG Points
                            </div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: '#13c2c2', marginBottom: '8px' }}>
                            {standoutInfo?.highestFgPoints?.name || 'N/A'}
                            </div>
                          <div style={{ color: '#b0b0b0', fontSize: '16px' }}>
                            {standoutInfo?.highestFgPoints?.fgPoints || 0} points
                          </div>
                            </div>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card title="Highest 3PT Points" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ textAlign: 'center', color: '#fff' }}>
                          <div style={{ color: '#eb2f96', fontWeight: '600', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                            <AimOutlined />
                            Highest 3PT Points
                            </div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: '#eb2f96', marginBottom: '8px' }}>
                            {standoutInfo?.highest3ptPoints?.name || 'N/A'}
                          </div>
                          <div style={{ color: '#b0b0b0', fontSize: '16px' }}>
                            {standoutInfo?.highest3ptPoints?.threePointPoints || 0} points
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                  <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                    <Col span={8}>
                      <Card title="Highest FT Points" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ textAlign: 'center', color: '#fff' }}>
                          <div style={{ color: '#52c41a', fontWeight: '600', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                              <AimOutlined />
                            Highest FT Points
                            </div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: '#52c41a', marginBottom: '8px' }}>
                            {standoutInfo?.highestFtPoints?.name || 'N/A'}
                            </div>
                          <div style={{ color: '#b0b0b0', fontSize: '16px' }}>
                            {standoutInfo?.highestFtPoints?.ftPoints || 0} points
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )
            },
            // Lineup Comparison tab - commented out
            // {
            //   key: 'lineup-comparison',
            //   label: (
            //     <span style={{ color: '#fff' }}>
            //       <SwapOutlined style={{ marginRight: '8px' }} />
            //       Lineup Comparison
            //     </span>
            //   ),
            //   children: (
            //     <div style={{ padding: '16px 0' }}>
            //       <Row gutter={[16, 16]}>
            //         <Col span={12}>
            //           <Card title="Starters" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             <Table
            //               dataSource={lineupComparison?.starters || []}
            //               pagination={false}
            //               size="small"
            //               style={{ background: 'transparent' }}
            //               components={{
            //                 body: {
            //                   row: ({ children, ...props }: any) => (
            //                     <tr {...props} style={{ 
            //                       background: 'rgba(255,255,255,0.05)', 
            //                       borderBottom: '1px solid rgba(255,255,255,0.1)',
            //                       color: '#fff'
            //                     }}>
            //                       {children}
            //                     </tr>
            //                   ),
            //                   cell: ({ children, ...props }: any) => (
            //                     <td {...props} style={{ 
            //                       padding: '8px 12px', 
            //                       color: '#fff',
            //                       fontSize: '12px'
            //                     }}>
            //                       {children}
            //                     </td>
            //                   )
            //                 }
            //               }}
            //             >
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Player</span>}
            //                 dataIndex="name" 
            //                 key="name"
            //                 render={(text: string) => <span style={{ color: '#fff', fontWeight: '600' }}>{text}</span>}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Min</span>}
            //                 dataIndex="minutes" 
            //                 key="minutes"
            //                 render={(value: number) => <span style={{ color: '#fff' }}>{value}</span>}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>+/-</span>}
            //                 dataIndex="plusMinus" 
            //                 key="plusMinus"
            //                 render={(value: number) => (
            //                   <span style={{ 
            //                     color: value >= 0 ? '#52c41a' : '#ff4d4f', 
            //                     fontWeight: '600',
            //                     fontSize: '14px'
            //                   }}>
            //                     {value >= 0 ? '+' : ''}{value}
            //                   </span>
            //                 )}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Efficiency</span>}
            //                 dataIndex="efficiency" 
            //                 key="efficiency"
            //                 render={(value: number) => <span style={{ color: '#fff' }}>{value}</span>}
            //               />
            //             </Table>
            //           </Card>
            //         </Col>
            //         <Col span={12}>
            //           <Card title="Bench" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             <Table
            //               dataSource={lineupComparison?.bench || []}
            //               pagination={false}
            //               size="small"
            //               style={{ background: 'transparent' }}
            //               components={{
            //                 body: {
            //                   row: ({ children, ...props }: any) => (
            //                     <tr {...props} style={{ 
            //                       background: 'rgba(255,255,255,0.05)', 
            //                       borderBottom: '1px solid rgba(255,255,255,0.1)',
            //                       color: '#fff'
            //                     }}>
            //                       {children}
            //                     </tr>
            //                   ),
            //                   cell: ({ children, ...props }: any) => (
            //                     <td {...props} style={{ 
            //                       padding: '8px 12px', 
            //                       color: '#fff',
            //                       fontSize: '12px'
            //                     }}>
            //                       {children}
            //                     </td>
            //                   )
            //                 }
            //               }}
            //             >
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Player</span>}
            //                 dataIndex="name" 
            //                 key="name"
            //                 render={(text: string) => <span style={{ color: '#fff', fontWeight: '600' }}>{text}</span>}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Min</span>}
            //                 dataIndex="minutes" 
            //                 key="minutes"
            //                 render={(value: number) => <span style={{ color: '#fff' }}>{value}</span>}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>+/-</span>}
            //                 dataIndex="plusMinus" 
            //                 key="plusMinus"
            //                 render={(value: number) => (
            //                   <span style={{ 
            //                     color: value >= 0 ? '#52c41a' : '#ff4d4f', 
            //                     fontWeight: '600',
            //                     fontSize: '14px'
            //                   }}>
            //                     {value >= 0 ? '+' : ''}{value}
            //                   </span>
            //                 )}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Efficiency</span>}
            //                 dataIndex="efficiency" 
            //                 key="efficiency"
            //                 render={(value: number) => <span style={{ color: '#fff' }}>{value}</span>}
            //               />
            //             </Table>
            //           </Card>
            //         </Col>
            //       </Row>
            //     </div>
            //   )
            // },
            {
              key: 'play-by-play',
              label: (
                <span style={{ color: '#fff' }}>
                  <PlayCircleOutlined style={{ marginRight: '8px' }} />
                  Play by Play
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {playByPlay && playByPlay.length > 0 ? (
                      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '16px' }}>
                        {playByPlay.map((play: any, index: number) => {
                          const getTypeColor = (type: string) => {
                            switch (type) {
                              case 'points':
                              case 'scoring':
                                return '#52c41a';
                              case 'assist':
                                return '#1890ff';
                              case 'rebound':
                                return '#faad14';
                              case 'steal':
                                return '#722ed1';
                              case 'block':
                                return '#eb2f96';
                              case 'turnover':
                                return '#ff4d4f';
                              case 'foul':
                                return '#fa8c16';
                              default:
                                return '#b0b0b0';
                            }
                          };

                          const getTypeIcon = (type: string) => {
                            switch (type) {
                              case 'points':
                              case 'scoring':
                                return <AimOutlined style={{ fontSize: '20px', color: '#52c41a' }} />;
                              case 'assist':
                                return <AimOutlined style={{ fontSize: '20px', color: '#1890ff' }} />;
                              case 'rebound':
                                return <InboxOutlined style={{ fontSize: '20px', color: '#faad14' }} />;
                              case 'steal':
                                return <ThunderboltOutlined style={{ fontSize: '20px', color: '#722ed1' }} />;
                              case 'block':
                                return <StopOutlined style={{ fontSize: '20px', color: '#eb2f96' }} />;
                              case 'turnover':
                                return <CloseCircleOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />;
                              case 'foul':
                                return <ExclamationCircleOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />;
                              default:
                                return <FileTextOutlined style={{ fontSize: '20px', color: '#b0b0b0' }} />;
                            }
                          };

                          return (
                            <div key={index} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              padding: '12px 0',
                              borderBottom: index < (playByPlay?.length || 0) - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                              background: play?.isOpponent ? 'rgba(255,77,79,0.05)' : 'transparent',
                              borderRadius: '4px',
                              marginBottom: '4px'
                            }}>
                              <div style={{ 
                                width: '80px', 
                                fontSize: '14px', 
                                fontWeight: '600', 
                                color: '#1890ff',
                                textAlign: 'center'
                              }}>
                                {play?.time || 'N/A'}
                              </div>
                              <div style={{ 
                                width: '60px', 
                                fontSize: '14px', 
                                color: '#b0b0b0',
                                textAlign: 'center',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                padding: '4px 8px'
                              }}>
                                Q{play?.quarter || 'N/A'}
                              </div>
                              <div style={{ 
                                width: '40px', 
                                textAlign: 'center',
                                marginLeft: '16px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}>
                                {getTypeIcon(play?.type || '')}
                              </div>
                              <div style={{ 
                                flex: 1, 
                                fontSize: '16px', 
                                color: play?.isOpponent ? '#ff7875' : '#fff', 
                                marginLeft: '12px',
                                fontWeight: play?.isOpponent ? '500' : '400'
                              }}>
                                {play?.description || 'No description available'}
                              </div>
                              <div style={{ 
                                width: '100px', 
                                fontSize: '16px', 
                                fontWeight: '700', 
                                textAlign: 'right',
                                color: play?.isOpponent ? '#ff4d4f' : '#52c41a',
                                background: play?.isOpponent ? 'rgba(255,77,79,0.1)' : 'rgba(82, 196, 26, 0.1)',
                                borderRadius: '8px',
                                padding: '8px 12px'
                              }}>
                                {play?.score || 'N/A'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ 
                        padding: '40px', 
                        textAlign: 'center', 
                        color: '#b0b0b0',
                        fontSize: '16px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '8px'
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏀</div>
                        <div>No play-by-play data available for this game</div>
                        <div style={{ fontSize: '14px', marginTop: '8px', color: '#8c8c8c' }}>
                          Play-by-play data will appear here when available from live stat tracking
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            }
          ]}
        />
      </Card>
    </main>
  );
}
