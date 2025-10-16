'use client'
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Tag, Spin, Alert, Divider } from 'antd';
import { 
  TrophyOutlined, 
  FireOutlined, 
  RiseOutlined, 
  FallOutlined,
  FullscreenOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import style from '../style.module.scss';
import { statsService } from '../services/statsService';

interface TeamStatsPanelProps {
  isFocused?: boolean;
  onToggleFocus?: () => void;
}

const TeamStatsPanel: React.FC<TeamStatsPanelProps> = ({ isFocused = false, onToggleFocus }) => {
  const [teamStats, setTeamStats] = useState<any>(null);
  const [gameStats, setGameStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [team, games] = await Promise.all([
          statsService.fetchTeamStats(),
          statsService.fetchGameStats()
        ]);
        setTeamStats(team);
        setGameStats(games);
      } catch (err) {
        setError('Failed to load team data');
        console.error('Team stats error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePanelClick = () => {
    if (onToggleFocus) {
      onToggleFocus();
    }
  };

  if (isLoading) {
    return (
      <Card title="Team Stats" className={style.panel} variant="outlined">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#b8c5d3' }}>Loading team statistics...</div>
        </div>
      </Card>
    );
  }

  if (error || !teamStats) {
    return (
      <Card title="Team Stats" className={style.panel} variant="outlined">
        <Alert
          message="Error Loading Data"
          description={error || 'Unable to load team statistics. Please try again.'}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  // Prepare data for charts
  const lastFiveGamesData = teamStats.lastFiveGames?.slice(-5).map((result: string, index: number) => ({
    key: `game-${index}`,
    game: index + 1,
    result: result === 'W' ? 1 : 0,
    label: result
  })) || [];

  const scoringData = [
    { key: 'points-for', name: 'Points For', value: teamStats.avgPointsFor || 0, color: '#52c41a' },
    { key: 'points-against', name: 'Points Against', value: teamStats.avgPointsAgainst || 0, color: '#f5222d' }
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
            value={`${teamStats.wins || 0}-${teamStats.losses || 0}`}
            prefix={<TrophyOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Win %"
            value={(teamStats.winPercentage || 0).toFixed(1)}
            suffix="%"
            prefix={<FireOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Games"
            value={teamStats.gamesPlayed || 0}
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
            value={(teamStats.avgPointsFor || 0).toFixed(1)}
            prefix={<RiseOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Avg Points Against"
            value={(teamStats.avgPointsAgainst || 0).toFixed(1)}
            prefix={<FallOutlined />}
            valueStyle={{ color: '#f5222d' }}
          />
        </Col>
      </Row>

      <Divider style={{ margin: '16px 0' }} />

      {/* Last 5 Games Chart */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ color: '#ffffff', marginBottom: 8 }}>Recent Performance</h4>
        {lastFiveGamesData.length > 0 ? (
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
                radius={[2, 2, 0, 0]}
              >
                {lastFiveGamesData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.result === 1 ? '#52c41a' : '#f5222d'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', color: '#b8c5d3', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No recent games data
          </div>
        )}
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
              radius={[2, 2, 0, 0]}
            >
              {scoringData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default TeamStatsPanel; 