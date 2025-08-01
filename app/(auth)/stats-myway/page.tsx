'use client'
import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Row, Col, Space, Button, Switch, Select, Input, Tabs, Statistic, Tag, Modal, Drawer, Checkbox, Divider } from 'antd';
import { 
  BarChartOutlined, 
  TrophyOutlined, 
  UserOutlined, 
  TeamOutlined,
  SettingOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import style from './style.module.scss';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

// 1. Update mock data model for advanced stats
const advancedPlayerData = [
  {
    id: 1,
    name: 'Marcus Johnson',
    position: 'PG',
    minutes: 32,
    fieldGoals: 7,
    fieldGoalAttempts: 15,
    twoPointers: 5,
    twoPointerAttempts: 10,
    threePointers: 2,
    threePointerAttempts: 5,
    freeThrows: 4,
    freeThrowAttempts: 5,
    pointsFor: 20,
    pointsAgainst: 15,
    pointsPerGame: 18.5,
    fgPercentage: 46.7,
    twoPointPercentage: 50.0,
    threePointPercentage: 40.0,
    ftPercentage: 80.0,
    effectiveFgPercentage: 53.3,
    shotType: 'Pull-up',
    pointsInPaint: 8,
    inboundEfficiency: 0.92,
    plusMinus: 8,
    lineupEfficiency: 1.12,
    valuePointSystem: 22,
    pointsPerPossession: 1.08,
    freeThrowFactor: 0.21,
    defensiveRebounds: 3,
    defensiveReboundPercentage: 12.5,
    offensiveRebounds: 1,
    offensiveReboundPercentage: 5.0,
    secondChancePoints: 4,
    personalFouls: 2,
    chargesTaken: 1,
    blocks: 0,
    steals: 2,
    deflections: 3,
    assists: 7,
    turnovers: 2,
    assistTurnoverRatio: 3.5,
    turnoverPercentage: 10.2,
    pointsOffTurnovers: 6,
    transitionPoints: 5
  },
  {
    id: 2,
    name: 'Sarah Chen',
    position: 'SG',
    minutes: 28,
    fieldGoals: 6,
    fieldGoalAttempts: 12,
    twoPointers: 4,
    twoPointerAttempts: 8,
    threePointers: 2,
    threePointerAttempts: 4,
    freeThrows: 3,
    freeThrowAttempts: 4,
    pointsFor: 15,
    pointsAgainst: 18,
    pointsPerGame: 22.1,
    fgPercentage: 50.0,
    twoPointPercentage: 50.0,
    threePointPercentage: 50.0,
    ftPercentage: 75.0,
    effectiveFgPercentage: 50.0,
    shotType: 'Dunk',
    pointsInPaint: 6,
    inboundEfficiency: 0.88,
    plusMinus: 5,
    lineupEfficiency: 1.05,
    valuePointSystem: 20,
    pointsPerPossession: 1.10,
    freeThrowFactor: 0.25,
    defensiveRebounds: 2,
    defensiveReboundPercentage: 10.0,
    offensiveRebounds: 0,
    offensiveReboundPercentage: 0.0,
    secondChancePoints: 3,
    personalFouls: 1,
    chargesTaken: 0,
    blocks: 0,
    steals: 1,
    deflections: 2,
    assists: 4,
    turnovers: 1,
    assistTurnoverRatio: 4.0,
    turnoverPercentage: 8.3,
    pointsOffTurnovers: 4,
    transitionPoints: 3
  },
  {
    id: 3,
    name: 'Tyler Williams',
    position: 'PF',
    minutes: 36,
    fieldGoals: 8,
    fieldGoalAttempts: 16,
    twoPointers: 6,
    twoPointerAttempts: 12,
    threePointers: 2,
    threePointerAttempts: 4,
    freeThrows: 4,
    freeThrowAttempts: 5,
    pointsFor: 20,
    pointsAgainst: 20,
    pointsPerGame: 14.3,
    fgPercentage: 50.0,
    twoPointPercentage: 50.0,
    threePointPercentage: 50.0,
    ftPercentage: 80.0,
    effectiveFgPercentage: 50.0,
    shotType: 'Layup',
    pointsInPaint: 10,
    inboundEfficiency: 0.95,
    plusMinus: 0,
    lineupEfficiency: 1.00,
    valuePointSystem: 20,
    pointsPerPossession: 1.05,
    freeThrowFactor: 0.20,
    defensiveRebounds: 4,
    defensiveReboundPercentage: 15.0,
    offensiveRebounds: 2,
    offensiveReboundPercentage: 8.3,
    secondChancePoints: 5,
    personalFouls: 3,
    chargesTaken: 0,
    blocks: 0,
    steals: 1,
    deflections: 2,
    assists: 3,
    turnovers: 1,
    assistTurnoverRatio: 3.0,
    turnoverPercentage: 8.3,
    pointsOffTurnovers: 3,
    transitionPoints: 2
  },
  {
    id: 4,
    name: 'Jordan Davis',
    position: 'SF',
    minutes: 29,
    fieldGoals: 7,
    fieldGoalAttempts: 15,
    twoPointers: 5,
    twoPointerAttempts: 10,
    threePointers: 2,
    threePointerAttempts: 5,
    freeThrows: 3,
    freeThrowAttempts: 4,
    pointsFor: 17,
    pointsAgainst: 22,
    pointsPerGame: 16.8,
    fgPercentage: 46.7,
    twoPointPercentage: 50.0,
    threePointPercentage: 40.0,
    ftPercentage: 75.0,
    effectiveFgPercentage: 46.7,
    shotType: 'Jump Shot',
    pointsInPaint: 7,
    inboundEfficiency: 0.90,
    plusMinus: -3,
    lineupEfficiency: 0.95,
    valuePointSystem: 18,
    pointsPerPossession: 1.02,
    freeThrowFactor: 0.20,
    defensiveRebounds: 3,
    defensiveReboundPercentage: 12.5,
    offensiveRebounds: 1,
    offensiveReboundPercentage: 5.0,
    secondChancePoints: 4,
    personalFouls: 2,
    chargesTaken: 0,
    blocks: 0,
    steals: 1,
    deflections: 2,
    assists: 4,
    turnovers: 2,
    assistTurnoverRatio: 2.0,
    turnoverPercentage: 10.2,
    pointsOffTurnovers: 3,
    transitionPoints: 2
  },
  {
    id: 5,
    name: 'Alex Rodriguez',
    position: 'C',
    minutes: 30,
    fieldGoals: 6,
    fieldGoalAttempts: 12,
    twoPointers: 4,
    twoPointerAttempts: 8,
    threePointers: 2,
    threePointerAttempts: 4,
    freeThrows: 3,
    freeThrowAttempts: 4,
    pointsFor: 15,
    pointsAgainst: 15,
    pointsPerGame: 12.4,
    fgPercentage: 50.0,
    twoPointPercentage: 50.0,
    threePointPercentage: 50.0,
    ftPercentage: 75.0,
    effectiveFgPercentage: 50.0,
    shotType: 'Dunk',
    pointsInPaint: 7,
    inboundEfficiency: 0.92,
    plusMinus: 0,
    lineupEfficiency: 1.00,
    valuePointSystem: 18,
    pointsPerPossession: 1.05,
    freeThrowFactor: 0.20,
    defensiveRebounds: 3,
    defensiveReboundPercentage: 12.5,
    offensiveRebounds: 1,
    offensiveReboundPercentage: 5.0,
    secondChancePoints: 4,
    personalFouls: 2,
    chargesTaken: 0,
    blocks: 0,
    steals: 1,
    deflections: 2,
    assists: 3,
    turnovers: 1,
    assistTurnoverRatio: 3.0,
    turnoverPercentage: 8.3,
    pointsOffTurnovers: 3,
    transitionPoints: 2
  }
];

const mockTeamData = {
  overallRecord: '15-3',
  winPercentage: 83.3,
  avgPointsFor: 72.4,
  avgPointsAgainst: 58.2,
  seasonTrends: [
    { game: 1, pointsFor: 68, pointsAgainst: 62 },
    { game: 2, pointsFor: 75, pointsAgainst: 58 },
    { game: 3, pointsFor: 71, pointsAgainst: 65 },
    { game: 4, pointsFor: 78, pointsAgainst: 55 },
    { game: 5, pointsFor: 69, pointsAgainst: 61 },
    { game: 6, pointsFor: 82, pointsAgainst: 52 },
    { game: 7, pointsFor: 74, pointsAgainst: 59 },
    { game: 8, pointsFor: 76, pointsAgainst: 58 }
  ]
};

// 2. Define advanced modules
const advancedModules = {
  shooting: {
    id: 'shooting',
    name: 'Shooting Breakdown',
    icon: <BarChartOutlined />,
    description: 'Field Goals, 2P, 3P, FT, Points, Shot Types',
    category: 'Shooting'
  },
  efficiencies: {
    id: 'efficiencies',
    name: 'Shooting Efficiencies',
    icon: <TrophyOutlined />,
    description: 'FG%, 2P%, 3P%, FT%, eFG%, Advanced Efficiencies',
    category: 'Efficiencies'
  },
  rebounding: {
    id: 'rebounding',
    name: 'Rebounding',
    icon: <TeamOutlined />,
    description: 'Defensive/Offensive Rebounds, %s, Second Chance',
    category: 'Rebounding'
  },
  defense: {
    id: 'defense',
    name: 'Defense',
    icon: <UserOutlined />,
    description: 'Fouls, Charges, Blocks, Steals, Deflections',
    category: 'Defense'
  },
  assistsTurnovers: {
    id: 'assistsTurnovers',
    name: 'Assists & Turnovers',
    icon: <BarChartOutlined />,
    description: 'Assists, Turnovers, Ratios, Points off TO, Transition',
    category: 'Playmaking'
  },
  minutesValue: {
    id: 'minutesValue',
    name: 'Minutes & Value',
    icon: <TrophyOutlined />,
    description: 'Minutes Played, Value Point System',
    category: 'Advanced'
  }
};

// 3. Add advanced modules to availableModules
const availableModules = {
  ...advancedModules,
  teamOverview: {
    id: 'teamOverview',
    name: 'Team Overview',
    icon: <TrophyOutlined />,
    description: 'Team record, win percentage, and key metrics',
    category: 'Team'
  },
  playerStats: {
    id: 'playerStats',
    name: 'Player Statistics',
    icon: <UserOutlined />,
    description: 'Individual player performance data',
    category: 'Players'
  },
  scoringTrends: {
    id: 'scoringTrends',
    name: 'Scoring Trends',
    icon: <BarChartOutlined />,
    description: 'Team scoring patterns over time',
    category: 'Analytics'
  },
  playerComparison: {
    id: 'playerComparison',
    name: 'Player Comparison',
    icon: <TeamOutlined />,
    description: 'Side-by-side player analysis',
    category: 'Players'
  },
  shootingAnalysis: {
    id: 'shootingAnalysis',
    name: 'Shooting Analysis',
    icon: <BarChartOutlined />,
    description: 'Field goal and shooting percentages',
    category: 'Analytics'
  },
  gameResults: {
    id: 'gameResults',
    name: 'Game Results',
    icon: <TrophyOutlined />,
    description: 'Recent game outcomes and margins',
    category: 'Team'
  }
};

// --- MODULE RENDERERS ---
const renderTeamOverview = () => (
  <Card title="Team Overview" className={style.dashboardModule} variant="outlined">
    <Row gutter={[16, 16]}>
      <Col xs={12} sm={6}>
        <Statistic
          title="Season Record"
          value={mockTeamData.overallRecord}
          valueStyle={{ color: '#52c41a' }}
        />
      </Col>
      <Col xs={12} sm={6}>
        <Statistic
          title="Win %"
          value={mockTeamData.winPercentage}
          suffix="%"
          valueStyle={{ color: '#1890ff' }}
        />
      </Col>
      <Col xs={12} sm={6}>
        <Statistic
          title="Avg Points For"
          value={mockTeamData.avgPointsFor}
          valueStyle={{ color: '#52c41a' }}
        />
      </Col>
      <Col xs={12} sm={6}>
        <Statistic
          title="Avg Points Against"
          value={mockTeamData.avgPointsAgainst}
          valueStyle={{ color: '#f5222d' }}
        />
      </Col>
    </Row>
  </Card>
);

const renderPlayerStats = (filteredPlayers, setFilterDrawerVisible) => (
  <Card 
    title="Player Statistics" 
    className={style.dashboardModule} 
    variant="outlined"
  >
    <div className={style.playerStatsTable}>
      <Row className={style.tableHeader}>
        <Col xs={8} sm={6}>Player</Col>
        <Col xs={4} sm={2}>Pos</Col>
        <Col xs={4} sm={2}>PPG</Col>
        <Col xs={4} sm={2}>APG</Col>
        <Col xs={4} sm={2}>RPG</Col>
        <Col xs={4} sm={2}>SPG</Col>
        <Col xs={4} sm={2}>FG%</Col>
        <Col xs={4} sm={2}>Min</Col>
      </Row>
      {filteredPlayers.map(player => (
        <Row key={player.id} className={style.tableRow}>
          <Col xs={8} sm={6}>
            <Text strong style={{ color: '#ffffff' }}>{player.name}</Text>
          </Col>
          <Col xs={4} sm={2}>
            <Tag color="blue">{player.position}</Tag>
          </Col>
          <Col xs={4} sm={2}>
            <Text style={{ color: '#52c41a' }}>{player.pointsPerGame}</Text>
          </Col>
          <Col xs={4} sm={2}>
            <Text style={{ color: '#1890ff' }}>{player.assists}</Text>
          </Col>
          <Col xs={4} sm={2}>
            <Text style={{ color: '#722ed1' }}>{player.offensiveRebounds}</Text>
          </Col>
          <Col xs={4} sm={2}>
            <Text style={{ color: '#fa8c16' }}>{player.steals}</Text>
          </Col>
          <Col xs={4} sm={2}>
            <Text style={{ color: '#52c41a' }}>{player.fgPercentage}%</Text>
          </Col>
          <Col xs={4} sm={2}>
            <Text style={{ color: '#b8c5d3' }}>{player.minutes}</Text>
          </Col>
        </Row>
      ))}
    </div>
  </Card>
);

const renderScoringTrends = () => (
  <Card title="Scoring Trends" className={style.dashboardModule} variant="outlined">
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={mockTeamData.seasonTrends}>
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
          dataKey="pointsFor" 
          stroke="#52c41a" 
          strokeWidth={2}
          dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
          name="Points For"
        />
        <Line 
          type="monotone" 
          dataKey="pointsAgainst" 
          stroke="#f5222d" 
          strokeWidth={2}
          dot={{ fill: '#f5222d', strokeWidth: 2, r: 4 }}
          name="Points Against"
        />
      </LineChart>
    </ResponsiveContainer>
  </Card>
);

const renderPlayerComparison = (filteredPlayers, hasActiveFilters) => (
  <Card 
    title={
      <Space>
        Player Comparison
        {hasActiveFilters && (
          <Tag color="blue" size="small">
            Filtered ({filteredPlayers.length} players)
          </Tag>
        )}
      </Space>
    } 
    className={style.dashboardModule} 
    variant="outlined"
  >
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
          PPG Comparison
        </Title>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={filteredPlayers.slice(0, 5)}>
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
            <Bar dataKey="pointsPerGame" fill="#52c41a" />
          </BarChart>
        </ResponsiveContainer>
      </Col>
      <Col xs={24} lg={12}>
        <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
          FG% Comparison
        </Title>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={filteredPlayers.slice(0, 5)}>
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
            <Bar dataKey="fgPercentage" fill="#1890ff" />
          </BarChart>
        </ResponsiveContainer>
      </Col>
    </Row>
  </Card>
);

const renderShootingAnalysis = (filteredPlayers, hasActiveFilters) => (
  <Card 
    title={
      <Space>
        Shooting Analysis
        {hasActiveFilters && (
          <Tag color="blue" size="small">
            Filtered ({filteredPlayers.length} players)
          </Tag>
        )}
      </Space>
    } 
    className={style.dashboardModule} 
    variant="outlined"
  >
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
          Position Shooting %
        </Title>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={[
                { name: 'PG', value: 45.2, color: '#52c41a' },
                { name: 'SG', value: 47.8, color: '#1890ff' },
                { name: 'SF', value: 43.1, color: '#722ed1' },
                { name: 'PF', value: 52.3, color: '#fa8c16' },
                { name: 'C', value: 58.7, color: '#f5222d' }
              ]}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}%`}
            >
              {[
                { name: 'PG', value: 45.2, color: '#52c41a' },
                { name: 'SG', value: 47.8, color: '#1890ff' },
                { name: 'SF', value: 43.1, color: '#722ed1' },
                { name: 'PF', value: 52.3, color: '#fa8c16' },
                { name: 'C', value: 58.7, color: '#f5222d' }
              ].map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#17375c',
                border: '1px solid #2a4a6b',
                color: '#ffffff'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Col>
      <Col xs={24} lg={12}>
        <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
          Top Shooters
        </Title>
        <div className={style.topShooters}>
          {[...filteredPlayers]
            .sort((a, b) => b.fgPercentage - a.fgPercentage)
            .slice(0, 5)
            .map((player, index) => (
              <div key={player.id} className={style.shooterItem}>
                <div className={style.rank}>#{index + 1}</div>
                <div className={style.playerInfo}>
                  <Text strong style={{ color: '#ffffff' }}>{player.name}</Text>
                  <Text style={{ color: '#b8c5d3', fontSize: '12px' }}>{player.position}</Text>
                </div>
                <div className={style.shootingPercentage}>
                  <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    {player.fgPercentage}%
                  </Text>
                </div>
              </div>
            ))}
        </div>
      </Col>
    </Row>
  </Card>
);

const renderGameResults = () => (
  <Card title="Recent Game Results" className={style.dashboardModule} variant="outlined">
    <div className={style.gameResults}>
      {[
        { opponent: 'Central High', result: 'W', score: '75-58', margin: '+17' },
        { opponent: 'East Valley', result: 'W', score: '82-52', margin: '+30' },
        { opponent: 'Westside', result: 'L', score: '65-71', margin: '-6' },
        { opponent: 'North High', result: 'W', score: '78-55', margin: '+23' },
        { opponent: 'South Central', result: 'W', score: '74-59', margin: '+15' }
      ].map((game, index) => (
        <div key={index} className={style.gameResult}>
          <div className={style.gameInfo}>
            <Text strong style={{ color: '#ffffff' }}>vs {game.opponent}</Text>
            <Text style={{ color: '#b8c5d3', fontSize: '12px' }}>Game {index + 1}</Text>
          </div>
          <div className={style.gameScore}>
            <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>{game.score}</Text>
          </div>
          <div className={style.gameResult}>
            <Tag color={game.result === 'W' ? 'green' : 'red'}>
              {game.result}
            </Tag>
            <Text style={{ 
              color: game.result === 'W' ? '#52c41a' : '#f5222d',
              fontWeight: 'bold'
            }}>
              {game.margin}
            </Text>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

// --- ADVANCED MODULE RENDERERS ---
const renderShooting = (filteredPlayers, hasActiveFilters) => (
  <Card 
    title={
      <Space>
        Shooting Breakdown
        {hasActiveFilters && (
          <Tag color="blue" size="small">
            Filtered ({filteredPlayers.length} players)
          </Tag>
        )}
      </Space>
    } 
    className={style.dashboardModule} 
    variant="outlined"
  >
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
          Field Goals
        </Title>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={filteredPlayers}>
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
            <Bar dataKey="fieldGoals" fill="#52c41a" />
            <Bar dataKey="twoPointers" fill="#1890ff" />
            <Bar dataKey="threePointers" fill="#722ed1" />
          </BarChart>
        </ResponsiveContainer>
      </Col>
      <Col xs={24} lg={12}>
        <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
          Free Throws
        </Title>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={filteredPlayers}>
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
            <Bar dataKey="freeThrows" fill="#fa8c16" />
            <Bar dataKey="freeThrowAttempts" fill="#f5222d" />
          </BarChart>
        </ResponsiveContainer>
      </Col>
    </Row>
  </Card>
);

const renderEfficiencies = (filteredPlayers, hasActiveFilters) => (
  <Card 
    title={
      <Space>
        Shooting Efficiencies
        {hasActiveFilters && (
          <Tag color="blue" size="small">
            Filtered ({filteredPlayers.length} players)
          </Tag>
        )}
      </Space>
    } 
    className={style.dashboardModule} 
    variant="outlined"
  >
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
          Field Goal Percentage
        </Title>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={filteredPlayers}>
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
            <Bar dataKey="fgPercentage" fill="#52c41a" />
          </BarChart>
        </ResponsiveContainer>
      </Col>
      <Col xs={24} lg={12}>
        <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
          Effective Field Goal Percentage
        </Title>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={filteredPlayers}>
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
            <Bar dataKey="effectiveFgPercentage" fill="#1890ff" />
          </BarChart>
        </ResponsiveContainer>
      </Col>
    </Row>
  </Card>
);

const renderRebounding = (filteredPlayers, hasActiveFilters) => (
  <Card 
    title={
      <Space>
        Rebounding
        {hasActiveFilters && (
          <Tag color="blue" size="small">
            Filtered ({filteredPlayers.length} players)
          </Tag>
        )}
      </Space>
    } 
    className={style.dashboardModule} 
    variant="outlined"
  >
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
          Defensive Rebounds
        </Title>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={filteredPlayers}>
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
            <Bar dataKey="defensiveRebounds" fill="#52c41a" />
          </BarChart>
        </ResponsiveContainer>
      </Col>
      <Col xs={24} lg={12}>
        <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
          Offensive Rebounds
        </Title>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={filteredPlayers}>
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
            <Bar dataKey="offensiveRebounds" fill="#1890ff" />
          </BarChart>
        </ResponsiveContainer>
      </Col>
    </Row>
  </Card>
);

const renderDefense = (filteredPlayers, hasActiveFilters) => (
  <Card 
    title={
      <Space>
        Defense
        {hasActiveFilters && (
          <Tag color="blue" size="small">
            Filtered ({filteredPlayers.length} players)
          </Tag>
        )}
      </Space>
    } 
    className={style.dashboardModule} 
    variant="outlined"
  >
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
          Fouls
        </Title>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={filteredPlayers}>
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
            <Bar dataKey="personalFouls" fill="#fa8c16" />
          </BarChart>
        </ResponsiveContainer>
      </Col>
      <Col xs={24} lg={12}>
        <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
          Charges Taken
        </Title>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={filteredPlayers}>
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
            <Bar dataKey="chargesTaken" fill="#f5222d" />
          </BarChart>
        </ResponsiveContainer>
      </Col>
    </Row>
  </Card>
);

const renderAssistsTurnovers = (filteredPlayers, hasActiveFilters) => (
  <Card 
    title={
      <Space>
        Assists & Turnovers
        {hasActiveFilters && (
          <Tag color="blue" size="small">
            Filtered ({filteredPlayers.length} players)
          </Tag>
        )}
      </Space>
    } 
    className={style.dashboardModule} 
    variant="outlined"
  >
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
          Assists
        </Title>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={filteredPlayers}>
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
            <Bar dataKey="assists" fill="#52c41a" />
          </BarChart>
        </ResponsiveContainer>
      </Col>
      <Col xs={24} lg={12}>
        <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
          Turnovers
        </Title>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={filteredPlayers}>
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
            <Bar dataKey="turnovers" fill="#f5222d" />
          </BarChart>
        </ResponsiveContainer>
      </Col>
    </Row>
  </Card>
);

const renderMinutesValue = (filteredPlayers, hasActiveFilters) => (
  <Card 
    title={
      <Space>
        Minutes & Value
        {hasActiveFilters && (
          <Tag color="blue" size="small">
            Filtered ({filteredPlayers.length} players)
          </Tag>
        )}
      </Space>
    } 
    className={style.dashboardModule} 
    variant="outlined"
  >
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
          Minutes Played
        </Title>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={filteredPlayers}>
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
            <Bar dataKey="minutes" fill="#1890ff" />
          </BarChart>
        </ResponsiveContainer>
      </Col>
      <Col xs={24} lg={12}>
        <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
          Value Point System
        </Title>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={filteredPlayers}>
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
            <Bar dataKey="valuePointSystem" fill="#fa8c16" />
          </BarChart>
        </ResponsiveContainer>
      </Col>
    </Row>
  </Card>
);

// --- MODULE RENDERERS OBJECT ---
const moduleRenderers = {
  teamOverview: renderTeamOverview,
  playerStats: renderPlayerStats,
  scoringTrends: renderScoringTrends,
  playerComparison: renderPlayerComparison,
  shootingAnalysis: renderShootingAnalysis,
  gameResults: renderGameResults,
  shooting: renderShooting,
  efficiencies: renderEfficiencies,
  rebounding: renderRebounding,
  defense: renderDefense,
  assistsTurnovers: renderAssistsTurnovers,
  minutesValue: renderMinutesValue
};

const StatsMyWay = () => {
  // State management
  const [activeModules, setActiveModules] = useState(['teamOverview', 'playerStats']);
  const [customizationDrawerVisible, setCustomizationDrawerVisible] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [sortBy, setSortBy] = useState('ppg');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState(advancedPlayerData);

  // Filter and sort players
  useEffect(() => {
    let filtered = [...advancedPlayerData];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Position filter
    if (selectedPositions.length > 0) {
      filtered = filtered.filter(player => 
        selectedPositions.includes(player.position)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    setFilteredPlayers(filtered);
  }, [searchTerm, selectedPositions, sortBy, sortOrder]);

  return (
    <div className={style.statsMyWayContainer}>
      {/* Header Section */}
      <div className={style.headerSection}>
        <div className={style.headerContent}>
          <div className={style.headerLeft}>
            <Title level={2} style={{ color: '#ffffff', margin: 0 }}>
              Stats My Way
            </Title>
            <Text style={{ color: '#b8c5d3', fontSize: '16px' }}>
              Customizable basketball analytics dashboard
            </Text>
          </div>
          <div className={style.headerRight}>
            <Space>
              <Button 
                icon={<FilterOutlined />} 
                onClick={() => setFilterDrawerVisible(true)}
              >
                Filter & Sort All Modules
              </Button>
              <Button 
                icon={<SettingOutlined />} 
                type="primary"
                onClick={() => setCustomizationDrawerVisible(true)}
              >
                Customize Dashboard
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className={style.mainContent}>
        <Row gutter={[24, 24]}>
          {activeModules.map(moduleId => {
            // Determine optimal column size based on module type
            let colSize = 24; // Default full width
            
            if (moduleId === 'teamOverview' || moduleId === 'gameResults') {
              colSize = 12; // Half width for overview modules
            } else if (moduleId === 'playerStats') {
              colSize = 24; // Full width for detailed tables
            } else if (moduleId === 'playerComparison' || moduleId === 'shootingAnalysis') {
              colSize = 24; // Full width for comparison charts
            } else if (moduleId === 'scoringTrends') {
              colSize = 24; // Full width for trend charts
            } else if (moduleId === 'shooting' || moduleId === 'efficiencies' || 
                       moduleId === 'rebounding' || moduleId === 'defense' || 
                       moduleId === 'assistsTurnovers' || moduleId === 'minutesValue') {
              colSize = 24; // Full width for advanced stat modules
            }
            
            // Determine if filters are active
            const hasActiveFilters = !!searchTerm || selectedPositions.length > 0 || sortBy !== 'ppg' || sortOrder !== 'desc';
            
            return (
              <Col xs={24} lg={colSize} key={moduleId}>
                {moduleId === 'playerStats' && moduleRenderers[moduleId]?.(filteredPlayers, setFilterDrawerVisible)}
                {moduleId === 'playerComparison' && moduleRenderers[moduleId]?.(filteredPlayers, hasActiveFilters)}
                {moduleId === 'shootingAnalysis' && moduleRenderers[moduleId]?.(filteredPlayers, hasActiveFilters)}
                {moduleId === 'shooting' && moduleRenderers[moduleId]?.(filteredPlayers, hasActiveFilters)}
                {moduleId === 'efficiencies' && moduleRenderers[moduleId]?.(filteredPlayers, hasActiveFilters)}
                {moduleId === 'rebounding' && moduleRenderers[moduleId]?.(filteredPlayers, hasActiveFilters)}
                {moduleId === 'defense' && moduleRenderers[moduleId]?.(filteredPlayers, hasActiveFilters)}
                {moduleId === 'assistsTurnovers' && moduleRenderers[moduleId]?.(filteredPlayers, hasActiveFilters)}
                {moduleId === 'minutesValue' && moduleRenderers[moduleId]?.(filteredPlayers, hasActiveFilters)}
                {moduleId !== 'playerStats' && moduleId !== 'playerComparison' && moduleId !== 'shootingAnalysis' && moduleId !== 'shooting' && moduleId !== 'efficiencies' && moduleId !== 'rebounding' && moduleId !== 'defense' && moduleId !== 'assistsTurnovers' && moduleId !== 'minutesValue' && moduleRenderers[moduleId]?.()}
              </Col>
            );
          })}
        </Row>
      </div>

      {/* Customization Drawer */}
      <Drawer
        title="Customize Dashboard"
        placement="right"
        width={400}
        open={customizationDrawerVisible}
        onClose={() => setCustomizationDrawerVisible(false)}
        className={style.customizationDrawer}
      >
        <div className={style.customizationContent}>
          <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
            Available Modules
          </Title>
          <Text style={{ color: '#b8c5d3', marginBottom: 24, display: 'block' }}>
            Toggle modules on/off to customize your dashboard
          </Text>
          
          {Object.values(availableModules).map(module => (
            <div key={module.id} className={style.moduleToggle}>
              <div className={style.moduleInfo}>
                <div className={style.moduleIcon}>
                  {module.icon}
                </div>
                <div className={style.moduleDetails}>
                  <Text strong style={{ color: '#ffffff' }}>{module.name}</Text>
                  <Text style={{ color: '#b8c5d3', fontSize: '12px' }}>
                    {module.description}
                  </Text>
                  <Tag size="small" color="blue">{module.category}</Tag>
                </div>
              </div>
              <Switch
                checked={activeModules.includes(module.id)}
                onChange={(checked) => {
                  if (checked) {
                    setActiveModules([...activeModules, module.id]);
                  } else {
                    setActiveModules(activeModules.filter(id => id !== module.id));
                  }
                }}
              />
            </div>
          ))}
        </div>
      </Drawer>

      {/* Filter & Sort Drawer */}
      <Drawer
        title="Filter & Sort All Modules"
        placement="right"
        width={400}
        open={filterDrawerVisible}
        onClose={() => setFilterDrawerVisible(false)}
        className={style.filterDrawer}
      >
        <div className={style.filterContent}>
          <Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
            Global Search & Filter
          </Title>
          <Text style={{ color: '#b8c5d3', marginBottom: 24, display: 'block' }}>
            These filters apply to all modules that display player data
          </Text>
          
          <div className={style.filterSection}>
            <Text strong style={{ color: '#ffffff', marginBottom: 8, display: 'block' }}>
              Search Players
            </Text>
            <Search
              placeholder="Search players across all modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: 16 }}
            />
          </div>

          <Divider style={{ borderColor: '#2a4a6b' }} />

          <div className={style.filterSection}>
            <Text strong style={{ color: '#ffffff', marginBottom: 8, display: 'block' }}>
              Position Filter
            </Text>
            <Checkbox.Group
              value={selectedPositions}
              onChange={setSelectedPositions}
              style={{ marginBottom: 16 }}
            >
              <Row>
                <Col span={12}>
                  <Checkbox value="PG" style={{ color: '#b8c5d3' }}>Point Guard</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="SG" style={{ color: '#b8c5d3' }}>Shooting Guard</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="SF" style={{ color: '#b8c5d3' }}>Small Forward</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="PF" style={{ color: '#b8c5d3' }}>Power Forward</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="C" style={{ color: '#b8c5d3' }}>Center</Checkbox>
                </Col>
              </Row>
            </Checkbox.Group>
          </div>

          <Divider style={{ borderColor: '#2a4a6b' }} />

          <div className={style.filterSection}>
            <Text strong style={{ color: '#ffffff', marginBottom: 8, display: 'block' }}>
              Sort Options
            </Text>
            <div style={{ marginBottom: 8 }}>
              <Text style={{ color: '#b8c5d3', marginBottom: 4, display: 'block' }}>
                Sort By:
              </Text>
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: '100%', marginBottom: 16 }}
              >
                <Option value="pointsPerGame">Points Per Game</Option>
                <Option value="assists">Assists</Option>
                <Option value="defensiveRebounds">Defensive Rebounds</Option>
                <Option value="offensiveRebounds">Offensive Rebounds</Option>
                <Option value="steals">Steals</Option>
                <Option value="blocks">Blocks</Option>
                <Option value="fgPercentage">Field Goal %</Option>
                <Option value="threePointPercentage">3P %</Option>
                <Option value="ftPercentage">Free Throw %</Option>
                <Option value="effectiveFgPercentage">Effective FG %</Option>
                <Option value="minutes">Minutes Played</Option>
                <Option value="valuePointSystem">Value Points</Option>
                <Option value="plusMinus">Plus/Minus</Option>
                <Option value="assistTurnoverRatio">Assist/Turnover Ratio</Option>
              </Select>
            </div>
            <div>
              <Text style={{ color: '#b8c5d3', marginBottom: 4, display: 'block' }}>
                Sort Order:
              </Text>
              <Select
                value={sortOrder}
                onChange={setSortOrder}
                style={{ width: '100%' }}
              >
                <Option value="desc">Highest First</Option>
                <Option value="asc">Lowest First</Option>
              </Select>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default StatsMyWay; 