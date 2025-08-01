'use client'
import React from 'react';
import { Card, Table, Tag, Spin, Alert } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CalendarOutlined, TrophyOutlined, FireOutlined } from '@ant-design/icons';
import style from '../style.module.scss';
import { useGameStats } from '../hooks/useStatsData';

const GameStatsPanel = () => {
  const { games, isLoading, error } = useGameStats();

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Opponent',
      dataIndex: 'opponent',
      key: 'opponent',
    },
    {
      title: 'Result',
      key: 'result',
      render: (_: any, record: any) => {
        const win = record.result === 'W';
        return <Tag color={win ? 'green' : 'red'}>{win ? 'W' : 'L'}</Tag>;
      },
    },
    {
      title: 'Score',
      key: 'score',
      render: (_: any, record: any) => `${record.finalScoreUs} - ${record.finalScoreThem}`,
    },
    {
      title: 'Margin',
      key: 'margin',
      render: (_: any, record: any) => {
        const margin = record.margin;
        const color = margin > 0 ? 'green' : margin < 0 ? 'red' : 'default';
        return <Tag color={color}>{margin > 0 ? '+' : ''}{margin}</Tag>;
      },
    },
  ];

  if (isLoading) {
    return (
      <Card title="Game Stats" className={style.panel} variant="outlined">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#b8c5d3' }}>Loading game statistics...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Game Stats" className={style.panel} variant="outlined">
        <Alert
          message="Error Loading Data"
          description="Unable to load game statistics. Please try again."
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!games || games.length === 0) {
    return (
      <Card title="Game Stats" className={style.panel} variant="outlined">
        <div style={{ textAlign: 'center', color: '#b8c5d3' }}>
          No game data available
        </div>
      </Card>
    );
  }

  // Prepare data for scoring trend chart
  const scoringTrendData = games.map((game, index) => ({
    game: index + 1,
    pointsFor: game.finalScoreUs,
    pointsAgainst: game.finalScoreThem,
    opponent: game.opponent,
    result: game.result
  }));

  // Calculate summary stats
  const wins = games.filter(g => g.result === 'W').length;
  const losses = games.filter(g => g.result === 'L').length;
  const avgPointsFor = Math.round(games.reduce((sum, g) => sum + g.finalScoreUs, 0) / games.length);
  const avgPointsAgainst = Math.round(games.reduce((sum, g) => sum + g.finalScoreThem, 0) / games.length);

  return (
    <Card title="Game Stats" className={style.panel} variant="outlined">
      {/* Summary Stats */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#b8c5d3' }}>
            <TrophyOutlined style={{ marginRight: 4 }} />
            Record: {wins}-{losses}
          </span>
          <span style={{ color: '#b8c5d3' }}>
            <FireOutlined style={{ marginRight: 4 }} />
            Avg: {avgPointsFor} PF / {avgPointsAgainst} PA
          </span>
        </div>
      </div>

      {/* Scoring Trend Chart */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ color: '#ffffff', marginBottom: 8 }}>Scoring Trend</h4>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={scoringTrendData}>
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
              formatter={(value: any, name: any, props: any) => [
                `${value} pts`,
                name === 'pointsFor' ? 'Points For' : 'Points Against'
              ]}
              labelFormatter={(label: any, payload: any) => {
                if (payload && payload[0]) {
                  return `Game ${label} vs ${payload[0].payload.opponent}`;
                }
                return `Game ${label}`;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="pointsFor" 
              stroke="#52c41a" 
              strokeWidth={2}
              dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#52c41a', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="pointsAgainst" 
              stroke="#f5222d" 
              strokeWidth={2}
              dot={{ fill: '#f5222d', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#f5222d', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Games Table */}
      <div>
        <h4 style={{ color: '#ffffff', marginBottom: 8 }}>Recent Games</h4>
        <Table
          columns={columns}
          dataSource={games.map(g => ({ ...g, key: g.id }))}
          size="small"
          pagination={false}
          scroll={{ y: 120 }}
        />
      </div>
    </Card>
  );
};

export default GameStatsPanel; 