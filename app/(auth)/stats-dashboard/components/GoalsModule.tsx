'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Spin, Alert, Tooltip, Badge, Row, Col, Typography, Space, Modal } from 'antd';
import { 
  PlusOutlined, 
  ReloadOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  MinusOutlined,
  BarChartOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  AimOutlined,
  LeftOutlined,
  RightOutlined,
  EditOutlined
} from '@ant-design/icons';
import GoalFormModal from './goals/GoalFormModal';
import GoalDetailModal from './goals/GoalDetailModal';
// COMMENTED OUT: import GoalAlerts from './goals/GoalAlerts';
import style from '../style.module.scss';
import { supabase } from '@/lib/supabase';

const { Title, Text } = Typography;

interface Goal {
  id: number;
  target_value: number;
  comparison_operator: string;
  period_type: string;
  season: string;
  visibility: string;
  notes?: string;
  stat_metrics: {
    id: number;
    name: string;
    category: string;
    description: string;
    unit: string;
    calculation_type: string;
    event_types: string[];
  };
  trends: Array<{
    value: number;
    date: string;
    game: string;
    opponent: string;
  }>;
}

interface Game {
  id: number;
  date: string;
  opponent: string;
  location: 'HOME' | 'AWAY';
  result: 'WIN' | 'LOSS' | 'TIE';
  score: string;
  goalsAchieved: { [goalId: number]: boolean };
}

interface GoalsModuleProps {
  season?: string;
  onRefresh?: () => void;
  selectedGoalId?: number | null;
}

const GoalsModule: React.FC<GoalsModuleProps> = ({ season = '2024-25', onRefresh, selectedGoalId: propSelectedGoalId }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [summary, setSummary] = useState({
    totalGoals: 0,
    onTrack: 0,
    atRisk: 0,
    offTrack: 0
  });

  const fetchGoalsAndGames = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get authentication token for API calls
      const { data: { session } } = await supabase.auth.getSession()
      const authHeaders: HeadersInit = session?.access_token ? {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      }
      
      // Fetch goals
      const goalsResponse = await fetch(`/api/stats/team-goals/dashboard?season=${season}`, {
        headers: authHeaders
      });
      if (!goalsResponse.ok) {
        throw new Error(`Failed to fetch goals: ${goalsResponse.status}`);
      }
      const goalsData = await goalsResponse.json();
      
      // Fetch recent games
      const gamesResponse = await fetch(`/api/stats/games?season=${season}`, {
        headers: authHeaders
      });
      if (!gamesResponse.ok) {
        throw new Error(`Failed to fetch games: ${gamesResponse.status}`);
      }
      const gamesData = await gamesResponse.json();
      
      setGoals(goalsData.goals || []);
      setSummary(goalsData.summary || { totalGoals: 0, onTrack: 0, atRisk: 0, offTrack: 0 });
      
      // Transform games data to include goal achievement status
      const gamesWithGoals = (Array.isArray(gamesData) ? gamesData : []).map((game: any) => ({
        id: game.id,
        date: new Date(game.date || game.startTime || game.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        opponent: game.opponent || 'Unknown',
        location: 'AWAY' as const, // Default to away since we don't have location data
        result: (game.result === 'W' ? 'WIN' : game.result === 'L' ? 'LOSS' : 'TIE') as 'WIN' | 'LOSS' | 'TIE',
        score: game.score || '0-0',
        goalsAchieved: {} // Will be populated by goal progress data
      }));
      
      setGames(gamesWithGoals);
      
    } catch (err) {
      console.error('Error fetching goals and games:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalsAndGames();
  }, [season]);

  // Handle selectedGoalId prop to open detail modal
  useEffect(() => {
    if (propSelectedGoalId && goals.length > 0) {
      const goalExists = goals.find(g => g.id === propSelectedGoalId);
      if (goalExists) {
        setSelectedGoalId(propSelectedGoalId);
        setShowDetailModal(true);
      }
    }
  }, [propSelectedGoalId, goals]);

  const handleCreateGoal = () => {
    setShowCreateModal(true);
  };

  const handleViewDetails = (goalId: number) => {
    setSelectedGoalId(goalId);
    setShowDetailModal(true);
  };

  const handleEditGoal = (goalId: number) => {
    setSelectedGoalId(goalId);
    setShowEditModal(true);
  };

  const handleDeleteGoal = (goalId: number) => {
    setSelectedGoalId(goalId);
    setShowDeleteModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowDetailModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedGoalId(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedGoalId) return;
    
    try {
      // Get authentication token for API calls
      const { data: { session } } = await supabase.auth.getSession()
      const authHeaders: HeadersInit = session?.access_token ? {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      }
      
      const response = await fetch(`/api/stats/team-goals/${selectedGoalId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }
      
      handleModalClose();
      fetchGoalsAndGames();
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      // You could add a message.error here if you want to show error messages
    }
  };

  const handleGoalSaved = () => {
    handleModalClose();
    fetchGoalsAndGames();
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleRefresh = () => {
    fetchGoalsAndGames();
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleHorizontalScroll = (direction: 'left' | 'right') => {
    const gameColumnWidth = 120; // Fixed width for each game column
    const scrollAmount = gameColumnWidth; // Scroll by 1 game at a time
    const maxScroll = Math.max(0, (games.length - 5) * gameColumnWidth);
    
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(maxScroll, scrollPosition + scrollAmount);
    
    setScrollPosition(newPosition);
  };

  const formatGoalDescription = (goal: Goal): string => {
    const { stat_metrics, target_value, comparison_operator } = goal;
    const operator = comparison_operator === 'gte' ? '≥' : comparison_operator === 'lte' ? '≤' : '=';
    return `${stat_metrics.name} ${operator} ${target_value}`;
  };

  const getGoalStatusIcon = (goalId: number, gameId: number): React.ReactNode => {
    // Use real progress data if available, otherwise calculate from game data
    const goal = goals.find(g => g.id === goalId);
    const game = games.find(g => g.id === gameId);
    
    if (goal && game) {
      // For Points goals, check if the team scored enough points
      if (goal.stat_metrics.name.toLowerCase().includes('point')) {
        // Extract team score from game score (assuming format like "68-20" where first is team)
        const scoreParts = game.score.split('-');
        if (scoreParts.length === 2) {
          const teamScore = parseInt(scoreParts[0]);
          const targetValue = goal.target_value;
          const operator = goal.comparison_operator;
          
          let isAchieved = false;
          if (operator === 'gte') {
            isAchieved = teamScore >= targetValue;
          } else if (operator === 'lte') {
            isAchieved = teamScore <= targetValue;
          } else if (operator === 'eq') {
            isAchieved = teamScore === targetValue;
          }
          
          return isAchieved ? (
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
          ) : (
            <CloseCircleOutlined style={{ color: '#f5222d', fontSize: '16px' }} />
          );
        }
      }
      
      // For other metrics, calculate achievement based on game data
      // This would need to be implemented based on specific metric requirements
      return <MinusOutlined style={{ color: '#8a9ba8', fontSize: '16px' }} />;
    }
    
    // Fallback to demo pattern for testing
    const isAchieved = (goalId === 1 && gameId % 3 !== 0) || (goalId === 2 && gameId % 4 === 0);
    return isAchieved ? (
      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
    ) : (
      <CloseCircleOutlined style={{ color: '#f5222d', fontSize: '16px' }} />
    );
  };

  const getGameResultColor = (result: string): string => {
    switch (result) {
      case 'WIN': return '#52c41a';
      case 'LOSS': return '#f5222d';
      case 'TIE': return '#faad14';
      default: return '#1890ff';
    }
  };


  if (loading) {
    return (
      <div className={style.goalsModule}>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#b8c5d3' }}>
            Loading team goals...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={style.goalsModule}>
        <Alert
          message="Error Loading Goals"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#17375c',
        borderRadius: '16px',
        padding: '20px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        minHeight: '280px',
        maxHeight: '500px',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '20px',
        width: '100%',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ color: '#B58842', fontSize: '16px' }}>
            <BarChartOutlined />
          </div>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '16px',
            color: '#fff'
          }}>
            Performance Goals
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            type="primary" 
            size="small"
            icon={<PlusOutlined />}
            onClick={handleCreateGoal}
          >
            Add Goal
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>

        {goals.length > 0 ? (
          <div style={{ 
            overflow: 'hidden',
            width: '100%',
            position: 'relative'
          }}>
            <div 
              className={style.goalsTable} 
              style={{ 
                // maxHeight: '450px', // Maximum height before scrolling
                overflowY: goals.length > 3 ? 'auto' : 'hidden', // Scroll only when > 3 goals
                overflowX: 'hidden', // Hide horizontal scrollbar, use arrows only
                position: 'relative',
                width: `${300 + (games.length * 120)}px`, // Dynamic width: goal column (300px) + all games (games.length * 120px)
                transform: `translateX(-${scrollPosition}px)`,
                transition: 'transform 0.3s ease'
              }}
            >
            {/* Integrated Summary Header */}
            <div className={style.goalsTableHeader} style={{ 
              position: 'sticky', 
              top: 0, 
              zIndex: 1, 
              backgroundColor: '#17375c',
              gridTemplateColumns: `300px repeat(${games.length}, 120px)`
            }}>
              <div className={style.goalColumn}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center', minWidth: '40px' }}>
                    <div style={{ color: '#b8c5d3', fontSize: '15px', marginBottom: '2px' }}>Total</div>
                    <div style={{ color: '#1890ff', fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <AimOutlined style={{ fontSize: '16px' }} />
                      {summary.totalGoals}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: '40px' }}>
                    <div style={{ color: '#b8c5d3', fontSize: '15px', marginBottom: '2px' }}>On Track</div>
                    <div style={{ color: '#52c41a', fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <CheckCircleOutlined style={{ fontSize: '16px' }} />
                      {summary.onTrack}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: '40px' }}>
                    <div style={{ color: '#b8c5d3', fontSize: '15px', marginBottom: '2px' }}>Off Track</div>
                    <div style={{ color: '#f5222d', fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <CloseCircleOutlined style={{ fontSize: '16px' }} />
                      {summary.offTrack}
                    </div>
                  </div>
                </div>
              </div>
              {games.map((game) => (
                <div key={game.id} className={style.gameColumn}>
                  <div className={style.gameDate}>{game.date}</div>
                  <div className={style.gameLocation}>@{game.location === 'HOME' ? 'HOME' : game.opponent}</div>
                  <div 
                    className={style.gameResult}
                    style={{ 
                      color: getGameResultColor(game.result),
                      fontWeight: 700,
                      fontSize: '12px'
                    }}
                  >
                    {game.result.charAt(0)} {game.score}
                  </div>
                </div>
              ))}
            </div>

            {/* Goal Rows - Show all goals, scroll when > 3 */}
            {goals.map((goal) => (
              <div key={goal.id} className={style.goalRow} style={{ 
                gridTemplateColumns: `300px repeat(${games.length}, 120px)`
              }}>
                <div 
                  className={style.goalColumn}
                  style={{ padding: '12px 20px' }}
                >
                  <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', flex: 1 }}>
                      {formatGoalDescription(goal)}
                    </Text>
                    <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                      <Button
                        type="text"
                        size="small"
                        icon={<CalendarOutlined />}
                        onClick={() => handleViewDetails(goal.id)}
                        style={{ color: '#1890ff', padding: '2px 4px' }}
                        title="View Details"
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditGoal(goal.id)}
                        style={{ color: '#52c41a', padding: '2px 4px' }}
                        title="Edit Goal"
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleDeleteGoal(goal.id)}
                        style={{ color: '#f5222d', padding: '2px 4px' }}
                        title="Delete Goal"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <AimOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
                    <Text style={{ 
                      color: '#8a9ba8', 
                      fontSize: '10px',
                      fontWeight: 500
                    }}>
                      Game Goals
                    </Text>
                  </div>
                </div>
                {games.map((game) => (
                  <div key={`${goal.id}-${game.id}`} className={style.gameColumn} style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getGoalStatusIcon(goal.id, game.id)}
                  </div>
                ))}
              </div>
            ))}
            
            {/* Show message if there are more than 3 goals */}
            {goals.length > 3 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '8px 12px', 
                color: '#8a9ba8', 
                fontSize: '11px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                fontStyle: 'italic'
              }}>
                +{goals.length - 3} more goals
              </div>
            )}
          </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <AimOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
            <div>
              <Text style={{ fontSize: '16px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                No Goals Set Yet
              </Text>
              <Text style={{ color: '#666', fontSize: '14px', display: 'block', marginBottom: '16px' }}>
                Create your first performance goal to start tracking team progress
              </Text>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleCreateGoal}
              >
                Create Your First Goal
              </Button>
            </div>
          </div>
        )}
        
        {/* Horizontal Scroll Arrows */}
        {goals.length > 0 && games.length > 5 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '8px', 
            marginTop: '8px',
            padding: '0 16px'
          }}>
            <Button
              size="small"
              icon={<ArrowUpOutlined style={{ transform: 'rotate(-90deg)' }} />}
              onClick={() => handleHorizontalScroll('left')}
              disabled={scrollPosition <= 0}
              style={{
                background: 'rgba(24, 144, 255, 0.1)',
                border: '1px solid rgba(24, 144, 255, 0.3)',
                color: '#1890ff'
              }}
            />
            <span style={{ 
              color: '#8a9ba8', 
              fontSize: '11px', 
              alignSelf: 'center',
              padding: '0 8px'
            }}>
              {Math.floor(scrollPosition / 120) + 1}-{Math.min(Math.floor(scrollPosition / 120) + 5, games.length)} of {games.length}
            </span>
            <Button
              size="small"
              icon={<ArrowUpOutlined style={{ transform: 'rotate(90deg)' }} />}
              onClick={() => handleHorizontalScroll('right')}
              disabled={(() => {
                const maxScroll = Math.max(0, (games.length - 5) * 120);
                return scrollPosition >= maxScroll;
              })()}
              style={{
                background: 'rgba(24, 144, 255, 0.1)',
                border: '1px solid rgba(24, 144, 255, 0.3)',
                color: '#1890ff'
              }}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <GoalFormModal
        open={showCreateModal}
        onClose={handleModalClose}
        onSave={handleGoalSaved}
        season={season}
      />

      <GoalFormModal
        open={showEditModal}
        onClose={handleModalClose}
        onSave={handleGoalSaved}
        season={season}
        goalId={selectedGoalId}
        mode="edit"
      />

      <GoalDetailModal
        open={showDetailModal}
        onClose={handleModalClose}
        goalId={selectedGoalId}
        onEdit={handleEditGoal}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Goal"
        open={showDeleteModal}
        onCancel={handleModalClose}
        onOk={handleConfirmDelete}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this goal? This action cannot be undone.</p>
        <p style={{ color: '#666', fontSize: '14px' }}>
          All progress data associated with this goal will also be deleted.
        </p>
      </Modal>
    </div>
  );
};

export default GoalsModule;
