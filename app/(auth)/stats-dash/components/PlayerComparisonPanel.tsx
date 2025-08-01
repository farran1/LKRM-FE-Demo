'use client'
import React from 'react';
import { Card, Table, Tag, Spin, Alert } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { UserOutlined, TrophyOutlined, FireOutlined } from '@ant-design/icons';
import style from '../style.module.scss';
import { usePlayerStats } from '../hooks/useStatsData';

const PlayerComparisonPanel = () => {
  const { players, isLoading, error } = usePlayerStats();

  const columns = [
    {
      title: 'Player',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <div>
          <div style={{ fontWeight: 'bold', color: '#ffffff' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#b8c5d3' }}>
            #{record.jerseyNumber} {record.position}
          </div>
        </div>
      ),
    },
    {
      title: 'PPG',
      dataIndex: 'avgPoints',
      key: 'avgPoints',
      render: (value: number) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{value.toFixed(1)}</span>
      ),
    },
    {
      title: 'RPG',
      dataIndex: 'avgRebounds',
      key: 'avgRebounds',
      render: (value: number) => (
        <span style={{ color: '#1890ff' }}>{value.toFixed(1)}</span>
      ),
    },
    {
      title: 'APG',
      dataIndex: 'avgAssists',
      key: 'avgAssists',
      render: (value: number) => (
        <span style={{ color: '#722ed1' }}>{value.toFixed(1)}</span>
      ),
    },
    {
      title: 'FG%',
      dataIndex: 'fieldGoalPercentage',
      key: 'fieldGoalPercentage',
      render: (value: number) => (
        <span style={{ color: '#fa8c16' }}>{(value * 100).toFixed(1)}%</span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Card title="Player Comparison" className={style.panel} variant="outlined">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#b8c5d3' }}>Loading player statistics...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Player Comparison" className={style.panel} variant="outlined">
        <Alert
          message="Error Loading Data"
          description="Unable to load player statistics. Please try again."
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!players || players.length === 0) {
    return (
      <Card title="Player Comparison" className={style.panel} variant="outlined">
        <div style={{ textAlign: 'center', color: '#b8c5d3' }}>
          No player data available
        </div>
      </Card>
    );
  }

  // Prepare data for scoring comparison chart
  const scoringData = players.map(player => ({
    name: player.name,
    points: player.avgPoints,
    rebounds: player.avgRebounds,
    assists: player.avgAssists,
  }));

  // Prepare data for shooting comparison chart (top 5 players)
  const topPlayers = players.slice(0, 5);
  const shootingData = topPlayers.map(player => ({
    name: player.name,
    fgPct: (player.fieldGoalPercentage * 100).toFixed(1),
    threePct: (player.threePointPercentage * 100).toFixed(1),
    ftPct: (player.freeThrowPercentage * 100).toFixed(1),
  }));

  // Calculate team averages
  const avgPoints = players.reduce((sum, p) => sum + p.avgPoints, 0) / players.length;
  const avgRebounds = players.reduce((sum, p) => sum + p.avgRebounds, 0) / players.length;
  const avgAssists = players.reduce((sum, p) => sum + p.avgAssists, 0) / players.length;

  return (
    <Card title="Player Comparison" className={style.panel} variant="outlined">
      {/* Team Averages */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#b8c5d3' }}>
            <UserOutlined style={{ marginRight: 4 }} />
            Team Avg: {avgPoints.toFixed(1)} PPG
          </span>
          <span style={{ color: '#b8c5d3' }}>
            <TrophyOutlined style={{ marginRight: 4 }} />
            {avgRebounds.toFixed(1)} RPG / {avgAssists.toFixed(1)} APG
          </span>
        </div>
      </div>

      {/* Scoring Comparison Chart */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ color: '#ffffff', marginBottom: 8 }}>Scoring Comparison</h4>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={scoringData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a4a6b" />
            <XAxis 
              dataKey="name" 
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
            <Bar dataKey="points" fill="#52c41a" radius={[2, 2, 0, 0]} />
            <Bar dataKey="rebounds" fill="#1890ff" radius={[2, 2, 0, 0]} />
            <Bar dataKey="assists" fill="#722ed1" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Shooting Comparison Chart */}
      {shootingData.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#ffffff', marginBottom: 8 }}>Shooting Comparison</h4>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={shootingData}>
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
              <Bar dataKey="fgPct" fill="#52c41a" name="FG%" radius={[2, 2, 0, 0]} />
              <Bar dataKey="threePct" fill="#1890ff" name="3P%" radius={[2, 2, 0, 0]} />
              <Bar dataKey="ftPct" fill="#722ed1" name="FT%" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Players Table */}
      <div>
        <h4 style={{ color: '#ffffff', marginBottom: 8 }}>Player Stats</h4>
        <Table
          columns={columns}
          dataSource={players.map(p => ({ ...p, key: p.id }))}
          size="small"
          pagination={false}
          scroll={{ y: 120 }}
        />
      </div>
    </Card>
  );
};

export default PlayerComparisonPanel; 