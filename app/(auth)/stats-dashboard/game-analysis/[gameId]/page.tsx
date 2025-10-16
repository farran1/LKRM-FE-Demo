'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Statistic, Table, Tag, Button, Spin, Alert, Tabs, Card, Row, Col, Divider, Tooltip, Input, Select, Modal, App } from 'antd';
import { 
  ArrowLeftOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TrophyOutlined,
  UserOutlined,
  TeamOutlined,
  BarChartOutlined,
  PlayCircleOutlined,
  StarOutlined,
  SwapOutlined,
  CalendarOutlined,
  AimOutlined,
  InboxOutlined,
  ThunderboltOutlined,
  StopOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import TeamComparisonTable, { ComparisonStats } from '../components/TeamComparisonTable';
import PlayerLink from '@/components/PlayerLink';
import EventEditor from '../components/EventEditor';
// import BoxScoreEditor from '../components/BoxScoreEditor';

export default function GameAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const { message } = App.useApp();
  
  const [gameAnalysisData, setGameAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterQuarter, setFilterQuarter] = useState<number | 'all'>('all');
  const [filterSide, setFilterSide] = useState<'all' | 'team' | 'opponent'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [isEventEditorOpen, setIsEventEditorOpen] = useState(false);
  // const [isBoxScoreEditorOpen, setIsBoxScoreEditorOpen] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [deletingEvent, setDeletingEvent] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (gameId) {
      fetchGameAnalysis();
    }
  }, [gameId]);

  // Debug quarter breakdown data
  useEffect(() => {
    if (gameAnalysisData?.quarterBreakdown) {
      console.log('Quarter Breakdown Data:', gameAnalysisData.quarterBreakdown);
      console.log('Consistency Score:', gameAnalysisData.quarterBreakdown.analysis?.consistency);
      console.log('Strongest Quarter:', gameAnalysisData.quarterBreakdown.analysis?.strongestQuarter);
      console.log('Weakest Quarter:', gameAnalysisData.quarterBreakdown.analysis?.weakestQuarter);
    }
  }, [gameAnalysisData]);

  const fetchGameAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎯 Fetching game analysis for gameId:', gameId);
      const response = await fetch(`/api/stats/game-analysis/${gameId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch game analysis: ${response.status}`);
      }
      
      const gameData = await response.json();
      console.log('🎯 Game analysis data received:', gameData);
      
      if (gameData.error) {
        throw new Error(gameData.error);
      }
      
      setGameAnalysisData(gameData);
      
      // Fetch players for the event editor
      const playersResponse = await fetch('/api/players');
      if (playersResponse.ok) {
        const playersData = await playersResponse.json();
        // Check if data is wrapped or direct
        const playersArray = playersData.data || playersData;
        setPlayers(playersArray || []);
      }
    } catch (error) {
      console.error('Failed to load game analysis:', error);
      setError(error instanceof Error ? error.message : 'Failed to load game analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setIsEventEditorOpen(true);
  };

  const handleAddEvent = () => {
    setEditingEvent({
      session_id: gameAnalysisData?.gameId,
      player_id: null,
      event_type: '',
      event_value: 0,
      quarter: 1,
      is_opponent_event: false,
      opponent_jersey: null,
      metadata: {}
    });
    setIsEventEditorOpen(true);
  };

  const handleEventSave = (updatedEvent: any) => {
    // Refresh the game analysis data
    fetchGameAnalysis();
    setIsEventEditorOpen(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (event: any) => {
    setDeletingEvent(event);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;
    
    try {
      // Get the current session for authentication
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`/api/live-game-events/${deletingEvent.id}`, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete event: ${response.status}`);
      }
      
      message.success('Event deleted successfully');
      
      // Close modal immediately
      setIsDeleteModalOpen(false);
      setDeletingEvent(null);
      
      // Force refresh the page to get updated event data with proper IDs
      window.location.reload();
    } catch (error) {
      console.error('Error deleting event:', error);
      message.error('Failed to delete event');
      // Close modal even on error
      setIsDeleteModalOpen(false);
      setDeletingEvent(null);
    }
  };

  const handleEventDelete = (eventId: string) => {
    // Refresh the game analysis data after deletion
    fetchGameAnalysis();
    setIsEventEditorOpen(false);
    setEditingEvent(null);
  };

  // const handleBoxScoreEdit = () => {
  //   console.log('Game analysis data:', gameAnalysisData);
  //   console.log('Actual game ID:', gameAnalysisData?.actualGameId);
  //   console.log('Session ID (gameId):', gameId);
  //   setIsBoxScoreEditorOpen(true);
  // };

  // const handleBoxScoreSave = (updatedGame: any) => {
  //   // Refresh the game analysis data
  //   fetchGameAnalysis();
  //   setIsBoxScoreEditorOpen(false);
  // };

  if (loading) {
    return (
      <main style={{ padding: '0 24px 24px 0', minHeight: '100vh', background: '#202c3e' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spin size="large" />
        </div>
      </main>
    );
  }

  if (error || !gameAnalysisData) {
    return (
      <main style={{ padding: '0 24px 24px 0', minHeight: '100vh', background: '#202c3e' }}>
        <Alert
          message="Error Loading Game Analysis"
          description={error || 'No game data available'}
          type="error"
          showIcon
          action={
            <Button danger onClick={fetchGameAnalysis}>
              Retry
            </Button>
          }
        />
      </main>
    );
  }

  // Extract data from the API response
  const gameInfo = {
    opponent: gameAnalysisData.opponent,
    date: gameAnalysisData.date,
    result: gameAnalysisData.result,
    score: gameAnalysisData.score,
    margin: gameAnalysisData.margin
  };
  
  const teamStats = gameAnalysisData.teamTotals;
  const playerStats = gameAnalysisData.playerStats;
  const quarterBreakdown = gameAnalysisData.quarterBreakdown;
  const events = gameAnalysisData.events;
  
  // Calculate standout players from playerStats
  type PS = { id: number; name?: string; points?: number; rebounds?: number; assists?: number; steals?: number; threeMade?: number; ftMade?: number };
  const reduceSafe = <T extends PS>(list: T[] | undefined, fn: (max: T, player: T) => T, init: T): T => {
    return (list && list.length > 0) ? list.reduce(fn) : init
  }
  const standoutInfo = {
    topScorer: reduceSafe(
      (playerStats as PS[] | undefined)?.filter(p => (p.points || 0) > 0), 
      (max, player) => ((player.points || 0) > (max.points || 0) ? player : max), 
      { points: 0, name: 'N/A', id: -1 }
    ),
    topRebounder: reduceSafe(
      (playerStats as PS[] | undefined)?.filter(p => (p.rebounds || 0) > 0), 
      (max, player) => ((player.rebounds || 0) > (max.rebounds || 0) ? player : max), 
      { rebounds: 0, name: 'N/A', id: -1 }
    ),
    topAssister: reduceSafe(
      (playerStats as PS[] | undefined)?.filter(p => (p.assists || 0) > 0), 
      (max, player) => ((player.assists || 0) > (max.assists || 0) ? player : max), 
      { assists: 0, name: 'N/A', id: -1 }
    ),
    mostSteals: reduceSafe(
      (playerStats as PS[] | undefined)?.filter(p => (p.steals || 0) > 0), 
      (max, player) => ((player.steals || 0) > (max.steals || 0) ? player : max), 
      { steals: 0, name: 'N/A', id: -1 }
    ),
    highestFgPoints: reduceSafe(
      (playerStats as PS[] | undefined)?.filter(p => (p.points || 0) > 0), 
      (max, player) => ((player.points || 0) > (max.points || 0) ? player : max), 
      { points: 0, name: 'N/A', id: -1 }
    ),
    highest3ptPoints: reduceSafe(
      (playerStats as PS[] | undefined)?.filter(p => (p.threeMade || 0) > 0), 
      (max, player) => (((player.threeMade || 0) * 3) > ((max.threeMade || 0) * 3) ? player : max), 
      { threeMade: 0, name: 'N/A', id: -1 }
    ),
    highestFtPoints: reduceSafe(
      (playerStats as PS[] | undefined)?.filter(p => (p.ftMade || 0) > 0), 
      (max, player) => ((player.ftMade || 0) > (max.ftMade || 0) ? player : max), 
      { ftMade: 0, name: 'N/A', id: -1 }
    )
  };
  
  // Create play-by-play from events (use realtime timestamp)
  const getPointsForEvent = (type: string, value: any): number => {
    const t = String(type || '').toLowerCase()
    switch (t) {
      case 'three_made':
        return 3
      case 'fg_made':
        return 2
      case 'ft_made':
        return 1
      case 'points':
        return Number.isFinite(value) ? Number(value) : 0
      default:
        return 0
    }
  }

  const playByPlay = events?.map((event: any, index: number) => {
    const when = event.created_at ? new Date(event.created_at) : null
    const timeStr = when ? when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : 'N/A'
    const playerObj = event.player_id ? (playerStats?.find((p: any) => p.id === event.player_id) || null) : null
    const playerName = playerObj?.name || 'N/A'
    const isOpponent = !!event.is_opponent_event
    const points = getPointsForEvent(event.event_type, event.event_value)
    const score = points > 0 ? `+${points}` : ''
    return {
      id: event.id, // Use the actual database ID instead of index + 1
      displayId: index + 1, // Keep the display ID for UI purposes
      time: timeStr,
      timestamp: when ? when.getTime() : 0,
      quarter: event.quarter,
      type: String(event.event_type || ''),
      isOpponent,
      opponentJersey: event.opponent_jersey || null,
      description: `${isOpponent ? 'Opponent' : 'Team'} ${String(event.event_type || '').replace('_', ' ')}`,
      player: playerName,
      playerId: playerObj?.id ?? null,
      points,
      score
    }
  }) || [];

  // Compute running score context (Team-Opponent) per event
  const playByPlayWithScore = (() => {
    let team = 0
    let opponent = 0
    
    // Sort events chronologically by timestamp before calculating running score
    const sortedPlayByPlay = [...(playByPlay || [])].sort((a, b) => a.timestamp - b.timestamp)
    
    return sortedPlayByPlay.map((p: any) => {
      const pts = Number(p.points || 0)
      if (pts > 0) {
        if (p.isOpponent) {
          opponent += pts
        } else {
          team += pts
        }
      }
      return { ...p, runningScore: `(${team}-${opponent})` }
    })
  })()

  const availableQuarters = Array.from(new Set((events || []).map((e: any) => e.quarter).filter((q: any) => q != null))).sort();
  const availableTypes = Array.from(new Set((events || []).map((e: any) => String(e.event_type || '')).filter((t: string) => t))).sort();

  const filteredPlayByPlay = (playByPlayWithScore || []).filter((p: any) => {
    if (filterQuarter !== 'all' && p.quarter !== filterQuarter) return false;
    if (filterSide !== 'all') {
      const isOpp = filterSide === 'opponent';
      if (Boolean(p.isOpponent) !== isOpp) return false;
    }
    if (filterType !== 'all' && p.type !== filterType) return false;
    if (searchText) {
      const hay = `${p.description || ''} ${p.player || ''}`.toLowerCase();
      if (!hay.includes(searchText.toLowerCase())) return false;
    }
    return true;
  }).sort((a: any, b: any) => sortOrder === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp);

  const formatPlayDescription = (p: any): { actorNode: React.ReactNode; text: string } => {
    const t = String(p.type || '').toLowerCase()
    const actorText = p.player && p.player !== 'N/A'
      ? p.player
      : (p.isOpponent ? (p.opponentJersey ? `#${p.opponentJersey}` : 'Opponent') : 'Team')
    const actorNode = p.player && p.player !== 'N/A' && p.playerId
      ? <PlayerLink id={p.playerId} name={p.player} />
      : <span>{actorText}</span>
    const text = (() => {
      switch (t) {
        case 'three_made': return 'made a 3-pointer'
        case 'fg_made': return 'made a 2-pointer'
        case 'ft_made': return 'made a free throw'
        case 'three_missed': return 'missed a 3-pointer'
        case 'fg_missed': return 'missed a 2-pointer'
        case 'ft_missed': return 'missed a free throw'
        case 'assist': return 'recorded an assist'
        case 'rebound': return 'grabbed a rebound'
        case 'steal': return 'made a steal'
        case 'block': return 'made a block'
        case 'turnover': return 'committed a turnover'
        case 'foul': return 'committed a foul'
        case 'substitution': return 'substitution'
        default: return String(p.type || '').replace('_', ' ')
      }
    })()
    return { actorNode, text }
  }
  
  // Create lineup comparison (starters vs bench)
  const lineupComparison = {
    starters: (playerStats as any[] | undefined)?.filter((p: any) => (p.points || 0) > 0).slice(0, 5) || [],
    bench: (playerStats as any[] | undefined)?.filter((p: any) => (p.points || 0) > 0).slice(5) || []
  };

  return (
    <main style={{ padding: '0 24px 24px 0', minHeight: '100vh', background: '#202c3e' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '2px 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push('/stats-dashboard')}
            style={{ 
              background: 'rgba(255,255,255,0.1)', 
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff'
            }}
          >
            Back to Dashboard
          </Button>
          <div>
            <h1 style={{ color: '#fff', margin: 0, fontSize: '28px', fontWeight: '600' }}>
              Game Analysis
            </h1>
            <p style={{ color: '#b0b0b0', margin: '4px 0 0 0', fontSize: '14px' }}>
              vs {gameInfo?.opponent || 'Unknown'} • {gameInfo?.date ? new Date(gameInfo.date).toLocaleDateString() : 'Unknown Date'}
            </p>
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1890ff', marginBottom: '4px' }}>
            {gameInfo?.score || '0-0'}
          </div>
          <Tag 
            color={gameInfo?.result === 'W' ? 'success' : gameInfo?.result === 'L' ? 'error' : 'warning'} 
            style={{ 
              fontSize: '16px', 
              padding: '4px 12px',
              border: 'none'
            }}
          >
            {gameInfo?.result === 'W' ? 'WIN' : gameInfo?.result === 'L' ? 'LOSS' : 'TIE'}
          </Tag>
        </div>
      </div>

      {/* Top 3 Shooting Percentage Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col span={8}>
          <Card style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: '#b0b0b0', fontSize: 16 }}>Field Goals</span>
              <span style={{ color: '#52c41a', fontSize: 16,fontWeight: 700 }}>{teamStats?.fgPct || 0}%</span>
            </div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              {(teamStats?.fgMade || 0)}/{(teamStats?.fgAttempted || 0)}
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${teamStats?.fgPct || 0}%`, height: '100%', background: '#52c41a' }} />
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: '#b0b0b0', fontSize: 16 }}>Three Pointers</span>
              <span style={{ color: '#1890ff', fontSize: 16,fontWeight: 700 }}>{teamStats?.threePct || 0}%</span>
            </div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              {(teamStats?.threeMade || 0)}/{(teamStats?.threeAttempted || 0)}
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${teamStats?.threePct || 0}%`, height: '100%', background: '#1890ff' }} />
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: '#b0b0b0', fontSize: 16 }}>Free Throws</span>
              <span style={{ color: '#faad14', fontSize: 16, fontWeight: 700 }}>{teamStats?.ftPct || 0}%</span>
            </div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              {(teamStats?.ftMade || 0)}/{(teamStats?.ftAttempted || 0)}
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${teamStats?.ftPct || 0}%`, height: '100%', background: '#faad14' }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 5 Smaller Stats Blocks Below */}
      <Row gutter={[12, 8]} style={{ marginBottom: '24px' }}>
        <Col span={5}>
          <Card style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 500 }}>Rebounds</span>
              <TeamOutlined style={{ color: '#B58842', fontSize: 16 }} />
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700 }}>
              {teamStats?.rebounds || 0}
            </div>
          </Card>
        </Col>
        <Col span={5}>
          <Card style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 500 }}>Assists</span>
              <UserOutlined style={{ color: '#B58842', fontSize: 16 }} />
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700 }}>
              {teamStats?.assists || 0}
            </div>
          </Card>
        </Col>
        <Col span={5}>
          <Card style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 500 }}>Turnovers</span>
              <SwapOutlined style={{ color: '#B58842', fontSize: 16 }} />
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700 }}>
              {teamStats?.turnovers || 0}
            </div>
          </Card>
        </Col>
        <Col span={5}>
          <Card style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 500 }}>Steals</span>
              <TeamOutlined style={{ color: '#B58842', fontSize: 16 }} />
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700 }}>
              {teamStats?.steals || 0}
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 500 }}>Blocks</span>
              <TeamOutlined style={{ color: '#B58842', fontSize: 16 }} />
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700 }}>
              {teamStats?.blocks || 0}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card style={{ 
        background: 'rgba(255,255,255,0.05)', 
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px'
      }}>
        <Tabs
          defaultActiveKey="team-stats"
          items={[
            {
              key: 'team-stats',
              label: (
                <span style={{ color: '#fff' }}>
                  <TeamOutlined style={{ marginRight: '8px' }} />
                  Team Stats
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <Row gutter={[16, 16]}>
                    {/* Shooting Breakdown temporarily disabled to reduce duplication with header tiles. */}
                    {/* <Col span={12}>
                      <Card title="Shooting Breakdown" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        ...
                      </Card>
                    </Col> */}
                    
                  </Row>

                  {gameAnalysisData?.opponentStats ? (
                    <div style={{ marginTop: 16 }}>
                      <TeamComparisonTable 
                        teamStats={{
                          fgMade: teamStats?.fgMade,
                          fgAttempted: teamStats?.fgAttempted,
                          fgPercentage: teamStats?.fgPct,
                          twoPointMade: (teamStats?.fgMade || 0) - (teamStats?.threeMade || 0),
                          twoPointAttempted: (teamStats?.fgAttempted || 0) - (teamStats?.threeAttempted || 0),
                          twoPointPercentage: (() => {
                            const made = (teamStats?.fgMade || 0) - (teamStats?.threeMade || 0);
                            const attempted = (teamStats?.fgAttempted || 0) - (teamStats?.threeAttempted || 0);
                            return attempted > 0 ? Math.round((made / attempted) * 100) : 0;
                          })(),
                          threePointMade: teamStats?.threeMade,
                          threePointAttempted: teamStats?.threeAttempted,
                          threePointPercentage: teamStats?.threePct,
                          ftMade: teamStats?.ftMade,
                          ftAttempted: teamStats?.ftAttempted,
                          ftPercentage: teamStats?.ftPct,
                          totalRebounds: teamStats?.rebounds || 0,
                          totalAssists: teamStats?.assists,
                          totalSteals: teamStats?.steals,
                          totalBlocks: teamStats?.blocks,
                          totalTurnovers: teamStats?.turnovers,
                          totalFouls: teamStats?.fouls,
                          pointsInPaint: teamStats?.pointsInPaint,
                          secondChancePoints: teamStats?.secondChancePoints,
                          pointsOffTurnovers: teamStats?.pointsOffTurnovers,
                          benchPoints: teamStats?.benchPoints,
                        }}
                        opponentStats={{
                          fgMade: gameAnalysisData.opponentStats?.fieldGoals?.made,
                          fgAttempted: gameAnalysisData.opponentStats?.fieldGoals?.attempted,
                          fgPercentage: gameAnalysisData.opponentStats?.fieldGoals?.percentage,
                          twoPointMade: (gameAnalysisData.opponentStats?.fieldGoals?.made || 0) - (gameAnalysisData.opponentStats?.threePointers?.made || 0),
                          twoPointAttempted: (gameAnalysisData.opponentStats?.fieldGoals?.attempted || 0) - (gameAnalysisData.opponentStats?.threePointers?.attempted || 0),
                          twoPointPercentage: (() => {
                            const made = (gameAnalysisData.opponentStats?.fieldGoals?.made || 0) - (gameAnalysisData.opponentStats?.threePointers?.made || 0);
                            const attempted = (gameAnalysisData.opponentStats?.fieldGoals?.attempted || 0) - (gameAnalysisData.opponentStats?.threePointers?.attempted || 0);
                            return attempted > 0 ? Math.round((made / attempted) * 100) : 0;
                          })(),
                          threePointMade: gameAnalysisData.opponentStats?.threePointers?.made,
                          threePointAttempted: gameAnalysisData.opponentStats?.threePointers?.attempted,
                          threePointPercentage: gameAnalysisData.opponentStats?.threePointers?.percentage,
                          ftMade: gameAnalysisData.opponentStats?.freeThrows?.made,
                          ftAttempted: gameAnalysisData.opponentStats?.freeThrows?.attempted,
                          ftPercentage: gameAnalysisData.opponentStats?.freeThrows?.percentage,
                          totalRebounds: (gameAnalysisData.opponentStats?.rebounds?.offensive || 0) + (gameAnalysisData.opponentStats?.rebounds?.defensive || 0),
                          totalAssists: gameAnalysisData.opponentStats?.assists,
                          totalSteals: gameAnalysisData.opponentStats?.steals,
                          totalBlocks: gameAnalysisData.opponentStats?.blocks,
                          totalTurnovers: gameAnalysisData.opponentStats?.turnovers,
                          totalFouls: gameAnalysisData.opponentStats?.fouls,
                          pointsInPaint: gameAnalysisData.opponentStats?.pointsInPaint,
                          secondChancePoints: gameAnalysisData.opponentStats?.secondChancePoints,
                          pointsOffTurnovers: gameAnalysisData.opponentStats?.pointsOffTurnovers,
                          benchPoints: gameAnalysisData.opponentStats?.benchPoints,
                        }}
                        teamName={"TEAM"}
                        opponentName={gameInfo?.opponent || "OPPONENT"}
                      />
                    </div>
                  ) : null}
                </div>
              )
            },
            {
              key: 'player-stats',
              label: (
                <span style={{ color: '#fff' }}>
                  <UserOutlined style={{ marginRight: '8px' }} />
                  Player Stats
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <Table
                    dataSource={playerStats || []}
                    rowKey={(record) => record.id || `player-${record.name}-${record.position}`}
                    columns={[
                      { 
                        title: (<Tooltip title="Player name"><span style={{ color: '#fff' }}>Player</span></Tooltip>),
                        dataIndex: 'name', 
                        key: 'name',
                        sorter: (a: any, b: any) => a.name.localeCompare(b.name),
                        width: 150,
                        render: (text: string, record: any) => (
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600' }}>
                              <PlayerLink id={record.id} name={text} />
                            </div>
                            <div style={{ color: '#b0b0b0', fontSize: '12px' }}>
                              {record.position} #{record.number}
                            </div>
                          </div>
                        )
                      },
                      { 
                        title: (<Tooltip title="Player Position"><span style={{ color: '#fff' }}>POS</span></Tooltip>),
                        dataIndex: 'position', 
                        key: 'position',
                        sorter: (a: any, b: any) => a.position.localeCompare(b.position),
                        width: 60,
                        render: (value: any) => <span style={{ color: '#fff' }}>{value}</span>
                      },
                      { 
                        title: (<Tooltip title="Total points scored"><span style={{ color: '#fff' }}>PTS</span></Tooltip>), 
                        dataIndex: 'points', 
                        key: 'points', 
                        sorter: (a: any, b: any) => a.points - b.points,
                        render: (text: any, record: any) => record.points === 0 ? '' : <span style={{ color: '#1890ff', fontWeight: '600' }}>{record.points}</span>
                      },
                      { 
                        title: (<Tooltip title="Total rebounds (offensive + defensive)"><span style={{ color: '#fff' }}>REB</span></Tooltip>), 
                        dataIndex: 'rebounds', 
                        key: 'rebounds', 
                        sorter: (a: any, b: any) => a.rebounds - b.rebounds,
                        render: (text: any, record: any) => record.rebounds === 0 ? '' : record.rebounds
                      },
                      { 
                        title: (<Tooltip title="Total assists"><span style={{ color: '#fff' }}>AST</span></Tooltip>), 
                        dataIndex: 'assists', 
                        key: 'assists', 
                        sorter: (a: any, b: any) => a.assists - b.assists,
                        render: (text: any, record: any) => record.assists === 0 ? '' : record.assists
                      },
                      { 
                        title: (<Tooltip title="Total steals"><span style={{ color: '#fff' }}>STL</span></Tooltip>), 
                        dataIndex: 'steals', 
                        key: 'steals', 
                        sorter: (a: any, b: any) => a.steals - b.steals,
                        render: (text: any, record: any) => record.steals === 0 ? '' : record.steals
                      },
                      { 
                        title: (<Tooltip title="Total blocks"><span style={{ color: '#fff' }}>BLK</span></Tooltip>), 
                        dataIndex: 'blocks', 
                        key: 'blocks', 
                        sorter: (a: any, b: any) => a.blocks - b.blocks,
                        render: (text: any, record: any) => record.blocks === 0 ? '' : record.blocks
                      },
                      { 
                        title: (<Tooltip title="Total turnovers"><span style={{ color: '#fff' }}>TO</span></Tooltip>), 
                        dataIndex: 'turnovers', 
                        key: 'turnovers', 
                        sorter: (a: any, b: any) => a.turnovers - b.turnovers,
                        render: (text: any, record: any) => record.turnovers === 0 ? '' : record.turnovers
                      },
                      { 
                        title: (<Tooltip title="Personal Fouls"><span style={{ color: '#fff' }}>PF</span></Tooltip>), 
                        dataIndex: 'fouls', 
                        key: 'fouls', 
                        sorter: (a: any, b: any) => a.fouls - b.fouls,
                        render: (text: any, record: any) => record.fouls === 0 ? '' : record.fouls
                      },
                      { 
                        title: (<Tooltip title="Field goal percentage: FG made / FG attempted"><span style={{ color: '#fff' }}>FG</span></Tooltip>), 
                        key: 'fgPercentage',
                        render: (text: any, record: any) => {
                          const fgAttempted = record.fgAttempted || record.fieldGoals?.attempted || 0;
                          const fgMade = record.fgMade || record.fieldGoals?.made || 0;
                          return fgAttempted > 0 ? `${Math.round((fgMade / fgAttempted) * 100)}%` : '0%';
                        },
                        sorter: (a: any, b: any) => {
                          const aPct = (a.fgAttempted || a.fieldGoals?.attempted || 0) > 0 ? (a.fgMade || a.fieldGoals?.made || 0) / (a.fgAttempted || a.fieldGoals?.attempted || 0) : 0;
                          const bPct = (b.fgAttempted || b.fieldGoals?.attempted || 0) > 0 ? (b.fgMade || b.fieldGoals?.made || 0) / (b.fgAttempted || b.fieldGoals?.attempted || 0) : 0;
                          return aPct - bPct;
                        }
                      },
                      { 
                        title: (<Tooltip title="Team point differential while the player is on court"><span style={{ color: '#fff' }}>+/-</span></Tooltip>), 
                        dataIndex: 'plusMinus', 
                        key: 'plusMinus', 
                        sorter: (a: any, b: any) => a.plusMinus - b.plusMinus,
                        render: (text: any, record: any) => record.plusMinus === 0 ? '' : <span style={{ color: record.plusMinus >= 0 ? '#52c41a' : '#ff4d4f' }}>{record.plusMinus}</span>,
                        width: 70
                      },
                      { 
                        title: (<Tooltip title="EFF = PTS + REB + AST + STL + BLK - Missed FG - Missed FT − TO"><span style={{ color: '#fff' }}>EFF</span></Tooltip>),
                        key: 'efficiency', 
                        render: (text: any, record: any) => {
                          // Use flattened structure first, fallback to nested
                          const fgAttempted = record.fgAttempted || record.fieldGoals?.attempted || 0;
                          const fgMade = record.fgMade || record.fieldGoals?.made || 0;
                          const ftAttempted = record.ftAttempted || record.freeThrows?.attempted || 0;
                          const ftMade = record.ftMade || record.freeThrows?.made || 0;
                          const missedFg = fgAttempted - fgMade;
                          const missedFt = ftAttempted - ftMade;
                          const efficiency = (record.points || 0) + (record.rebounds || 0) + (record.assists || 0) + (record.steals || 0) + (record.blocks || 0) - missedFg - missedFt - (record.turnovers || 0);
                          return <span style={{ color: '#fff' }}>{isNaN(efficiency) ? 0 : efficiency}</span>;
                        },
                        sorter: (a: any, b: any) => {
                          const effA = (a.points || 0) + (a.rebounds || 0) + (a.assists || 0) + (a.steals || 0) + (a.blocks || 0) - ((a.fgAttempted || a.fieldGoals?.attempted || 0) - (a.fgMade || a.fieldGoals?.made || 0)) - ((a.ftAttempted || a.freeThrows?.attempted || 0) - (a.ftMade || a.freeThrows?.made || 0)) - (a.turnovers || 0);
                          const effB = (b.points || 0) + (b.rebounds || 0) + (b.assists || 0) + (b.steals || 0) + (b.blocks || 0) - ((b.fgAttempted || b.fieldGoals?.attempted || 0) - (b.fgMade || b.fieldGoals?.made || 0)) - ((b.ftAttempted || b.freeThrows?.attempted || 0) - (b.ftMade || b.freeThrows?.made || 0)) - (b.turnovers || 0);
                          return effA - effB;
                        }
                      }
                    ]}
                    pagination={false}
                    size="middle"
                    style={{ background: 'transparent' }}
                    showSorterTooltip={false}
                    components={{
                      body: {
                        row: ({ children, ...props }: any) => (
                          <tr {...props} style={{ 
                            background: 'rgba(255,255,255,0.05)', 
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff'
                          }}>
                            {children}
                          </tr>
                        ),
                        cell: ({ children, ...props }: any) => (
                          <td {...props} style={{ 
                            padding: '12px 16px', 
                            color: '#fff',
                            fontSize: '14px'
                          }}>
                            {children}
                          </td>
                        )
                      }
                    }}
                  />
                  
                  {/* Opponent Box Score */}
                  {gameAnalysisData?.opponentStats && (
                    <div style={{ marginTop: '24px' }}>
                      <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                        {gameInfo?.opponent || 'OPPONENT'} Box Score
                      </h3>
                      <Table
                        dataSource={gameAnalysisData?.opponentPlayerStats || []}
                        rowKey={(record) => record.id || `opponent-${record.number}-${record.name}`}
                        columns={[
                          { 
                            title: (<Tooltip title="Jersey number"><span style={{ color: '#fff' }}>#</span></Tooltip>),
                            dataIndex: 'number', 
                            key: 'number',
                            sorter: (a: any, b: any) => Number(a.number) - Number(b.number),
                            width: 80,
                            render: (value: any) => (
                              <div style={{ fontWeight: 600, color: '#ff4d4f', fontSize: '16px' }}>
                                #{value}
                              </div>
                            )
                          },
                          { 
                            title: (<Tooltip title="Total points scored"><span style={{ color: '#fff' }}>PTS</span></Tooltip>), 
                            dataIndex: 'points', 
                            key: 'points', 
                            sorter: (a: any, b: any) => a.points - b.points,
                            render: (text: any, record: any) => record.points === 0 ? '' : <span style={{ color: '#ff4d4f', fontWeight: '600' }}>{record.points}</span>
                          },
                          { 
                            title: (<Tooltip title="Total rebounds (offensive + defensive)"><span style={{ color: '#fff' }}>REB</span></Tooltip>), 
                            dataIndex: 'rebounds', 
                            key: 'rebounds', 
                            sorter: (a: any, b: any) => a.rebounds - b.rebounds,
                            render: (text: any, record: any) => record.rebounds === 0 ? '' : record.rebounds
                          },
                          { 
                            title: (<Tooltip title="Total assists"><span style={{ color: '#fff' }}>AST</span></Tooltip>), 
                            dataIndex: 'assists', 
                            key: 'assists', 
                            sorter: (a: any, b: any) => a.assists - b.assists,
                            render: (text: any, record: any) => record.assists === 0 ? '' : record.assists
                          },
                          { 
                            title: (<Tooltip title="Total steals"><span style={{ color: '#fff' }}>STL</span></Tooltip>), 
                            dataIndex: 'steals', 
                            key: 'steals', 
                            sorter: (a: any, b: any) => a.steals - b.steals,
                            render: (text: any, record: any) => record.steals === 0 ? '' : record.steals
                          },
                          { 
                            title: (<Tooltip title="Total blocks"><span style={{ color: '#fff' }}>BLK</span></Tooltip>), 
                            dataIndex: 'blocks', 
                            key: 'blocks', 
                            sorter: (a: any, b: any) => a.blocks - b.blocks,
                            render: (text: any, record: any) => record.blocks === 0 ? '' : record.blocks
                          },
                          { 
                            title: (<Tooltip title="Total turnovers"><span style={{ color: '#fff' }}>TO</span></Tooltip>), 
                            dataIndex: 'turnovers', 
                            key: 'turnovers', 
                            sorter: (a: any, b: any) => a.turnovers - b.turnovers,
                            render: (text: any, record: any) => record.turnovers === 0 ? '' : record.turnovers
                          },
                          { 
                            title: (<Tooltip title="Personal Fouls"><span style={{ color: '#fff' }}>PF</span></Tooltip>), 
                            dataIndex: 'fouls', 
                            key: 'fouls', 
                            sorter: (a: any, b: any) => a.fouls - b.fouls,
                            render: (text: any, record: any) => record.fouls === 0 ? '' : record.fouls
                          },
                          { 
                            title: (<Tooltip title="Field goal percentage: FG made / FG attempted"><span style={{ color: '#fff' }}>FG</span></Tooltip>), 
                            key: 'fgPercentage',
                            render: (text: any, record: any) => {
                              const fgAttempted = record.fgAttempted || record.fieldGoals?.attempted || 0;
                              const fgMade = record.fgMade || record.fieldGoals?.made || 0;
                              return fgAttempted > 0 ? `${Math.round((fgMade / fgAttempted) * 100)}%` : '0%';
                            },
                            sorter: (a: any, b: any) => {
                              const aPct = (a.fgAttempted || a.fieldGoals?.attempted || 0) > 0 ? (a.fgMade || a.fieldGoals?.made || 0) / (a.fgAttempted || a.fieldGoals?.attempted || 0) : 0;
                              const bPct = (b.fgAttempted || b.fieldGoals?.attempted || 0) > 0 ? (b.fgMade || b.fieldGoals?.made || 0) / (b.fgAttempted || b.fieldGoals?.attempted || 0) : 0;
                              return aPct - bPct;
                            }
                          },
                          { 
                            title: (<Tooltip title="Team point differential while the player is on court"><span style={{ color: '#fff' }}>+/-</span></Tooltip>), 
                            dataIndex: 'plusMinus', 
                            key: 'plusMinus', 
                            sorter: (a: any, b: any) => a.plusMinus - b.plusMinus,
                            render: (text: any, record: any) => record.plusMinus === 0 ? '' : <span style={{ color: record.plusMinus >= 0 ? '#52c41a' : '#ff4d4f' }}>{record.plusMinus}</span>,
                            width: 70
                          },
                          { 
                            title: (<Tooltip title="EFF = PTS + REB + AST + STL + BLK - Missed FG - Missed FT − TO"><span style={{ color: '#fff' }}>EFF</span></Tooltip>),
                            key: 'efficiency', 
                            render: (text: any, record: any) => {
                              // Use flattened structure first, fallback to nested
                              const fgAttempted = record.fgAttempted || record.fieldGoals?.attempted || 0;
                              const fgMade = record.fgMade || record.fieldGoals?.made || 0;
                              const ftAttempted = record.ftAttempted || record.freeThrows?.attempted || 0;
                              const ftMade = record.ftMade || record.freeThrows?.made || 0;
                              const missedFg = fgAttempted - fgMade;
                              const missedFt = ftAttempted - ftMade;
                              const efficiency = (record.points || 0) + (record.rebounds || 0) + (record.assists || 0) + (record.steals || 0) + (record.blocks || 0) - missedFg - missedFt - (record.turnovers || 0);
                              return <span style={{ color: '#fff' }}>{isNaN(efficiency) ? 0 : efficiency}</span>;
                            },
                            sorter: (a: any, b: any) => {
                              const effA = (a.points || 0) + (a.rebounds || 0) + (a.assists || 0) + (a.steals || 0) + (a.blocks || 0) - ((a.fgAttempted || a.fieldGoals?.attempted || 0) - (a.fgMade || a.fieldGoals?.made || 0)) - ((a.ftAttempted || a.freeThrows?.attempted || 0) - (a.ftMade || a.freeThrows?.made || 0)) - (a.turnovers || 0);
                              const effB = (b.points || 0) + (b.rebounds || 0) + (b.assists || 0) + (b.steals || 0) + (b.blocks || 0) - ((b.fgAttempted || b.fieldGoals?.attempted || 0) - (b.fgMade || b.fieldGoals?.made || 0)) - ((b.ftAttempted || b.freeThrows?.attempted || 0) - (b.ftMade || b.freeThrows?.made || 0)) - (b.turnovers || 0);
                              return effA - effB;
                            }
                          }
                        ]}
                          pagination={false}
                        size="middle"
                          style={{ background: 'transparent' }}
                        showSorterTooltip={false}
                          components={{
                            body: {
                              row: ({ children, ...props }: any) => (
                                <tr {...props} style={{ 
                                background: 'rgba(255,77,79,0.05)', 
                                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                                  color: '#fff'
                                }}>
                                  {children}
                                </tr>
                              ),
                              cell: ({ children, ...props }: any) => (
                                <td {...props} style={{ 
                                padding: '12px 16px', 
                                  color: '#fff',
                                fontSize: '14px'
                                }}>
                                  {children}
                                </td>
                              )
                            }
                          }}
                      />
                    </div>
                  )}
                  
                  {/* Edit Box Score Button - COMMENTED OUT */}
                  {/* <div style={{ 
                    marginTop: '24px', 
                    display: 'flex', 
                    justifyContent: 'center',
                    padding: '16px 0'
                  }}>
                    <Button 
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={handleBoxScoreEdit}
                      size="large"
                      style={{ 
                        background: 'rgba(24, 144, 255, 0.1)', 
                        border: '1px solid rgba(24, 144, 255, 0.3)',
                        color: '#1890ff',
                        fontWeight: '600',
                        padding: '8px 24px',
                        height: 'auto'
                      }}
                    >
                      Edit Box Score
                    </Button>
                  </div> */}
                </div>
              )
            },
            // Advanced Metrics tab - commented out
            // {
            //   key: 'advanced-metrics',
            //   label: (
            //     <span style={{ color: '#fff' }}>
            //       <BarChartOutlined style={{ marginRight: '8px' }} />
            //       Advanced Metrics
            //     </span>
            //   ),
            //   children: (
            //     <div style={{ padding: '16px 0' }}>
            //       <Row gutter={[16, 16]}>
            //         <Col span={12}>
            //           <Card title="Team Efficiency" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
            //               <div><strong>Points per Possession:</strong> {gameAnalysisData?.advancedMetrics?.teamEfficiency?.pointsPerPossession || 0}</div>
            //               <div><strong>True Shooting %:</strong> {gameAnalysisData?.advancedMetrics?.teamEfficiency?.trueShootingPercentage || 0}%</div>
            //               <div><strong>Offensive Efficiency:</strong> {gameAnalysisData?.advancedMetrics?.teamEfficiency?.offensiveEfficiency || 0}</div>
            //               <div><strong>Defensive Efficiency:</strong> {gameAnalysisData?.advancedMetrics?.teamEfficiency?.defensiveEfficiency || 0}</div>
            //               <div><strong>Pace:</strong> {gameAnalysisData?.advancedMetrics?.teamEfficiency?.pace || 0}</div>
            //             </div>
            //           </Card>
            //         </Col>
            //         <Col span={12}>
            //           <Card title="Position Performance" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
            //               <div><strong>Guards:</strong> {gameAnalysisData?.advancedMetrics?.positionMetrics?.guards?.count || 0} players, {gameAnalysisData?.advancedMetrics?.positionMetrics?.guards?.points || 0} pts, {gameAnalysisData?.advancedMetrics?.positionMetrics?.guards?.fgPct || 0}% FG</div>
            //               <div><strong>Forwards:</strong> {gameAnalysisData?.advancedMetrics?.positionMetrics?.forwards?.count || 0} players, {gameAnalysisData?.advancedMetrics?.positionMetrics?.forwards?.points || 0} pts, {gameAnalysisData?.advancedMetrics?.positionMetrics?.forwards?.fgPct || 0}% FG</div>
            //               <div><strong>Centers:</strong> {gameAnalysisData?.advancedMetrics?.positionMetrics?.centers?.count || 0} players, {gameAnalysisData?.advancedMetrics?.positionMetrics?.centers?.points || 0} pts, {gameAnalysisData?.advancedMetrics?.positionMetrics?.centers?.fgPct || 0}% FG</div>
            //             </div>
            //           </Card>
            //         </Col>
            //       </Row>
            //       
            //       <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            //         <Col span={24}>
            //           <Card title="Player Efficiency Ratings" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             <Table
            //               dataSource={gameAnalysisData?.advancedMetrics?.playerEfficiencyRatings || []}
            //               pagination={false}
            //               size="small"
            //               style={{ background: 'transparent' }}
            //               components={{
            //                 body: {
            //                   row: ({ children, ...props }: any) => (
            //                     <tr {...props} style={{ 
            //                       background: 'rgba(255,255,255,0.05)', 
            //                       borderBottom: '1px solid rgba(255,255,255,0.1)',
            //                       color: '#fff'
            //                     }}>
            //                       {children}
            //                     </tr>
            //                   ),
            //                   cell: ({ children, ...props }: any) => (
            //                     <td {...props} style={{ 
            //                       padding: '8px 12px', 
            //                       color: '#fff',
            //                       fontSize: '12px'
            //                     }}>
            //                       {children}
            //                     </td>
            //                   )
            //                 }
            //               }}
            //             >
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Player</span>}
            //                 dataIndex="name" 
            //                 key="name"
            //                 render={(text: string) => <span style={{ color: '#fff', fontWeight: '600' }}>{text}</span>}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Offensive</span>}
            //                 dataIndex="offensiveRating" 
            //                 key="offensiveRating"
            //                 render={(value: number) => <span style={{ color: '#1890ff' }}>{value}</span>}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Defensive</span>}
            //                 dataIndex="defensiveRating" 
            //                 key="defensiveRating"
            //                 render={(value: number) => <span style={{ color: '#52c41a' }}>{value}</span>}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>True Shooting</span>}
            //                 dataIndex="trueShootingPercentage" 
            //                 key="trueShootingPercentage"
            //                 render={(value: number) => <span style={{ color: '#722ed1' }}>{value}%</span>}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Usage Rate</span>}
            //                 dataIndex="usageRate" 
            //                 key="usageRate"
            //                 render={(value: number) => <span style={{ color: '#faad14' }}>{value}%</span>}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Overall</span>}
            //                 dataIndex="efficiency" 
            //                 key="efficiency"
            //                 render={(value: number) => <span style={{ color: '#ff4d4f', fontWeight: '600' }}>{value}</span>}
            //               />
            //             </Table>
            //           </Card>
            //         </Col>
            //       </Row>
            //     </div>
            //   )
            // },
            {
              key: 'quarter-breakdown',
              label: (
                <span style={{ color: '#fff' }}>
                  <CalendarOutlined style={{ marginRight: '8px' }} />
                  Quarter Breakdown
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <Card title="Quarter Performance" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Row gutter={[16, 16]}>
                          {gameAnalysisData?.quarterBreakdown?.quarters?.map((quarter: any, index: number) => (
                            <Col span={6} key={quarter.quarter || index}>
                              <Card 
                                style={{ 
                                  background: 'rgba(255,255,255,0.05)', 
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  textAlign: 'center'
                                }}
                              >
                                <div style={{ color: '#1890ff', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                                  Q{quarter.quarter}
                                </div>
                                <div style={{ color: '#fff', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
                                  {quarter.points || 0}
                                </div>
                                <div style={{ color: '#b0b0b0', fontSize: '12px', marginBottom: '4px' }}>
                                  {quarter.fgPct || 0}% FG
                                </div>
                                <div style={{ color: '#b0b0b0', fontSize: '12px', marginBottom: '4px' }}>
                                  {quarter.turnovers || 0} Turnovers
                                </div>
                                <div style={{ color: '#b0b0b0', fontSize: '12px', marginBottom: '4px' }}>
                                  {quarter.timeouts || 0} Timeouts
                                </div>
                                {/* Quarter momentum display - commented out */}
                                {/* <div style={{ 
                                  color: quarter.momentum === 'positive' ? '#52c41a' : '#ff4d4f', 
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}>
                                  {quarter.momentum === 'positive' ? '↗' : '↘'} {quarter.momentum}
                                </div> */}
                              </Card>
                            </Col>
                          ))}
                        </Row>
                        
                        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                          <Col span={12}>
                            <Card title="First Half" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <div style={{ fontSize: '16px', lineHeight: '2', color: '#fff' }}>
                                <div><strong>Points:</strong> {gameAnalysisData?.quarterBreakdown?.firstHalf?.points || 0}</div>
                                <div><strong>FG%:</strong> {gameAnalysisData?.quarterBreakdown?.firstHalf?.fgPct || 0}%</div>
                                <div><strong>Turnovers:</strong> {gameAnalysisData?.quarterBreakdown?.firstHalf?.turnovers || 0}</div>
                              </div>
                            </Card>
                          </Col>
                          <Col span={12}>
                            <Card title="Second Half" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <div style={{ fontSize: '16px', lineHeight: '2', color: '#fff' }}>
                                <div><strong>Points:</strong> {gameAnalysisData?.quarterBreakdown?.secondHalf?.points || 0}</div>
                                <div><strong>FG%:</strong> {gameAnalysisData?.quarterBreakdown?.secondHalf?.fgPct || 0}%</div>
                                <div><strong>Turnovers:</strong> {gameAnalysisData?.quarterBreakdown?.secondHalf?.turnovers || 0}</div>
                              </div>
                            </Card>
                          </Col>
                        </Row>
                        
                        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                          <Col span={24}>
                            <Card 
                              title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                  <Tooltip title="Analysis of team performance across all four quarters of the game">
                                    <span style={{ color: '#fff', cursor: 'help' }}>Quarter Performance</span>
                                  </Tooltip>
                                  <Tooltip title="Measures how consistent the team's performance is across quarters. Higher scores indicate more steady performance, while lower scores show dramatic swings between quarters.">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'help', minWidth: '120px' }}>
                                      <div style={{ 
                                        width: '80px', 
                                        height: '8px', 
                                        background: 'rgba(255,255,255,0.2)', 
                                        borderRadius: '4px',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(255,255,255,0.3)'
                                      }}>
                                        <div style={{ 
                                          width: `${gameAnalysisData?.quarterBreakdown?.analysis?.consistency || 0}%`, 
                                          height: '100%', 
                                          background: 'linear-gradient(90deg, #ff4d4f, #faad14, #52c41a)',
                                          transition: 'width 0.3s ease'
                                        }} />
                                      </div>
                                      <span style={{ 
                                        color: gameAnalysisData?.quarterBreakdown?.analysis?.consistency >= 70 ? '#52c41a' : 
                                               gameAnalysisData?.quarterBreakdown?.analysis?.consistency >= 40 ? '#faad14' : '#ff4d4f',
                                        fontWeight: '700',
                                        fontSize: '16px',
                                        minWidth: '40px',
                                        textAlign: 'center'
                                      }}>
                                        {gameAnalysisData?.quarterBreakdown?.analysis?.consistency || 0}%
                                      </span>
                                    </div>
                                  </Tooltip>
                                </div>
                              } 
                              style={{ 
                                background: 'rgba(255,255,255,0.08)', 
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', padding: '20px 0', minHeight: '120px' }}>
                                <Tooltip title="The quarter where the team scored the most points">
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 1 }}>
                                    <div style={{ 
                                      width: '60px', 
                                      height: '60px', 
                                      borderRadius: '50%', 
                                      background: 'linear-gradient(135deg, #52c41a, #73d13d)',
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)',
                                      border: '2px solid rgba(255,255,255,0.2)'
                                    }}>
                                      <TrophyOutlined style={{ fontSize: '24px', color: '#fff' }} />
                                    </div>
                                    <span style={{ color: '#52c41a', fontWeight: '600', fontSize: '14px' }}>
                                      Q{gameAnalysisData?.quarterBreakdown?.analysis?.strongestQuarter || 0}
                                    </span>
                                    <span style={{ color: '#b0b0b0', fontSize: '12px' }}>Strongest</span>
                                  </div>
                                </Tooltip>
                                
                                <div style={{ width: '2px', height: '60px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px' }} />
                                
                                <Tooltip title="The quarter where the team scored the fewest points">
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 1 }}>
                                    <div style={{ 
                                      width: '60px', 
                                      height: '60px', 
                                      borderRadius: '50%', 
                                      background: 'linear-gradient(135deg, #ff4d4f, #ff7875)',
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)',
                                      border: '2px solid rgba(255,255,255,0.2)'
                                    }}>
                                      <SwapOutlined style={{ fontSize: '24px', color: '#fff' }} />
                                    </div>
                                    <span style={{ color: '#ff4d4f', fontWeight: '600', fontSize: '14px' }}>
                                      Q{gameAnalysisData?.quarterBreakdown?.analysis?.weakestQuarter || 0}
                                    </span>
                                    <span style={{ color: '#b0b0b0', fontSize: '12px' }}>Weakest</span>
                                  </div>
                                </Tooltip>
                              </div>
                            </Card>
                          </Col>
                        </Row>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )
            },
            // Strategic Insights tab - commented out
            // {
            //   key: 'strategic-insights',
            //   label: (
            //     <span style={{ color: '#fff' }}>
            //       <SwapOutlined style={{ marginRight: '8px' }} />
            //       Strategic Insights
            //     </span>
            //   ),
            //   children: (
            //     <div style={{ padding: '16px 0' }}>
            //       <Row gutter={[16, 16]}>
            //         <Col span={12}>
            //           <Card title="Lineup Effectiveness" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
            //               <div><strong>Most Effective Lineups:</strong></div>
            //               {gameAnalysisData?.strategicInsights?.lineupEffectiveness?.mostEffective?.map((lineup: any, index: number) => (
            //                 <div key={index} style={{ marginLeft: '16px', marginBottom: '8px' }}>
            //                   • {lineup.players.join(', ')} (+{lineup.plusMinus}, {lineup.minutes} min)
            //                 </div>
            //               ))}
            //               <div style={{ marginTop: '12px' }}>
            //                 <strong>Average +/-:</strong> {gameAnalysisData?.strategicInsights?.lineupEffectiveness?.averagePlusMinus || 0}
            //               </div>
            //             </div>
            //           </Card>
            //         </Col>
            //         <Col span={12}>
            //           <Card title="Game Flow" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
            //               <div><strong>Largest Lead:</strong> +{gameAnalysisData?.strategicInsights?.gameFlow?.largestLead || 0}</div>
            //               <div><strong>Largest Deficit:</strong> -{gameAnalysisData?.strategicInsights?.gameFlow?.largestDeficit || 0}</div>
            //               <div><strong>Momentum Shifts:</strong> {gameAnalysisData?.strategicInsights?.gameFlow?.momentumShifts || 0}</div>
            //               <div><strong>Scoring Runs:</strong> {gameAnalysisData?.strategicInsights?.gameFlow?.scoringRuns?.length || 0}</div>
            //             </div>
            //           </Card>
            //         </Col>
            //       </Row>
            //       
            //       <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            //         <Col span={12}>
            //           <Card title="Defensive Insights" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
            //               <div><strong>Steals/Turnovers Ratio:</strong> {gameAnalysisData?.strategicInsights?.defensiveInsights?.stealsToTurnoversRatio || 0}</div>
            //               <div><strong>Blocks:</strong> {gameAnalysisData?.strategicInsights?.defensiveInsights?.blocksPerGame || 0}</div>
            //               <div><strong>Defensive Rebound %:</strong> {Math.round(gameAnalysisData?.strategicInsights?.defensiveInsights?.defensiveReboundPercentage || 0)}%</div>
            //               <div><strong>Fouls per Minute:</strong> {gameAnalysisData?.strategicInsights?.defensiveInsights?.foulsPerMinute || 0}</div>
            //             </div>
            //           </Card>
            //         </Col>
            //         <Col span={12}>
            //           <Card title="Substitution Patterns" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#fff' }}>
            //               <div><strong>Average Stint Length:</strong> {gameAnalysisData?.strategicInsights?.substitutionPatterns?.averageStintLength || 0} min</div>
            //               <div><strong>Substitution Frequency:</strong> {gameAnalysisData?.strategicInsights?.substitutionPatterns?.substitutionFrequency || 'Unknown'}</div>
            //               <div><strong>Rest Periods:</strong></div>
            //               {gameAnalysisData?.strategicInsights?.substitutionPatterns?.restPeriods?.slice(0, 3).map((rest: any, index: number) => (
            //                 <div key={index} style={{ marginLeft: '16px', marginBottom: '4px' }}>
            //                   • {rest.player}: {rest.duration} min rest
            //                 </div>
            //               ))}
            //             </div>
            //           </Card>
            //         </Col>
            //       </Row>
            //       
            //       <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            //         <Col span={24}>
            //           <Card title="Coach Recommendations" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             {gameAnalysisData?.strategicInsights?.recommendations?.length > 0 ? (
            //               gameAnalysisData.strategicInsights.recommendations.map((rec: any, index: number) => (
            //                 <div key={index} style={{ 
            //                   marginBottom: '16px', 
            //                   padding: '16px', 
            //                   background: 'rgba(255,255,255,0.05)', 
            //                   borderRadius: '8px',
            //                   border: `1px solid ${rec.priority === 'high' ? '#ff4d4f' : rec.priority === 'medium' ? '#faad14' : '#52c41a'}`
            //                 }}>
            //                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            //                     <span style={{ 
            //                       color: '#fff', 
            //                       fontSize: '16px', 
            //                       fontWeight: '600' 
            //                     }}>
            //                       {rec.category}
            //                     </span>
            //                     <Tag color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'success'}>
            //                       {rec.priority.toUpperCase()}
            //                     </Tag>
            //                   </div>
            //                   <div style={{ color: '#b0b0b0', fontSize: '14px', marginBottom: '8px' }}>
            //                     {rec.message}
            //                   </div>
            //                   <div style={{ color: '#1890ff', fontSize: '14px', fontStyle: 'italic' }}>
            //                     💡 {rec.actionable}
            //                   </div>
            //                 </div>
            //               ))
            //             ) : (
            //               <div style={{ textAlign: 'center', color: '#b0b0b0', padding: '20px' }}>
            //                 No specific recommendations at this time
            //               </div>
            //             )}
            //           </Card>
            //         </Col>
            //       </Row>
            //     </div>
            //   )
            // },
            {
              key: 'standout-info',
              label: (
                <span style={{ color: '#fff' }}>
                  <StarOutlined style={{ marginRight: '8px' }} />
                  LKRM Leaders
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Card title="Top Scorer" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ textAlign: 'center', color: '#fff' }}>
                          <div style={{ color: '#1890ff', fontWeight: '600', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                              <TrophyOutlined />
                              Top Scorer
                            </div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1890ff', marginBottom: '8px' }}>
                              <PlayerLink id={standoutInfo?.topScorer?.id} name={standoutInfo?.topScorer?.name || 'N/A'} />
                            </div>
                          <div style={{ color: '#b0b0b0', fontSize: '16px' }}>
                              {standoutInfo?.topScorer?.points || 0} points
                            </div>
                          </div>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card title="Top Rebounder" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ textAlign: 'center', color: '#fff' }}>
                          <div style={{ color: '#52c41a', fontWeight: '600', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                              <InboxOutlined />
                              Top Rebounder
                            </div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: '#52c41a', marginBottom: '8px' }}>
                              <PlayerLink id={standoutInfo?.topRebounder?.id} name={standoutInfo?.topRebounder?.name || 'N/A'} />
                            </div>
                          <div style={{ color: '#b0b0b0', fontSize: '16px' }}>
                              {standoutInfo?.topRebounder?.rebounds || 0} rebounds
                            </div>
                          </div>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card title="Top Assister" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ textAlign: 'center', color: '#fff' }}>
                          <div style={{ color: '#722ed1', fontWeight: '600', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                              <AimOutlined />
                              Top Assister
                            </div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: '#722ed1', marginBottom: '8px' }}>
                              <PlayerLink id={standoutInfo?.topAssister?.id} name={standoutInfo?.topAssister?.name || 'N/A'} />
                            </div>
                          <div style={{ color: '#b0b0b0', fontSize: '16px' }}>
                              {standoutInfo?.topAssister?.assists || 0} assists
                            </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                  <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                    <Col span={8}>
                      <Card title="Most Steals" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ textAlign: 'center', color: '#fff' }}>
                          <div style={{ color: '#fa8c16', fontWeight: '600', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                            <AimOutlined />
                            Most Steals
                          </div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: '#fa8c16', marginBottom: '8px' }}>
                            <PlayerLink id={standoutInfo?.mostSteals?.id} name={standoutInfo?.mostSteals?.name || 'N/A'} />
                          </div>
                          <div style={{ color: '#b0b0b0', fontSize: '16px' }}>
                            {standoutInfo?.mostSteals?.steals || 0} steals
                          </div>
                        </div>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card title="Highest FG Points" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ textAlign: 'center', color: '#fff' }}>
                          <div style={{ color: '#13c2c2', fontWeight: '600', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                              <BarChartOutlined />
                            Highest FG Points
                            </div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: '#13c2c2', marginBottom: '8px' }}>
                            <PlayerLink id={standoutInfo?.highestFgPoints?.id} name={standoutInfo?.highestFgPoints?.name || 'N/A'} />
                            </div>
                          <div style={{ color: '#b0b0b0', fontSize: '16px' }}>
                            {standoutInfo?.highestFgPoints?.points || 0} points
                          </div>
                            </div>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card title="Highest 3PT Points" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ textAlign: 'center', color: '#fff' }}>
                          <div style={{ color: '#eb2f96', fontWeight: '600', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                            <AimOutlined />
                            Highest 3PT Points
                            </div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: '#eb2f96', marginBottom: '8px' }}>
                            <PlayerLink id={standoutInfo?.highest3ptPoints?.id} name={standoutInfo?.highest3ptPoints?.name || 'N/A'} />
                          </div>
                          <div style={{ color: '#b0b0b0', fontSize: '16px' }}>
                            {(standoutInfo?.highest3ptPoints?.threeMade || 0) * 3} points
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                  <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                    <Col span={8}>
                      <Card title="Highest FT Points" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ textAlign: 'center', color: '#fff' }}>
                          <div style={{ color: '#52c41a', fontWeight: '600', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                              <AimOutlined />
                            Highest FT Points
                            </div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: '#52c41a', marginBottom: '8px' }}>
                            <PlayerLink id={standoutInfo?.highestFtPoints?.id} name={standoutInfo?.highestFtPoints?.name || 'N/A'} />
                            </div>
                          <div style={{ color: '#b0b0b0', fontSize: '16px' }}>
                            {standoutInfo?.highestFtPoints?.ftMade || 0} points
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )
            },
            // Lineup Comparison tab - commented out
            // {
            //   key: 'lineup-comparison',
            //   label: (
            //     <span style={{ color: '#fff' }}>
            //       <SwapOutlined style={{ marginRight: '8px' }} />
            //       Lineup Comparison
            //     </span>
            //   ),
            //   children: (
            //     <div style={{ padding: '16px 0' }}>
            //       <Row gutter={[16, 16]}>
            //         <Col span={12}>
            //           <Card title="Starters" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             <Table
            //               dataSource={lineupComparison?.starters || []}
            //               pagination={false}
            //               size="small"
            //               style={{ background: 'transparent' }}
            //               components={{
            //                 body: {
            //                   row: ({ children, ...props }: any) => (
            //                     <tr {...props} style={{ 
            //                       background: 'rgba(255,255,255,0.05)', 
            //                       borderBottom: '1px solid rgba(255,255,255,0.1)',
            //                       color: '#fff'
            //                     }}>
            //                       {children}
            //                     </tr>
            //                   ),
            //                   cell: ({ children, ...props }: any) => (
            //                     <td {...props} style={{ 
            //                       padding: '8px 12px', 
            //                       color: '#fff',
            //                       fontSize: '12px'
            //                     }}>
            //                       {children}
            //                     </td>
            //                   )
            //                 }
            //               }}
            //             >
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Player</span>}
            //                 dataIndex="name" 
            //                 key="name"
            //                 render={(text: string) => <span style={{ color: '#fff', fontWeight: '600' }}>{text}</span>}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Min</span>}
            //                 dataIndex="minutes" 
            //                 key="minutes"
            //                 render={(value: number) => <span style={{ color: '#fff' }}>{value}</span>}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>+/-</span>}
            //                 dataIndex="plusMinus" 
            //                 key="plusMinus"
            //                 render={(value: number) => (
            //                   <span style={{ 
            //                     color: value >= 0 ? '#52c41a' : '#ff4d4f', 
            //                     fontWeight: '600',
            //                     fontSize: '14px'
            //                   }}>
            //                     {value >= 0 ? '+' : ''}{value}
            //                   </span>
            //                 )}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Efficiency</span>}
            //                 dataIndex="efficiency" 
            //                 key="efficiency"
            //                 render={(value: number) => <span style={{ color: '#fff' }}>{value}</span>}
            //               />
            //             </Table>
            //           </Card>
            //         </Col>
            //         <Col span={12}>
            //           <Card title="Bench" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            //             <Table
            //               dataSource={lineupComparison?.bench || []}
            //               pagination={false}
            //               size="small"
            //               style={{ background: 'transparent' }}
            //               components={{
            //                 body: {
            //                   row: ({ children, ...props }: any) => (
            //                     <tr {...props} style={{ 
            //                       background: 'rgba(255,255,255,0.05)', 
            //                       borderBottom: '1px solid rgba(255,255,255,0.1)',
            //                       color: '#fff'
            //                     }}>
            //                       {children}
            //                     </tr>
            //                   ),
            //                   cell: ({ children, ...props }: any) => (
            //                     <td {...props} style={{ 
            //                       padding: '8px 12px', 
            //                       color: '#fff',
            //                       fontSize: '12px'
            //                     }}>
            //                       {children}
            //                     </td>
            //                   )
            //                 }
            //               }}
            //             >
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Player</span>}
            //                 dataIndex="name" 
            //                 key="name"
            //                 render={(text: string) => <span style={{ color: '#fff', fontWeight: '600' }}>{text}</span>}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Min</span>}
            //                 dataIndex="minutes" 
            //                 key="minutes"
            //                 render={(value: number) => <span style={{ color: '#fff' }}>{value}</span>}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>+/-</span>}
            //                 dataIndex="plusMinus" 
            //                 key="plusMinus"
            //                 render={(value: number) => (
            //                   <span style={{ 
            //                     color: value >= 0 ? '#52c41a' : '#ff4d4f', 
            //                     fontWeight: '600',
            //                     fontSize: '14px'
            //                   }}>
            //                     {value >= 0 ? '+' : ''}{value}
            //                   </span>
            //                 )}
            //               />
            //               <Table.Column 
            //                 title={<span style={{ color: '#fff' }}>Efficiency</span>}
            //                 dataIndex="efficiency" 
            //                 key="efficiency"
            //                 render={(value: number) => <span style={{ color: '#fff' }}>{value}</span>}
            //               />
            //             </Table>
            //           </Card>
            //         </Col>
            //       </Row>
            //     </div>
            //   )
            // },
            {
              key: 'play-by-play',
              label: (
                <span style={{ color: '#fff' }}>
                  <PlayCircleOutlined style={{ marginRight: '8px' }} />
                  Play by Play
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                    <Input.Search
                      allowClear
                      placeholder="Search description or player"
                      onSearch={(v) => setSearchText(v)}
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ width: 280 }}
                    />
                    <Select
                      value={filterQuarter}
                      onChange={setFilterQuarter as any}
                      style={{ width: 140 }}
                      options={[{ label: 'All Quarters', value: 'all' }, ...availableQuarters.map((q: any) => ({ label: `Q${q}`, value: q }))]}
                    />
                    <Select
                      value={filterSide}
                      onChange={setFilterSide}
                      style={{ width: 160 }}
                      options={[
                        { label: 'All Sides', value: 'all' },
                        { label: 'Team', value: 'team' },
                        { label: 'Opponent', value: 'opponent' },
                      ]}
                    />
                    <Select
                      showSearch
                      value={filterType}
                      onChange={setFilterType}
                      style={{ minWidth: 180 }}
                      options={[{ label: 'All Types', value: 'all' }, ...availableTypes.map((t: any) => ({ label: String(t).replace('_', ' '), value: String(t) }))]}
                      filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                    />
                    <Button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
                      {sortOrder === 'asc' ? <ArrowUpOutlined /> : <ArrowDownOutlined />} Sort by Time
                    </Button>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={handleAddEvent}
                      style={{ 
                        background: 'rgba(82, 196, 26, 0.1)', 
                        border: '1px solid rgba(82, 196, 26, 0.3)',
                        color: '#52c41a'
                      }}
                    >
                      Add Event
                    </Button>
                  </div>
                  <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {filteredPlayByPlay && filteredPlayByPlay.length > 0 ? (
                      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '16px' }}>
                        {filteredPlayByPlay.map((play: any, index: number) => {
                          const getTypeColor = (type: string) => {
                            switch (type) {
                              case 'three_made':
                                return '#faad14'; // gold for 3PT make
                              case 'fg_made':
                                return '#52c41a'; // green for FG make
                              case 'ft_made':
                                return '#1890ff'; // blue for FT make
                              case 'three_missed':
                              case 'fg_missed':
                              case 'ft_missed':
                                return '#ff4d4f'; // red for misses
                              case 'assist':
                                return '#2f54eb';
                              case 'rebound':
                                return '#faad14';
                              case 'steal':
                                return '#722ed1';
                              case 'block':
                                return '#eb2f96';
                              case 'turnover':
                                return '#ff4d4f';
                              case 'foul':
                                return '#fa8c16';
                              case 'substitution':
                                return '#8c8c8c';
                              default:
                                return '#b0b0b0';
                            }
                          };

                          const getTypeIcon = (type: string) => {
                            switch (type) {
                              case 'three_made':
                                return <StarOutlined style={{ fontSize: '20px', color: '#faad14' }} />; // star for 3PT make
                              case 'fg_made':
                                return <AimOutlined style={{ fontSize: '20px', color: '#52c41a' }} />; // target for FG make
                              case 'ft_made':
                                return <AimOutlined style={{ fontSize: '20px', color: '#1890ff' }} />; // target blue for FT make
                              case 'three_missed':
                              case 'fg_missed':
                              case 'ft_missed':
                                return <CloseCircleOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />; // red X for misses
                              case 'assist':
                                return <TeamOutlined style={{ fontSize: '20px', color: '#2f54eb' }} />; // teamwork
                              case 'rebound':
                                return <InboxOutlined style={{ fontSize: '20px', color: '#faad14' }} />; // inbox = board
                              case 'steal':
                                return <ThunderboltOutlined style={{ fontSize: '20px', color: '#722ed1' }} />; // lightning
                              case 'block':
                                return <StopOutlined style={{ fontSize: '20px', color: '#eb2f96' }} />; // stop sign
                              case 'turnover':
                                return <CloseCircleOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />; // red X
                              case 'foul':
                                return <ExclamationCircleOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />; // alert
                              case 'substitution':
                                return <SwapOutlined style={{ fontSize: '20px', color: '#8c8c8c' }} />; // swap arrows
                              default:
                                return <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#8c8c8c' }} />;
                            }
                          };

                          return (
                            <div key={index} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              padding: '12px 0',
                              borderBottom: index < (playByPlay?.length || 0) - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                              background: play?.isOpponent ? 'rgba(255,77,79,0.05)' : 'transparent',
                              borderRadius: '4px',
                              marginBottom: '4px'
                            }}>
                              <div style={{ 
                                width: '110px', 
                                fontSize: '14px', 
                                fontWeight: '600', 
                                color: '#1890ff',
                                textAlign: 'center',
                                whiteSpace: 'nowrap'
                              }}>
                                {play?.time || 'N/A'}
                              </div>
                              <div style={{ 
                                width: '50px', 
                                fontSize: '14px', 
                                color: '#b0b0b0',
                                textAlign: 'center',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                padding: '4px 8px'
                              }}>
                                {play?.quarter ? `Q${play.quarter}` : ''}
                              </div>
                              <div style={{ 
                                width: '40px', 
                                fontSize: '12px', 
                                color: '#8c8c8c',
                                textAlign: 'center',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '4px',
                                padding: '2px 4px'
                              }}>
                                #{play?.displayId || index + 1}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 12, marginLeft: 16 }}>
                                <div style={{ width: 24, display: 'flex', justifyContent: 'center' }}>
                                  {getTypeIcon(play?.type || '')}
                                </div>
                                <div style={{ flex: 1, fontSize: '16px', color: play?.isOpponent ? '#ff7875' : '#fff', fontWeight: play?.isOpponent ? '500' : '400', display: 'flex', gap: 6, alignItems: 'baseline' }}>
                                  {formatPlayDescription(play).actorNode}
                                  <span>{formatPlayDescription(play).text}</span>
                                </div>
                                {play?.score ? (
                                  <div style={{ 
                                    width: 64, 
                                    fontSize: '16px', 
                                    fontWeight: '700', 
                                    textAlign: 'right',
                                    color: play?.isOpponent ? '#ff4d4f' : '#52c41a',
                                    background: play?.isOpponent ? 'rgba(255,77,79,0.1)' : 'rgba(82, 196, 26, 0.1)',
                                    borderRadius: 8,
                                    padding: '8px 12px'
                                  }}>
                                    {play?.score}
                                  </div>
                                ) : <div style={{ width: 64 }} />}
                                <div style={{ width: 80, textAlign: 'right', color: '#b0b0b0', fontWeight: 600 }}>
                                  {play?.runningScore || ''}
                                </div>
                                <div style={{ width: 100, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                  <Button
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEditEvent(play)}
                                    style={{ 
                                      background: 'rgba(24, 144, 255, 0.1)', 
                                      border: '1px solid rgba(24, 144, 255, 0.3)',
                                      color: '#1890ff'
                                    }}
                                  />
                                  <Button
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    danger
                                    onClick={() => handleDeleteEvent(play)}
                                    style={{ 
                                      background: 'rgba(255, 77, 79, 0.1)', 
                                      border: '1px solid rgba(255, 77, 79, 0.3)'
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ 
                        padding: '40px', 
                        textAlign: 'center', 
                        color: '#b0b0b0',
                        fontSize: '16px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '8px'
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏀</div>
                        <div>No play-by-play data available for this game</div>
                        <div style={{ fontSize: '14px', marginTop: '8px', color: '#8c8c8c' }}>
                          Play-by-play data will appear here when available from live stat tracking
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            }
          ]}
        />
      </Card>
      
      {/* Event Editor Modal */}
      <EventEditor
        event={editingEvent}
        isOpen={isEventEditorOpen}
        onClose={() => {
          setIsEventEditorOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleEventSave}
        onDelete={handleEventDelete}
        players={players}
        isPostGame={true}
      />
      
      {/* Box Score Editor Modal - COMMENTED OUT */}
      {/* <BoxScoreEditor
        gameId={gameAnalysisData?.actualGameId || gameId}
        isOpen={isBoxScoreEditorOpen}
        onClose={() => setIsBoxScoreEditorOpen(false)}
        onSave={handleBoxScoreSave}
        gameData={gameAnalysisData}
      /> */}
      
      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Event"
        open={isDeleteModalOpen}
        onOk={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeletingEvent(null);
        }}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this event?</p>
        <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>This action cannot be undone.</p>
        
      </Modal>
    </main>
  );
}
