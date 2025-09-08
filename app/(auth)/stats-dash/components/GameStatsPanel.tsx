'use client'
import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Spin, Alert, Statistic, Row, Col } from 'antd';
import { 
  TrophyOutlined, 
  FireOutlined, 
  RiseOutlined, 
  FallOutlined,
  FullscreenOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import style from '../style.module.scss';
import { statsService } from '../services/statsService';

interface GameStatsPanelProps {
  isFocused?: boolean;
  onToggleFocus?: () => void;
}

const GameStatsPanel: React.FC<GameStatsPanelProps> = ({ isFocused = false, onToggleFocus }) => {
  const [gameStats, setGameStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const games = await statsService.fetchGameStats();
        setGameStats(games);
      } catch (err) {
        setError('Failed to load game data');
        console.error('Game stats error:', err);
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
          description={error}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  // Prepare data for charts
  const scoringTrendData = gameStats.slice(-6).map((game, index) => ({
    key: game.id || `game-${index}`,
    game: index + 1,
    points: game.finalScoreUs || 0,
    pointsAllowed: game.finalScoreThem || 0,
    opponent: game.opponent || 'Unknown'
  }));

  // Prepare table data
  const tableData = gameStats.slice(-5).map(game => ({
    key: game.id,
    date: new Date(game.date).toLocaleDateString(),
    opponent: game.opponent || 'Unknown',
    result: game.result === 'W' ? 'W' : 'L',
    score: `${game.finalScoreUs || 0}-${game.finalScoreThem || 0}`,
    margin: (game.finalScoreUs || 0) - (game.finalScoreThem || 0),
    fgPercentage: game.fieldGoalPercentage ? (game.fieldGoalPercentage * 100).toFixed(1) : 'N/A',
    threePercentage: game.threePointPercentage ? (game.threePointPercentage * 100).toFixed(1) : 'N/A'
  }));

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => <span style={{ color: '#ffffff' }}>{text}</span>
    },
    {
      title: 'Opponent',
      dataIndex: 'opponent',
      key: 'opponent',
      render: (text: string) => <span style={{ color: '#ffffff' }}>{text}</span>
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => (
        <Tag color={result === 'W' ? 'green' : 'red'}>
          {result}
        </Tag>
      )
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      render: (text: string) => <span style={{ color: '#ffffff' }}>{text}</span>
    },
    {
      title: 'Margin',
      dataIndex: 'margin',
      key: 'margin',
      render: (margin: number) => (
        <span style={{ color: margin > 0 ? '#52c41a' : '#f5222d' }}>
          {margin > 0 ? '+' : ''}{margin}
        </span>
      )
    },
    {
      title: 'FG%',
      dataIndex: 'fgPercentage',
      key: 'fgPercentage',
      render: (text: string) => <span style={{ color: '#b8c5d3' }}>{text}</span>
    },
    {
      title: '3P%',
      dataIndex: 'threePercentage',
      key: 'threePercentage',
      render: (text: string) => <span style={{ color: '#b8c5d3' }}>{text}</span>
    }
  ];

  // Calculate summary statistics
  const totalGames = gameStats.length;
  const wins = gameStats.filter(g => g.result === 'W').length;
  const losses = totalGames - wins;
  const avgPointsFor = totalGames > 0 ? gameStats.reduce((sum, g) => sum + (g.finalScoreUs || 0), 0) / totalGames : 0;
  const avgPointsAgainst = totalGames > 0 ? gameStats.reduce((sum, g) => sum + (g.finalScoreThem || 0), 0) / totalGames : 0;

  return (
    <Card 
      title="Game Stats" 
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
      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic
            title="Games"
            value={totalGames}
            valueStyle={{ color: '#b8c5d3' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Wins"
            value={wins}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Losses"
            value={losses}
            valueStyle={{ color: '#f5222d' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Win %"
            value={totalGames > 0 ? (wins / totalGames * 100).toFixed(1) : 0}
            suffix="%"
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Statistic
            title="Avg Points For"
            value={avgPointsFor.toFixed(1)}
            prefix={<RiseOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Avg Points Against"
            value={avgPointsAgainst.toFixed(1)}
            prefix={<FallOutlined />}
            valueStyle={{ color: '#f5222d' }}
          />
        </Col>
      </Row>

      {/* Scoring Trends Chart */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ color: '#ffffff', marginBottom: 8 }}>Scoring Trends (Last 6 Games)</h4>
        {scoringTrendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={isFocused ? 150 : 100}>
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
          <div style={{ textAlign: 'center', color: '#b8c5d3', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No scoring trend data available
          </div>
        )}
      </div>

      {/* Recent Games Table */}
      <div>
        <h4 style={{ color: '#ffffff', marginBottom: 8 }}>Recent Games</h4>
        <Table
          dataSource={tableData}
          columns={columns}
          pagination={false}
          size="small"
          className={style.gameTable}
          rowClassName={() => style.tableRow}
        />
      </div>
    </Card>
  );
};

export default GameStatsPanel; 