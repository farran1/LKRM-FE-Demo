'use client'
import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Select, Timeline, Progress, Space, Typography } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { 
  TrophyOutlined, 
  FireOutlined, 
  ClockCircleOutlined, 
  TeamOutlined,
  UserOutlined,
  BarChartOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useGameAnalysis } from '../hooks/useAdvancedStats';
import style from '../style.module.scss';

const { Title, Text } = Typography;
const { Option } = Select;

const GameAnalysisSection = () => {
  const [selectedGameId, setSelectedGameId] = useState<string>('game-1');
  const { gameAnalysis, isLoading, error } = useGameAnalysis(selectedGameId);

  if (isLoading) {
    return (
      <div className={style.sectionPlaceholder}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ color: '#b8c5d3' }}>Loading game analysis...</div>
        </div>
      </div>
    );
  }

  if (error || !gameAnalysis) {
    return (
      <div className={style.sectionPlaceholder}>
        <Title level={3} style={{ color: '#ffffff' }}>Game Analysis</Title>
        <Text style={{ color: '#b8c5d3' }}>
          Select a game to view detailed analysis
        </Text>
      </div>
    );
  }

  // Prepare data for charts
  const gameFlowData = gameAnalysis.gameFlow.map((flow, index) => ({
    period: `Q${flow.period}`,
    homeScore: flow.homeScore,
    awayScore: flow.awayScore,
    leadChanges: flow.leadChanges,
    largestLead: flow.largestLead,
  }));

  const quarterData = [
    { name: 'Q1', home: gameAnalysis.quarterAnalysis.q1.home, away: gameAnalysis.quarterAnalysis.q1.away },
    { name: 'Q2', home: gameAnalysis.quarterAnalysis.q2.home, away: gameAnalysis.quarterAnalysis.q2.away },
    { name: 'Q3', home: gameAnalysis.quarterAnalysis.q3.home, away: gameAnalysis.quarterAnalysis.q3.away },
    { name: 'Q4', home: gameAnalysis.quarterAnalysis.q4.home, away: gameAnalysis.quarterAnalysis.q4.away },
  ];

  const playerColumns = [
    {
      title: 'Player',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text style={{ color: '#ffffff', fontWeight: 500 }}>{name}</Text>,
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      render: (points: number) => <Text style={{ color: '#52c41a', fontWeight: 600 }}>{points}</Text>,
    },
    {
      title: 'Rebounds',
      dataIndex: 'rebounds',
      key: 'rebounds',
      render: (rebounds: number) => <Text style={{ color: '#1890ff' }}>{rebounds}</Text>,
    },
    {
      title: 'Assists',
      dataIndex: 'assists',
      key: 'assists',
      render: (assists: number) => <Text style={{ color: '#722ed1' }}>{assists}</Text>,
    },
    {
      title: 'Minutes',
      dataIndex: 'minutes',
      key: 'minutes',
      render: (minutes: number) => <Text style={{ color: '#b8c5d3' }}>{minutes}</Text>,
    },
    {
      title: '+/-',
      dataIndex: 'plusMinus',
      key: 'plusMinus',
      render: (plusMinus: number) => (
        <Tag color={plusMinus >= 0 ? 'green' : 'red'}>
          {plusMinus >= 0 ? '+' : ''}{plusMinus}
        </Tag>
      ),
    },
  ];

  const COLORS = ['#52c41a', '#1890ff', '#722ed1', '#fa8c16'];

  return (
    <div className={style.gameAnalysisSection}>
      {/* Game Selection and Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Title level={3} style={{ color: '#ffffff', margin: 0 }}>
            Game Analysis: {gameAnalysis.opponent}
          </Title>
          <Text style={{ color: '#b8c5d3' }}>
            {gameAnalysis.date} • {gameAnalysis.finalScore} • {gameAnalysis.result === 'W' ? 'Win' : 'Loss'}
          </Text>
        </Col>
        <Col span={8} style={{ textAlign: 'right' }}>
          <Space>
            <Select
              defaultValue="game-1"
              style={{ width: 200 }}
              onChange={setSelectedGameId}
            >
              <Option value="game-1">vs Central High (W 72-68)</Option>
              <Option value="game-2">vs East Valley (L 68-71)</Option>
              <Option value="game-3">vs Westside (W 85-78)</Option>
            </Select>
            <Button icon={<DownloadOutlined />} type="primary">
              Export
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Key Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={6}>
          <Card className={style.analysisCard} variant="outlined">
            <Statistic
              title="Result"
              value={gameAnalysis.result === 'W' ? 'WIN' : 'LOSS'}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: gameAnalysis.result === 'W' ? '#52c41a' : '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card className={style.analysisCard} variant="outlined">
            <Statistic
              title="Field Goal %"
              value={(gameAnalysis.teamStats.fieldGoalPercentage * 100).toFixed(1)}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card className={style.analysisCard} variant="outlined">
            <Statistic
              title="Three Point %"
              value={(gameAnalysis.teamStats.threePointPercentage * 100).toFixed(1)}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card className={style.analysisCard} variant="outlined">
            <Statistic
              title="Free Throw %"
              value={(gameAnalysis.teamStats.freeThrowPercentage * 100).toFixed(1)}
              suffix="%"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Game Flow Chart */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Game Flow" className={style.chartCard} variant="outlined">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={gameFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a4a6b" />
                <XAxis 
                  dataKey="period" 
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
                  dataKey="homeScore" 
                  stroke="#52c41a" 
                  strokeWidth={3}
                  dot={{ fill: '#52c41a', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#52c41a', strokeWidth: 2 }}
                  name="Lincoln High"
                />
                <Line 
                  type="monotone" 
                  dataKey="awayScore" 
                  stroke="#f5222d" 
                  strokeWidth={3}
                  dot={{ fill: '#f5222d', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#f5222d', strokeWidth: 2 }}
                  name="Opponent"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Quarter Breakdown" className={style.chartCard} variant="outlined">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={quarterData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#2a4a6b" />
                <XAxis 
                  type="number"
                  stroke="#b8c5d3"
                  tick={{ fill: '#b8c5d3', fontSize: 12 }}
                />
                <YAxis 
                  dataKey="name"
                  type="category"
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
                <Bar dataKey="home" fill="#52c41a" radius={[0, 4, 4, 0]} />
                <Bar dataKey="away" fill="#f5222d" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Key Moments and Player Performance */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Key Moments" className={style.analysisCard} variant="outlined">
            <Timeline
              items={gameAnalysis.keyMoments.map((moment, index) => ({
                color: moment.impact === 'positive' ? 'green' : moment.impact === 'negative' ? 'red' : 'blue',
                children: (
                  <div>
                    <Text style={{ color: '#ffffff', fontWeight: 500 }}>
                      {moment.time}
                    </Text>
                    <br />
                    <Text style={{ color: '#b8c5d3' }}>
                      {moment.description}
                    </Text>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Team Stats" className={style.analysisCard} variant="outlined">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Rebounds"
                  value={`${gameAnalysis.teamStats.rebounds.offensive}/${gameAnalysis.teamStats.rebounds.defensive}`}
                  suffix="O/D"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Assists"
                  value={gameAnalysis.teamStats.assists}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Turnovers"
                  value={gameAnalysis.teamStats.turnovers}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Steals"
                  value={gameAnalysis.teamStats.steals}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Player Performance Table */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Player Performance" className={style.analysisCard} variant="outlined">
            <Table
              columns={playerColumns}
              dataSource={gameAnalysis.playerPerformance.map(p => ({ ...p, key: p.playerId }))}
              size="small"
              pagination={false}
              scroll={{ x: 600 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default GameAnalysisSection; 