// Advanced Stats Hooks - PRD Implementation
// Comprehensive hooks for all dashboard features

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { advancedStatsService, LiveGameData, GameAnalysis, PlayerDevelopment, TeamAnalytics, StrategicInsights } from '../services/advancedStatsService';

// Type-safe fetchers for each data type
const liveGameFetcher = async (key: string) => {
  const gameId = key.split(':')[1];
  return await advancedStatsService.getLiveGameData(gameId);
};

const gameAnalysisFetcher = async (key: string) => {
  const gameId = key.split(':')[1];
  return await advancedStatsService.getGameAnalysis(gameId);
};

const playerDevelopmentFetcher = async (key: string) => {
  const [, playerId, season] = key.split(':');
  return await advancedStatsService.getPlayerDevelopment(playerId, season);
};

const teamAnalyticsFetcher = async (key: string) => {
  const season = key.split(':')[1];
  return await advancedStatsService.getTeamAnalytics(season);
};

const strategicInsightsFetcher = async (key: string) => {
  const season = key.split(':')[1];
  return await advancedStatsService.getStrategicInsights(season);
};

// Live Game Hook
export const useLiveGame = (gameId: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<LiveGameData>(
    gameId ? `liveGame:${gameId}` : null,
    liveGameFetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds for live data
      revalidateOnFocus: true,
      errorRetryCount: 5,
      dedupingInterval: 1000, // 1 second for live data
    }
  );

  return {
    liveGameData: data,
    isLoading,
    error,
    refetch: mutate,
  };
};

// Game Analysis Hook
export const useGameAnalysis = (gameId: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<GameAnalysis>(
    gameId ? `gameAnalysis:${gameId}` : null,
    gameAnalysisFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute for game analysis
      errorRetryCount: 3,
    }
  );

  return {
    gameAnalysis: data,
    isLoading,
    error,
    refetch: mutate,
  };
};

// Player Development Hook
export const usePlayerDevelopment = (playerId: string | null, season: string = '2023-24') => {
  const { data, error, isLoading, mutate } = useSWR<PlayerDevelopment>(
    playerId ? `playerDevelopment:${playerId}:${season}` : null,
    playerDevelopmentFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes for player data
      errorRetryCount: 3,
    }
  );

  return {
    playerDevelopment: data,
    isLoading,
    error,
    refetch: mutate,
  };
};

// Team Analytics Hook
export const useTeamAnalytics = (season: string = '2023-24') => {
  const { data, error, isLoading, mutate } = useSWR<TeamAnalytics>(
    `teamAnalytics:${season}`,
    teamAnalyticsFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes for team data
      errorRetryCount: 3,
    }
  );

  return {
    teamAnalytics: data,
    isLoading,
    error,
    refetch: mutate,
  };
};

// Strategic Insights Hook
export const useStrategicInsights = (season: string = '2023-24') => {
  const { data, error, isLoading, mutate } = useSWR<StrategicInsights>(
    `strategicInsights:${season}`,
    strategicInsightsFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 600000, // 10 minutes for strategic data
      errorRetryCount: 3,
    }
  );

  return {
    strategicInsights: data,
    isLoading,
    error,
    refetch: mutate,
  };
};

// Combined Dashboard Data Hook
export const useDashboardData = (season: string = '2023-24') => {
  const { teamAnalytics, isLoading: teamLoading, error: teamError } = useTeamAnalytics(season);
  const { strategicInsights, isLoading: insightsLoading, error: insightsError } = useStrategicInsights(season);

  return {
    teamAnalytics,
    strategicInsights,
    isLoading: teamLoading || insightsLoading,
    error: teamError || insightsError,
  };
};

// Live Game State Management
export const useLiveGameState = () => {
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);

  const startLiveGame = (gameId: string) => {
    setCurrentGameId(gameId);
    setIsLiveMode(true);
  };

  const stopLiveGame = () => {
    setCurrentGameId(null);
    setIsLiveMode(false);
  };

  return {
    currentGameId,
    isLiveMode,
    startLiveGame,
    stopLiveGame,
  };
};

// Report Generation Hook
export const useReportGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastReport, setLastReport] = useState<any>(null);

  const generateReport = async (type: string, data: any) => {
    setIsGenerating(true);
    try {
      const report = await advancedStatsService.generateReport(type, data);
      setLastReport(report);
      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateReport,
    isGenerating,
    lastReport,
  };
};

// Data Export Hook
export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async (type: string, data: any, format: 'pdf' | 'excel' | 'csv' = 'pdf') => {
    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const exportData = {
        type,
        format,
        data,
        timestamp: new Date().toISOString(),
        filename: `${type}-report-${Date.now()}.${format}`,
      };

      // In a real implementation, this would trigger file download
      console.log('Exporting data:', exportData);
      
      return exportData;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportData,
    isExporting,
  };
};

// Filter and Search Hook
export const useDataFilters = () => {
  const [filters, setFilters] = useState({
    dateRange: null,
    players: [],
    games: [],
    stats: [],
    season: '2023-24',
  });

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      dateRange: null,
      players: [],
      games: [],
      stats: [],
      season: '2023-24',
    });
  };

  return {
    filters,
    updateFilters,
    clearFilters,
  };
};

// Real-time Updates Hook
export const useRealTimeUpdates = (enabled: boolean = false) => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setUpdateCount(prev => prev + 1);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [enabled]);

  return {
    lastUpdate,
    updateCount,
    isEnabled: enabled,
  };
}; 