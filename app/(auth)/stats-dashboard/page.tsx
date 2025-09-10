'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Statistic, Progress, Table, Tag, Button, Select, DatePicker, Space, Tooltip, Badge, Divider, Spin, Alert, Empty, Modal } from 'antd';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { 
  TrophyOutlined, 
  UserOutlined, 
  CalendarOutlined, 
  FireOutlined, 
  RiseOutlined, 
  TeamOutlined,
  SwapOutlined,
  BarChartOutlined,
  PieChartOutlined,
  AreaChartOutlined,
  DownloadOutlined,
  FilterOutlined,
  ReloadOutlined,
  EyeOutlined,
  SettingOutlined,
  StarOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';



// Custom hooks for data management
const useStatsData = (filters: any) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const season = '2024-25'; // TODO: Make this configurable

      const params = new URLSearchParams({ season });
      if (filters?.timeRange === 'custom' && filters?.startDate && filters?.endDate) {
        params.set('startDate', filters.startDate);
        params.set('endDate', filters.endDate);
      }
      const paramsWithLimit = new URLSearchParams(params);
      paramsWithLimit.set('limit', '10');

      const [teamStatsRes, playerStatsRes, gameStatsRes, trendsRes, advancedStatsRes] = await Promise.all([
        fetch(`/api/stats/team?${params.toString()}`),
        fetch(`/api/stats/players?${params.toString()}`),
        fetch(`/api/stats/games?${paramsWithLimit.toString()}`),
        fetch(`/api/stats/trends?${params.toString()}`),
        fetch(`/api/stats/advanced?${params.toString()}`)
      ]);

      // Check if any response has an error status
      if (!teamStatsRes.ok || !playerStatsRes.ok || !gameStatsRes.ok || !trendsRes.ok || !advancedStatsRes.ok) {
        throw new Error('One or more API endpoints returned an error');
      }

      const [teamStats, playerStats, gameStats, trends, advancedStats] = await Promise.all([
        teamStatsRes.json(),
        playerStatsRes.json(),
        gameStatsRes.json(),
        trendsRes.json(),
        advancedStatsRes.json()
      ]);

      // Validate that the responses are arrays/objects and not error objects
      if (playerStats.error || !Array.isArray(playerStats)) {
        console.error('Player stats API returned error or invalid data:', playerStats);
        throw new Error('Failed to load player statistics');
      }

      if (teamStats.error || typeof teamStats !== 'object') {
        console.error('Team stats API returned error or invalid data:', teamStats);
        throw new Error('Failed to load team statistics');
      }

      if (gameStats.error || !Array.isArray(gameStats)) {
        console.error('Game stats API returned error or invalid data:', gameStats);
        throw new Error('Failed to load game statistics');
      }

      if (trends.error || !Array.isArray(trends)) {
        console.error('Trends API returned error or invalid data:', trends);
        throw new Error('Failed to load trends data');
      }

      if (advancedStats.error || typeof advancedStats !== 'object') {
        console.error('Advanced stats API returned error or invalid data:', advancedStats);
        throw new Error('Failed to load advanced statistics');
      }

      setData({
        teamStats,
        playerStats,
        gameStats,
        trends,
        advancedStats
      });
    } catch (err) {
      console.error('Error fetching stats data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      // Set empty data to prevent map errors
      setData({
        teamStats: {},
        playerStats: [],
        gameStats: [],
        trends: [],
        advancedStats: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchData();
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  return { data, loading, error, refetch };
};

const useFilters = () => {
  const [filters, setFilters] = useState({
    timeRange: 'season',
    player: null,
    gameType: 'all',
    startDate: null as string | null,
    endDate: null as string | null
  });

  return { filters, setFilters };
};

const StatsModule = ({ title, children, icon, minHeight = '280px', maxHeight = '320px', ...props }: any) => (
  <div
    {...props}
    style={{
      background: '#17375c',
      borderRadius: '16px',
      padding: '20px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      width: '100%',
      minHeight,
      maxHeight,
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
        {icon && (
          <div style={{ color: '#B58842', fontSize: '16px' }}>
            {icon}
          </div>
        )}
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          fontSize: '16px',
          color: '#fff'
        }}>
          {title}
        </div>
      </div>
    </div>
    
    {/* Content */}
    <div style={{ flex: 1, overflow: 'hidden' }}>
      {children}
    </div>
  </div>
);

const ActionButton = ({ icon, children, onClick, type = 'default', style }: any) => (
  <button
    onClick={onClick}
    style={{
      background: type === 'primary' ? 'rgba(181, 136, 66, 0.9)' : 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '24px',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      color: '#fff',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      minHeight: '44px',
      ...style
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = type === 'primary' 
        ? 'rgba(181, 136, 66, 1)' 
        : 'rgba(255,255,255,0.15)';
      e.currentTarget.style.transform = 'translateY(-1px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = type === 'primary' 
        ? 'rgba(181, 136, 66, 0.9)' 
        : 'rgba(255,255,255,0.1)';
      e.currentTarget.style.transform = 'translateY(0px)';
    }}
  >
    {icon}
    {children}
  </button>
);

export default function StatsDashboardPage() {
  const filtersData = useFilters();
  const { filters, setFilters } = filtersData || {};
  const statsData = useStatsData(filters);
  const { data, loading, error, refetch } = statsData || {};
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showGameAnalysisModal, setShowGameAnalysisModal] = useState(false);
  const [recordedGames, setRecordedGames] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('sidebar-collapsed');
        setSidebarCollapsed(stored === 'true');
      } catch (error) {
        console.error('Failed to access localStorage:', error);
      }
    }

    const handleStorageChange = () => {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        try {
          const stored = localStorage.getItem('sidebar-collapsed');
          setSidebarCollapsed(stored === 'true');
        } catch (error) {
          console.error('Failed to access localStorage:', error);
        }
      }
    };

    const handleSidebarToggle = () => {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        try {
          const stored = localStorage.getItem('sidebar-collapsed');
          setSidebarCollapsed(stored === 'true');
        } catch (error) {
          console.error('Failed to access localStorage:', error);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('sidebar-toggle', handleSidebarToggle);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('sidebar-toggle', handleSidebarToggle);
      };
    }
  }, []);

  const columnGap = sidebarCollapsed ? '8px' : '12px';

  // Game Analysis functionality
  const fetchRecordedGames = async () => {
    try {
      const response = await fetch('/api/stats/recorded-games?season=2024-25');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recorded games: ${response.status}`);
      }
      
      const games = await response.json();
      
      // Validate that the response is an array
      if (Array.isArray(games)) {
        setRecordedGames(games);
      } else {
        console.error('Invalid response format from recorded games API:', games);
        setRecordedGames([]);
      }
    } catch (error) {
      console.error('Failed to fetch recorded games:', error);
      setRecordedGames([]);
    }
  };

  const handleGameAnalysis = async (gameId: number | undefined) => {
    if (!gameId) {
      console.error('No game ID provided for analysis');
      return;
    }
    
    // Navigate to the game analysis page
    window.location.href = `/stats-dashboard/game-analysis/${gameId}`;
  };

  useEffect(() => {
    fetchRecordedGames();
  }, []);

  // Export functionality from Live Stats Tracker
  const exportStatsData = (format: 'csv' | 'json' | 'pdf') => {
    const exportData: any = {
      exportTime: new Date().toISOString(),
      filters: filters,
      teamStats: data?.teamStats || {},
      playerStats: data?.playerStats || [],
      gameStats: data?.gameStats || [],
      trends: data?.trends || [],
      advancedStats: data?.advancedStats || {}
    };

    if (format === 'json') {
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stats-dashboard-${Date.now()}.json`;
      link.click();
    } else if (format === 'csv') {
      const csvContent = generateStatsCSV(exportData);
      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stats-dashboard-${Date.now()}.csv`;
      link.click();
    }
  };

  const generateStatsCSV = (exportData: any) => {
    const sections: string[] = [];
    
    // Team Stats Section
    if (exportData.teamStats) {
      sections.push('TEAM STATISTICS');
      sections.push('Metric,Value');
      sections.push(`Wins,${exportData.teamStats?.wins || 0}`);
      sections.push(`Losses,${exportData.teamStats?.losses || 0}`);
      sections.push(`Win Percentage,${exportData.teamStats?.winPercentage || 0}%`);
      sections.push(`Points Per Game,${exportData.teamStats?.ppg || 0}`);
      sections.push(`Opponent PPG,${exportData.teamStats?.oppg || 0}`);
      sections.push(`Field Goal %,${exportData.teamStats?.fgPct || 0}%`);
      sections.push(`Three Point %,${exportData.teamStats?.threePct || 0}%`);
      sections.push(`Free Throw %,${exportData.teamStats?.ftPct || 0}%`);
      sections.push(`Rebounds,${exportData.teamStats?.rebounds || 0}`);
      sections.push(`Assists,${exportData.teamStats?.assists || 0}`);
      sections.push(`Steals,${exportData.teamStats?.steals || 0}`);
      sections.push(`Blocks,${exportData.teamStats?.blocks || 0}`);
      sections.push(`Turnovers,${exportData.teamStats?.turnovers || 0}`);
      sections.push(`Fouls,${exportData.teamStats?.fouls || 0}`);
      sections.push('');
    }
    
    // Player Stats Section
    if (exportData.playerStats) {
      sections.push('PLAYER STATISTICS');
      sections.push('Name,Position,Number,PPG,APG,RPG,SPG,FG%,3PT%,FT%,Games,Trend');
      exportData.playerStats.forEach((player: any) => {
        sections.push(`${player?.name || 'Unknown'},${player?.position || 'Unknown'},${player?.number || 'N/A'},${player?.ppg || 0},${player?.apg || 0},${player?.rpg || 0},${player?.spg || 0},${player?.fgPct || 0}%,${player?.threePct || 0}%,${player?.ftPct || 0}%,${player?.games || 0},${player?.trend || 'Unknown'}`);
      });
      sections.push('');
    }
    
    // Game Stats Section
    if (exportData.gameStats) {
      sections.push('GAME STATISTICS');
      sections.push('Opponent,Date,Result,Score,Margin,PPG,OPPG,FG%,3PT%,FT%');
      exportData.gameStats.forEach((game: any) => {
        sections.push(`${game?.opponent || 'Unknown'},${game?.date || 'Unknown'},${game?.result || 'N/A'},${game?.score || '0-0'},${game?.margin || 0},${game?.ppg || 0},${game?.oppg || 0},${game?.fgPct || 0}%,${game?.threePct || 0}%,${game?.ftPct || 0}%`);
      });
      sections.push('');
    }
    
    // Advanced Stats Section
    if (exportData.advancedStats) {
      sections.push('ADVANCED STATISTICS');
      sections.push('Metric,Value');
      sections.push(`Pace,${exportData.advancedStats?.pace || 0}`);
      sections.push(`Possessions,${exportData.advancedStats?.possessions || 0}`);
      sections.push(`Offensive Efficiency,${exportData.advancedStats?.offensiveEfficiency || 0}`);
      sections.push(`Defensive Efficiency,${exportData.advancedStats?.defensiveEfficiency || 0}`);
      sections.push(`Net Rating,${exportData.advancedStats?.netRating || 0}`);
      sections.push(`True Shooting %,${exportData.advancedStats?.trueShootingPct || 0}%`);
      sections.push(`Effective FG %,${exportData.advancedStats?.effectiveFgPct || 0}%`);
      sections.push(`Turnover Rate,${exportData.advancedStats?.turnoverRate || 0}%`);
      sections.push(`Offensive Rebound Rate,${exportData.advancedStats?.offensiveReboundRate || 0}%`);
      sections.push(`Defensive Rebound Rate,${exportData.advancedStats?.defensiveReboundRate || 0}%`);
      sections.push(`Free Throw Rate,${exportData.advancedStats?.freeThrowRate || 0}`);
      sections.push(`Three Point Rate,${exportData.advancedStats?.threePointRate || 0}`);
    }
    
    return sections.join('\n');
  };

  if (loading) {
    return (
      <main style={{ padding: '0 24px 24px 0', minHeight: '100vh', background: '#202c3e' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spin size="large" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: '0 24px 24px 0', minHeight: '100vh', background: '#202c3e' }}>
        <Alert
          message="Error Loading Data"
          description={error}
          type="error"
          showIcon
          action={
                      <Button danger onClick={() => {
            if (typeof refetch === 'function') {
              refetch();
            }
          }}>
            Retry
          </Button>
          }
        />
      </main>
    );
  }

  const { teamStats, playerStats, gameStats, trends, advancedStats } = data || {};

  return (
    <main style={{ padding: '0 24px 24px 0', minHeight: '100vh', background: '#202c3e' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        padding: '2px 0'
      }}>
        <div>
          <h1 style={{ color: '#fff', margin: 0, fontSize: '28px', fontWeight: '600' }}>
            Statistics
          </h1>
          <p style={{ color: '#b0b0b0', margin: '2px 0 0 0', fontSize: '14px' }}>
            Comprehensive Dashboard
          </p>
        </div>
        
                 <Space size="middle">
          {filters?.timeRange === 'custom' ? (
            <DatePicker.RangePicker
              allowClear
              onChange={(values) => {
                const [start, end] = (values as any) || [];
                const startIso = start ? (start as any).startOf('day').toISOString() : null;
                const endIso = end ? (end as any).endOf('day').toISOString() : null;
                if (typeof setFilters === 'function') {
                  setFilters({ ...(filters || {}), startDate: startIso, endDate: endIso });
                }
              }}
            />
          ) : null}
           <ActionButton icon={<BarChartOutlined />} onClick={() => {
             if (typeof window !== 'undefined') {
               window.location.href = '/stats-dashboard/game-analysis';
             }
           }}>
             Game Analysis
           </ActionButton>
           <Select
             placeholder="Time Range"
             value={filters?.timeRange}
             onChange={(value) => {
               if (typeof setFilters === 'function') {
                const next: any = { ...(filters || {}), timeRange: value };
                if (value !== 'custom') {
                  next.startDate = null;
                  next.endDate = null;
                }
                setFilters(next);
               }
             }}
             style={{ width: 140 }}
             options={[
               { value: 'season', label: 'This Season' },
               { value: 'month', label: 'This Month' },
               { value: 'week', label: 'This Week' },
               { value: 'custom', label: 'Custom' }
             ]}
           />
           <ActionButton icon={<ReloadOutlined />} onClick={() => {
             if (typeof refetch === 'function') {
               refetch();
             }
           }}>
             Refresh
           </ActionButton>
                        <ActionButton icon={<DownloadOutlined />} type="primary" style={{ color: '#ffffff' }} onClick={() => {
               if (typeof setShowExportModal === 'function') {
                 setShowExportModal(true);
               }
             }}>
               Export
             </ActionButton>
         </Space>
      </div>

      {/* Dashboard Grid Layout */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 375px',
        gap: '16px',
        minHeight: '800px'
      }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: columnGap }}>
          {/* Team Overview Module */}
          <StatsModule title="Team Overview" icon={<TeamOutlined />}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.12)'
              }}>
                <div style={{ color: '#B58842', fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                  {teamStats?.wins || 0}-{teamStats?.losses || 0}
                </div>
                <div style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>Record</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.12)'
              }}>
                <div style={{ color: '#52c41a', fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                  {teamStats?.winPercentage || 0}%
                </div>
                <div style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>Win %</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.12)'
              }}>
                <div style={{ color: '#1890ff', fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                  {Math.round((((teamStats?.ppg || 0) - (teamStats?.oppg || 0)) * 10)) / 10}
                </div>
                <div style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>Scoring Margin</div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '12px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.12)'
              }}>
                <div style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>
                  {teamStats?.ppg || 0}
                </div>
                <div style={{ color: '#b0b0b0', fontSize: '12px' }}>Points Per Game</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.12)'
              }}>
                <div style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>
                  {teamStats?.oppg || 0}
                </div>
                <div style={{ color: '#b0b0b0', fontSize: '12px' }}>Opponent PPG</div>
              </div>
            </div>
          </StatsModule>

                     {/* Performance Trends Module */}
           <StatsModule title="Performance Trends" icon={<RiseOutlined />} minHeight="240px" data-section="game-analysis">
             {trends && trends.length > 0 ? (
               <ResponsiveContainer width="100%" height={180}>
                 <LineChart data={trends}>
                   <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                   <XAxis dataKey="game" stroke="#fff" fontSize={12} />
                   <YAxis stroke="#fff" fontSize={12} />
                   <RechartsTooltip 
                     contentStyle={{ 
                       background: '#17375c', 
                       border: '1px solid rgba(255,255,255,0.2)',
                       color: '#ffffff',
                       borderRadius: '8px'
                     }}
                   />
                   <Line type="monotone" dataKey="ppg" stroke="#1890ff" strokeWidth={2} dot={{ fill: '#1890ff' }} />
                   <Line type="monotone" dataKey="oppg" stroke="#ff4d4f" strokeWidth={2} dot={{ fill: '#ff4d4f' }} />
                 </LineChart>
               </ResponsiveContainer>
             ) : (
               <div style={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 justifyContent: 'center', 
                 height: '180px',
                 color: '#b0b0b0',
                 fontSize: '14px'
               }}>
                 {loading ? 'Loading performance data...' : 'No performance data available'}
               </div>
             )}
           </StatsModule>

          
        </div>

        {/* Center Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: columnGap }}>
                     {/* Recent Games Module */}
           <StatsModule title="Recent Games" icon={<CalendarOutlined />} minHeight="320px">
             {gameStats && gameStats.length > 0 ? (
               <div style={{ 
                 maxHeight: '240px', 
                 overflowY: 'auto',
                 scrollbarWidth: 'thin',
                 scrollbarColor: 'rgba(255,255,255,0.3) transparent'
               }}>
                 {gameStats.map((game: any) => (
                   <div key={game?.id || Math.random()} style={{
                     display: 'flex',
                     justifyContent: 'space-between',
                     alignItems: 'center',
                     padding: '12px',
                     marginBottom: '8px',
                     background: 'rgba(255,255,255,0.05)',
                     borderRadius: '8px',
                     border: '1px solid rgba(255,255,255,0.1)'
                   }}>
                     <div style={{ flex: 1 }}>
                       <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500', marginBottom: '2px' }}>
                         vs {game?.opponent || 'Unknown'}
                       </div>
                       <div style={{ color: '#b0b0b0', fontSize: '12px' }}>
                         {game?.date ? new Date(game.date).toLocaleDateString() : 'Unknown Date'}
                       </div>
                     </div>
                     <div style={{ textAlign: 'right' }}>
                       <div style={{ 
                         color: game?.result === 'W' ? '#52c41a' : '#ff4d4f', 
                         fontSize: '16px', 
                         fontWeight: '600',
                         marginBottom: '2px'
                       }}>
                         {game?.result || 'N/A'} {game?.score || '0-0'}
                       </div>
                       <div style={{ 
                         color: (game?.margin || 0) > 0 ? '#52c41a' : '#ff4d4f', 
                         fontSize: '12px' 
                       }}>
                         {(game?.margin || 0) > 0 ? '+' : ''}{game?.margin || 0}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div style={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 justifyContent: 'center', 
                 height: '240px',
                 color: '#b0b0b0',
                 fontSize: '14px'
               }}>
                 {loading ? 'Loading recent games...' : 'No recent games data available'}
               </div>
             )}
           </StatsModule>

          {/* Key Team Stats */}
          <StatsModule title="Key Team Stats" icon={<BarChartOutlined />} minHeight="280px">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ color: '#1890ff', fontSize: '18px', fontWeight: '600' }}>
                  {(() => {
                    const a = Number(teamStats?.assists || 0);
                    const t = Number(teamStats?.turnovers || 0);
                    const ratio = t > 0 ? Math.round((a / t) * 100) / 100 : 0;
                    return ratio;
                  })()}
                </div>
                <div style={{ color: '#b0b0b0', fontSize: '11px' }}>Assist / Turnover Ratio</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ color: '#52c41a', fontSize: '18px', fontWeight: '600' }}>
                  {(() => {
                    const s = Number(teamStats?.steals || 0);
                    const t = Number(teamStats?.turnovers || 0);
                    const ratio = t > 0 ? Math.round((s / t) * 100) / 100 : 0;
                    return ratio;
                  })()}
                </div>
                <div style={{ color: '#b0b0b0', fontSize: '11px' }}>Steal / Turnover Ratio</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ color: '#faad14', fontSize: '18px', fontWeight: '600' }}>
                  {(() => {
                    const b = Number(teamStats?.blocks || 0);
                    const f = Number(teamStats?.fouls || 0);
                    const ratio = f > 0 ? Math.round((b / f) * 100) / 100 : 0;
                    return ratio;
                  })()}
                </div>
                <div style={{ color: '#b0b0b0', fontSize: '11px' }}>Block / Foul Ratio</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ color: '#ff4d4f', fontSize: '18px', fontWeight: '600' }}>{teamStats?.fouls || 0}</div>
                <div style={{ color: '#b0b0b0', fontSize: '11px' }}>Fouls / Game</div>
              </div>
            </div>
          </StatsModule>

                     {/* Player Stats Table Module */}
           <StatsModule title="Player Statistics" icon={<UserOutlined />} minHeight="320px">
             {playerStats && playerStats.length > 0 ? (
               <div style={{ 
                 maxHeight: '240px', 
                 overflowY: 'auto',
                 scrollbarWidth: 'thin',
                 scrollbarColor: 'rgba(255,255,255,0.3) transparent'
               }}>
                 <Table
                   dataSource={playerStats}
                   pagination={false}
                   size="small"
                   style={{ background: 'transparent' }}
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
                           padding: '8px 12px', 
                           color: '#fff',
                           fontSize: '12px'
                         }}>
                           {children}
                         </td>
                       )
                     }
                   }}
                 >
                   <Table.Column 
                     title="Player" 
                     dataIndex="name" 
                     key="name"
                     render={(text: string, record: any) => (
                       <div>
                         <div style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>
                           {text}
                         </div>
                         <div style={{ color: '#b0b0b0', fontSize: '10px' }}>
                           {record.position} #{record.number}
                         </div>
                       </div>
                     )}
                   />
                   <Table.Column 
                     title="PPG" 
                     dataIndex="ppg" 
                     key="ppg"
                     render={(value: number) => (
                       <span style={{ color: '#B58842', fontWeight: '600' }}>{value}</span>
                     )}
                   />
                   <Table.Column 
                     title="APG" 
                     dataIndex="apg" 
                     key="apg"
                     render={(value: number) => (
                       <span style={{ color: '#1890ff', fontWeight: '600' }}>{value}</span>
                     )}
                   />
                   <Table.Column 
                     title="RPG" 
                     dataIndex="rpg" 
                     key="rpg"
                     render={(value: number) => (
                       <span style={{ color: '#52c41a', fontWeight: '600' }}>{value}</span>
                     )}
                   />
                 </Table>
               </div>
             ) : (
               <div style={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 justifyContent: 'center', 
                 height: '240px',
                 color: '#b0b0b0',
                 fontSize: '14px'
               }}>
                 {loading ? 'Loading player statistics...' : 'No player statistics available'}
               </div>
             )}
           </StatsModule>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: columnGap }}>
          {/* Team Stats Summary Module */}
          <StatsModule title="Team Stats" icon={<TrophyOutlined />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid rgba(255,255,255,0.12)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#fff' }}>
                  Shooting Efficiency
                </div>
                <div style={{ fontSize: '12px', color: '#b0b0b0' }}>
                  FG%: {teamStats?.fgPct || 0}% | 3P%: {teamStats?.threePct || 0}% | FT%: {teamStats?.ftPct || 0}%
                </div>
              </div>
              
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid rgba(255,255,255,0.12)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#fff' }}>
                  Defensive Metrics
                </div>
                <div style={{ fontSize: '12px', color: '#b0b0b0' }}>
                  Steals: {teamStats?.steals || 0}/game | Blocks: {teamStats?.blocks || 0}/game
                </div>
              </div>
              
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid rgba(255,255,255,0.12)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#fff' }}>
                  Ball Control
                </div>
                <div style={{ fontSize: '12px', color: '#b0b0b0' }}>
                  Assists: {teamStats?.assists || 0}/game | Turnovers: {teamStats?.turnovers || 0}/game
                </div>
              </div>
            </div>
          </StatsModule>

          {/* Player Performance Module */}
          <StatsModule title="Player Performance" icon={<UserOutlined />} minHeight="380px" maxHeight="420px">
            <div style={{ marginBottom: '16px' }}>
              <Select
                placeholder="Select a player"
                value={selectedPlayer}
                onChange={(value) => {
                 if (typeof setSelectedPlayer === 'function') {
                   setSelectedPlayer(value);
                 }
               }}
                style={{ width: '100%' }}
                options={playerStats ? playerStats.map((player: any) => ({
                  value: player.id,
                  label: `${player.name} - ${player?.number ? `#${player.number}` : '#--'} | ${player?.position||'Pos'}`
                })) : []}
              />
            </div>
            
            {selectedPlayer && playerStats ? (() => {
              const player = playerStats.find((p: any) => p.id === selectedPlayer);
              
              if (!player) return null;

              const series = Array.isArray(player?.recentPoints) ? player.recentPoints.map((p: any, idx: number) => ({ game: idx + 1, ppg: p.points })) : [];
              const firstPts = series.length ? series[0].ppg : 0;
              const lastPts = series.length ? series[series.length - 1].ppg : 0;
              const changePct = firstPts > 0 ? Math.round(((lastPts - firstPts) / firstPts) * 100) : (lastPts > 0 ? 100 : 0);
              
              return (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '10px 8px',
                      textAlign: 'center',
                      border: '1px solid rgba(255,255,255,0.12)',
                      minHeight: '60px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <div style={{ color: '#B58842', fontSize: '18px', fontWeight: '600', lineHeight: '1.2' }}>
                        {player?.ppg || 0}
                      </div>
                      <div style={{ color: '#b0b0b0', fontSize: '11px', marginTop: '2px' }}>PPG</div>
                    </div>
                    <div style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '10px 8px',
                      textAlign: 'center',
                      border: '1px solid rgba(255,255,255,0.12)',
                      minHeight: '60px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <div style={{ color: '#B58842', fontSize: '18px', fontWeight: '600', lineHeight: '1.2' }}>
                        {player?.apg || 0}
                      </div>
                      <div style={{ color: '#b0b0b0', fontSize: '11px', marginTop: '2px' }}>APG</div>
                    </div>
                    <div style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '10px 8px',
                      textAlign: 'center',
                      border: '1px solid rgba(255,255,255,0.12)',
                      minHeight: '60px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <div style={{ color: '#B58842', fontSize: '18px', fontWeight: '600', lineHeight: '1.2' }}>
                        {player?.rpg || 0}
                      </div>
                      <div style={{ color: '#b0b0b0', fontSize: '11px', marginTop: '2px' }}>RPG</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '10px 8px',
                      textAlign: 'center',
                      border: '1px solid rgba(255,255,255,0.12)',
                      minHeight: '50px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <div style={{ color: '#B58842', fontSize: '15px', fontWeight: '600', lineHeight: '1.2' }}>
                        {player?.fgPct || 0}%
                      </div>
                      <div style={{ color: '#b0b0b0', fontSize: '11px', marginTop: '2px' }}>FG%</div>
                    </div>
                    <div style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '10px 8px',
                      textAlign: 'center',
                      border: '1px solid rgba(255,255,255,0.12)',
                      minHeight: '50px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <div style={{ color: '#B58842', fontSize: '15px', fontWeight: '600', lineHeight: '1.2' }}>
                        {player?.threePct || 0}%
                      </div>
                      <div style={{ color: '#b0b0b0', fontSize: '11px', marginTop: '2px' }}>3P%</div>
                    </div>
                  </div>
                  
                  {/* Enhanced Trend Display */}
                  <div style={{ 
                    marginTop: '16px',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px'
                      }}>
                        <div style={{
                          color: player?.trend === 'rapidly_improving' ? '#52c41a' : 
                                 player?.trend === 'improving' ? '#1890ff' : 
                                 player?.trend === 'steady' ? '#faad14' : '#ff4d4f',
                          fontSize: '16px',
                          fontWeight: '600'
                        }}>
                          {player?.trend === 'rapidly_improving' ? '↗↗' : 
                           player?.trend === 'improving' ? '↗' : 
                           player?.trend === 'steady' ? '→' : '↘'}
                        </div>
                        <div style={{ 
                          color: '#ffffff', 
                          fontSize: '14px', 
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {player?.trend ? player.trend.replace('_', ' ') : 'Unknown'}
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500',
                        background: player?.trend === 'rapidly_improving' ? 'rgba(82, 196, 26, 0.2)' : 
                                   player?.trend === 'improving' ? 'rgba(24, 144, 255, 0.2)' : 
                                   player?.trend === 'steady' ? 'rgba(250, 173, 20, 0.2)' : 'rgba(255, 77, 77, 0.2)',
                        color: player?.trend === 'rapidly_improving' ? '#52c41a' : 
                               player?.trend === 'improving' ? '#1890ff' : 
                               player?.trend === 'steady' ? '#faad14' : '#ff4d4f',
                        border: `1px solid ${player?.trend === 'rapidly_improving' ? 'rgba(82, 196, 26, 0.3)' : 'rgba(24, 144, 255, 0.3)'}`
                      }}>
                        {changePct > 0 ? `+${changePct}%` : `${changePct}%`}
                      </div>
                    </div>
                    
                    {/* Mini Trend Chart */}
                    <div style={{ 
                      height: '40px', 
                      marginTop: '8px',
                      position: 'relative'
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={series.length ? series : [{ game: 1, ppg: player?.ppg || 0 }] }>
                          <RechartsTooltip 
                            formatter={(value: any) => [`${value} pts`, 'Points']}
                            labelFormatter={(_lbl: any, payload: any) => {
                              const g = payload && payload[0] && payload[0].payload ? payload[0].payload.game : 1;
                              return `Game ${g}`;
                            }}
                            contentStyle={{ background: '#17375c', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', borderRadius: '8px' }}
                            labelStyle={{ color: '#b8c5d3' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="ppg" 
                            stroke={player?.trend === 'rapidly_improving' ? '#52c41a' : 
                                    player?.trend === 'improving' ? '#1890ff' : 
                                    player?.trend === 'steady' ? '#faad14' : '#ff4d4f'}
                            fill={player?.trend === 'rapidly_improving' ? 'rgba(82, 196, 26, 0.2)' : 
                                  player?.trend === 'improving' ? 'rgba(24, 144, 255, 0.2)' : 
                                  player?.trend === 'steady' ? 'rgba(250, 173, 20, 0.2)' : 'rgba(255, 77, 77, 0.2)'}
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            activeDot={{ r: 3 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Trend Details */}
                    <div style={{ 
                      marginTop: '8px',
                      fontSize: '11px',
                      color: '#b0b0b0',
                      lineHeight: '1.4'
                    }}>
                      {player?.trend === 'rapidly_improving' ? 'Strong upward trajectory - excellent form' :
                       player?.trend === 'improving' ? 'Consistent improvement - good progress' :
                       player?.trend === 'steady' ? 'Stable performance - maintaining level' :
                       'Performance declining - needs attention'}
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '200px',
                color: '#b0b0b0',
                fontSize: '14px'
              }}>
                {loading ? 'Loading player data...' : 'Select a player to view performance details'}
              </div>
            )}
          </StatsModule>
        </div>
      </div>

      {/* Game Analysis Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChartOutlined style={{ color: '#1890ff' }} />
            <span>Game Analysis</span>
          </div>
        }
        open={showGameAnalysisModal}
        onCancel={() => setShowGameAnalysisModal(false)}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Game Selection Sidebar */}
          <div style={{ width: '300px', borderRight: '1px solid rgba(0,0,0,0.1)', paddingRight: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Select a Game</h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                Choose a recorded game to analyze
              </p>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {recordedGames && recordedGames.length > 0 ? (
                recordedGames.map((game) => (
                  <div
                    key={game?.id || Math.random()}
                    onClick={() => {
                      if (game?.id) {
                        handleGameAnalysis(game.id);
                      }
                    }}
                    style={{
                      padding: '20px',
                      border: '1px solid rgba(24, 144, 255, 0.3)',
                      borderRadius: '8px',
                      background: 'rgba(24, 144, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginBottom: '12px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.2)';
                      e.currentTarget.style.border = '1px solid rgba(24, 144, 255, 0.6)';
                      e.currentTarget.style.background = 'rgba(24, 144, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.border = '1px solid rgba(24, 144, 255, 0.3)';
                      e.currentTarget.style.background = 'rgba(24, 144, 255, 0.05)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '16px', fontWeight: '600' }}>vs {game?.opponent || 'Unknown'}</div>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: game?.result === 'W' ? 'rgba(82, 196, 26, 0.2)' : 'rgba(255, 77, 77, 0.2)',
                        color: game?.result === 'W' ? '#52c41a' : '#ff4d4f',
                        border: `1px solid ${game?.result === 'W' ? 'rgba(82, 196, 26, 0.3)' : 'rgba(255, 77, 77, 0.3)'}`
                      }}>
                        {game?.result || 'N/A'}
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                      {game?.date ? new Date(game.date).toLocaleDateString() : 'Unknown Date'} • {game?.type || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#1890ff' }}>
                      {game?.score || '0-0'}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: '#666',
                  border: '2px dashed rgba(0,0,0,0.1)',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>No Recorded Games</div>
                  <div style={{ fontSize: '14px' }}>Games recorded in the live stat tracker will appear here</div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div style={{ flex: 1, paddingLeft: '20px' }}>
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <BarChartOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 12px 0', color: '#333' }}>Select a Game to Analyze</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                Choose a game from the left sidebar to view comprehensive analysis including:
              </p>
              <div style={{ marginTop: '20px', textAlign: 'left', maxWidth: '300px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <TeamOutlined style={{ color: '#1890ff', marginRight: '12px' }} />
                  <span style={{ fontSize: '14px', color: '#333' }}>Team Statistics</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <UserOutlined style={{ color: '#52c41a', marginRight: '12px' }} />
                  <span style={{ fontSize: '14px', color: '#333' }}>Player Performance</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <StarOutlined style={{ color: '#722ed1', marginRight: '12px' }} />
                  <span style={{ fontSize: '14px', color: '#333' }}>Standout Information</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <SwapOutlined style={{ color: '#faad14', marginRight: '12px' }} />
                  <span style={{ fontSize: '14px', color: '#333' }}>Lineup Comparison</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <PlayCircleOutlined style={{ color: '#ff4d4f', marginRight: '12px' }} />
                  <span style={{ fontSize: '14px', color: '#333' }}>Play-by-Play Log</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </main>
  );
}