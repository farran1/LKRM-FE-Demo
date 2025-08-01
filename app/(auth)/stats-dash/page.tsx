'use client'
import React, { useState } from 'react';
import { Layout, Menu, Card, Row, Col, Typography, Space, Button, Tabs, Statistic, Alert, Spin, Tag } from 'antd';
import { 
  DashboardOutlined, 
  PlayCircleOutlined, 
  BarChartOutlined, 
  UserOutlined, 
  TeamOutlined, 
  TrophyOutlined,
  SettingOutlined,
  ExportOutlined,
  FireOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import style from './style.module.scss';
import GameAnalysisSection from './components/GameAnalysisSection';
import { useDashboardData, useLiveGame, useLiveGameState, useDataExport } from './hooks/useAdvancedStats';
import StatsDashboard2 from './stats-dash';

const { Content } = Layout;
const { Title, Text } = Typography;

// Dashboard sections based on PRD
const DASHBOARD_SECTIONS = {
  OVERVIEW: 'overview',
  LIVE_GAME: 'live-game',
  GAME_ANALYSIS: 'game-analysis',
  PLAYER_DEVELOPMENT: 'player-development',
  TEAM_ANALYTICS: 'team-analytics',
  STRATEGIC_INSIGHTS: 'strategic-insights',
  REPORTS: 'reports'
};

const StatsDashboard = () => {
  const [activeSection, setActiveSection] = useState(DASHBOARD_SECTIONS.OVERVIEW);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  // Advanced hooks
  const { teamAnalytics, strategicInsights, isLoading: dashboardLoading } = useDashboardData();
  const { currentGameId, isLiveMode, startLiveGame, stopLiveGame } = useLiveGameState();
  const { liveGameData, isLoading: liveLoading } = useLiveGame(currentGameId);
  const { exportData, isExporting } = useDataExport();

  const menuItems = [
    {
      key: DASHBOARD_SECTIONS.OVERVIEW,
      icon: <DashboardOutlined />,
      label: 'Overview',
      description: 'Comprehensive dashboard with key insights'
    },
    {
      key: DASHBOARD_SECTIONS.LIVE_GAME,
      icon: <PlayCircleOutlined />,
      label: 'Live Game',
      description: 'Multi-panel real-time monitoring'
    },
    {
      key: DASHBOARD_SECTIONS.GAME_ANALYSIS,
      icon: <BarChartOutlined />,
      label: 'Game Analysis',
      description: 'Detailed single-game breakdowns'
    },
    {
      key: DASHBOARD_SECTIONS.PLAYER_DEVELOPMENT,
      icon: <UserOutlined />,
      label: 'Player Development',
      description: 'Individual analysis and comparisons'
    },
    {
      key: DASHBOARD_SECTIONS.TEAM_ANALYTICS,
      icon: <TeamOutlined />,
      label: 'Team Analytics',
      description: 'Collective analytics and trends'
    },
    {
      key: DASHBOARD_SECTIONS.STRATEGIC_INSIGHTS,
      icon: <TrophyOutlined />,
      label: 'Strategic Insights',
      description: 'Advanced insights and planning'
    },
    {
      key: DASHBOARD_SECTIONS.REPORTS,
      icon: <ExportOutlined />,
      label: 'Reports',
      description: 'Professional export suite'
    }
  ];

  const renderOverviewSection = () => (
    <div className={style.overviewSection}>
      <Row gutter={[24, 24]}>
        {/* Key Performance Indicators */}
        <Col xs={24} lg={6}>
          <Card className={style.kpiCard} variant="outlined">
            <Statistic
              title="Season Record"
              value={teamAnalytics?.overallRecord || "15-3"}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card className={style.kpiCard} variant="outlined">
            <Statistic
              title="Win %"
              value="83.3"
              suffix="%"
              prefix={<FireOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card className={style.kpiCard} variant="outlined">
            <Statistic
              title="Avg Points For"
              value="72.4"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card className={style.kpiCard} variant="outlined">
            <Statistic
              title="Avg Points Against"
              value="58.2"
              prefix={<FallOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>

        {/* Season Arc Visualization */}
        <Col xs={24} lg={16}>
          <Card title="Season Progression" className={style.chartCard} variant="outlined">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={teamAnalytics?.trends.pointsPerGame.map((value, index) => ({
                game: index + 1,
                points: value,
                pointsAllowed: teamAnalytics?.trends.pointsAllowedPerGame[index] || 0
              })) || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a4a6b" />
                <XAxis 
                  dataKey="game" 
                  stroke="#b8c5d3"
                  tick={{ fill: '#b8c5d3', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#b8c5d3"
                  tick={{ fill: '#b8c5d3', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#17375c',
                    border: '1px solid #2a4a6b',
                    color: '#ffffff'
                  }}
                  labelStyle={{ color: '#b8c5d3' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="points" 
                  stroke="#52c41a" 
                  strokeWidth={2}
                  dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
                  name="Points For"
                />
                <Line 
                  type="monotone" 
                  dataKey="pointsAllowed" 
                  stroke="#f5222d" 
                  strokeWidth={2}
                  dot={{ fill: '#f5222d', strokeWidth: 2, r: 4 }}
                  name="Points Against"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col xs={24} lg={8}>
          <Card title="Quick Actions" className={style.actionCard} variant="outlined">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                block 
                icon={<PlayCircleOutlined />}
                onClick={() => startLiveGame('live-game-1')}
              >
                Start Live Game
              </Button>
              <Button 
                block 
                icon={<BarChartOutlined />}
                onClick={() => setActiveSection(DASHBOARD_SECTIONS.GAME_ANALYSIS)}
              >
                Analyze Last Game
              </Button>
              <Button 
                block 
                icon={<UserOutlined />}
                onClick={() => setActiveSection(DASHBOARD_SECTIONS.PLAYER_DEVELOPMENT)}
              >
                Player Development
              </Button>
              <Button 
                block 
                icon={<ExportOutlined />}
                onClick={() => setActiveSection(DASHBOARD_SECTIONS.REPORTS)}
              >
                Generate Report
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderLiveGameSection = () => (
    <div className={style.liveGameSection}>
      {isLiveMode && liveGameData ? (
        <Row gutter={[16, 16]}>
          {/* Live Scoreboard */}
          <Col xs={24} lg={8}>
            <Card title="Live Scoreboard" className={style.liveCard} variant="outlined">
              <div className={style.scoreboard}>
                <div className={style.teamScore}>
                  <Text className={style.teamName}>{liveGameData.homeTeam.name}</Text>
                  <Text className={style.score}>{liveGameData.homeTeam.score}</Text>
                </div>
                <div className={style.gameInfo}>
                  <Text className={style.period}>Q{liveGameData.currentPeriod} - {liveGameData.timeRemaining}</Text>
                  <Text className={style.timeout}>{liveGameData.lastPlay}</Text>
                </div>
                <div className={style.teamScore}>
                  <Text className={style.teamName}>{liveGameData.awayTeam.name}</Text>
                  <Text className={style.score}>{liveGameData.awayTeam.score}</Text>
                </div>
              </div>
            </Card>
          </Col>

          {/* Live Key Stats */}
          <Col xs={24} lg={8}>
            <Card title="Key Stats" className={style.liveCard} variant="outlined">
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <Statistic
                    title="FG%"
                    value={(liveGameData.keyStats.fieldGoalPercentage * 100).toFixed(1)}
                    suffix="%"
                    valueStyle={{ color: '#52c41a', fontSize: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="3P%"
                    value={(liveGameData.keyStats.threePointPercentage * 100).toFixed(1)}
                    suffix="%"
                    valueStyle={{ color: '#1890ff', fontSize: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Rebounds"
                    value={liveGameData.keyStats.rebounds}
                    valueStyle={{ color: '#722ed1', fontSize: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Assists"
                    value={liveGameData.keyStats.assists}
                    valueStyle={{ color: '#fa8c16', fontSize: '16px' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Live Game Flow Chart */}
          <Col xs={24} lg={8}>
            <Card title="Game Flow" className={style.liveCard} variant="outlined">
              <div className={style.chartPlaceholder}>
                <Text style={{ color: '#b8c5d3' }}>Live game flow chart...</Text>
              </div>
            </Card>
          </Col>
        </Row>
      ) : (
        <div className={style.sectionPlaceholder}>
          <Title level={3} style={{ color: '#ffffff' }}>Live Game</Title>
          <Text style={{ color: '#b8c5d3' }}>
            No live game in progress. Start a live game to monitor real-time statistics.
          </Text>
          <div style={{ marginTop: 16 }}>
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={() => startLiveGame('live-game-1')}
            >
              Start Live Game
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderTeamAnalyticsSection = () => (
    <div className={style.teamAnalyticsSection}>
      {teamAnalytics ? (
        <Row gutter={[24, 24]}>
          {/* Team Records */}
          <Col xs={24} lg={8}>
            <Card title="Team Records" className={style.analysisCard} variant="outlined">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Overall"
                    value={teamAnalytics.overallRecord}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Home"
                    value={teamAnalytics.homeRecord}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Away"
                    value={teamAnalytics.awayRecord}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Conference"
                    value={teamAnalytics.conferenceRecord}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Efficiency Metrics */}
          <Col xs={24} lg={8}>
            <Card title="Efficiency Metrics" className={style.analysisCard} variant="outlined">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Offensive Efficiency"
                    value={teamAnalytics.offensiveEfficiency}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Defensive Efficiency"
                    value={teamAnalytics.defensiveEfficiency}
                    valueStyle={{ color: '#f5222d' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Pace"
                    value={teamAnalytics.pace}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Strength of Schedule"
                    value={(teamAnalytics.strengthOfSchedule * 100).toFixed(1)}
                    suffix="%"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Situational Stats */}
          <Col xs={24} lg={8}>
            <Card title="Situational Performance" className={style.analysisCard} variant="outlined">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Home Games"
                    value={`${teamAnalytics.situationalStats.homeGames.wins}-${teamAnalytics.situationalStats.homeGames.losses}`}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Away Games"
                    value={`${teamAnalytics.situationalStats.awayGames.wins}-${teamAnalytics.situationalStats.awayGames.losses}`}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Close Games"
                    value={`${teamAnalytics.situationalStats.closeGames.wins}-${teamAnalytics.situationalStats.closeGames.losses}`}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Blowout Wins"
                    value={teamAnalytics.situationalStats.blowoutWins}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      ) : (
        <div className={style.sectionPlaceholder}>
          <Title level={3} style={{ color: '#ffffff' }}>Team Analytics</Title>
          <Text style={{ color: '#b8c5d3' }}>
            Loading team analytics data...
          </Text>
        </div>
      )}
    </div>
  );

  const renderStrategicInsightsSection = () => (
    <div className={style.strategicInsightsSection}>
      {strategicInsights ? (
        <Row gutter={[24, 24]}>
          {/* Key Insights */}
          <Col xs={24} lg={12}>
            <Card title="Key Insights" className={style.analysisCard} variant="outlined">
              {strategicInsights.keyInsights.map((insight, index) => (
                <div key={index} style={{ marginBottom: 16, padding: 12, border: '1px solid #2a4a6b', borderRadius: 6 }}>
                  <Text style={{ color: '#ffffff', fontWeight: 600, display: 'block' }}>
                    {insight.title}
                  </Text>
                  <Text style={{ color: '#b8c5d3', fontSize: '14px' }}>
                    {insight.description}
                  </Text>
                  <Tag 
                    color={insight.impact === 'high' ? 'red' : insight.impact === 'medium' ? 'orange' : 'blue'}
                    style={{ marginTop: 8 }}
                  >
                    {insight.impact.toUpperCase()} IMPACT
                  </Tag>
                </div>
              ))}
            </Card>
          </Col>

          {/* Recommendations */}
          <Col xs={24} lg={12}>
            <Card title="Strategic Recommendations" className={style.analysisCard} variant="outlined">
              {strategicInsights.recommendations.map((rec, index) => (
                <div key={index} style={{ marginBottom: 16, padding: 12, border: '1px solid #2a4a6b', borderRadius: 6 }}>
                  <Text style={{ color: '#ffffff', fontWeight: 600, display: 'block' }}>
                    {rec.title}
                  </Text>
                  <Text style={{ color: '#b8c5d3', fontSize: '14px' }}>
                    {rec.description}
                  </Text>
                  <Text style={{ color: '#1890ff', fontSize: '12px', display: 'block', marginTop: 8 }}>
                    Implementation: {rec.implementation}
                  </Text>
                  <Tag 
                    color={rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'orange' : 'blue'}
                    style={{ marginTop: 8 }}
                  >
                    {rec.priority.toUpperCase()} PRIORITY
                  </Tag>
                </div>
              ))}
            </Card>
          </Col>

          {/* Predictive Analytics */}
          <Col xs={24}>
            <Card title="Predictive Analytics" className={style.analysisCard} variant="outlined">
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Title level={4} style={{ color: '#ffffff' }}>Next Game Prediction</Title>
                  <div style={{ padding: 16, background: 'rgba(42, 74, 107, 0.3)', borderRadius: 6 }}>
                    <Text style={{ color: '#ffffff', fontWeight: 600 }}>
                      vs {strategicInsights.predictiveAnalytics.nextGamePrediction.opponent}
                    </Text>
                    <br />
                    <Text style={{ color: strategicInsights.predictiveAnalytics.nextGamePrediction.predictedResult === 'W' ? '#52c41a' : '#f5222d', fontSize: '18px', fontWeight: 600 }}>
                      Predicted: {strategicInsights.predictiveAnalytics.nextGamePrediction.predictedResult === 'W' ? 'WIN' : 'LOSS'}
                    </Text>
                    <br />
                    <Text style={{ color: '#b8c5d3' }}>
                      Confidence: {strategicInsights.predictiveAnalytics.nextGamePrediction.confidence}%
                    </Text>
                  </div>
                </Col>
                <Col xs={24} lg={12}>
                  <Title level={4} style={{ color: '#ffffff' }}>Season Projection</Title>
                  <div style={{ padding: 16, background: 'rgba(42, 74, 107, 0.3)', borderRadius: 6 }}>
                    <Text style={{ color: '#ffffff', fontWeight: 600 }}>
                      Final Record: {strategicInsights.predictiveAnalytics.seasonProjection.finalRecord}
                    </Text>
                    <br />
                    <Text style={{ color: '#52c41a' }}>
                      Playoff Chance: {strategicInsights.predictiveAnalytics.seasonProjection.playoffChance}%
                    </Text>
                    <br />
                    <Text style={{ color: '#1890ff' }}>
                      Conference Standing: #{strategicInsights.predictiveAnalytics.seasonProjection.conferenceStanding}
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      ) : (
        <div className={style.sectionPlaceholder}>
          <Title level={3} style={{ color: '#ffffff' }}>Strategic Insights</Title>
          <Text style={{ color: '#b8c5d3' }}>
            Loading strategic insights...
          </Text>
        </div>
      )}
    </div>
  );

  const renderPlayerDevelopmentSection = () => {
    // Mock player development data
    const players = [
      {
        id: '1',
        name: 'Marcus Johnson',
        position: 'PG',
        grade: 'Senior',
        number: '3',
        photo: '/api/placeholder/150/150',
        stats: {
          ppg: 18.5,
          apg: 6.2,
          rpg: 3.1,
          spg: 2.4,
          fgPercentage: 0.452,
          threePointPercentage: 0.381,
          ftPercentage: 0.823
        },
        development: {
          trend: 'improving',
          keyStrengths: ['Leadership', 'Ball Handling', 'Court Vision'],
          areasForImprovement: ['Defensive Positioning', 'Consistency'],
          progress: {
            shooting: 85,
            defense: 72,
            leadership: 90,
            conditioning: 88
          }
        }
      },
      {
        id: '2',
        name: 'Sarah Chen',
        position: 'SG',
        grade: 'Junior',
        number: '12',
        photo: '/api/placeholder/150/150',
        stats: {
          ppg: 22.1,
          apg: 3.8,
          rpg: 4.2,
          spg: 1.9,
          fgPercentage: 0.478,
          threePointPercentage: 0.412,
          ftPercentage: 0.891
        },
        development: {
          trend: 'rapidly_improving',
          keyStrengths: ['Shooting', 'Work Ethic', 'Basketball IQ'],
          areasForImprovement: ['Defense', 'Passing'],
          progress: {
            shooting: 92,
            defense: 68,
            leadership: 75,
            conditioning: 85
          }
        }
      },
      {
        id: '3',
        name: 'Tyler Williams',
        position: 'PF',
        grade: 'Senior',
        number: '23',
        photo: '/api/placeholder/150/150',
        stats: {
          ppg: 14.3,
          apg: 2.1,
          rpg: 8.7,
          spg: 0.8,
          fgPercentage: 0.523,
          threePointPercentage: 0.298,
          ftPercentage: 0.745
        },
        development: {
          trend: 'steady',
          keyStrengths: ['Rebounding', 'Post Play', 'Strength'],
          areasForImprovement: ['Shooting Range', 'Free Throws'],
          progress: {
            shooting: 70,
            defense: 85,
            leadership: 80,
            conditioning: 82
          }
        }
      }
    ];

    const currentSelectedPlayer = players.find(p => p.id === selectedPlayer) || players[0];

    return (
      <div className={style.playerDevelopmentSection}>
        <Row gutter={[24, 24]}>
          {/* Player Selection */}
          <Col xs={24}>
            <Card title="Player Selection" className={style.analysisCard} variant="outlined">
              <Row gutter={[16, 16]}>
                {players.map(player => (
                  <Col xs={24} sm={8} key={player.id}>
                    <Card
                      className={`${style.playerCard} ${currentSelectedPlayer?.id === player.id ? style.selectedPlayer : ''}`}
                      variant="outlined"
                      onClick={() => setSelectedPlayer(player.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                          width: 60, 
                          height: 60, 
                          borderRadius: '50%', 
                          background: '#2a4a6b',
                          margin: '0 auto 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontSize: '18px',
                          fontWeight: 'bold'
                        }}>
                          {player.number}
                        </div>
                        <Title level={5} style={{ color: '#ffffff', margin: '8px 0 4px' }}>
                          {player.name}
                        </Title>
                        <Text style={{ color: '#b8c5d3', fontSize: '12px' }}>
                          {player.position} • {player.grade}
                        </Text>
                        <Tag 
                          color={player.development.trend === 'rapidly_improving' ? 'green' : 
                                 player.development.trend === 'improving' ? 'blue' : 'orange'}
                          style={{ marginTop: 8 }}
                        >
                          {player.development.trend.replace('_', ' ').toUpperCase()}
                        </Tag>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>

          {/* Player Profile */}
          <Col xs={24} lg={12}>
            <Card title={`${currentSelectedPlayer.name} - Player Profile`} className={style.analysisCard} variant="outlined">
              <Row gutter={[16, 16]}>
                <Col xs={12}>
                  <Statistic
                    title="Points Per Game"
                    value={currentSelectedPlayer.stats.ppg}
                    precision={1}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col xs={12}>
                  <Statistic
                    title="Assists Per Game"
                    value={currentSelectedPlayer.stats.apg}
                    precision={1}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col xs={12}>
                  <Statistic
                    title="Rebounds Per Game"
                    value={currentSelectedPlayer.stats.rpg}
                    precision={1}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
                <Col xs={12}>
                  <Statistic
                    title="Steals Per Game"
                    value={currentSelectedPlayer.stats.spg}
                    precision={1}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Col>
                <Col xs={8}>
                  <Statistic
                    title="FG%"
                    value={currentSelectedPlayer.stats.fgPercentage * 100}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col xs={8}>
                  <Statistic
                    title="3P%"
                    value={currentSelectedPlayer.stats.threePointPercentage * 100}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col xs={8}>
                  <Statistic
                    title="FT%"
                    value={currentSelectedPlayer.stats.ftPercentage * 100}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Development Progress */}
          <Col xs={24} lg={12}>
            <Card title="Development Progress" className={style.analysisCard} variant="outlined">
              <div style={{ marginBottom: 16 }}>
                <Text style={{ color: '#ffffff', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                  Key Strengths:
                </Text>
                <Space wrap>
                  {currentSelectedPlayer.development.keyStrengths.map((strength, index) => (
                    <Tag key={index} color="green">{strength}</Tag>
                  ))}
                </Space>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Text style={{ color: '#ffffff', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                  Areas for Improvement:
                </Text>
                <Space wrap>
                  {currentSelectedPlayer.development.areasForImprovement.map((area, index) => (
                    <Tag key={index} color="orange">{area}</Tag>
                  ))}
                </Space>
              </div>
              <div>
                <Text style={{ color: '#ffffff', fontWeight: 600, display: 'block', marginBottom: 12 }}>
                  Skill Assessment:
                </Text>
                {Object.entries(currentSelectedPlayer.development.progress).map(([skill, value]) => (
                  <div key={skill} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: '#b8c5d3', textTransform: 'capitalize' }}>
                        {skill}
                      </Text>
                      <Text style={{ color: '#ffffff', fontWeight: 600 }}>
                        {value}%
                      </Text>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: 8, 
                      background: '#2a4a6b', 
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${value}%`, 
                        height: '100%', 
                        background: value >= 80 ? '#52c41a' : value >= 70 ? '#1890ff' : '#fa8c16',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>

          {/* Performance Trends */}
          <Col xs={24}>
            <Card title="Performance Trends" className={style.analysisCard} variant="outlined">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { game: 1, points: 16, assists: 5, rebounds: 3 },
                  { game: 2, points: 22, assists: 7, rebounds: 4 },
                  { game: 3, points: 18, assists: 6, rebounds: 2 },
                  { game: 4, points: 25, assists: 8, rebounds: 5 },
                  { game: 5, points: 20, assists: 5, rebounds: 3 },
                  { game: 6, points: 28, assists: 9, rebounds: 6 },
                  { game: 7, points: 24, assists: 7, rebounds: 4 },
                  { game: 8, points: 30, assists: 10, rebounds: 7 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a4a6b" />
                  <XAxis 
                    dataKey="game" 
                    stroke="#b8c5d3"
                    tick={{ fill: '#b8c5d3', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#b8c5d3"
                    tick={{ fill: '#b8c5d3', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#17375c',
                      border: '1px solid #2a4a6b',
                      color: '#ffffff'
                    }}
                    labelStyle={{ color: '#b8c5d3' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="points" 
                    stroke="#52c41a" 
                    strokeWidth={2}
                    dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
                    name="Points"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="assists" 
                    stroke="#1890ff" 
                    strokeWidth={2}
                    dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
                    name="Assists"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rebounds" 
                    stroke="#722ed1" 
                    strokeWidth={2}
                    dot={{ fill: '#722ed1', strokeWidth: 2, r: 4 }}
                    name="Rebounds"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* Player Comparison */}
          <Col xs={24}>
            <Card title="Player Comparison" className={style.analysisCard} variant="outlined">
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
                    Shooting Comparison
                  </Title>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={players.map(p => ({
                      name: p.name,
                      fg: p.stats.fgPercentage * 100,
                      three: p.stats.threePointPercentage * 100,
                      ft: p.stats.ftPercentage * 100
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a4a6b" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#b8c5d3"
                        tick={{ fill: '#b8c5d3', fontSize: 10 }}
                      />
                      <YAxis 
                        stroke="#b8c5d3"
                        tick={{ fill: '#b8c5d3', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#17375c',
                          border: '1px solid #2a4a6b',
                          color: '#ffffff'
                        }}
                        labelStyle={{ color: '#b8c5d3' }}
                      />
                      <Bar dataKey="fg" fill="#52c41a" name="FG%" />
                      <Bar dataKey="three" fill="#1890ff" name="3P%" />
                      <Bar dataKey="ft" fill="#722ed1" name="FT%" />
                    </BarChart>
                  </ResponsiveContainer>
                </Col>
                <Col xs={24} lg={12}>
                  <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
                    Statistical Comparison
                  </Title>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={players.map(p => ({
                      name: p.name,
                      ppg: p.stats.ppg,
                      apg: p.stats.apg,
                      rpg: p.stats.rpg
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a4a6b" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#b8c5d3"
                        tick={{ fill: '#b8c5d3', fontSize: 10 }}
                      />
                      <YAxis 
                        stroke="#b8c5d3"
                        tick={{ fill: '#b8c5d3', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#17375c',
                          border: '1px solid #2a4a6b',
                          color: '#ffffff'
                        }}
                        labelStyle={{ color: '#b8c5d3' }}
                      />
                      <Bar dataKey="ppg" fill="#52c41a" name="PPG" />
                      <Bar dataKey="apg" fill="#1890ff" name="APG" />
                      <Bar dataKey="rpg" fill="#722ed1" name="RPG" />
                    </BarChart>
                  </ResponsiveContainer>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case DASHBOARD_SECTIONS.OVERVIEW:
        return renderOverviewSection();
      case DASHBOARD_SECTIONS.LIVE_GAME:
        return renderLiveGameSection();
      case DASHBOARD_SECTIONS.GAME_ANALYSIS:
        return <GameAnalysisSection />;
      case DASHBOARD_SECTIONS.PLAYER_DEVELOPMENT:
        return renderPlayerDevelopmentSection();
      case DASHBOARD_SECTIONS.TEAM_ANALYTICS:
        return renderTeamAnalyticsSection();
      case DASHBOARD_SECTIONS.STRATEGIC_INSIGHTS:
        return renderStrategicInsightsSection();
      default:
        return (
          <div className={style.sectionPlaceholder}>
            <Title level={3} style={{ color: '#ffffff' }}>
              {menuItems.find(item => item.key === activeSection)?.label}
            </Title>
            <Text style={{ color: '#b8c5d3' }}>
              {menuItems.find(item => item.key === activeSection)?.description}
            </Text>
            <div style={{ marginTop: 24 }}>
              <Text style={{ color: '#b8c5d3' }}>
                This section is under development. Coming soon...
              </Text>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={style.dashboardContainer}>
      {/* Dashboard Header */}
      <div className={style.dashboardHeader}>
        <div className={style.headerContent}>
          <div className={style.headerLeft}>
            <Title level={2} style={{ color: '#ffffff', margin: 0 }}>
              Stats Dashboard
            </Title>
            <Text style={{ color: '#b8c5d3' }}>
              Professional basketball analytics for Lincoln High School
            </Text>
          </div>
          <div className={style.headerRight}>
            <Space>
              <Button icon={<SettingOutlined />} size="small">
                Settings
              </Button>
              <Button 
                icon={<ExportOutlined />} 
                size="small" 
                type="primary"
                loading={isExporting}
                onClick={() => exportData('dashboard', { activeSection, teamAnalytics, strategicInsights })}
              >
                Export
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={style.navigationTabs}>
        <Tabs
          activeKey={activeSection}
          onChange={setActiveSection}
          type="card"
          className={style.dashboardTabs}
          items={menuItems.map(item => ({
            key: item.key,
            label: (
              <span>
                {item.icon}
                {item.label}
              </span>
            )
          }))}
        />
      </div>

      {/* Main Content */}
      <div className={style.mainContent}>
        {dashboardLoading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#b8c5d3' }}>
              Loading dashboard data...
            </div>
          </div>
        ) : (
          <>
            {renderContent()}
          </>
        )}
      </div>
    </div>
  );
};

export default StatsDashboard; 