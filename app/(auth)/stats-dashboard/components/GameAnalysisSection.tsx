'use client'
import React, { useState, useEffect } from 'react';
import { Card, Timeline, Spin, Alert, Statistic, Row, Col, Divider } from 'antd';
import { 
  TrophyOutlined, 
  FireOutlined, 
  RiseOutlined, 
  FallOutlined,
  FullscreenOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import style from '../style.module.scss';
import { statsService } from '../services/statsService';

interface GameAnalysisSectionProps {
  isFocused?: boolean;
  onToggleFocus?: () => void;
}

const GameAnalysisSection: React.FC<GameAnalysisSectionProps> = ({ isFocused = false, onToggleFocus }) => {
  const [gameStats, setGameStats] = useState<any[]>([]);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const games = await statsService.fetchGameStats();
        setGameStats(games);
        if (games.length > 0) {
          setSelectedGame(games[games.length - 1]); // Select most recent game
        }
      } catch (err) {
        setError('Failed to load game analysis data');
        console.error('Game analysis error:', err);
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
      <Card title="Game Analysis" className={style.panel} variant="outlined">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#b8c5d3' }}>Loading game analysis...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Game Analysis" className={style.panel} variant="outlined">
        <Alert
          message="Error Loading Data"
          description={error}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!selectedGame) {
    return (
      <Card title="Game Analysis" className={style.panel} variant="outlined">
        <div style={{ textAlign: 'center', color: '#b8c5d3', padding: '40px 0' }}>
          No game data available for analysis
        </div>
      </Card>
    );
  }

  // Prepare data for charts
  const gameFlowData = gameStats.slice(-8).map((game, index) => ({
    key: `flow-${index}`,
    game: index + 1,
    points: game.finalScoreUs || 0,
    pointsAllowed: game.finalScoreThem || 0,
    margin: (game.finalScoreUs || 0) - (game.finalScoreThem || 0)
  }));

  const quarterData = [
    { key: 'q1', quarter: 'Q1', points: selectedGame.q1ScoreUs || 0, pointsAllowed: selectedGame.q1ScoreThem || 0 },
    { key: 'q2', quarter: 'Q2', points: selectedGame.q2ScoreUs || 0, pointsAllowed: selectedGame.q2ScoreThem || 0 },
    { key: 'q3', quarter: 'Q3', points: selectedGame.q3ScoreUs || 0, pointsAllowed: selectedGame.q3ScoreThem || 0 },
    { key: 'q4', quarter: 'Q4', points: selectedGame.q4ScoreUs || 0, pointsAllowed: selectedGame.q4ScoreThem || 0 }
  ];

  // Calculate game analysis metrics
  const totalPoints = selectedGame.finalScoreUs || 0;
  const totalPointsAllowed = selectedGame.finalScoreThem || 0;
  const margin = totalPoints - totalPointsAllowed;
  const result = selectedGame.result === 'W' ? 'Win' : 'Loss';
  const resultColor = result === 'Win' ? '#52c41a' : '#f5222d';

  // Generate key moments based on game data
  const keyMoments = [
    {
      key: 'moment-1',
      time: 'Q1 Start',
      event: 'Game begins',
      impact: 'neutral'
    },
    {
      key: 'moment-2',
      time: 'Q2',
      event: `${selectedGame.q2ScoreUs || 0}-${selectedGame.q2ScoreThem || 0}`,
      impact: 'positive'
    },
    {
      key: 'moment-3',
      time: 'Q3',
      event: `${selectedGame.q3ScoreUs || 0}-${selectedGame.q3ScoreThem || 0}`,
      impact: 'positive'
    },
    {
      key: 'moment-4',
      time: 'Q4 End',
      event: `Final: ${totalPoints}-${totalPointsAllowed}`,
      impact: result === 'Win' ? 'positive' : 'negative'
    }
  ];

  return (
    <Card 
      title="Game Analysis" 
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
      {/* Game Summary */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ color: '#ffffff', marginBottom: 8 }}>Game Summary</h4>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Result"
              value={result}
              valueStyle={{ color: resultColor, fontSize: '18px' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Final Score"
              value={`${totalPoints}-${totalPointsAllowed}`}
              valueStyle={{ color: '#ffffff' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Margin"
              value={margin > 0 ? `+${margin}` : margin.toString()}
              valueStyle={{ color: margin > 0 ? '#52c41a' : '#f5222d' }}
            />
          </Col>
        </Row>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* Quarter Breakdown */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ color: '#ffffff', marginBottom: 8 }}>Quarter Breakdown</h4>
        {quarterData.some(q => q.points > 0 || q.pointsAllowed > 0) ? (
          <ResponsiveContainer width="100%" height={isFocused ? 150 : 100}>
            <BarChart data={quarterData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a4a6b" />
              <XAxis 
                dataKey="quarter" 
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
              <Bar dataKey="points" fill="#52c41a" name="Points For" radius={[2, 2, 0, 0]} />
              <Bar dataKey="pointsAllowed" fill="#f5222d" name="Points Against" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', color: '#b8c5d3', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No quarter data available
          </div>
        )}
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* Game Flow Analysis */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ color: '#ffffff', marginBottom: 8 }}>Game Flow Analysis</h4>
        {gameFlowData.length > 0 ? (
          <ResponsiveContainer width="100%" height={isFocused ? 150 : 100}>
            <LineChart data={gameFlowData}>
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
            No game flow data available
          </div>
        )}
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* Key Moments Timeline */}
      <div>
        <h4 style={{ color: '#ffffff', marginBottom: 8 }}>Key Moments</h4>
        <Timeline
          items={keyMoments.map(moment => ({
            key: moment.key,
            children: (
              <div>
                <div style={{ color: '#ffffff', fontWeight: 600 }}>{moment.time}</div>
                <div style={{ color: '#b8c5d3' }}>{moment.event}</div>
              </div>
            ),
            color: moment.impact === 'positive' ? 'green' : moment.impact === 'negative' ? 'red' : 'blue'
          }))}
        />
      </div>
    </Card>
  );
};

export default GameAnalysisSection; 