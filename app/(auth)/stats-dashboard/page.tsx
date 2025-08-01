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
  SettingOutlined
} from '@ant-design/icons';

// Mock data service
const mockStatsService = {
  getTeamStats: async () => ({
    wins: 18,
    losses: 6,
    winPercentage: 75,
    ppg: 108.5,
    oppg: 98.2,
    fgPct: 47.2,
    threePct: 36.8,
    ftPct: 78.5,
    rebounds: 42.3,
    assists: 24.1,
    steals: 8.7,
    blocks: 4.2,
    turnovers: 12.8,
    fouls: 18.5
  }),

  getPlayerStats: async () => [
    { id: 1, name: "John Smith", position: "PG", number: "3", ppg: 22.3, apg: 5.8, rpg: 3.2, spg: 1.5, fgPct: 48.5, threePct: 38.2, ftPct: 85.1, games: 24, trend: 'improving' },
    { id: 2, name: "Mike Johnson", position: "SG", number: "12", ppg: 18.7, apg: 3.1, rpg: 4.8, spg: 2.1, fgPct: 45.2, threePct: 41.5, ftPct: 79.3, games: 24, trend: 'steady' },
    { id: 3, name: "David Wilson", position: "SF", number: "23", ppg: 15.4, apg: 2.9, rpg: 6.2, spg: 1.8, fgPct: 46.8, threePct: 35.1, ftPct: 72.4, games: 24, trend: 'rapidly_improving' },
    { id: 4, name: "Chris Brown", position: "PF", number: "34", ppg: 12.8, apg: 1.7, rpg: 8.9, spg: 0.9, fgPct: 52.1, threePct: 28.5, ftPct: 68.7, games: 24, trend: 'improving' },
    { id: 5, name: "Alex Davis", position: "C", number: "55", ppg: 10.2, apg: 1.2, rpg: 11.4, spg: 0.6, fgPct: 54.3, threePct: 0, ftPct: 61.2, games: 24, trend: 'steady' }
  ],

  getGameStats: async () => [
    { id: 1, opponent: "Lakers", date: "2024-01-15", result: "W", score: "108-95", margin: 13, ppg: 108, oppg: 95, fgPct: 48.2, threePct: 37.5, ftPct: 82.1 },
    { id: 2, opponent: "Warriors", date: "2024-01-18", result: "L", score: "102-110", margin: -8, ppg: 102, oppg: 110, fgPct: 44.8, threePct: 32.1, ftPct: 75.6 },
    { id: 3, opponent: "Celtics", date: "2024-01-20", result: "W", score: "115-98", margin: 17, ppg: 115, oppg: 98, fgPct: 49.1, threePct: 39.2, ftPct: 84.3 },
    { id: 4, opponent: "Heat", date: "2024-01-22", result: "W", score: "105-92", margin: 13, ppg: 105, oppg: 92, fgPct: 47.3, threePct: 36.8, ftPct: 79.8 },
    { id: 5, opponent: "Nets", date: "2024-01-25", result: "L", score: "98-104", margin: -6, ppg: 98, oppg: 104, fgPct: 43.2, threePct: 31.5, ftPct: 71.4 },
    { id: 6, opponent: "Bulls", date: "2024-01-28", result: "W", score: "112-99", margin: 13, ppg: 112, oppg: 99, fgPct: 46.8, threePct: 38.9, ftPct: 81.2 }
  ],

  getPerformanceTrends: async () => [
    { game: 1, ppg: 105, oppg: 98, fgPct: 46.2, threePct: 35.1 },
    { game: 2, ppg: 108, oppg: 102, fgPct: 47.1, threePct: 36.8 },
    { game: 3, ppg: 112, oppg: 99, fgPct: 48.3, threePct: 38.2 },
    { game: 4, ppg: 110, oppg: 101, fgPct: 47.8, threePct: 37.5 },
    { game: 5, ppg: 115, oppg: 97, fgPct: 49.1, threePct: 39.2 },
    { game: 6, ppg: 108, oppg: 95, fgPct: 47.2, threePct: 36.8 }
  ],

  getAdvancedStats: async () => ({
    pace: 98.3,
    possessions: 95.2,
    offensiveEfficiency: 114.2,
    defensiveEfficiency: 103.1,
    netRating: 11.1,
    trueShootingPct: 56.8,
    effectiveFgPct: 52.4,
    turnoverRate: 12.8,
    offensiveReboundRate: 28.5,
    defensiveReboundRate: 71.5,
    freeThrowRate: 0.24,
    threePointRate: 0.35
  })
};

// Custom hooks for data management
const useStatsData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [teamStats, playerStats, gameStats, trends, advancedStats] = await Promise.all([
          mockStatsService.getTeamStats(),
          mockStatsService.getPlayerStats(),
          mockStatsService.getGameStats(),
          mockStatsService.getPerformanceTrends(),
          mockStatsService.getAdvancedStats()
        ]);

        setData({
          teamStats,
          playerStats,
          gameStats,
          trends,
          advancedStats
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const refetch = () => {
    setLoading(true);
    setError(null);
    // Simulate refetch
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return { data, loading, error, refetch };
};

const useFilters = () => {
  const [filters, setFilters] = useState({
    timeRange: 'season',
    player: null,
    gameType: 'all'
  });

  return { filters, setFilters };
};

const StatsModule = ({ title, children, icon, minHeight = '280px', maxHeight = '320px' }: any) => (
  <div
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
  const { data, loading, error, refetch } = useStatsData();
  const { filters, setFilters } = useFilters();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebar-collapsed');
      setSidebarCollapsed(stored === 'true');
    }

    const handleStorageChange = () => {
      const stored = localStorage.getItem('sidebar-collapsed');
      setSidebarCollapsed(stored === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    const handleSidebarToggle = () => {
      const stored = localStorage.getItem('sidebar-collapsed');
      setSidebarCollapsed(stored === 'true');
    };

    window.addEventListener('sidebar-toggle', handleSidebarToggle);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  const columnGap = sidebarCollapsed ? '8px' : '12px';

  // Export functionality from Live Stats Tracker
  const exportStatsData = (format: 'csv' | 'json' | 'pdf') => {
    const exportData: any = {
      exportTime: new Date().toISOString(),
      filters: filters,
      teamStats: data.teamStats,
      playerStats: data.playerStats,
      gameStats: data.gameStats,
      trends: data.trends,
      advancedStats: data.advancedStats
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
      sections.push(`Wins,${exportData.teamStats.wins}`);
      sections.push(`Losses,${exportData.teamStats.losses}`);
      sections.push(`Win Percentage,${exportData.teamStats.winPercentage}%`);
      sections.push(`Points Per Game,${exportData.teamStats.ppg}`);
      sections.push(`Opponent PPG,${exportData.teamStats.oppg}`);
      sections.push(`Field Goal %,${exportData.teamStats.fgPct}%`);
      sections.push(`Three Point %,${exportData.teamStats.threePct}%`);
      sections.push(`Free Throw %,${exportData.teamStats.ftPct}%`);
      sections.push(`Rebounds,${exportData.teamStats.rebounds}`);
      sections.push(`Assists,${exportData.teamStats.assists}`);
      sections.push(`Steals,${exportData.teamStats.steals}`);
      sections.push(`Blocks,${exportData.teamStats.blocks}`);
      sections.push(`Turnovers,${exportData.teamStats.turnovers}`);
      sections.push(`Fouls,${exportData.teamStats.fouls}`);
      sections.push('');
    }
    
    // Player Stats Section
    if (exportData.playerStats) {
      sections.push('PLAYER STATISTICS');
      sections.push('Name,Position,Number,PPG,APG,RPG,SPG,FG%,3PT%,FT%,Games,Trend');
      exportData.playerStats.forEach((player: any) => {
        sections.push(`${player.name},${player.position},${player.number},${player.ppg},${player.apg},${player.rpg},${player.spg},${player.fgPct}%,${player.threePct}%,${player.ftPct}%,${player.games},${player.trend}`);
      });
      sections.push('');
    }
    
    // Game Stats Section
    if (exportData.gameStats) {
      sections.push('GAME STATISTICS');
      sections.push('Opponent,Date,Result,Score,Margin,PPG,OPPG,FG%,3PT%,FT%');
      exportData.gameStats.forEach((game: any) => {
        sections.push(`${game.opponent},${game.date},${game.result},${game.score},${game.margin},${game.ppg},${game.oppg},${game.fgPct}%,${game.threePct}%,${game.ftPct}%`);
      });
      sections.push('');
    }
    
    // Advanced Stats Section
    if (exportData.advancedStats) {
      sections.push('ADVANCED STATISTICS');
      sections.push('Metric,Value');
      sections.push(`Pace,${exportData.advancedStats.pace}`);
      sections.push(`Possessions,${exportData.advancedStats.possessions}`);
      sections.push(`Offensive Efficiency,${exportData.advancedStats.offensiveEfficiency}`);
      sections.push(`Defensive Efficiency,${exportData.advancedStats.defensiveEfficiency}`);
      sections.push(`Net Rating,${exportData.advancedStats.netRating}`);
      sections.push(`True Shooting %,${exportData.advancedStats.trueShootingPct}%`);
      sections.push(`Effective FG %,${exportData.advancedStats.effectiveFgPct}%`);
      sections.push(`Turnover Rate,${exportData.advancedStats.turnoverRate}%`);
      sections.push(`Offensive Rebound Rate,${exportData.advancedStats.offensiveReboundRate}%`);
      sections.push(`Defensive Rebound Rate,${exportData.advancedStats.defensiveReboundRate}%`);
      sections.push(`Free Throw Rate,${exportData.advancedStats.freeThrowRate}`);
      sections.push(`Three Point Rate,${exportData.advancedStats.threePointRate}`);
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
            <Button size="small" danger onClick={refetch}>
              Retry
            </Button>
          }
        />
      </main>
    );
  }

  const { teamStats, playerStats, gameStats, trends, advancedStats } = data;

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
            Stats Dashboard
          </h1>
          <p style={{ color: '#b0b0b0', margin: '4px 0 0 0', fontSize: '14px' }}>
            Comprehensive team and player statistics
          </p>
        </div>
        
        <Space size="middle">
          <Select
            placeholder="Time Range"
            value={filters.timeRange}
            onChange={(value) => setFilters({ ...filters, timeRange: value })}
            style={{ width: 140 }}
            options={[
              { value: 'season', label: 'This Season' },
              { value: 'month', label: 'This Month' },
              { value: 'week', label: 'This Week' },
              { value: 'custom', label: 'Custom' }
            ]}
          />
          <ActionButton icon={<ReloadOutlined />} onClick={refetch}>
            Refresh
          </ActionButton>
          <ActionButton icon={<DownloadOutlined />} type="primary" style={{ color: '#ffffff' }} onClick={() => setShowExportModal(true)}>
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
                  {teamStats.wins}-{teamStats.losses}
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
                  {teamStats.winPercentage}%
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
                  {advancedStats.netRating}
                </div>
                <div style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>Net Rating</div>
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
                  {teamStats.ppg}
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
                  {teamStats.oppg}
                </div>
                <div style={{ color: '#b0b0b0', fontSize: '12px' }}>Opponent PPG</div>
              </div>
            </div>
          </StatsModule>

          {/* Performance Trends Module */}
          <StatsModule title="Performance Trends" icon={<RiseOutlined />} minHeight="240px">
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
          </StatsModule>

          {/* Player Performance Module */}
          <StatsModule title="Player Performance" icon={<UserOutlined />} minHeight="380px" maxHeight="420px">
            <div style={{ marginBottom: '16px' }}>
              <Select
                placeholder="Select a player"
                value={selectedPlayer}
                onChange={setSelectedPlayer}
                style={{ width: '100%' }}
                options={playerStats.map((player: any) => ({
                  value: player.id,
                  label: `${player.name} (${player.position})`
                }))}
              />
            </div>
            
            {selectedPlayer && (() => {
              const player = playerStats.find((p: any) => p.id === selectedPlayer);
              
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
                        {player.ppg}
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
                        {player.apg}
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
                        {player.rpg}
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
                        {player.fgPct}%
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
                        {player.threePct}%
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
                          color: player.trend === 'rapidly_improving' ? '#52c41a' : 
                                 player.trend === 'improving' ? '#1890ff' : 
                                 player.trend === 'steady' ? '#faad14' : '#ff4d4f',
                          fontSize: '16px',
                          fontWeight: '600'
                        }}>
                          {player.trend === 'rapidly_improving' ? '↗↗' : 
                           player.trend === 'improving' ? '↗' : 
                           player.trend === 'steady' ? '→' : '↘'}
                        </div>
                        <div style={{ 
                          color: '#ffffff', 
                          fontSize: '14px', 
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {player.trend.replace('_', ' ')}
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500',
                        background: player.trend === 'rapidly_improving' ? 'rgba(82, 196, 26, 0.2)' : 
                                   player.trend === 'improving' ? 'rgba(24, 144, 255, 0.2)' : 
                                   player.trend === 'steady' ? 'rgba(250, 173, 20, 0.2)' : 'rgba(255, 77, 77, 0.2)',
                        color: player.trend === 'rapidly_improving' ? '#52c41a' : 
                               player.trend === 'improving' ? '#1890ff' : 
                               player.trend === 'steady' ? '#faad14' : '#ff4d4f',
                        border: `1px solid ${player.trend === 'rapidly_improving' ? 'rgba(82, 196, 26, 0.3)' : 
                                         player.trend === 'improving' ? 'rgba(24, 144, 255, 0.3)' : 
                                         player.trend === 'steady' ? 'rgba(250, 173, 20, 0.3)' : 'rgba(255, 77, 77, 0.3)'}`
                      }}>
                        {player.trend === 'rapidly_improving' ? '+15%' : 
                         player.trend === 'improving' ? '+8%' : 
                         player.trend === 'steady' ? '0%' : '-5%'}
                      </div>
                    </div>
                    
                    {/* Mini Trend Chart */}
                    <div style={{ 
                      height: '40px', 
                      marginTop: '8px',
                      position: 'relative'
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { game: 1, ppg: player.ppg - 2 },
                          { game: 2, ppg: player.ppg - 1 },
                          { game: 3, ppg: player.ppg },
                          { game: 4, ppg: player.ppg + (player.trend === 'rapidly_improving' ? 3 : player.trend === 'improving' ? 1.5 : 0) },
                          { game: 5, ppg: player.ppg + (player.trend === 'rapidly_improving' ? 5 : player.trend === 'improving' ? 2.5 : 0) },
                          { game: 6, ppg: player.ppg + (player.trend === 'rapidly_improving' ? 8 : player.trend === 'improving' ? 4 : 0) }
                        ]}>
                          <Area 
                            type="monotone" 
                            dataKey="ppg" 
                            stroke={player.trend === 'rapidly_improving' ? '#52c41a' : 
                                    player.trend === 'improving' ? '#1890ff' : 
                                    player.trend === 'steady' ? '#faad14' : '#ff4d4f'}
                            fill={player.trend === 'rapidly_improving' ? 'rgba(82, 196, 26, 0.2)' : 
                                  player.trend === 'improving' ? 'rgba(24, 144, 255, 0.2)' : 
                                  player.trend === 'steady' ? 'rgba(250, 173, 20, 0.2)' : 'rgba(255, 77, 77, 0.2)'}
                            strokeWidth={2}
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
                      {player.trend === 'rapidly_improving' ? 'Strong upward trajectory - excellent form' :
                       player.trend === 'improving' ? 'Consistent improvement - good progress' :
                       player.trend === 'steady' ? 'Stable performance - maintaining level' :
                       'Performance declining - needs attention'}
                    </div>
                  </div>
                </div>
              );
            })()}
          </StatsModule>
        </div>

        {/* Center Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: columnGap }}>
          {/* Recent Games Module */}
          <StatsModule title="Recent Games" icon={<CalendarOutlined />} minHeight="320px">
            <div style={{ 
              maxHeight: '240px', 
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.3) transparent'
            }}>
              {gameStats.map((game: any) => (
                <div key={game.id} style={{
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
                      vs {game.opponent}
                    </div>
                    <div style={{ color: '#b0b0b0', fontSize: '12px' }}>
                      {new Date(game.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      color: game.result === 'W' ? '#52c41a' : '#ff4d4f', 
                      fontSize: '16px', 
                      fontWeight: '600',
                      marginBottom: '2px'
                    }}>
                      {game.result} {game.score}
                    </div>
                    <div style={{ 
                      color: game.margin > 0 ? '#52c41a' : '#ff4d4f', 
                      fontSize: '12px' 
                    }}>
                      {game.margin > 0 ? '+' : ''}{game.margin}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </StatsModule>

          {/* Advanced Stats Module */}
          <StatsModule title="Advanced Metrics" icon={<BarChartOutlined />} minHeight="280px">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.12)'
              }}>
                <div style={{ color: '#1890ff', fontSize: '18px', fontWeight: '600' }}>
                  {advancedStats.offensiveEfficiency}
                </div>
                <div style={{ color: '#b0b0b0', fontSize: '11px' }}>Offensive Efficiency</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.12)'
              }}>
                <div style={{ color: '#ff4d4f', fontSize: '18px', fontWeight: '600' }}>
                  {advancedStats.defensiveEfficiency}
                </div>
                <div style={{ color: '#b0b0b0', fontSize: '11px' }}>Defensive Efficiency</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.12)'
              }}>
                <div style={{ color: '#52c41a', fontSize: '18px', fontWeight: '600' }}>
                  {advancedStats.trueShootingPct}%
                </div>
                <div style={{ color: '#b0b0b0', fontSize: '11px' }}>True Shooting %</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.12)'
              }}>
                <div style={{ color: '#722ed1', fontSize: '18px', fontWeight: '600' }}>
                  {advancedStats.pace}
                </div>
                <div style={{ color: '#b0b0b0', fontSize: '11px' }}>Pace</div>
              </div>
            </div>
          </StatsModule>

          {/* Player Stats Table Module */}
          <StatsModule title="Player Statistics" icon={<UserOutlined />} minHeight="320px">
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
                  FG%: {teamStats.fgPct}% | 3P%: {teamStats.threePct}% | FT%: {teamStats.ftPct}%
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
                  Steals: {teamStats.steals}/game | Blocks: {teamStats.blocks}/game
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
                  Assists: {teamStats.assists}/game | Turnovers: {teamStats.turnovers}/game
                </div>
              </div>
            </div>
          </StatsModule>

          {/* Player Comparison Chart Module */}
          <StatsModule title="Player Comparison" icon={<SwapOutlined />} minHeight="320px">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart 
                data={playerStats.slice(0, 5).map((player: any) => ({
                  name: player.name,
                  ppg: player.ppg,
                  apg: player.apg,
                  rpg: player.rpg,
                  fgPct: player.fgPct,
                  threePct: player.threePct
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#fff" 
                  fontSize={12}
                  tick={{ fill: '#ffffff', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis 
                  stroke="#fff" 
                  fontSize={12}
                  tick={{ fill: '#ffffff', fontSize: 10 }}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    background: '#17375c', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="ppg" fill="#1890ff" name="PPG" radius={[2, 2, 0, 0]} />
                <Bar dataKey="apg" fill="#52c41a" name="APG" radius={[2, 2, 0, 0]} />
                <Bar dataKey="rpg" fill="#722ed1" name="RPG" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </StatsModule>

          {/* Quick Actions Module */}
          <StatsModule title="Quick Actions" icon={<SettingOutlined />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <ActionButton icon={<EyeOutlined />}>
                View Detailed Reports
              </ActionButton>
              <ActionButton icon={<DownloadOutlined />} style={{ color: '#1890f' }} onClick={() => setShowExportModal(true)}>
                Export Data
              </ActionButton>
              <ActionButton icon={<FilterOutlined />}>
                Advanced Filters
              </ActionButton>
              <ActionButton icon={<ReloadOutlined />}>
                Refresh Data
              </ActionButton>
            </div>
          </StatsModule>
        </div>
      </div>

      {/* Export Modal */}
      <Modal
        title="Export Stats Data"
        open={showExportModal}
        onCancel={() => setShowExportModal(false)}
        footer={null}
        width={400}
        style={{ top: 20 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button icon={<DownloadOutlined />} onClick={() => exportStatsData('json')} block>
            Export as JSON
          </Button>
          <Button icon={<DownloadOutlined />} onClick={() => exportStatsData('csv')} block>
            Export as CSV
          </Button>
          <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginTop: '8px' }}>
            Exports include team stats, player stats, game stats, and advanced analytics
          </div>
        </div>
      </Modal>
    </main>
  );
}