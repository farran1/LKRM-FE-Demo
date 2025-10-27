'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Statistic, Progress, Table, Tag, Button, Select, DatePicker, Space, Tooltip, Badge, Divider, Spin, Alert, Empty, Modal, Popover, Checkbox } from 'antd';
import dayjs from 'dayjs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '@/lib/supabase';
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

import PlayerLink from '@/components/PlayerLink';
import GoalsModule from './components/GoalsModule';



// Custom hooks for data management
const useStatsData = (filters: any) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({});

  const fetchData = async () => {
    try {
      if (filters?.timeRange === 'selectGames' && (!filters?.gameIds || filters.gameIds.length === 0)) {
        return; // Wait until at least one game is selected before fetching
      }
      setLoading(true);
      setError(null);
      
      const season = '2025-2026'; // TODO: Make this configurable

      const params = new URLSearchParams({ season });
      
      // Add time range and date filters
      if (filters?.timeRange) {
        params.set('timeRange', filters.timeRange);
      }
      if (filters?.timeRange === 'custom' && filters?.startDate && filters?.endDate) {
        params.set('startDate', filters.startDate);
        params.set('endDate', filters.endDate);
      }
      if (filters?.timeRange === 'selectGames' && Array.isArray(filters?.gameIds) && filters.gameIds.length) {
        params.set('gameIds', filters.gameIds.join(','));
      }
      
      const paramsWithLimit = new URLSearchParams(params);
      paramsWithLimit.set('limit', '10');
      if (filters?.timeRange === 'selectGames' && Array.isArray(filters?.gameIds) && filters.gameIds.length) {
        paramsWithLimit.set('gameIds', filters.gameIds.join(','));
      }

      // Get authentication token for API calls (same pattern as dashboard)
      const { data: { session } } = await supabase.auth.getSession()
      const authHeaders: HeadersInit = session?.access_token ? {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      }

      const [teamStatsRes, playerStatsRes, gameStatsRes, trendsRes, advancedStatsRes] = await Promise.all([
        fetch(`/api/stats/team?${params.toString()}`, {
          headers: authHeaders
        }),
        fetch(`/api/stats/players?${params.toString()}`, {
          headers: authHeaders
        }),
        fetch(`/api/stats/games?${paramsWithLimit.toString()}`, {
          headers: authHeaders
        }),
        fetch(`/api/stats/trends?${params.toString()}`, {
          headers: authHeaders
        }),
        fetch(`/api/stats/advanced?${params.toString()}`, {
          headers: authHeaders
        })
      ]);

      // Check if any response has an error status
      if (!teamStatsRes.ok || !playerStatsRes.ok || !gameStatsRes.ok || !trendsRes.ok || !advancedStatsRes.ok) {
        // Check for authentication errors first
        const responses = [teamStatsRes, playerStatsRes, gameStatsRes, trendsRes, advancedStatsRes];
        const authError = responses.find(res => res.status === 401);
        
        if (authError) {
          throw new Error('Authentication required. Please log in again.');
        }
        
        const forbiddenError = responses.find(res => res.status === 403);
        if (forbiddenError) {
          throw new Error('Insufficient permissions to access statistics.');
        }
        
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
  }, [filters?.timeRange, filters?.startDate, filters?.endDate, filters?.gameIds]);

  return { data, loading, error, refetch };
};

const useFilters = () => {
  const [filters, setFilters] = useState({
    timeRange: 'season',
    player: null,
    gameType: 'all',
    startDate: null as string | null,
    endDate: null as string | null,
    gameIds: [] as string[]
  });

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      timeRange: 'season',
      player: null,
      gameType: 'all',
      startDate: null,
      endDate: null,
      gameIds: []
    });
  };

  return { filters, setFilters, updateFilters, clearFilters };
};

const StatsModule = ({ title, children, icon, minHeight = '280px', maxHeight = '320px', headerActions, ...props }: any) => (
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
      minHeight: minHeight === 'auto' ? 'auto' : minHeight,
      maxHeight: maxHeight === 'none' ? 'none' : maxHeight,
      height: maxHeight === 'none' ? 'auto' : undefined,
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
      {headerActions && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {headerActions}
        </div>
      )}
    </div>
    
    {/* Content */}
    <div style={{
      flex: minHeight === 'auto' ? 'none' : 1,
      overflow: minHeight === 'auto' && maxHeight === 'none' ? 'visible' : minHeight === 'auto' ? 'auto' : 'hidden',
      display: minHeight === 'auto' ? 'block' : 'flex',
      flexDirection: minHeight === 'auto' ? 'column' : 'column',
      maxHeight: minHeight === 'auto' && maxHeight !== 'none' ? `calc(${maxHeight} - 40px)` : 'none'
    }}>
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
  const { filters, setFilters, updateFilters, clearFilters } = filtersData || {};
  const statsData = useStatsData(filters);
  const { data, loading, error, refetch } = statsData || {};
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [selectedMetric, setSelectedMetric] = useState('points');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showGameAnalysisModal, setShowGameAnalysisModal] = useState(false);
  const [recordedGames, setRecordedGames] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'totals' | 'averages'>('totals');
  const [teamStatsPositionFilter, setTeamStatsPositionFilter] = useState<string>('all');
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'name','points','rebounds','assists','steals','blocks','turnovers','fgPct','threePct','ftPct','efficiency','games'
  ]);
  const [sortConfig, setSortConfig] = useState<{ column?: string; order?: 'ascend' | 'descend' }>({});
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Client-side filtering for player stats
  const filteredPlayerStats = useMemo(() => {
    if (!data?.playerStats || !Array.isArray(data.playerStats)) return [];
    
    return [...data.playerStats];
  }, [data?.playerStats]);

  // Team statistics specific filtering by position
  const teamStatsFilteredPlayers = useMemo(() => {
    if (!data?.playerStats || !Array.isArray(data.playerStats)) return [];
    
    let filtered = [...data.playerStats];
    
    // Filter by position group for team stats
    if (teamStatsPositionFilter && teamStatsPositionFilter !== 'all') {
      filtered = filtered.filter((player: any) => {
        const position = player.position?.toUpperCase();
        switch (teamStatsPositionFilter) {
          case 'guards':
            return position === 'G';
          case 'forwards':
            return position === 'F';
          case 'centers':
            return position === 'C';
          default:
            return true;
        }
      });
    }
    
    return filtered;
  }, [data?.playerStats, teamStatsPositionFilter]);

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
      const params = new URLSearchParams({ season: '2025-2026' });
      if (filters?.timeRange) {
        params.set('timeRange', String(filters.timeRange));
      }
      if (filters?.timeRange === 'custom' && filters?.startDate && filters?.endDate) {
        params.set('startDate', String(filters.startDate));
        params.set('endDate', String(filters.endDate));
      }
      if (filters?.timeRange === 'selectGames' && Array.isArray(filters?.gameIds) && filters.gameIds.length) {
        params.set('gameIds', filters.gameIds.join(','));
      }

      // Get authentication token for API calls
      const { data: { session } } = await supabase.auth.getSession()
      const authHeaders: HeadersInit = session?.access_token ? {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      }

      const response = await fetch(`/api/stats/recorded-games?${params.toString()}`, {
        headers: authHeaders
      });
      
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
  }, [filters?.timeRange, filters?.startDate, filters?.endDate]);

  // Export functionality from Live Stats Tracker
  const exportStatsData = async (format: 'csv' | 'json' | 'pdf') => {
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
    } else if (format === 'pdf') {
      await exportToPDF();
    }
  };

  const exportToPDF = async () => {
    if (!dashboardRef.current) {
      console.error('Dashboard ref not found');
      return;
    }

    try {
      // Hide sidebar and other UI elements that shouldn't be in PDF
      const sidebarElement = document.querySelector('.ant-layout-sider') as HTMLElement;
      const originalSidebarStyle = sidebarElement?.style.display;
      if (sidebarElement) {
        sidebarElement.style.display = 'none';
      }

      // Capture the dashboard content
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f1419',
        width: dashboardRef.current.scrollWidth,
        height: dashboardRef.current.scrollHeight,
      });

      // Restore sidebar
      if (sidebarElement) {
        sidebarElement.style.display = originalSidebarStyle || '';
      }

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calculate dimensions to fit the image
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      // Add title
      pdf.setFontSize(20);
      pdf.text('Stats Dashboard Report', pdfWidth / 2, 20, { align: 'center' });
      
      // Add date
      pdf.setFontSize(12);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pdfWidth / 2, 30, { align: 'center' });

      // Add the dashboard image
      pdf.addImage(imgData, 'PNG', imgX, imgY + 20, imgWidth * ratio, imgHeight * ratio);

      // Save the PDF
      pdf.save(`stats-dashboard-${Date.now()}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
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
      sections.push('Name,Position,Number,PPG,APG,RPG,SPG,EFF,FG%,3PT%,FT%,Games,Trend');
      exportData.playerStats.forEach((player: any) => {
        // Calculate EFF for export
        const points = player.points || 0;
        const rebounds = player.rebounds || 0;
        const assists = player.assists || 0;
        const steals = player.steals || 0;
        const blocks = player.blocks || 0;
        const turnovers = player.turnovers || 0;
        const games = player.games || 1;
        const fgMade = player.fgMade || 0;
        const fgAttempted = player.fgAttempted || 0;
        const ftMade = player.ftMade || 0;
        const ftAttempted = player.ftAttempted || 0;
        const missedFg = fgAttempted - fgMade;
        const missedFt = ftAttempted - ftMade;
        const efficiency = (points + rebounds + assists + steals + blocks - missedFg - missedFt - turnovers) / games;
        const roundedEfficiency = Math.round(efficiency * 10) / 10;
        
        sections.push(`${player?.name || 'Unknown'},${player?.position || 'Unknown'},${player?.number || 'N/A'},${player?.ppg || 0},${player?.apg || 0},${player?.rpg || 0},${player?.spg || 0},${isNaN(roundedEfficiency) ? '0.0' : roundedEfficiency},${player?.fgPct || 0}%,${player?.threePct || 0}%,${player?.ftPct || 0}%,${player?.games || 0},${player?.trend || 'Unknown'}`);
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

// Helper to ensure 0 values always sort to bottom for both ascending and descending orders
const compareWithZeroBottom = (aVal: number, bVal: number) => {
  const aZero = aVal === 0;
  const bZero = bVal === 0;

  // Always put zeros at bottom for both directions
  if (aZero && bZero) return 0;
  if (aZero) return 1; // a (0) should come after b (non-zero) - goes to bottom
  if (bZero) return -1; // a (non-zero) should come before b (0) - non-zeros at top

  // For non-zeros, compare numerically (direction handled by caller)
  return aVal - bVal;
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
    const isAuthError = error.includes('Authentication') || error.includes('log in');
    const isPermissionError = error.includes('permissions') || error.includes('Insufficient');
    
    return (
      <main style={{ padding: '0 24px 24px 0', minHeight: '100vh', background: '#202c3e' }}>
        <Alert
          message={isAuthError ? 'Authentication Required' : isPermissionError ? 'Access Denied' : 'Error Loading Statistics'}
          description={
            isAuthError 
              ? 'Please log in again to access the statistics dashboard.' 
              : isPermissionError 
                ? 'You do not have permission to view statistics. Please contact your administrator.'
                : error
          }
          type={isAuthError ? 'warning' : isPermissionError ? 'error' : 'error'}
          showIcon
          action={
            isAuthError ? (
              <Button 
                type="primary" 
                onClick={() => {
                  // Redirect to login page
                  window.location.href = '/login';
                }}
              >
                Log In
              </Button>
            ) : (
              <Button danger onClick={() => {
                if (typeof refetch === 'function') {
                  refetch();
                }
              }}>
                Retry
              </Button>
            )
          }
        />
      </main>
    );
  }

  const { teamStats, playerStats, gameStats, trends, advancedStats } = data || {};

  return (
    <main ref={dashboardRef} style={{ padding: '0 24px 24px 0', minHeight: '100vh', background: '#202c3e' }}>
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
        
        {/* View Toggle */}
        <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
        </div>
        
                 <Space size="middle">
          {/* Date Range Filter or Game Selector */}
          {filters?.timeRange === 'custom' ? (
            <DatePicker.RangePicker
              allowClear
              value={
                filters?.startDate && filters?.endDate
                  ? [dayjs(filters.startDate), dayjs(filters.endDate)]
                  : null as any
              }
              format="MM/DD/YYYY"
              onChange={(values) => {
                const [start, end] = (values as any) || [];
                const startIso = start ? (start as any).startOf('day').toISOString() : null;
                const endIso = end ? (end as any).endOf('day').toISOString() : null;
                updateFilters({ startDate: startIso, endDate: endIso });
              }}
            />
          ) : filters?.timeRange === 'selectGames' ? (
            <Select
              mode="multiple"
              placeholder="Select games"
              value={filters?.gameIds}
              onChange={(vals) => updateFilters({ gameIds: (vals as any[]).map(v => String(v)) })}
              style={{ minWidth: 240 }}
              maxTagCount={2}
              maxTagPlaceholder={(omittedValues) => `+${omittedValues.length} more`}
              optionLabelProp="label"
              options={(
                // Source list: prefer recordedGames when in selectGames mode
                filters?.timeRange === 'selectGames' && Array.isArray(recordedGames) && recordedGames.length
                  ? recordedGames
                  : (data?.gameStats || [])
              )
                // Deduplicate by id to avoid duplicate React keys
                .reduce((acc: any[], item: any) => {
                  const id = String(item?.id ?? '');
                  if (!id) return acc;
                  if (!acc.some((x: any) => String(x.id) === id)) acc.push(item);
                  return acc;
                }, [])
                .map((g: any) => {
                  const id = String(g.id);
                  const label = `${new Date(g.date || g.created_at).toLocaleDateString()} vs ${g.opponent || 'Unknown'} (${g.result || ''} ${g.score || ''})`;
                  return { key: id, value: id, label };
                })}
            />
          ) : null}

          {/* Time Range Selector */}
          <Select
            placeholder="Time Range"
            value={filters?.timeRange}
            onChange={(value) => {
              const next: any = { timeRange: value };
              if (value !== 'custom') {
                next.startDate = null;
                next.endDate = null;
              }
              if (value !== 'selectGames') {
                next.gameIds = [];
              }
              updateFilters(next);
            }}
            style={{ width: 140 }}
            options={[
              { value: 'season', label: 'This Season' },
              { value: 'month', label: 'This Month' },
              { value: 'week', label: 'This Week' },
              { value: 'custom', label: 'Custom' },
              { value: 'selectGames', label: 'Select Games' }
            ]}
          />

          {/* Filter summary removed per request */}

          {/* Action Buttons */}
          <ActionButton icon={<BarChartOutlined />} onClick={() => {
             if (typeof window !== 'undefined') {
               window.location.href = '/stats-dashboard/game-analysis';
             }
           }}>
             Game Analysis
           </ActionButton>
           
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

      {/* Gap above grid layout */}
      <div style={{ height: '16px' }}></div>

      {/* Main Content */}
      {/* Dashboard Grid Layout */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Grid Layout for Other Modules */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 375px',
          gap: '16px'
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
           <StatsModule title="Recent Games" icon={<CalendarOutlined />} minHeight="553px">
             {gameStats && gameStats.length > 0 ? (
               <div style={{ 
                 maxHeight: '553px', 
                 overflowY: 'auto',
                 scrollbarWidth: 'thin',
                 scrollbarColor: 'rgba(255,255,255,0.3) transparent'
               }}>
                 {gameStats.map((game: any) => (
                   <div 
                     key={game?.id || Math.random()} 
                     onClick={() => {
                       if (game?.id && typeof window !== 'undefined') {
                         window.location.href = `/stats-dashboard/game-analysis/${game.id}`;
                       }
                     }}
                     style={{
                       display: 'flex',
                       justifyContent: 'space-between',
                       alignItems: 'center',
                       padding: '12px',
                       marginBottom: '8px',
                       background: 'rgba(255,255,255,0.05)',
                       borderRadius: '8px',
                       border: '1px solid rgba(255,255,255,0.1)',
                       cursor: 'pointer',
                       transition: 'background-color 0.2s ease'
                     }}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                     }}
                   >
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
                 height: '553px',
                 color: '#b0b0b0',
                 fontSize: '14px'
               }}>
                 {loading ? 'Loading recent games...' : 'No recent games data available'}
               </div>
             )}
           </StatsModule>

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: columnGap }}>

          {/* Player Performance Module */}
          <StatsModule title="Player Performance" icon={<UserOutlined />} minHeight="553px" maxHeight="553px">
            <div style={{ marginBottom: '20px' }}>
              <Select
                placeholder="Select a player"
                value={selectedPlayer}
                onChange={(value) => {
                 if (typeof setSelectedPlayer === 'function') {
                   setSelectedPlayer(value);
                 }
               }}
                style={{ width: '100%' }}
                options={filteredPlayerStats ? filteredPlayerStats.map((player: any) => ({
                  value: player.id,
                  label: `${player.name} - ${player?.number ? `#${player.number}` : '#--'} | ${player?.position || 'Pos'}`
                })) : []}
              />
            </div>
            
            {selectedPlayer && filteredPlayerStats ? (() => {
              const player = filteredPlayerStats.find((p: any) => p.id === selectedPlayer);
              
              if (!player) return null;
              
              // Transform data based on selected metric
              const getSeriesData = () => {
                if (!Array.isArray(player?.recentPoints)) return [];
                
                return player.recentPoints.map((p: any, idx: number) => {
                  const gameData: any = { 
                    game: idx + 1,
                    gameName: p.gameName || `Game ${idx + 1}`
                  };
                  
                  switch (selectedMetric) {
                    case 'points':
                      gameData.value = p.points;
                      gameData.label = 'Points';
                      gameData.unit = 'pts';
                      break;
                    case 'rebounds':
                      gameData.value = p.rebounds || 0;
                      gameData.label = 'Rebounds';
                      gameData.unit = 'reb';
                      break;
                    case 'assists':
                      gameData.value = p.assists || 0;
                      gameData.label = 'Assists';
                      gameData.unit = 'ast';
                      break;
                    case 'steals':
                      gameData.value = p.steals || 0;
                      gameData.label = 'Steals';
                      gameData.unit = 'stl';
                      break;
                    case 'blocks':
                      gameData.value = p.blocks || 0;
                      gameData.label = 'Blocks';
                      gameData.unit = 'blk';
                      break;
                    default:
                      gameData.value = p.points;
                      gameData.label = 'Points';
                      gameData.unit = 'pts';
                  }
                  
                  return gameData;
                });
              };

              const series = getSeriesData();
              
              // Calculate trend and percentage change based on selected metric
              const calculateTrend = () => {
                if (series.length < 2) {
                  return { trend: 'steady', changePct: 0 };
                }
                
                const firstValue = series[0].value;
                const lastValue = series[series.length - 1].value;
                
                let changePct = 0;
                if (firstValue > 0) {
                  changePct = Math.round(((lastValue - firstValue) / firstValue) * 100);
                } else if (lastValue > 0) {
                  changePct = 100; // Went from 0 to some value
                }
                
                let trend = 'steady';
                if (changePct > 25) trend = 'rapidly_improving';
                else if (changePct > 5) trend = 'improving';
                else if (changePct < -25) trend = 'declining';
                else trend = 'steady';
                
                return { trend, changePct };
              };
              
              const { trend: dynamicTrend, changePct: dynamicChangePct } = calculateTrend();
              
              return (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '18px' }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '14px 10px',
                      textAlign: 'center',
                      border: '1px solid rgba(255,255,255,0.12)',
                      minHeight: '70px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <div style={{ color: '#B58842', fontSize: '20px', fontWeight: '600', lineHeight: '1.2' }}>
                        {player?.ppg || 0}
                      </div>
                      <div style={{ color: '#b0b0b0', fontSize: '12px', marginTop: '4px' }}>PPG</div>
                    </div>
                    <div style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '14px 10px',
                      textAlign: 'center',
                      border: '1px solid rgba(255,255,255,0.12)',
                      minHeight: '70px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <div style={{ color: '#B58842', fontSize: '20px', fontWeight: '600', lineHeight: '1.2' }}>
                        {player?.apg || 0}
                      </div>
                      <div style={{ color: '#b0b0b0', fontSize: '12px', marginTop: '4px' }}>APG</div>
                    </div>
                    <div style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '14px 10px',
                      textAlign: 'center',
                      border: '1px solid rgba(255,255,255,0.12)',
                      minHeight: '70px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <div style={{ color: '#B58842', fontSize: '20px', fontWeight: '600', lineHeight: '1.2' }}>
                        {player?.rpg || 0}
                      </div>
                      <div style={{ color: '#b0b0b0', fontSize: '12px', marginTop: '4px' }}>RPG</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '18px' }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '14px 10px',
                      textAlign: 'center',
                      border: '1px solid rgba(255,255,255,0.12)',
                      minHeight: '60px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <div style={{ color: '#B58842', fontSize: '17px', fontWeight: '600', lineHeight: '1.2' }}>
                        {player?.fgPct || 0}%
                      </div>
                      <div style={{ color: '#b0b0b0', fontSize: '12px', marginTop: '4px' }}>FG%</div>
                    </div>
                    <div style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '14px 10px',
                      textAlign: 'center',
                      border: '1px solid rgba(255,255,255,0.12)',
                      minHeight: '60px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <div style={{ color: '#B58842', fontSize: '17px', fontWeight: '600', lineHeight: '1.2' }}>
                        {player?.threePct || 0}%
                      </div>
                      <div style={{ color: '#b0b0b0', fontSize: '12px', marginTop: '4px' }}>3P%</div>
                    </div>
                  </div>
                  
                  {/* Enhanced Trend Display */}
                  <div style={{ 
                    marginTop: '20px',
                    padding: '16px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {/* Header with Dropdown and Trend */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                      gap: '12px'
                    }}>
                      {/* Metric Selection Dropdown */}
                      <div style={{ flex: '0 0 140px' }}>
                        <Select
                          value={selectedMetric}
                          onChange={setSelectedMetric}
                          style={{ width: '100%' }}
                          size="small"
                          placeholder="Select metric"
                          options={[
                            { value: 'points', label: 'Points' },
                            { value: 'rebounds', label: 'Rebounds' },
                            { value: 'assists', label: 'Assists' },
                            { value: 'steals', label: 'Steals' },
                            { value: 'blocks', label: 'Blocks' }
                          ]}
                        />
                      </div>
                      
                      {/* Trend Indicator */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        flex: '1'
                      }}>
                        <div style={{
                          color: dynamicTrend === 'rapidly_improving' ? '#52c41a' : 
                                 dynamicTrend === 'improving' ? '#1890ff' : 
                                 dynamicTrend === 'steady' ? '#faad14' : '#ff4d4f',
                          fontSize: '16px',
                          fontWeight: '600'
                        }}>
                          {dynamicTrend === 'rapidly_improving' ? '↗↗' : 
                           dynamicTrend === 'improving' ? '↗' : 
                           dynamicTrend === 'steady' ? '→' : '↘'}
                        </div>
                        <div style={{ 
                          color: '#ffffff', 
                          fontSize: '14px', 
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {dynamicTrend ? dynamicTrend.replace('_', ' ') : 'Unknown'}
                        </div>
                      </div>
                      
                      {/* Percentage Badge */}
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: dynamicTrend === 'rapidly_improving' ? 'rgba(82, 196, 26, 0.15)' : 
                                   dynamicTrend === 'improving' ? 'rgba(24, 144, 255, 0.15)' : 
                                   dynamicTrend === 'steady' ? 'rgba(250, 173, 20, 0.15)' : 'rgba(255, 77, 77, 0.15)',
                        color: dynamicTrend === 'rapidly_improving' ? '#52c41a' : 
                               dynamicTrend === 'improving' ? '#1890ff' : 
                               dynamicTrend === 'steady' ? '#faad14' : '#ff4d4f',
                        border: `1px solid ${dynamicTrend === 'rapidly_improving' ? 'rgba(82, 196, 26, 0.3)' : 
                                         dynamicTrend === 'improving' ? 'rgba(24, 144, 255, 0.3)' : 
                                         dynamicTrend === 'steady' ? 'rgba(250, 173, 20, 0.3)' : 'rgba(255, 77, 77, 0.3)'}`,
                        flex: '0 0 auto'
                      }}>
                        {dynamicChangePct > 0 ? `+${dynamicChangePct}%` : `${dynamicChangePct}%`}
                      </div>
                    </div>
                    
                    {/* Trend Chart */}
                    <div style={{ 
                      height: '113px', 
                      marginTop: '12px',
                      position: 'relative'
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={series.length ? series : [{ game: 1, value: 0 }] }>
                          <RechartsTooltip 
                            formatter={(value: any, name: any, props: any) => {
                              const unit = props.payload?.unit || 'pts';
                              return [`${value} ${unit}`, series[0]?.label || 'Points'];
                            }}
                            labelFormatter={(_lbl: any, payload: any) => {
                              const gameName = payload && payload[0] && payload[0].payload ? payload[0].payload.gameName : 'Game';
                              return gameName;
                            }}
                            contentStyle={{ background: '#17375c', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', borderRadius: '8px' }}
                            labelStyle={{ color: '#b8c5d3' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke={dynamicTrend === 'rapidly_improving' ? '#52c41a' : 
                                    dynamicTrend === 'improving' ? '#1890ff' : 
                                    dynamicTrend === 'steady' ? '#faad14' : '#ff4d4f'}
                            fill={dynamicTrend === 'rapidly_improving' ? 'rgba(82, 196, 26, 0.2)' : 
                                  dynamicTrend === 'improving' ? 'rgba(24, 144, 255, 0.2)' : 
                                  dynamicTrend === 'steady' ? 'rgba(250, 173, 20, 0.2)' : 'rgba(255, 77, 77, 0.2)'}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 4 }}
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
                      {(() => {
                        const metricName = series[0]?.label?.toLowerCase() || 'performance';
                        const metricUnit = series[0]?.unit || '';
                        
                        if (dynamicTrend === 'rapidly_improving') {
                          return `Strong upward trajectory in ${metricName} - excellent form`;
                        } else if (dynamicTrend === 'improving') {
                          return `Consistent improvement in ${metricName} - good progress`;
                        } else if (dynamicTrend === 'steady') {
                          return `Stable ${metricName} performance - maintaining level`;
                        } else {
                          return `${metricName.charAt(0).toUpperCase() + metricName.slice(1)} declining - needs attention`;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '400px',
                color: '#b0b0b0',
                fontSize: '14px'
              }}>
                {loading ? 'Loading player data...' : 'Select a player to view performance details'}
              </div>
            )}
          </StatsModule>
        </div>
        </div>
      </div>

      {/* Gap above Team Analytics */}
      <div style={{ height: '16px' }}></div>

      {/* Team Analytics - Full Width */}
      <StatsModule title="Team Analytics" icon={<TrophyOutlined />} minHeight="auto" maxHeight="380px">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch', height: '100%' }}>
          {/* Key Performance Ratios Section */}
          <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', flex: 1 }}>
              <Tooltip title="Assists to Turnovers Ratio" placement="top">
                <div style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '10px 8px',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.12)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <div style={{ color: '#1890ff', fontSize: '28px', fontWeight: '700', marginBottom: '2px' }}>
                    {(() => {
                      const a = Number(teamStats?.assists || 0);
                      const t = Number(teamStats?.turnovers || 0);
                      const ratio = t > 0 ? Math.round((a / t) * 100) / 100 : 0;
                      return ratio;
                    })()}
                  </div>
                  <div style={{ color: '#b0b0b0', fontSize: '18px', fontWeight: '500' }}>A/T</div>
                </div>
              </Tooltip>
              <Tooltip title="Steals to Turnovers Ratio" placement="top">
                <div style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '12px 8px',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.12)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <div style={{ color: '#52c41a', fontSize: '28px', fontWeight: '700', marginBottom: '2px' }}>
                    {(() => {
                      const s = Number(teamStats?.steals || 0);
                      const t = Number(teamStats?.turnovers || 0);
                      const ratio = t > 0 ? Math.round((s / t) * 100) / 100 : 0;
                      return ratio;
                    })()}
                  </div>
                  <div style={{ color: '#b0b0b0', fontSize: '18px', fontWeight: '500' }}>S/T</div>
                </div>
              </Tooltip>
              <Tooltip title="Blocks to Fouls Ratio" placement="top">
                <div style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '12px 8px',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.12)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <div style={{ color: '#faad14', fontSize: '28px', fontWeight: '700', marginBottom: '2px' }}>
                    {(() => {
                      const b = Number(teamStats?.blocks || 0);
                      const f = Number(teamStats?.fouls || 0);
                      const ratio = f > 0 ? Math.round((b / f) * 100) / 100 : 0;
                      return ratio;
                    })()}
                  </div>
                  <div style={{ color: '#b0b0b0', fontSize: '18px', fontWeight: '500' }}>B/F</div>
                </div>
              </Tooltip>
              <Tooltip title="Fouls Per Game" placement="top">
                <div style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '12px 8px',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.12)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <div style={{ color: '#ff4d4f', fontSize: '28px', fontWeight: '700', marginBottom: '2px' }}>{teamStats?.fouls || 0}</div>
                  <div style={{ color: '#b0b0b0', fontSize: '18px', fontWeight: '500' }}>FPG</div>
                </div>
              </Tooltip>
            </div>
          </div>

          {/* Team Performance Metrics Section */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', flex: 1 }}>
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '16px 8px',
                border: '1px solid rgba(255,255,255,0.12)',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#fff', textAlign: 'center' }}>
                  Shooting Efficiency
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', color: '#b0b0b0', fontWeight: '600', marginBottom: '2px' }}>FG%</div>
                    <div style={{ fontSize: '28px', color: '#ffc107', fontWeight: '700' }}>{teamStats?.fgPct || 0}%</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', color: '#b0b0b0', fontWeight: '600', marginBottom: '2px' }}>3P%</div>
                    <div style={{ fontSize: '28px', color: '#ffc107', fontWeight: '700' }}>{teamStats?.threePct || 0}%</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', color: '#b0b0b0', fontWeight: '600', marginBottom: '2px' }}>FT%</div>
                    <div style={{ fontSize: '28px', color: '#ffc107', fontWeight: '700' }}>{teamStats?.ftPct || 0}%</div>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '16px 8px',
                border: '1px solid rgba(255,255,255,0.12)',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#fff', textAlign: 'center' }}>
                  Defensive Metrics
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', color: '#b0b0b0', fontWeight: '600', marginBottom: '2px' }}>Steals</div>
                    <div style={{ fontSize: '32px', color: '#52c41a', fontWeight: '700' }}>{teamStats?.steals || 0}</div>
                    <div style={{ fontSize: '16px', color: '#b0b0b0', fontWeight: '500' }}>per game</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', color: '#b0b0b0', fontWeight: '600', marginBottom: '2px' }}>Blocks</div>
                    <div style={{ fontSize: '32px', color: '#52c41a', fontWeight: '700' }}>{teamStats?.blocks || 0}</div>
                    <div style={{ fontSize: '16px', color: '#b0b0b0', fontWeight: '500' }}>per game</div>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '16px 8px',
                border: '1px solid rgba(255,255,255,0.12)',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#fff', textAlign: 'center' }}>
                  Ball Control
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', color: '#b0b0b0', fontWeight: '600', marginBottom: '2px' }}>Assists</div>
                    <div style={{ fontSize: '32px', color: '#1890ff', fontWeight: '700' }}>{teamStats?.assists || 0}</div>
                    <div style={{ fontSize: '16px', color: '#b0b0b0', fontWeight: '500' }}>per game</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', color: '#b0b0b0', fontWeight: '600', marginBottom: '2px' }}>Turnovers</div>
                    <div style={{ fontSize: '32px', color: '#1890ff', fontWeight: '700' }}>{teamStats?.turnovers || 0}</div>
                    <div style={{ fontSize: '16px', color: '#b0b0b0', fontWeight: '500' }}>per game</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </StatsModule>

      {/* Spacing between modules */}
      <div style={{ height: '12px' }}></div>

      {/* Goals Module */}
      <GoalsModule season="2024-25" onRefresh={refetch} selectedGoalId={selectedGoalId} />

      {/* Spacing between modules */}
      <div style={{ height: '12px' }}></div>

      {/* Full-Width Box Score */}
      <StatsModule
        title="Team Statistics"
        icon={<TeamOutlined />}
        minHeight="auto"
        maxHeight="none"
        headerActions={
          <Space.Compact>
            {/* Position Group Filter for Team Stats */}
            <Select
              placeholder="Filter by Position"
              value={teamStatsPositionFilter}
              onChange={(value) => setTeamStatsPositionFilter(value)}
              style={{ 
                height: '32px',
                width: 160,
                borderColor: 'rgba(255,255,255,0.3)',
                color: '#fff',
                marginRight: '8px',
                borderRadius: '6px'
              }}
              suffixIcon={<FilterOutlined style={{ color: '#fff' }} />}
              options={[
                { value: 'all', label: 'All Positions' },
                { value: 'guards', label: 'Guards (G)' },
                { value: 'forwards', label: 'Forwards (F)' },
                { value: 'centers', label: 'Centers (C)' }
              ]}
            />
            <Button
              type={viewMode === 'averages' ? 'primary' : 'default'}
              onClick={() => setViewMode('averages')}
              style={{
                backgroundColor: viewMode === 'averages' ? '#1890ff' : 'rgba(255,255,255,0.1)',
                borderColor: viewMode === 'averages' ? '#1890ff' : 'rgba(255,255,255,0.3)',
                color: '#fff',
                fontSize: '12px',
                height: '32px',
                padding: '0 12px'
              }}
            >
              Averages
            </Button>
            <Button
              type={viewMode === 'totals' ? 'primary' : 'default'}
              onClick={() => setViewMode('totals')}
              style={{
                backgroundColor: viewMode === 'totals' ? '#1890ff' : 'rgba(255,255,255,0.1)',
                borderColor: viewMode === 'totals' ? '#1890ff' : 'rgba(255,255,255,0.3)',
                color: '#fff',
                fontSize: '12px',
                height: '32px',
                padding: '0 12px'
              }}
            >
              Totals
            </Button>
            <Popover
              trigger="click"
              placement="bottomRight"
              content={(
                <div style={{ minWidth: 220 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Manage Columns</div>
                  <Checkbox.Group
                    value={visibleColumns}
                    onChange={(vals) => setVisibleColumns(vals as string[])}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
                  >
                    <Checkbox value="name">Player</Checkbox>
                    <Checkbox value="points">PTS</Checkbox>
                    <Checkbox value="rebounds">REB</Checkbox>
                    <Checkbox value="assists">AST</Checkbox>
                    <Checkbox value="steals">STL</Checkbox>
                    <Checkbox value="blocks">BLK</Checkbox>
                    <Checkbox value="turnovers">TO</Checkbox>
                    <Checkbox value="fgPct">FG%</Checkbox>
                    <Checkbox value="threePct">3P%</Checkbox>
                    <Checkbox value="ftPct">FT%</Checkbox>
                    <Checkbox value="efficiency">EFF</Checkbox>
                    <Checkbox value="games">Games</Checkbox>
                  </Checkbox.Group>
                </div>
              )}
            >
              <Button icon={<SettingOutlined />} style={{ marginLeft: 8, height: 32 }} />
            </Popover>
          </Space.Compact>
        }
      >
        
        {teamStatsFilteredPlayers && teamStatsFilteredPlayers.length > 0 ? (
          (() => {
            // Transform data based on view mode
            const transformedData = viewMode === 'averages'
              ? teamStatsFilteredPlayers.map((player: any) => ({
                  ...player,
                  points: player.games ? Math.round((player.points || 0) / player.games * 10) / 10 : 0,
                  rebounds: player.games ? Math.round((player.rebounds || 0) / player.games * 10) / 10 : 0,
                  assists: player.games ? Math.round((player.assists || 0) / player.games * 10) / 10 : 0,
                  steals: player.games ? Math.round((player.steals || 0) / player.games * 10) / 10 : 0,
                  blocks: player.games ? Math.round((player.blocks || 0) / player.games * 10) / 10 : 0,
                  turnovers: player.games ? Math.round((player.turnovers || 0) / player.games * 10) / 10 : 0,
                  fgMade: player.games ? Math.round((player.fgMade || 0) / player.games * 10) / 10 : 0,
                  fgAttempted: player.games ? Math.round((player.fgAttempted || 0) / player.games * 10) / 10 : 0,
                  threeMade: player.games ? Math.round((player.threeMade || 0) / player.games * 10) / 10 : 0,
                  threeAttempted: player.games ? Math.round((player.threeAttempted || 0) / player.games * 10) / 10 : 0,
                  ftMade: player.games ? Math.round((player.ftMade || 0) / player.games * 10) / 10 : 0,
                  ftAttempted: player.games ? Math.round((player.ftAttempted || 0) / player.games * 10) / 10 : 0,
                  isTotalRow: false, // Ensure player rows are not marked as totals
                }))
              : teamStatsFilteredPlayers.map((player: any) => ({
                  ...player,
                  isTotalRow: false, // Ensure player rows are not marked as totals
                }));

            // Calculate team averages (per column) to one decimal place
            const round1 = (v: number) => Math.round(v * 10) / 10;
            const averageNonZero = (accessor: (p: any) => number): number => {
              const values: number[] = transformedData
                .map((player: any) => accessor(player))
                .filter((value: number) => value > 0);
              const count: number = values.length;
              if (count === 0) return 0;
              const total: number = values.reduce((acc: number, current: number) => acc + current, 0);
              return round1(total / count);
            };

            const teamAverages = {
              points: averageNonZero((player: any) => player.points || 0),
              rebounds: averageNonZero((player: any) => player.rebounds || 0),
              assists: averageNonZero((player: any) => player.assists || 0),
              steals: averageNonZero((player: any) => player.steals || 0),
              blocks: averageNonZero((player: any) => player.blocks || 0),
              turnovers: averageNonZero((player: any) => player.turnovers || 0),
              fgMade: averageNonZero((player: any) => player.fgMade || 0),
              fgAttempted: averageNonZero((player: any) => player.fgAttempted || 0),
              threeMade: averageNonZero((player: any) => player.threeMade || 0),
              threeAttempted: averageNonZero((player: any) => player.threeAttempted || 0),
              ftMade: averageNonZero((player: any) => player.ftMade || 0),
              ftAttempted: averageNonZero((player: any) => player.ftAttempted || 0),
              games: averageNonZero((player: any) => player.games || 0)
            };

            // Add totals row
            const dataSourceRows = transformedData;

            return (
          <div style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.3) transparent'
          }}>
            <Table
              dataSource={dataSourceRows}
              rowKey={(record) => record.id || `${record.name}-${record.position}`}
              pagination={false}
              size="small"
              style={{ background: 'transparent' }}
  onChange={(_p, _f, sorter) => {
    const column = Array.isArray(sorter) ? (sorter[0]?.field ?? sorter[0]?.columnKey) : (sorter as any)?.field ?? (sorter as any)?.columnKey;
    const order = Array.isArray(sorter) ? (sorter[0]?.order ?? null) : (sorter as any)?.order ?? null;
    setSortConfig({ column, order });
  }}
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
              {visibleColumns.includes('name') && (
                <Table.Column
                  title="Player"
                  dataIndex="name"
                  key="name"
                  width={120}
                  sorter={(a: any, b: any) => {
                    if (a.isTotalRow || a.id === 'totals') return 1;
                    if (b.isTotalRow || b.id === 'totals') return -1;
                    return (a.name || '').localeCompare(b.name || '');
                  }}
                  render={(text: string, record: any) => (
                    <div>
                      <div style={{ color: '#fff', fontSize: '12px', fontWeight: record.isTotalRow ? 'bold' : '500' }}>
                        {record.isTotalRow ? text : <PlayerLink id={record.id} name={text} />}
                      </div>
                      {!record.isTotalRow && (
                        <div style={{ color: '#b0b0b0', fontSize: '10px' }}>
                          {record.position} | #{record.number}
                        </div>
                      )}
                    </div>
                  )}
                />
              )}
              {visibleColumns.includes('points') && (
                <Table.Column
                  title="PTS"
                  dataIndex="points"
                  key="points"
                  width={60}
                  sorter={(a: any, b: any) => {
                    if (a.isTotalRow || a.id === 'totals') return 1;
                    if (b.isTotalRow || b.id === 'totals') return -1;

                    const aVal = a.points || 0;
                    const bVal = b.points || 0;

                    // Handle zeros - always put them at bottom regardless of sort direction
                    if (aVal === 0 && bVal === 0) return 0;
                    if (aVal === 0) return 1; // 0s always sort after non-zeros
                    if (bVal === 0) return -1; // Non-zeros always sort before 0s

                    // For non-zeros, return ascending comparison (Ant Design handles direction)
                    return aVal - bVal;
                  }}
                  render={(value: number, record: any) => {
                    const displayValue = value || 0;
                    if (displayValue === 0) return '';
                    
                    return (
                      <span style={{
                        color: record.isTotalRow ? '#fff' : '#B58842',
                        fontWeight: record.isTotalRow ? 'bold' : '600'
                      }}>
                        {viewMode === 'totals' ? Math.round(displayValue) : displayValue}
                      </span>
                    );
                  }}
                />
              )}
              {visibleColumns.includes('rebounds') && (
                <Table.Column
                  title="REB"
                  dataIndex="rebounds"
                  key="rebounds"
                  width={60}
                  sorter={(a: any, b: any) => {
                    if (a.isTotalRow || a.id === 'totals') return 1;
                    if (b.isTotalRow || b.id === 'totals') return -1;
                    return compareWithZeroBottom(a.rebounds || 0, b.rebounds || 0);
                  }}
                  render={(value: number, record: any) => {
                    const displayValue = value || 0;
                    if (displayValue === 0) return '';
                    
                    return (
                      <span style={{
                        color: record.isTotalRow ? '#fff' : '#52c41a',
                        fontWeight: record.isTotalRow ? 'bold' : '600'
                      }}>
                        {viewMode === 'totals' ? Math.round(displayValue) : displayValue}
                      </span>
                    );
                  }}
                />
              )}
              {visibleColumns.includes('assists') && (
                <Table.Column
                  title="AST"
                  dataIndex="assists"
                  key="assists"
                  width={60}
                  sorter={(a: any, b: any) => {
                    if (a.isTotalRow || a.id === 'totals') return 1;
                    if (b.isTotalRow || b.id === 'totals') return -1;
                    return compareWithZeroBottom(a.assists || 0, b.assists || 0);
                  }}
                  render={(value: number, record: any) => {
                    const displayValue = value || 0;
                    if (displayValue === 0) return '';
                    
                    return (
                      <span style={{
                        color: record.isTotalRow ? '#fff' : '#1890ff',
                        fontWeight: record.isTotalRow ? 'bold' : '600'
                      }}>
                        {viewMode === 'totals' ? Math.round(displayValue) : displayValue}
                      </span>
                    );
                  }}
                />
              )}
              {visibleColumns.includes('steals') && (
                <Table.Column
                  title="STL"
                  dataIndex="steals"
                  key="steals"
                  width={60}
                  sorter={(a: any, b: any) => {
                    if (a.isTotalRow || a.id === 'totals') return 1;
                    if (b.isTotalRow || b.id === 'totals') return -1;
                    return compareWithZeroBottom(a.steals || 0, b.steals || 0);
                  }}
                  render={(value: number, record: any) => {
                    const displayValue = value || 0;
                    if (displayValue === 0) return '';
                    
                    return (
                      <span style={{
                        color: record.isTotalRow ? '#fff' : '#722ed1',
                        fontWeight: record.isTotalRow ? 'bold' : '600'
                      }}>
                        {viewMode === 'totals' ? Math.round(displayValue) : displayValue}
                      </span>
                    );
                  }}
                />
              )}
              {visibleColumns.includes('blocks') && (
                <Table.Column
                  title="BLK"
                  dataIndex="blocks"
                  key="blocks"
                  width={60}
                  sorter={(a: any, b: any) => {
                    if (a.isTotalRow || a.id === 'totals') return 1;
                    if (b.isTotalRow || b.id === 'totals') return -1;
                    return compareWithZeroBottom(a.blocks || 0, b.blocks || 0);
                  }}
                  render={(value: number, record: any) => {
                    const displayValue = value || 0;
                    if (displayValue === 0) return '';
                    
                    return (
                      <span style={{
                        color: record.isTotalRow ? '#fff' : '#fa8c16',
                        fontWeight: record.isTotalRow ? 'bold' : '600'
                      }}>
                        {viewMode === 'totals' ? Math.round(displayValue) : displayValue}
                      </span>
                    );
                  }}
                />
              )}
              {visibleColumns.includes('turnovers') && (
                <Table.Column
                  title="TO"
                  dataIndex="turnovers"
                  key="turnovers"
                  width={60}
                  sorter={(a: any, b: any) => {
                    if (a.isTotalRow || a.id === 'totals') return 1;
                    if (b.isTotalRow || b.id === 'totals') return -1;
                    return compareWithZeroBottom(a.turnovers || 0, b.turnovers || 0);
                  }}
                  render={(value: number, record: any) => {
                    const displayValue = value || 0;
                    if (displayValue === 0) return '';
                    
                    return (
                      <span style={{
                        color: record.isTotalRow ? '#fff' : '#ff4d4f',
                        fontWeight: record.isTotalRow ? 'bold' : '600'
                      }}>
                        {viewMode === 'totals' ? Math.round(displayValue) : displayValue}
                      </span>
                    );
                  }}
                />
              )}
              {visibleColumns.includes('fgPct') && (
                <Table.Column
                  title="FG%"
                  key="fgPct"
                  width={70}
                  sorter={(a: any, b: any) => {
                    if (a.isTotalRow || a.id === 'totals') return 1;
                    if (b.isTotalRow || b.id === 'totals') return -1;
                    const aPct = (a.fgAttempted || 0) > 0 ? (a.fgMade || 0) / (a.fgAttempted || 0) : 0;
                    const bPct = (b.fgAttempted || 0) > 0 ? (b.fgMade || 0) / (b.fgAttempted || 0) : 0;
                    return compareWithZeroBottom(aPct, bPct);
                  }}
                  render={(text: any, record: any) => {
                    const fgMade = record.fgMade || 0;
                    const fgAttempted = record.fgAttempted || 0;
                    const fgPct = fgAttempted > 0 ? Math.round((fgMade / fgAttempted) * 100) : 0;

                    // Show blank if no attempts
                    if (fgAttempted === 0) return '';

                    if (viewMode === 'totals') {
                      return (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ color: record.isTotalRow ? '#fff' : '#13c2c2', fontWeight: record.isTotalRow ? 'bold' : '600' }}>
                            {Math.round(fgMade)} / {Math.round(fgAttempted)}
                          </div>
                          <div style={{ color: record.isTotalRow ? '#fff' : '#13c2c2', fontWeight: record.isTotalRow ? 'bold' : '600', fontSize: '10px' }}>
                            {fgPct}%
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ color: record.isTotalRow ? '#fff' : '#13c2c2', fontWeight: record.isTotalRow ? 'bold' : '600' }}>
                            {fgMade.toFixed(1)} / {fgAttempted.toFixed(1)}
                          </div>
                          <div style={{ color: record.isTotalRow ? '#fff' : '#13c2c2', fontWeight: record.isTotalRow ? 'bold' : '600', fontSize: '10px' }}>
                            {fgPct}%
                          </div>
                        </div>
                      );
                    }
                  }}
                />
              )}
              {visibleColumns.includes('threePct') && (
                <Table.Column
                  title="3P%"
                  key="threePct"
                  width={70}
                  sorter={(a: any, b: any) => {
                    if (a.isTotalRow || a.id === 'totals') return 1;
                    if (b.isTotalRow || b.id === 'totals') return -1;
                    const aPct = (a.threeAttempted || 0) > 0 ? (a.threeMade || 0) / (a.threeAttempted || 0) : 0;
                    const bPct = (b.threeAttempted || 0) > 0 ? (b.threeMade || 0) / (b.threeAttempted || 0) : 0;
                    return compareWithZeroBottom(aPct, bPct);
                  }}
                  render={(text: any, record: any) => {
                    const threeMade = record.threeMade || 0;
                    const threeAttempted = record.threeAttempted || 0;
                    const threePct = threeAttempted > 0 ? Math.round((threeMade / threeAttempted) * 100) : 0;

                    // Show blank if no attempts
                    if (threeAttempted === 0) return '';

                    if (viewMode === 'totals') {
                      return (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ color: record.isTotalRow ? '#fff' : '#eb2f96', fontWeight: record.isTotalRow ? 'bold' : '600' }}>
                            {Math.round(threeMade)} / {Math.round(threeAttempted)}
                          </div>
                          <div style={{ color: record.isTotalRow ? '#fff' : '#eb2f96', fontWeight: record.isTotalRow ? 'bold' : '600', fontSize: '10px' }}>
                            {threePct}%
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ color: record.isTotalRow ? '#fff' : '#eb2f96', fontWeight: record.isTotalRow ? 'bold' : '600' }}>
                            {threeMade.toFixed(1)} / {threeAttempted.toFixed(1)}
                          </div>
                          <div style={{ color: record.isTotalRow ? '#fff' : '#eb2f96', fontWeight: record.isTotalRow ? 'bold' : '600', fontSize: '10px' }}>
                            {threePct}%
                          </div>
                        </div>
                      );
                    }
                  }}
                />
              )}
              {visibleColumns.includes('ftPct') && (
                <Table.Column
                  title="FT%"
                  key="ftPct"
                  width={70}
                  sorter={(a: any, b: any) => {
                    if (a.isTotalRow || a.id === 'totals') return 1;
                    if (b.isTotalRow || b.id === 'totals') return -1;
                    const aPct = (a.ftAttempted || 0) > 0 ? (a.ftMade || 0) / (a.ftAttempted || 0) : 0;
                    const bPct = (b.ftAttempted || 0) > 0 ? (b.ftMade || 0) / (b.ftAttempted || 0) : 0;
                    return compareWithZeroBottom(aPct, bPct);
                  }}
                  render={(text: any, record: any) => {
                    const ftMade = record.ftMade || 0;
                    const ftAttempted = record.ftAttempted || 0;
                    const ftPct = ftAttempted > 0 ? Math.round((ftMade / ftAttempted) * 100) : 0;

                    // Show blank if no attempts
                    if (ftAttempted === 0) return '';

                    if (viewMode === 'totals') {
                      return (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ color: record.isTotalRow ? '#fff' : '#52c41a', fontWeight: record.isTotalRow ? 'bold' : '600' }}>
                            {Math.round(ftMade)} / {Math.round(ftAttempted)}
                          </div>
                          <div style={{ color: record.isTotalRow ? '#fff' : '#52c41a', fontWeight: record.isTotalRow ? 'bold' : '600', fontSize: '10px' }}>
                            {ftPct}%
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ color: record.isTotalRow ? '#fff' : '#52c41a', fontWeight: record.isTotalRow ? 'bold' : '600' }}>
                            {ftMade.toFixed(1)} / {ftAttempted.toFixed(1)}
                          </div>
                          <div style={{ color: record.isTotalRow ? '#fff' : '#52c41a', fontWeight: record.isTotalRow ? 'bold' : '600', fontSize: '10px' }}>
                            {ftPct}%
                          </div>
                        </div>
                      );
                    }
                  }}
                />
              )}
              {visibleColumns.includes('efficiency') && (
                <Table.Column 
                  title={
                    <Tooltip title="EFF = (PTS + REB + AST + STL + BLK - Missed FG - Missed FT - TO) / GP">
                      <span style={{ color: '#fff' }}>EFF</span>
                    </Tooltip>
                  }
                  key="efficiency"
                  width={80}
                  render={(text: any, record: any) => {
                    // Calculate EFF rating: (PTS + REB + AST + STL + BLK - Missed FG - Missed FT - TO) / GP
                    const points = record.points || 0;
                    const rebounds = record.rebounds || 0;
                    const assists = record.assists || 0;
                    const steals = record.steals || 0;
                    const blocks = record.blocks || 0;
                    const turnovers = record.turnovers || 0;
                    const games = record.games || 1; // Avoid division by zero
                    
                    // Calculate missed shots
                    const fgMade = record.fgMade || 0;
                    const fgAttempted = record.fgAttempted || 0;
                    const ftMade = record.ftMade || 0;
                    const ftAttempted = record.ftAttempted || 0;
                    const missedFg = fgAttempted - fgMade;
                    const missedFt = ftAttempted - ftMade;
                    
                    // EFF calculation
                    const efficiency = (points + rebounds + assists + steals + blocks - missedFg - missedFt - turnovers) / games;
                    const roundedEfficiency = Math.round(efficiency * 10) / 10; // Round to 1 decimal place
                    
                    // Show blank if efficiency is 0 or NaN
                    if (roundedEfficiency === 0 || isNaN(roundedEfficiency)) return '';
                    
                    return (
                      <span style={{ 
                        color: record.isTotalRow ? '#fff' : '#ff7a00', 
                        fontWeight: record.isTotalRow ? 'bold' : '600' 
                      }}>
                        {roundedEfficiency}
                      </span>
                    );
                  }}
                  sorter={(a: any, b: any) => {
                    const calcEfficiency = (record: any) => {
                      const points = record.points || 0;
                      const rebounds = record.rebounds || 0;
                      const assists = record.assists || 0;
                      const steals = record.steals || 0;
                      const blocks = record.blocks || 0;
                      const turnovers = record.turnovers || 0;
                      const games = record.games || 1;
                      const fgMade = record.fgMade || 0;
                      const fgAttempted = record.fgAttempted || 0;
                      const ftMade = record.ftMade || 0;
                      const ftAttempted = record.ftAttempted || 0;
                      const missedFg = fgAttempted - fgMade;
                      const missedFt = ftAttempted - ftMade;
                      return (points + rebounds + assists + steals + blocks - missedFg - missedFt - turnovers) / games;
                    };

                    // Totals row should always be at bottom
                    if (a.isTotalRow || a.id === 'totals') return 1;
                    if (b.isTotalRow || b.id === 'totals') return -1;

                    return compareWithZeroBottom(calcEfficiency(a), calcEfficiency(b));
                  }}
                />
              )}
              {visibleColumns.includes('games') && (
                <Table.Column
                  title="# of games"
                  dataIndex="games"
                  key="games"
                  width={80}
                  sorter={(a: any, b: any) => {
                    if (a.isTotalRow || a.id === 'totals') return 1;
                    if (b.isTotalRow || b.id === 'totals') return -1;
                    return compareWithZeroBottom(a.games || 0, b.games || 0);
                  }}
                  render={(value: number, record: any) => {
                    const displayValue = value || 0;
                    if (displayValue === 0) return '';
                    
                    return (
                      <span style={{
                        color: record.isTotalRow ? '#fff' : '#b0b0b0',
                        fontWeight: record.isTotalRow ? 'bold' : 'normal'
                      }}>
                        {displayValue}
                      </span>
                    );
                  }}
                />
              )}
            </Table>
            
            {/* Team Averages Row (separate from table to avoid being included in sorts) */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'rgba(24, 144, 255, 0.2)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              fontSize: '12px',
              color: '#fff',
              fontWeight: 600,
              marginTop: 4
            }}>
              <div style={{ width: '120px' }}>Team Averages</div>
              <div style={{ width: '60px' }}>{teamAverages.points.toFixed(1)}</div>
              <div style={{ width: '60px' }}>{teamAverages.rebounds.toFixed(1)}</div>
              <div style={{ width: '60px' }}>{teamAverages.assists.toFixed(1)}</div>
              <div style={{ width: '60px' }}>{teamAverages.steals.toFixed(1)}</div>
              <div style={{ width: '60px' }}>{teamAverages.blocks.toFixed(1)}</div>
              <div style={{ width: '60px' }}>{teamAverages.turnovers.toFixed(1)}</div>
              <div style={{ width: '70px', textAlign: 'center' }}>
                {teamAverages.fgMade.toFixed(1)} / {teamAverages.fgAttempted.toFixed(1)}
              </div>
              <div style={{ width: '70px', textAlign: 'center' }}>
                {teamAverages.threeMade.toFixed(1)} / {teamAverages.threeAttempted.toFixed(1)}
              </div>
              <div style={{ width: '70px', textAlign: 'center' }}>
                {teamAverages.ftMade.toFixed(1)} / {teamAverages.ftAttempted.toFixed(1)}
              </div>
              <div style={{ width: '80px' }}></div>
              <div style={{ width: '80px' }}>{teamAverages.games.toFixed(1)}</div>
            </div>
 
            {/* Percentages Row */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '8px 12px',
              background: 'rgba(24, 144, 255, 0.1)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              fontSize: '12px',
              color: '#fff'
            }}>
              <div style={{ width: '120px' }}></div> {/* Player column spacer */}
              <div style={{ width: '60px' }}></div> {/* PTS column spacer */}
              <div style={{ width: '60px' }}></div> {/* REB column spacer */}
              <div style={{ width: '60px' }}></div> {/* AST column spacer */}
              <div style={{ width: '60px' }}></div> {/* STL column spacer */}
              <div style={{ width: '60px' }}></div> {/* BLK column spacer */}
              <div style={{ width: '60px' }}></div> {/* TO column spacer */}
              <div style={{ width: '70px', textAlign: 'center', fontWeight: 'bold' }}>
                {teamAverages.fgAttempted > 0 ? Math.round((teamAverages.fgMade / teamAverages.fgAttempted) * 100 * 10) / 10 : 0}%
              </div>
              <div style={{ width: '70px', textAlign: 'center', fontWeight: 'bold' }}>
                {teamAverages.threeAttempted > 0 ? Math.round((teamAverages.threeMade / teamAverages.threeAttempted) * 100 * 10) / 10 : 0}%
              </div>
              <div style={{ width: '70px', textAlign: 'center', fontWeight: 'bold' }}>
                {teamAverages.ftAttempted > 0 ? Math.round((teamAverages.ftMade / teamAverages.ftAttempted) * 100 * 10) / 10 : 0}%
              </div>
              <div style={{ width: '80px' }}></div> {/* EFF column spacer */}
              <div style={{ width: '80px' }}></div> {/* Games column spacer */}
            </div>
          </div>
            );
          })()
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

      {/* Export Modal */}
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DownloadOutlined style={{ color: '#1890ff' }} />
          <span>Export Dashboard</span>
        </div>
      }
      open={showExportModal}
      onCancel={() => setShowExportModal(false)}
      footer={null}
      width={400}
      style={{ top: 20 }}
    >
      <div style={{ padding: '20px 0' }}>
        <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '14px' }}>
          Choose the format for your dashboard export:
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              exportStatsData('pdf');
              setShowExportModal(false);
            }}
            style={{ 
              height: '48px', 
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            Export as PDF (Screenshot)
          </Button>
          
          <Button
            icon={<DownloadOutlined />}
            onClick={() => {
              exportStatsData('csv');
              setShowExportModal(false);
            }}
            style={{ 
              height: '48px', 
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            Export as CSV (Data)
          </Button>
          
          <Button
            icon={<DownloadOutlined />}
            onClick={() => {
              exportStatsData('json');
              setShowExportModal(false);
            }}
            style={{ 
              height: '48px', 
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            Export as JSON (Raw Data)
          </Button>
        </div>
        
        <div style={{ 
          marginTop: '20px', 
          padding: '12px', 
          background: '#f6f8fa', 
          borderRadius: '6px',
          fontSize: '12px',
          color: '#666'
        }}>
          <strong>PDF Export:</strong> Captures the dashboard as a visual screenshot, perfect for reports and presentations.
        </div>
      </div>
    </Modal>

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