'use client'
import React, { useState, useEffect } from 'react';
import { Card, Spin, Alert, Statistic, Row, Col, Divider } from 'antd';
import { 
  UserOutlined, 
  TrophyOutlined, 
  FireOutlined, 
  RiseOutlined,
  FullscreenOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import style from '../style.module.scss';
import { statsService } from '../services/statsService';

interface PlayerComparisonPanelProps {
  isFocused?: boolean;
  onToggleFocus?: () => void;
}

const PlayerComparisonPanel: React.FC<PlayerComparisonPanelProps> = ({ isFocused = false, onToggleFocus }) => {
  const [playerStats, setPlayerStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const players = await statsService.fetchPlayerStats();
        setPlayerStats(players);
      } catch (err) {
        setError('Failed to load player data');
        console.error('Player stats error:', err);
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
          description={error}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!playerStats || playerStats.length === 0) {
    return (
      <Card title="Player Comparison" className={style.panel} variant="outlined">
        <div style={{ textAlign: 'center', color: '#b8c5d3', padding: '40px 0' }}>
          No player data available
        </div>
      </Card>
    );
  }

  // Prepare data for charts
  const scoringData = playerStats.slice(0, 6).map(player => ({
    key: player.id,
    name: player.name?.split(' ').pop() || 'Player',
    ppg: player.avgPoints || 0,
    color: '#52c41a'
  }));

  const shootingData = playerStats.slice(0, 6).map(player => ({
    key: player.id,
    name: player.name?.split(' ').pop() || 'Player',
    fg: player.fieldGoalPercentage ? (player.fieldGoalPercentage * 100).toFixed(1) : 0,
    three: player.threePointPercentage ? (player.threePointPercentage * 100).toFixed(1) : 0,
    ft: player.freeThrowPercentage ? (player.freeThrowPercentage * 100).toFixed(1) : 0
  }));

  // Calculate team averages
  const totalPlayers = playerStats.length;
  const avgPPG = totalPlayers > 0 ? playerStats.reduce((sum, p) => sum + (p.avgPoints || 0), 0) / totalPlayers : 0;
  const avgRPG = totalPlayers > 0 ? playerStats.reduce((sum, p) => sum + (p.avgRebounds || 0), 0) / totalPlayers : 0;
  const avgAPG = totalPlayers > 0 ? playerStats.reduce((sum, p) => sum + (p.avgAssists || 0), 0) / totalPlayers : 0;
  const avgSPG = totalPlayers > 0 ? playerStats.reduce((sum, p) => sum + (p.avgSteals || 0), 0) / totalPlayers : 0;
  const avgBPG = totalPlayers > 0 ? playerStats.reduce((sum, p) => sum + (p.avgBlocks || 0), 0) / totalPlayers : 0;

  // Find top performers
  const topScorer = playerStats.reduce((top, current) => 
    (current.avgPoints || 0) > (top.avgPoints || 0) ? current : top, playerStats[0]);
  const topRebounder = playerStats.reduce((top, current) => 
    (current.avgRebounds || 0) > (top.avgRebounds || 0) ? current : top, playerStats[0]);
  const topAssister = playerStats.reduce((top, current) => 
    (current.avgAssists || 0) > (top.avgAssists || 0) ? current : top, playerStats[0]);

  return (
    <Card 
      title="Player Comparison" 
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
      {/* Team Averages */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic
            title="Avg PPG"
            value={avgPPG.toFixed(1)}
            prefix={<FireOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Avg RPG"
            value={avgRPG.toFixed(1)}
            prefix={<TrophyOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Avg APG"
            value={avgAPG.toFixed(1)}
            prefix={<RiseOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Statistic
            title="Avg SPG"
            value={avgSPG.toFixed(1)}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Avg BPG"
            value={avgBPG.toFixed(1)}
            valueStyle={{ color: '#eb2f96' }}
          />
        </Col>
      </Row>

      <Divider style={{ margin: '16px 0' }} />

      {/* Top Performers */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ color: '#ffffff', marginBottom: 8 }}>Top Performers</h4>
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: 8, background: 'rgba(82, 196, 26, 0.1)', borderRadius: 6 }}>
              <div style={{ color: '#52c41a', fontSize: '12px', marginBottom: 4 }}>Top Scorer</div>
              <div style={{ color: '#ffffff', fontWeight: 600 }}>{topScorer?.name || 'N/A'}</div>
              <div style={{ color: '#b8c5d3', fontSize: '12px' }}>{(topScorer?.avgPoints || 0).toFixed(1)} PPG</div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: 8, background: 'rgba(24, 144, 255, 0.1)', borderRadius: 6 }}>
              <div style={{ color: '#1890ff', fontSize: '12px', marginBottom: 4 }}>Top Rebounder</div>
              <div style={{ color: '#ffffff', fontWeight: 600 }}>{topRebounder?.name || 'N/A'}</div>
              <div style={{ color: '#b8c5d3', fontSize: '12px' }}>{(topRebounder?.avgRebounds || 0).toFixed(1)} RPG</div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: 8, background: 'rgba(114, 46, 209, 0.1)', borderRadius: 6 }}>
              <div style={{ color: '#722ed1', fontSize: '12px', marginBottom: 4 }}>Top Assister</div>
              <div style={{ color: '#ffffff', fontWeight: 600 }}>{topAssister?.name || 'N/A'}</div>
              <div style={{ color: '#b8c5d3', fontSize: '12px' }}>{(topAssister?.avgAssists || 0).toFixed(1)} APG</div>
            </div>
          </Col>
        </Row>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* Scoring Comparison Chart */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ color: '#ffffff', marginBottom: 8 }}>Scoring Comparison</h4>
        {scoringData.length > 0 ? (
          <ResponsiveContainer width="100%" height={isFocused ? 150 : 100}>
            <BarChart data={scoringData}>
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
              <Bar 
                dataKey="ppg" 
                radius={[2, 2, 0, 0]}
              >
                {scoringData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', color: '#b8c5d3', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No scoring data available
          </div>
        )}
      </div>

      {/* Shooting Comparison Chart */}
      <div>
        <h4 style={{ color: '#ffffff', marginBottom: 8 }}>Shooting Comparison</h4>
        {shootingData.length > 0 ? (
          <ResponsiveContainer width="100%" height={isFocused ? 150 : 100}>
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
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#17375c',
                  border: '1px solid #2a4a6b',
                  color: '#ffffff'
                }}
                labelStyle={{ color: '#b8c5d3' }}
                formatter={(value: any, name: any) => [`${value}%`, name]}
              />
              <Bar dataKey="fg" fill="#52c41a" name="FG%" radius={[2, 2, 0, 0]} />
              <Bar dataKey="three" fill="#1890ff" name="3P%" radius={[2, 2, 0, 0]} />
              <Bar dataKey="ft" fill="#722ed1" name="FT%" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', color: '#b8c5d3', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No shooting data available
          </div>
        )}
      </div>
    </Card>
  );
};

export default PlayerComparisonPanel; 