'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Statistic, Table, Tag, Button, Spin, Alert, Tabs, Card, Row, Col, Divider } from 'antd';
import { 
  ArrowLeftOutlined,
  TrophyOutlined,
  UserOutlined,
  TeamOutlined,
  BarChartOutlined,
  PlayCircleOutlined,
  StarOutlined,
  SwapOutlined,
  CalendarOutlined
} from '@ant-design/icons';

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

      {/* Game Overview Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card style={{ 
            background: 'rgba(255,255,255,0.08)', 
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px'
          }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>Team Points</span>}
              value={teamStats?.points || 0}
              valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: '600' }}
              prefix={<TrophyOutlined style={{ color: '#B58842' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ 
            background: 'rgba(255,255,255,0.08)', 
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px'
          }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>Field Goal %</span>}
              value={teamStats?.fieldGoals?.percentage || 0}
              suffix="%"
              valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: '600' }}
              prefix={<BarChartOutlined style={{ color: '#B58842' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ 
            background: 'rgba(255,255,255,0.08)', 
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px'
          }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>Rebounds</span>}
              value={(teamStats?.rebounds?.offensive || 0) + (teamStats?.rebounds?.defensive || 0)}
              valueStyle={{ color: '#722ed1', fontSize: '24px', fontWeight: '600' }}
              prefix={<TeamOutlined style={{ color: '#B58842' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ 
            background: 'rgba(255,255,255,0.08)', 
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px'
          }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>Assists</span>}
              value={teamStats?.assists || 0}
              valueStyle={{ color: '#faad14', fontSize: '24px', fontWeight: '600' }}
              prefix={<UserOutlined style={{ color: '#B58842' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Additional Overview Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card style={{ 
            background: 'rgba(255,255,255,0.08)', 
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px'
          }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>Efficiency</span>}
              value={gameAnalysisData?.advancedMetrics?.teamEfficiency?.pointsPerPossession || 0}
              valueStyle={{ color: '#13c2c2', fontSize: '20px', fontWeight: '600' }}
              prefix={<BarChartOutlined style={{ color: '#B58842' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ 
            background: 'rgba(255,255,255,0.08)', 
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px'
          }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>Turnovers</span>}
              value={teamStats?.turnovers || 0}
              valueStyle={{ color: '#ff4d4f', fontSize: '20px', fontWeight: '600' }}
              prefix={<SwapOutlined style={{ color: '#B58842' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ 
            background: 'rgba(255,255,255,0.08)', 
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px'
          }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>Steals</span>}
              value={teamStats?.steals || 0}
              valueStyle={{ color: '#722ed1', fontSize: '20px', fontWeight: '600' }}
              prefix={<TeamOutlined style={{ color: '#B58842' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ 
            background: 'rgba(255,255,255,0.08)', 
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px'
          }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>Blocks</span>}
              value={teamStats?.blocks || 0}
              valueStyle={{ color: '#faad14', fontSize: '20px', fontWeight: '600' }}
              prefix={<TeamOutlined style={{ color: '#B58842' }} />}
            />
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
                    <Col span={12}>
                      <Card title="Shooting Breakdown" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
                          <div><strong>Field Goals:</strong> {teamStats?.fieldGoals?.made || 0}/{teamStats?.fieldGoals?.attempted || 0} ({teamStats?.fieldGoals?.percentage || 0}%)</div>
                          <div><strong>Three Pointers:</strong> {teamStats?.threePointers?.made || 0}/{teamStats?.threePointers?.attempted || 0} ({teamStats?.threePointers?.percentage || 0}%)</div>
                          <div><strong>Free Throws:</strong> {teamStats?.freeThrows?.made || 0}/{teamStats?.freeThrows?.attempted || 0} ({teamStats?.freeThrows?.percentage || 0}%)</div>
                        </div>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card title="Other Statistics" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
                          <div><strong>Steals:</strong> {teamStats?.steals || 0}</div>
                          <div><strong>Blocks:</strong> {teamStats?.blocks || 0}</div>
                          <div><strong>Turnovers:</strong> {teamStats?.turnovers || 0}</div>
                          <div><strong>Fouls:</strong> {teamStats?.fouls || 0}</div>
                          <div><strong>Total Minutes:</strong> {teamStats?.minutesPlayed || 0}</div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
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
                    pagination={false}
                    size="middle"
                    style={{ background: 'transparent' }}
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
                  >
                    <Table.Column 
                      title={<span style={{ color: '#fff' }}>Player</span>}
                      dataIndex="name" 
                      key="name"
                      render={(text: string, record: any) => (
                        <div>
                          <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>
                            {text}
                          </div>
                          <div style={{ color: '#b0b0b0', fontSize: '12px' }}>
                            {record.position} #{record.number}
                          </div>
                        </div>
                      )}
                    />
                    <Table.Column 
                      title={<span style={{ color: '#fff' }}>Min</span>}
                      dataIndex="minutes" 
                      key="minutes"
                      render={(value: number) => <span style={{ color: '#fff' }}>{value}</span>}
                    />
                    <Table.Column 
                      title={<span style={{ color: '#fff' }}>PTS</span>}
                      dataIndex="points" 
                      key="points"
                      render={(value: number) => <span style={{ color: '#1890ff', fontWeight: '600', fontSize: '16px' }}>{value}</span>}
                    />
                    <Table.Column 
                      title={<span style={{ color: '#fff' }}>FG</span>}
                      key="fg" 
                      render={(_, record: any) => (
                        <span style={{ color: '#fff' }}>
                          {record.fieldGoals.made}/{record.fieldGoals.attempted}
                        </span>
                      )}
                    />
                    <Table.Column 
                      title={<span style={{ color: '#fff' }}>3PT</span>}
                      key="3pt" 
                      render={(_, record: any) => (
                        <span style={{ color: '#fff' }}>
                          {record.threePointers.made}/{record.threePointers.attempted}
                        </span>
                      )}
                    />
                    <Table.Column 
                      title={<span style={{ color: '#fff' }}>FT</span>}
                      key="ft" 
                      render={(_, record: any) => (
                        <span style={{ color: '#fff' }}>
                          {record.freeThrows.made}/{record.freeThrows.attempted}
                        </span>
                      )}
                    />
                    <Table.Column 
                      title={<span style={{ color: '#fff' }}>REB</span>}
                      key="rebounds"
                      render={(_, record: any) => (
                        <span style={{ color: '#fff' }}>
                          {(record.rebounds.offensive || 0) + (record.rebounds.defensive || 0)}
                        </span>
                      )}
                    />
                    <Table.Column 
                      title={<span style={{ color: '#fff' }}>AST</span>}
                      dataIndex="assists" 
                      key="assists"
                      render={(value: number) => <span style={{ color: '#52c41a', fontWeight: '600' }}>{value}</span>}
                    />
                    <Table.Column 
                      title={<span style={{ color: '#fff' }}>STL</span>}
                      dataIndex="steals" 
                      key="steals"
                      render={(value: number) => <span style={{ color: '#722ed1', fontWeight: '600' }}>{value}</span>}
                    />
                    <Table.Column 
                      title={<span style={{ color: '#fff' }}>BLK</span>}
                      dataIndex="blocks" 
                      key="blocks"
                      render={(value: number) => <span style={{ color: '#faad14', fontWeight: '600' }}>{value}</span>}
                    />
                    <Table.Column 
                      title={<span style={{ color: '#fff' }}>TO</span>}
                      dataIndex="turnovers" 
                      key="turnovers"
                      render={(value: number) => <span style={{ color: '#ff4d4f', fontWeight: '600' }}>{value}</span>}
                    />
                    <Table.Column 
                      title={<span style={{ color: '#fff' }}>PF</span>}
                      dataIndex="fouls" 
                      key="fouls"
                      render={(value: number) => <span style={{ color: '#ff7a45', fontWeight: '600' }}>{value}</span>}
                    />
                  </Table>
                </div>
              )
            },
            {
              key: 'advanced-metrics',
              label: (
                <span style={{ color: '#fff' }}>
                  <BarChartOutlined style={{ marginRight: '8px' }} />
                  Advanced Metrics
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card title="Team Efficiency" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
                          <div><strong>Points per Possession:</strong> {gameAnalysisData?.advancedMetrics?.teamEfficiency?.pointsPerPossession || 0}</div>
                          <div><strong>True Shooting %:</strong> {gameAnalysisData?.advancedMetrics?.teamEfficiency?.trueShootingPercentage || 0}%</div>
                          <div><strong>Offensive Efficiency:</strong> {gameAnalysisData?.advancedMetrics?.teamEfficiency?.offensiveEfficiency || 0}</div>
                          <div><strong>Defensive Efficiency:</strong> {gameAnalysisData?.advancedMetrics?.teamEfficiency?.defensiveEfficiency || 0}</div>
                          <div><strong>Pace:</strong> {gameAnalysisData?.advancedMetrics?.teamEfficiency?.pace || 0}</div>
                        </div>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card title="Position Performance" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
                          <div><strong>Guards:</strong> {gameAnalysisData?.advancedMetrics?.positionMetrics?.guards?.count || 0} players, {gameAnalysisData?.advancedMetrics?.positionMetrics?.guards?.points || 0} pts, {gameAnalysisData?.advancedMetrics?.positionMetrics?.guards?.fgPct || 0}% FG</div>
                          <div><strong>Forwards:</strong> {gameAnalysisData?.advancedMetrics?.positionMetrics?.forwards?.count || 0} players, {gameAnalysisData?.advancedMetrics?.positionMetrics?.forwards?.points || 0} pts, {gameAnalysisData?.advancedMetrics?.positionMetrics?.forwards?.fgPct || 0}% FG</div>
                          <div><strong>Centers:</strong> {gameAnalysisData?.advancedMetrics?.positionMetrics?.centers?.count || 0} players, {gameAnalysisData?.advancedMetrics?.positionMetrics?.centers?.points || 0} pts, {gameAnalysisData?.advancedMetrics?.positionMetrics?.centers?.fgPct || 0}% FG</div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                  
                  <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                    <Col span={24}>
                      <Card title="Player Efficiency Ratings" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Table
                          dataSource={gameAnalysisData?.advancedMetrics?.playerEfficiencyRatings || []}
                          pagination={false}
                          size="small"
                          style={{ background: 'transparent' }}
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
                                  padding: '8px 12px', 
                                  color: '#fff',
                                  fontSize: '12px'
                                }}>
                                  {children}
                                </td>
                              )
                            }
                          }}
                        >
                          <Table.Column 
                            title={<span style={{ color: '#fff' }}>Player</span>}
                            dataIndex="name" 
                            key="name"
                            render={(text: string) => <span style={{ color: '#fff', fontWeight: '600' }}>{text}</span>}
                          />
                          <Table.Column 
                            title={<span style={{ color: '#fff' }}>Offensive</span>}
                            dataIndex="offensiveRating" 
                            key="offensiveRating"
                            render={(value: number) => <span style={{ color: '#1890ff' }}>{value}</span>}
                          />
                          <Table.Column 
                            title={<span style={{ color: '#fff' }}>Defensive</span>}
                            dataIndex="defensiveRating" 
                            key="defensiveRating"
                            render={(value: number) => <span style={{ color: '#52c41a' }}>{value}</span>}
                          />
                          <Table.Column 
                            title={<span style={{ color: '#fff' }}>True Shooting</span>}
                            dataIndex="trueShootingPercentage" 
                            key="trueShootingPercentage"
                            render={(value: number) => <span style={{ color: '#722ed1' }}>{value}%</span>}
                          />
                          <Table.Column 
                            title={<span style={{ color: '#fff' }}>Usage Rate</span>}
                            dataIndex="usageRate" 
                            key="usageRate"
                            render={(value: number) => <span style={{ color: '#faad14' }}>{value}%</span>}
                          />
                          <Table.Column 
                            title={<span style={{ color: '#fff' }}>Overall</span>}
                            dataIndex="efficiency" 
                            key="efficiency"
                            render={(value: number) => <span style={{ color: '#ff4d4f', fontWeight: '600' }}>{value}</span>}
                          />
                        </Table>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )
            },
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
                                  {quarter.turnovers} TO
                                </div>
                                <div style={{ 
                                  color: quarter.momentum === 'positive' ? '#52c41a' : '#ff4d4f', 
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}>
                                  {quarter.momentum === 'positive' ? '↗' : '↘'} {quarter.momentum}
                                </div>
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
                            <Card title="Quarter Analysis" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
                                <div><strong>Strongest Quarter:</strong> Q{gameAnalysisData?.quarterBreakdown?.analysis?.strongestQuarter || 0}</div>
                                <div><strong>Weakest Quarter:</strong> Q{gameAnalysisData?.quarterBreakdown?.analysis?.weakestQuarter || 0}</div>
                                <div><strong>Consistency Score:</strong> {gameAnalysisData?.quarterBreakdown?.analysis?.consistency || 0}%</div>
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
            {
              key: 'strategic-insights',
              label: (
                <span style={{ color: '#fff' }}>
                  <SwapOutlined style={{ marginRight: '8px' }} />
                  Strategic Insights
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card title="Lineup Effectiveness" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
                          <div><strong>Most Effective Lineups:</strong></div>
                          {gameAnalysisData?.strategicInsights?.lineupEffectiveness?.mostEffective?.map((lineup: any, index: number) => (
                            <div key={index} style={{ marginLeft: '16px', marginBottom: '8px' }}>
                              • {lineup.players.join(', ')} (+{lineup.plusMinus}, {lineup.minutes} min)
                            </div>
                          ))}
                          <div style={{ marginTop: '12px' }}>
                            <strong>Average +/-:</strong> {gameAnalysisData?.strategicInsights?.lineupEffectiveness?.averagePlusMinus || 0}
                          </div>
                        </div>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card title="Game Flow" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
                          <div><strong>Largest Lead:</strong> +{gameAnalysisData?.strategicInsights?.gameFlow?.largestLead || 0}</div>
                          <div><strong>Largest Deficit:</strong> -{gameAnalysisData?.strategicInsights?.gameFlow?.largestDeficit || 0}</div>
                          <div><strong>Momentum Shifts:</strong> {gameAnalysisData?.strategicInsights?.gameFlow?.momentumShifts || 0}</div>
                          <div><strong>Scoring Runs:</strong> {gameAnalysisData?.strategicInsights?.gameFlow?.scoringRuns?.length || 0}</div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                  
                  <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                    <Col span={12}>
                      <Card title="Defensive Insights" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
                          <div><strong>Steals/Turnovers Ratio:</strong> {gameAnalysisData?.strategicInsights?.defensiveInsights?.stealsToTurnoversRatio || 0}</div>
                          <div><strong>Blocks:</strong> {gameAnalysisData?.strategicInsights?.defensiveInsights?.blocksPerGame || 0}</div>
                          <div><strong>Defensive Rebound %:</strong> {Math.round(gameAnalysisData?.strategicInsights?.defensiveInsights?.defensiveReboundPercentage || 0)}%</div>
                          <div><strong>Fouls per Minute:</strong> {gameAnalysisData?.strategicInsights?.defensiveInsights?.foulsPerMinute || 0}</div>
                        </div>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card title="Substitution Patterns" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
                          <div><strong>Average Stint Length:</strong> {gameAnalysisData?.strategicInsights?.substitutionPatterns?.averageStintLength || 0} min</div>
                          <div><strong>Substitution Frequency:</strong> {gameAnalysisData?.strategicInsights?.substitutionPatterns?.substitutionFrequency || 'Unknown'}</div>
                          <div><strong>Rest Periods:</strong></div>
                          {gameAnalysisData?.strategicInsights?.substitutionPatterns?.restPeriods?.slice(0, 3).map((rest: any, index: number) => (
                            <div key={index} style={{ marginLeft: '16px', marginBottom: '4px' }}>
                              • {rest.player}: {rest.duration} min rest
                            </div>
                          ))}
                        </div>
                      </Card>
                    </Col>
                  </Row>
                  
                  <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                    <Col span={24}>
                      <Card title="Coach Recommendations" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {gameAnalysisData?.strategicInsights?.recommendations?.length > 0 ? (
                          gameAnalysisData.strategicInsights.recommendations.map((rec: any, index: number) => (
                            <div key={index} style={{ 
                              marginBottom: '16px', 
                              padding: '16px', 
                              background: 'rgba(255,255,255,0.05)', 
                              borderRadius: '8px',
                              border: `1px solid ${rec.priority === 'high' ? '#ff4d4f' : rec.priority === 'medium' ? '#faad14' : '#52c41a'}`
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ 
                                  color: '#fff', 
                                  fontSize: '16px', 
                                  fontWeight: '600' 
                                }}>
                                  {rec.category}
                                </span>
                                <Tag color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'success'}>
                                  {rec.priority.toUpperCase()}
                                </Tag>
                              </div>
                              <div style={{ color: '#b0b0b0', fontSize: '14px', marginBottom: '8px' }}>
                                {rec.message}
                              </div>
                              <div style={{ color: '#1890ff', fontSize: '14px', fontStyle: 'italic' }}>
                                💡 {rec.actionable}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ textAlign: 'center', color: '#b0b0b0', padding: '20px' }}>
                            No specific recommendations at this time
                          </div>
                        )}
                      </Card>
                    </Col>
                  </Row>
                </div>
              )
            },
            {
              key: 'standout-info',
              label: (
                <span style={{ color: '#fff' }}>
                  <StarOutlined style={{ marginRight: '8px' }} />
                  Standout Info
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card title="Top Performers" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '16px', lineHeight: '2', color: '#fff' }}>
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ color: '#1890ff', fontWeight: '600', fontSize: '18px' }}>
                              🏆 Top Scorer
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1890ff' }}>
                              {standoutInfo?.topScorer?.name || 'N/A'}
                            </div>
                            <div style={{ color: '#b0b0b0', fontSize: '14px' }}>
                              {standoutInfo?.topScorer?.points || 0} points
                            </div>
                          </div>
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ color: '#52c41a', fontWeight: '600', fontSize: '18px' }}>
                              🏀 Top Rebounder
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#52c41a' }}>
                              {standoutInfo?.topRebounder?.name || 'N/A'}
                            </div>
                            <div style={{ color: '#b0b0b0', fontSize: '14px' }}>
                              {standoutInfo?.topRebounder?.rebounds || 0} rebounds
                            </div>
                          </div>
                          <div>
                            <div style={{ color: '#722ed1', fontWeight: '600', fontSize: '18px' }}>
                              🎯 Top Assister
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#722ed1' }}>
                              {standoutInfo?.topAssister?.name || 'N/A'}
                            </div>
                            <div style={{ color: '#b0b0b0', fontSize: '14px' }}>
                              {standoutInfo?.topAssister?.assists || 0} assists
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card title="Team Efficiency" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '16px', lineHeight: '2', color: '#fff' }}>
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ color: '#faad14', fontWeight: '600', fontSize: '18px' }}>
                              📊 Points per Shot
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#faad14' }}>
                              {standoutInfo?.teamEfficiency || 0}
                            </div>
                          </div>
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ color: '#52c41a', fontWeight: '600', fontSize: '18px' }}>
                              ⏱️ Total Minutes
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#52c41a' }}>
                              {teamStats?.minutesPlayed || 0}
                            </div>
                            <div style={{ color: '#b0b0b0', fontSize: '14px' }}>minutes</div>
                          </div>
                          <div>
                            <div style={{ color: '#1890ff', fontWeight: '600', fontSize: '18px' }}>
                              🎯 Team FG%
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1890ff' }}>
                              {teamStats?.fieldGoals?.percentage || 0}%
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )
            },
            {
              key: 'lineup-comparison',
              label: (
                <span style={{ color: '#fff' }}>
                  <SwapOutlined style={{ marginRight: '8px' }} />
                  Lineup Comparison
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card title="Starters" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Table
                          dataSource={lineupComparison?.starters || []}
                          pagination={false}
                          size="small"
                          style={{ background: 'transparent' }}
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
                                  padding: '8px 12px', 
                                  color: '#fff',
                                  fontSize: '12px'
                                }}>
                                  {children}
                                </td>
                              )
                            }
                          }}
                        >
                          <Table.Column 
                            title={<span style={{ color: '#fff' }}>Player</span>}
                            dataIndex="name" 
                            key="name"
                            render={(text: string) => <span style={{ color: '#fff', fontWeight: '600' }}>{text}</span>}
                          />
                          <Table.Column 
                            title={<span style={{ color: '#fff' }}>Min</span>}
                            dataIndex="minutes" 
                            key="minutes"
                            render={(value: number) => <span style={{ color: '#fff' }}>{value}</span>}
                          />
                          <Table.Column 
                            title={<span style={{ color: '#fff' }}>+/-</span>}
                            dataIndex="plusMinus" 
                            key="plusMinus"
                            render={(value: number) => (
                              <span style={{ 
                                color: value >= 0 ? '#52c41a' : '#ff4d4f', 
                                fontWeight: '600',
                                fontSize: '14px'
                              }}>
                                {value >= 0 ? '+' : ''}{value}
                              </span>
                            )}
                          />
                          <Table.Column 
                            title={<span style={{ color: '#fff' }}>Efficiency</span>}
                            dataIndex="efficiency" 
                            key="efficiency"
                            render={(value: number) => <span style={{ color: '#fff' }}>{value}</span>}
                          />
                        </Table>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card title="Bench" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Table
                          dataSource={lineupComparison?.bench || []}
                          pagination={false}
                          size="small"
                          style={{ background: 'transparent' }}
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
                                  padding: '8px 12px', 
                                  color: '#fff',
                                  fontSize: '12px'
                                }}>
                                  {children}
                                </td>
                              )
                            }
                          }}
                        >
                          <Table.Column 
                            title={<span style={{ color: '#fff' }}>Player</span>}
                            dataIndex="name" 
                            key="name"
                            render={(text: string) => <span style={{ color: '#fff', fontWeight: '600' }}>{text}</span>}
                          />
                          <Table.Column 
                            title={<span style={{ color: '#fff' }}>Min</span>}
                            dataIndex="minutes" 
                            key="minutes"
                            render={(value: number) => <span style={{ color: '#fff' }}>{value}</span>}
                          />
                          <Table.Column 
                            title={<span style={{ color: '#fff' }}>+/-</span>}
                            dataIndex="plusMinus" 
                            key="plusMinus"
                            render={(value: number) => (
                              <span style={{ 
                                color: value >= 0 ? '#52c41a' : '#ff4d4f', 
                                fontWeight: '600',
                                fontSize: '14px'
                              }}>
                                {value >= 0 ? '+' : ''}{value}
                              </span>
                            )}
                          />
                          <Table.Column 
                            title={<span style={{ color: '#fff' }}>Efficiency</span>}
                            dataIndex="efficiency" 
                            key="efficiency"
                            render={(value: number) => <span style={{ color: '#fff' }}>{value}</span>}
                          />
                        </Table>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )
            },
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
                  <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {playByPlay && playByPlay.length > 0 ? (
                      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '16px' }}>
                        {playByPlay.map((play: any, index: number) => (
                          <div key={index} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            padding: '12px 0',
                            borderBottom: index < (playByPlay?.length || 0) - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
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
                            <div style={{ flex: 1, fontSize: '16px', color: '#fff', marginLeft: '16px' }}>
                              {play?.description || 'No description available'}
                            </div>
                            <div style={{ 
                              width: '80px', 
                              fontSize: '16px', 
                              fontWeight: '700', 
                              textAlign: 'right',
                              color: '#52c41a',
                              background: 'rgba(82, 196, 26, 0.1)',
                              borderRadius: '8px',
                              padding: '8px 12px'
                            }}>
                              {play?.score || 'N/A'}
                            </div>
                          </div>
                        ))}
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
                        No play-by-play data available for this game
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
