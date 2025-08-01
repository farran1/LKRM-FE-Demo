'use client'
import React from 'react';
import { Card, Statistic, Row, Col, Divider, Spin, Alert } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrophyOutlined, FireOutlined, RiseOutlined, FallOutlined, FullscreenOutlined } from '@ant-design/icons';
import style from '../style.module.scss';
import { useTeamStats } from '../hooks/useStatsData';
import { FocusPanel } from '../hooks/useDashboardFocus';

interface TeamStatsPanelProps {
  isFocused?: boolean;
  onToggleFocus?: (panel: FocusPanel) => void;
}

const TeamStatsPanel: React.FC<TeamStatsPanelProps> = ({ 
  isFocused = false, 
  onToggleFocus 
}) => {
  const { teamStats, isLoading, error } = useTeamStats();

  const handlePanelClick = () => {
    if (onToggleFocus) {
      onToggleFocus('team');
    }
  };

  if (isLoading) {
    return (
      <Card 
        title="Team Stats" 
        className={`${style.panel} ${isFocused ? style.focusedPanel : ''}`} 
        variant="outlined"
        extra={
          onToggleFocus && (
            <FullscreenOutlined 
              onClick={handlePanelClick}
              style={{ cursor: 'pointer', color: '#1890ff' }}
            />
          )
        }
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#b8c5d3' }}>Loading team statistics...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card 
        title="Team Stats" 
        className={`${style.panel} ${isFocused ? style.focusedPanel : ''}`} 
        variant="outlined"
        extra={
          onToggleFocus && (
            <FullscreenOutlined 
              onClick={handlePanelClick}
              style={{ cursor: 'pointer', color: '#1890ff' }}
            />
          )
        }
      >
        <Alert
          message="Error Loading Data"
          description="Unable to load team statistics. Please try again."
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!teamStats) {
    return (
      <Card 
        title="Team Stats" 
        className={`${style.panel} ${isFocused ? style.focusedPanel : ''}`} 
        variant="outlined"
        extra={
          onToggleFocus && (
            <FullscreenOutlined 
              onClick={handlePanelClick}
              style={{ cursor: 'pointer', color: '#1890ff' }}
            />
          )
        }
      >
        <div style={{ textAlign: 'center', color: '#b8c5d3' }}>
          No team data available
        </div>
      </Card>
    );
  }

  // Prepare data for charts
  const lastFiveGamesData = teamStats.lastFiveGames.map((result, index) => ({
    game: index + 1,
    result: result === 'W' ? 1 : 0,
    label: result
  }));

  const scoringData = [
    { name: 'Points For', value: teamStats.avgPointsFor, color: '#52c41a' },
    { name: 'Points Against', value: teamStats.avgPointsAgainst, color: '#f5222d' }
  ];

  return (
    <Card 
      title="Team Stats" 
      className={`${style.panel} ${isFocused ? style.focusedPanel : ''}`} 
      variant="outlined"
      extra={
        onToggleFocus && (
          <FullscreenOutlined 
            onClick={handlePanelClick}
            style={{ cursor: 'pointer', color: '#1890ff' }}
          />
        )
      }
    >
      {/* Key Statistics */}
      <Row gutter={16}>
        <Col span={8}>
          <Statistic
            title="Record"
            value={`${teamStats.wins}-${teamStats.losses}`}
            prefix={<TrophyOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Win %"
            value={teamStats.winPercentage.toFixed(1)}
            suffix="%"
            prefix={<FireOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Games"
            value={teamStats.gamesPlayed}
            valueStyle={{ color: '#b8c5d3' }}
          />
        </Col>
      </Row>

      <Divider style={{ margin: '16px 0' }} />

      {/* Scoring Averages */}
      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title="Avg Points For"
            value={teamStats.avgPointsFor}
            prefix={<RiseOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Avg Points Against"
            value={teamStats.avgPointsAgainst}
            prefix={<FallOutlined />}
            valueStyle={{ color: '#f5222d' }}
          />
        </Col>
      </Row>

      <Divider style={{ margin: '16px 0' }} />

      {/* Last 5 Games Chart */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ color: '#ffffff', marginBottom: 8 }}>Last 5 Games</h4>
        <ResponsiveContainer width="100%" height={isFocused ? 120 : 80}>
          <BarChart data={lastFiveGamesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a4a6b" />
            <XAxis 
              dataKey="game" 
              stroke="#b8c5d3"
              tick={{ fill: '#b8c5d3', fontSize: 12 }}
            />
            <YAxis 
              stroke="#b8c5d3"
              tick={{ fill: '#b8c5d3', fontSize: 12 }}
              domain={[0, 1]}
              ticks={[0, 1]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#17375c',
                border: '1px solid #2a4a6b',
                color: '#ffffff'
              }}
              labelStyle={{ color: '#b8c5d3' }}
              formatter={(value: any, name: any, props: any) => [
                props.payload.label === 'W' ? 'Win' : 'Loss',
                'Result'
              ]}
            />
            <Bar 
              dataKey="result" 
              fill={(entry: any) => entry.result === 1 ? '#52c41a' : '#f5222d'}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Scoring Comparison Chart */}
      <div>
        <h4 style={{ color: '#ffffff', marginBottom: 8 }}>Scoring Comparison</h4>
        <ResponsiveContainer width="100%" height={isFocused ? 120 : 80}>
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
            <Bar 
              dataKey="value" 
              fill={(entry: any) => entry.color}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default TeamStatsPanel; 