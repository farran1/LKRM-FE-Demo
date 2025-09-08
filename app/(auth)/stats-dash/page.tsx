'use client'
import React, { useState, useEffect } from 'react';
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
import { statsService } from './services/statsService';
import TeamStatsPanel from './components/TeamStatsPanel';
import GameStatsPanel from './components/GameStatsPanel';
import PlayerComparisonPanel from './components/PlayerComparisonPanel';
import GameAnalysisSection from './components/GameAnalysisSection';

const { Content } = Layout;
const { Title, Text } = Typography;

const StatsDashboard = () => {
  const [teamStats, setTeamStats] = useState<any>(null);
  const [gameStats, setGameStats] = useState<any[]>([]);
  const [playerStats, setPlayerStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusedPanel, setFocusedPanel] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [team, games, players] = await Promise.all([
          statsService.fetchTeamStats(),
          statsService.fetchGameStats(),
          statsService.fetchPlayerStats()
        ]);
        setTeamStats(team);
        setGameStats(games);
        setPlayerStats(players);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard data error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggleFocus = (panelName: string) => {
    setFocusedPanel(focusedPanel === panelName ? null : panelName);
  };

  if (isLoading) {
    return (
      <div className={style.dashboardContainer}>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#b8c5d3' }}>
            Loading dashboard data...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={style.dashboardContainer}>
        <Alert
          message="Error Loading Dashboard"
          description={error}
          type="error"
          showIcon
          style={{ margin: '20px' }}
        />
      </div>
    );
  }

  // Calculate real metrics from data
  const wins = teamStats?.wins || 0;
  const losses = teamStats?.losses || 0;
  const winPercentage = teamStats?.winPercentage || 0;
  const avgPointsFor = teamStats?.avgPointsFor || 0;
  const avgPointsAgainst = teamStats?.avgPointsAgainst || 0;
  const netRating = avgPointsFor - avgPointsAgainst;

  // Prepare performance trends data
  const performanceData = gameStats.slice(-6).map((game, index) => ({
    key: `game-${index}`,
    game: index + 1,
    points: game.finalScoreUs || 0,
    pointsAllowed: game.finalScoreThem || 0,
    opponent: game.opponent || 'Unknown'
  }));

  // Prepare recent games data
  const recentGames = gameStats.slice(-3).map(game => ({
    key: game.id,
    opponent: game.opponent || 'Unknown',
    date: new Date(game.date).toLocaleDateString(),
    result: game.result === 'W' ? 'W' : 'L',
    score: `${game.finalScoreUs || 0}-${game.finalScoreThem || 0}`,
    margin: (game.finalScoreUs || 0) - (game.finalScoreThem || 0)
  }));

  // Calculate shooting percentages from player stats
  const totalFGM = playerStats.reduce((sum, p) => sum + (p.fieldGoalPercentage * p.gamesPlayed || 0), 0);
  const totalFGA = playerStats.reduce((sum, p) => sum + (p.gamesPlayed || 0), 0);
  const total3PM = playerStats.reduce((sum, p) => sum + (p.threePointPercentage * p.gamesPlayed || 0), 0);
  const total3PA = playerStats.reduce((sum, p) => sum + (p.gamesPlayed || 0), 0);
  const totalFTM = playerStats.reduce((sum, p) => sum + (p.freeThrowPercentage * p.gamesPlayed || 0), 0);
  const totalFTA = playerStats.reduce((sum, p) => sum + (p.gamesPlayed || 0), 0);

  const fgPercentage = totalFGA > 0 ? (totalFGM / totalFGA * 100).toFixed(1) : '0.0';
  const threePercentage = total3PA > 0 ? (total3PM / total3PA * 100).toFixed(1) : '0.0';
  const ftPercentage = totalFTA > 0 ? (totalFTM / totalFTA * 100).toFixed(1) : '0.0';

  // Calculate team averages
  const avgRebounds = playerStats.reduce((sum, p) => sum + (p.avgRebounds || 0), 0) / Math.max(1, playerStats.length);
  const avgAssists = playerStats.reduce((sum, p) => sum + (p.avgAssists || 0), 0) / Math.max(1, playerStats.length);
  const avgSteals = playerStats.reduce((sum, p) => sum + (p.avgSteals || 0), 0) / Math.max(1, playerStats.length);
  const avgBlocks = playerStats.reduce((sum, p) => sum + (p.avgBlocks || 0), 0) / Math.max(1, playerStats.length);
  const avgTurnovers = 12.8; // Placeholder - would need turnover data

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
              Comprehensive team and player statistics
            </Text>
          </div>
          <div className={style.headerRight}>
            <Space>
              <Button 
                icon={<TeamOutlined />}
                onClick={() => handleToggleFocus('team')}
                type={focusedPanel === 'team' ? 'primary' : 'default'}
              >
                Team Stats
              </Button>
              <Button 
                icon={<PlayCircleOutlined />}
                onClick={() => handleToggleFocus('game')}
                type={focusedPanel === 'game' ? 'primary' : 'default'}
              >
                Game Stats
              </Button>
              <Button 
                icon={<UserOutlined />}
                onClick={() => handleToggleFocus('player')}
                type={focusedPanel === 'player' ? 'primary' : 'default'}
              >
                Player Comparison
              </Button>
              <Button 
                icon={<BarChartOutlined />}
                onClick={() => handleToggleFocus('gameAnalysis')}
                type={focusedPanel === 'gameAnalysis' ? 'primary' : 'default'}
              >
                Game Analysis
              </Button>
              {focusedPanel && (
                <Button 
                  icon={<DashboardOutlined />}
                  onClick={() => setFocusedPanel(null)}
                  type="default"
                  size="small"
                >
                  Clear Focus
                </Button>
              )}
              <Button icon={<SettingOutlined />}>
                Settings
              </Button>
              <Button 
                icon={<ExportOutlined />} 
                size="small" 
                type="primary"
              >
                Export
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* Content Panels */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* Team Overview Panel */}
        <Col xs={24} lg={8}>
          <Card title="Team Overview" className={style.panel} variant="outlined" extra={<TrophyOutlined />}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
            <Statistic
                  title="Record"
                  value={`${wins}-${losses}`}
                  valueStyle={{ color: '#faad14' }}
                />
        </Col>
              <Col span={12}>
            <Statistic
              title="Win %"
                  value={winPercentage.toFixed(1)}
              suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Net Rating"
                  value={netRating.toFixed(1)}
              valueStyle={{ color: '#1890ff' }}
            />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Points Per Game"
                  value={avgPointsFor.toFixed(1)}
                  valueStyle={{ color: '#ffffff' }}
                />
        </Col>
              <Col span={12}>
            <Statistic
                  title="Opponent PPG"
                  value={avgPointsAgainst.toFixed(1)}
                  valueStyle={{ color: '#ffffff' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Recent Games Panel */}
        <Col xs={24} lg={8}>
          <Card title="Recent Games" className={style.panel} variant="outlined" extra={<FireOutlined />}>
            {recentGames.length > 0 ? (
              recentGames.map(game => (
                <div key={game.key} style={{ marginBottom: 16, padding: 12, border: '1px solid #2a4a6b', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text style={{ color: '#ffffff', fontWeight: 600, display: 'block' }}>
                        vs {game.opponent}
                      </Text>
                      <Text style={{ color: '#b8c5d3', fontSize: '12px' }}>
                        {game.date}
                      </Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Tag color={game.result === 'W' ? 'green' : 'red'} style={{ marginBottom: 4 }}>
                        {game.result} {game.score}
                      </Tag>
                      <div>
                        <Text style={{ color: game.margin > 0 ? '#52c41a' : '#f5222d', fontSize: '12px' }}>
                          {game.margin > 0 ? '+' : ''}{game.margin}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#b8c5d3' }}>
                No recent games
              </div>
            )}
          </Card>
        </Col>

        {/* Team Stats Panel */}
        <Col xs={24} lg={8}>
          <Card title="Team Stats" className={style.panel} variant="outlined" extra={<TrophyOutlined />}>
            <div style={{ marginBottom: 16 }}>
              <Text style={{ color: '#ffffff', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Shooting Efficiency:
              </Text>
              <Text style={{ color: '#b8c5d3' }}>
                FG%: {fgPercentage}% | 3P%: {threePercentage}% | FT%: {ftPercentage}%
              </Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text style={{ color: '#ffffff', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Defensive Metrics:
              </Text>
              <Text style={{ color: '#b8c5d3' }}>
                Steals: {avgSteals.toFixed(1)}/game | Blocks: {avgBlocks.toFixed(1)}/game
              </Text>
            </div>
            <div>
              <Text style={{ color: '#ffffff', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Ball Control:
              </Text>
              <Text style={{ color: '#b8c5d3' }}>
                Assists: {avgAssists.toFixed(1)}/game | Turnovers: {avgTurnovers.toFixed(1)}/game
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Second Row */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* Performance Trends Panel */}
        <Col xs={24} lg={8}>
          <Card title="Performance Trends" className={style.panel} variant="outlined" extra={<RiseOutlined />}>
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={performanceData}>
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
            ) : (
              <div style={{ textAlign: 'center', color: '#b8c5d3', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                No performance data available
        </div>
      )}
            </Card>
          </Col>

        {/* Advanced Metrics Panel */}
          <Col xs={24} lg={8}>
          <Card title="Advanced Metrics" className={style.panel} variant="outlined" extra={<BarChartOutlined />}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Offensive Efficiency"
                  value={avgPointsFor.toFixed(1)}
                  valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Defensive Efficiency"
                  value={avgPointsAgainst.toFixed(1)}
                    valueStyle={{ color: '#f5222d' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                  title="FG%"
                  value={fgPercentage}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                  title="Net Rating"
                  value={netRating.toFixed(1)}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

        {/* Player Comparison Panel */}
          <Col xs={24} lg={8}>
          <PlayerComparisonPanel 
            isFocused={focusedPanel === 'player'}
            onToggleFocus={() => handleToggleFocus('player')}
                  />
                </Col>
              </Row>

      {/* Third Row - Detailed Panels */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={12}>
          <TeamStatsPanel 
            isFocused={focusedPanel === 'team'}
            onToggleFocus={() => handleToggleFocus('team')}
          />
                </Col>
                <Col xs={24} lg={12}>
          <GameStatsPanel 
            isFocused={focusedPanel === 'game'}
            onToggleFocus={() => handleToggleFocus('game')}
                  />
                </Col>
              </Row>

      {/* Fourth Row - Game Analysis */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24}>
          <GameAnalysisSection 
            isFocused={focusedPanel === 'gameAnalysis'}
            onToggleFocus={() => handleToggleFocus('gameAnalysis')}
          />
          </Col>
        </Row>
    </div>
  );
};

export default StatsDashboard; 