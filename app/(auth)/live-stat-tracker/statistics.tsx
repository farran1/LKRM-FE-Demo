'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, Row, Col, Button, Typography, Space, Divider, Badge, Progress, Statistic, Modal, Table, Tabs, Select, Input, Tooltip, Alert, Switch } from 'antd'
import { PlayCircleOutlined, PauseCircleOutlined, StopOutlined, ClockCircleOutlined, BarChartOutlined, ExportOutlined, DownloadOutlined, SettingOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons'
import style from './style.module.scss'

const { Title, Text } = Typography
const { TabPane } = Tabs
const { Option } = Select

interface GameState {
  isPlaying: boolean
  currentTime: number // seconds
  quarter: number
  homeScore: number
  awayScore: number
  opponentScore: number
  timeoutHome: number
  timeoutAway: number
}

interface Player {
  id: number
  name: string
  number: string
  position: string
  minutesPlayed: number
  points: number
  rebounds: number
  offensiveRebounds: number
  defensiveRebounds: number
  assists: number
  steals: number
  blocks: number
  fouls: number
  turnovers: number
  fgAttempted: number
  fgMade: number
  threeAttempted: number
  threeMade: number
  ftAttempted: number
  ftMade: number
  plusMinus: number
  chargesTaken: number
  deflections: number
  isOnCourt: boolean
}

interface StatEvent {
  id: string
  timestamp: number
  playerId: number
  playerName: string
  eventType: string
  value?: number
  quarter: number
  gameTime: number
  opponentEvent?: boolean
}

interface Lineup {
  id: string
  players: number[]
  startTime: number
  endTime?: number
  plusMinus: number
}

// DEV-ONLY: Settings interface for comprehensive configuration
interface GameSettings {
  // Game Configuration
  quarterDuration: number // minutes
  totalQuarters: number
  timeoutCount: number
  shotClock: number // seconds
  
  // Workflow Settings
  workflowMode: 'player-first' | 'action-first'
  autoPauseOnTimeout: boolean
  autoPauseOnQuarterEnd: boolean
  showConfirmations: boolean
  
  // Display Settings
  showPlayerNumbers: boolean
  showPositions: boolean
  showEfficiencyRatings: boolean
  compactMode: boolean
  darkMode: boolean
  
  // Export Settings
  autoExport: boolean
  exportFormat: 'json' | 'csv' | 'pdf'
  exportInterval: number // minutes
  includePlayerStats: boolean
  includeTeamStats: boolean
  includeLineupData: boolean
  
  // Analytics Settings
  showAdvancedStats: boolean
  showProjections: boolean
  showTrends: boolean
  highlightTopPerformers: boolean
  
  // Notification Settings
  halftimeReminder: boolean
  timeoutReminder: boolean
  foulTroubleAlert: boolean
  efficiencyThreshold: number
  
  // Recommendation Settings
  showRecommendations: boolean
  showQuickActions: boolean
}

type SettingRowProps = {
  label: string;
  controlType: 'switch' | 'input' | 'select';
  value: any;
  onChange: (value: any) => void;
  options?: { value: any; label: string }[];
  [x: string]: any;
};

const SettingRow: React.FC<SettingRowProps> = ({ label, controlType, value, onChange, options = [], ...rest }) => {
  return (
    <div className={style.settingGroup} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
      <Text strong style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</Text>
      <span style={{ paddingLeft: 8, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {controlType === 'switch' && (
          <Switch checked={value} onChange={onChange} {...rest} />
        )}
        {controlType === 'input' && (
          <Input type="number" value={value} onChange={onChange} {...rest} />
        )}
        {controlType === 'select' && (
          <Select value={value} onChange={onChange} style={{ width: '100%' }} {...rest}>
            {options.map((opt: { value: any; label: string }) => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
        )}
      </span>
    </div>
  );
};

const Statistics = () => {
  // DEV-ONLY: Default settings with comprehensive options
  const defaultSettings: GameSettings = {
    quarterDuration: 10,
    totalQuarters: 4,
    timeoutCount: 4,
    shotClock: 30,
    workflowMode: 'player-first',
    autoPauseOnTimeout: true,
    autoPauseOnQuarterEnd: true,
    showConfirmations: true,
    showPlayerNumbers: true,
    showPositions: true,
    showEfficiencyRatings: true,
    compactMode: false,
    darkMode: false,
    autoExport: false,
    exportFormat: 'json',
    exportInterval: 5,
    includePlayerStats: true,
    includeTeamStats: true,
    includeLineupData: true,
    showAdvancedStats: true,
    showProjections: true,
    showTrends: true,
    highlightTopPerformers: true,
    halftimeReminder: true,
    timeoutReminder: true,
    foulTroubleAlert: true,
    efficiencyThreshold: 15,
    showRecommendations: true,
    showQuickActions: true
  }

  // Hydration-safe: always use defaultSettings for SSR, update from localStorage on client
  const [settings, setSettings] = useState<GameSettings>(defaultSettings)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('basketballStatsSettings')
      if (savedSettings) {
        try {
          setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) })
        } catch (error) {
          console.warn('Failed to load settings from localStorage:', error)
        }
      }
    }
  }, [])

  const [gameState, setGameState] = useState<GameState>(() => ({
    isPlaying: false,
    currentTime: defaultSettings.quarterDuration * 60, // Use default settings for initial state
    quarter: 1,
    homeScore: 0,
    awayScore: 0,
    opponentScore: 0,
    timeoutHome: defaultSettings.timeoutCount,
    timeoutAway: defaultSettings.timeoutCount
  }))

  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: 'John Smith', number: '10', position: 'PG', minutesPlayed: 0, points: 0, rebounds: 0, offensiveRebounds: 0, defensiveRebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, fgAttempted: 0, fgMade: 0, threeAttempted: 0, threeMade: 0, ftAttempted: 0, ftMade: 0, plusMinus: 0, chargesTaken: 0, deflections: 0, isOnCourt: false },
    { id: 2, name: 'Mike Johnson', number: '15', position: 'SG', minutesPlayed: 0, points: 0, rebounds: 0, offensiveRebounds: 0, defensiveRebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, fgAttempted: 0, fgMade: 0, threeAttempted: 0, threeMade: 0, ftAttempted: 0, ftMade: 0, plusMinus: 0, chargesTaken: 0, deflections: 0, isOnCourt: false },
    { id: 3, name: 'David Wilson', number: '23', position: 'SF', minutesPlayed: 0, points: 0, rebounds: 0, offensiveRebounds: 0, defensiveRebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, fgAttempted: 0, fgMade: 0, threeAttempted: 0, threeMade: 0, ftAttempted: 0, ftMade: 0, plusMinus: 0, chargesTaken: 0, deflections: 0, isOnCourt: false },
    { id: 4, name: 'Chris Brown', number: '32', position: 'PF', minutesPlayed: 0, points: 0, rebounds: 0, offensiveRebounds: 0, defensiveRebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, fgAttempted: 0, fgMade: 0, threeAttempted: 0, threeMade: 0, ftAttempted: 0, ftMade: 0, plusMinus: 0, chargesTaken: 0, deflections: 0, isOnCourt: false },
    { id: 5, name: 'Alex Davis', number: '44', position: 'C', minutesPlayed: 0, points: 0, rebounds: 0, offensiveRebounds: 0, defensiveRebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, fgAttempted: 0, fgMade: 0, threeAttempted: 0, threeMade: 0, ftAttempted: 0, ftMade: 0, plusMinus: 0, chargesTaken: 0, deflections: 0, isOnCourt: false },
    { id: 6, name: 'Ryan Martinez', number: '3', position: 'PG', minutesPlayed: 0, points: 0, rebounds: 0, offensiveRebounds: 0, defensiveRebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, fgAttempted: 0, fgMade: 0, threeAttempted: 0, threeMade: 0, ftAttempted: 0, ftMade: 0, plusMinus: 0, chargesTaken: 0, deflections: 0, isOnCourt: false },
    { id: 7, name: 'Kevin Thompson', number: '7', position: 'SG', minutesPlayed: 0, points: 0, rebounds: 0, offensiveRebounds: 0, defensiveRebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, fgAttempted: 0, fgMade: 0, threeAttempted: 0, threeMade: 0, ftAttempted: 0, ftMade: 0, plusMinus: 0, chargesTaken: 0, deflections: 0, isOnCourt: false },
    { id: 8, name: 'Marcus Williams', number: '12', position: 'SF', minutesPlayed: 0, points: 0, rebounds: 0, offensiveRebounds: 0, defensiveRebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, fgAttempted: 0, fgMade: 0, threeAttempted: 0, threeMade: 0, ftAttempted: 0, ftMade: 0, plusMinus: 0, chargesTaken: 0, deflections: 0, isOnCourt: false },
    { id: 9, name: 'Jordan Lee', number: '21', position: 'PF', minutesPlayed: 0, points: 0, rebounds: 0, offensiveRebounds: 0, defensiveRebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, fgAttempted: 0, fgMade: 0, threeAttempted: 0, threeMade: 0, ftAttempted: 0, ftMade: 0, plusMinus: 0, chargesTaken: 0, deflections: 0, isOnCourt: false },
    { id: 10, name: 'Tyler Anderson', number: '33', position: 'C', minutesPlayed: 0, points: 0, rebounds: 0, offensiveRebounds: 0, defensiveRebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, fgAttempted: 0, fgMade: 0, threeAttempted: 0, threeMade: 0, ftAttempted: 0, ftMade: 0, plusMinus: 0, chargesTaken: 0, deflections: 0, isOnCourt: false },
    { id: 11, name: 'Brandon Garcia', number: '5', position: 'PG', minutesPlayed: 0, points: 0, rebounds: 0, offensiveRebounds: 0, defensiveRebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, fgAttempted: 0, fgMade: 0, threeAttempted: 0, threeMade: 0, ftAttempted: 0, ftMade: 0, plusMinus: 0, chargesTaken: 0, deflections: 0, isOnCourt: false },
    { id: 12, name: 'Isaiah Rodriguez', number: '8', position: 'SG', minutesPlayed: 0, points: 0, rebounds: 0, offensiveRebounds: 0, defensiveRebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, fgAttempted: 0, fgMade: 0, threeAttempted: 0, threeMade: 0, ftAttempted: 0, ftMade: 0, plusMinus: 0, chargesTaken: 0, deflections: 0, isOnCourt: false },
    { id: 13, name: 'Cameron White', number: '14', position: 'SF', minutesPlayed: 0, points: 0, rebounds: 0, offensiveRebounds: 0, defensiveRebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, fgAttempted: 0, fgMade: 0, threeAttempted: 0, threeMade: 0, ftAttempted: 0, ftMade: 0, plusMinus: 0, chargesTaken: 0, deflections: 0, isOnCourt: false },
    { id: 14, name: 'Devin Taylor', number: '25', position: 'PF', minutesPlayed: 0, points: 0, rebounds: 0, offensiveRebounds: 0, defensiveRebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, fgAttempted: 0, fgMade: 0, threeAttempted: 0, threeMade: 0, ftAttempted: 0, ftMade: 0, plusMinus: 0, chargesTaken: 0, deflections: 0, isOnCourt: false },
    { id: 15, name: 'Nathan Clark', number: '55', position: 'C', minutesPlayed: 0, points: 0, rebounds: 0, offensiveRebounds: 0, defensiveRebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, fgAttempted: 0, fgMade: 0, threeAttempted: 0, threeMade: 0, ftAttempted: 0, ftMade: 0, plusMinus: 0, chargesTaken: 0, deflections: 0, isOnCourt: false },
  ])

  const [events, setEvents] = useState<StatEvent[]>([])
  const [lineups, setLineups] = useState<Lineup[]>([])
  const [showHalftimeReport, setShowHalftimeReport] = useState(false)
  const [showTimeoutReport, setShowTimeoutReport] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [activeTab, setActiveTab] = useState('tracking')
  const [workflowMode, setWorkflowMode] = useState<'player-first' | 'action-first'>(defaultSettings.workflowMode)
  const [lastTimeoutTime, setLastTimeoutTime] = useState<number>(0)
  const [currentLineup, setCurrentLineup] = useState<Lineup | null>(null)
  const [showLineupBuilder, setShowLineupBuilder] = useState(false)
  const [selectedLineupPlayers, setSelectedLineupPlayers] = useState<number[]>([])
  const [lineupName, setLineupName] = useState('')
  const [isEditingClock, setIsEditingClock] = useState(false);
  
  // DEV-ONLY: Action history for undo functionality
  const [actionHistory, setActionHistory] = useState<Array<{
    type: 'stat' | 'substitution' | 'timeout' | 'score' | 'quarter'
    timestamp: number
    data: any
    previousState: any
  }>>([])
  const [clockInputValue, setClockInputValue] = useState('');
  const clockInputRef = useRef<HTMLInputElement>(null);
  // DEV-ONLY: Quick substitution state
  const [showQuickSubModal, setShowQuickSubModal] = useState(false)
  const [substitutionPlayerOut, setSubstitutionPlayerOut] = useState<Player | null>(null)
  const [substitutionPlayerIn, setSubstitutionPlayerIn] = useState<Player | null>(null)
  const [quickSubHistory, setQuickSubHistory] = useState<Array<{playerIn: Player, playerOut: Player, timestamp: number}>>([])
  const [showSubHistory, setShowSubHistory] = useState(false)
  // 1. Add a ref for the Player In select
  const playerInSelectRef = useRef<any>(null);

  // DEV-ONLY: Enhanced substitution state
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false)
  const [substitutionStep, setSubstitutionStep] = useState<'select-out' | 'select-in' | 'confirm'>('select-out')
  const [substitutionHistory, setSubstitutionHistory] = useState<Array<{
    playerIn: Player
    playerOut: Player
    timestamp: number
    quarter: number
    gameTime: number
    lineupId?: string
  }>>([])

  // DEV-ONLY: Save settings to localStorage
  const saveSettings = useCallback((newSettings: Partial<GameSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('basketballStatsSettings', JSON.stringify(updatedSettings))
      } catch (error) {
        console.warn('Failed to save settings to localStorage:', error)
      }
    }
  }, [settings])

  // DEV-ONLY: Reset settings to defaults
  const resetSettings = () => {
    setSettings(defaultSettings)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('basketballStatsSettings')
    }
  }

  // DEV-ONLY: Export settings
  const exportSettings = () => {
    const settingsData = {
      settings,
      exportTime: new Date().toISOString(),
      version: '1.0'
    }
    
    const dataStr = JSON.stringify(settingsData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `basketball-stats-settings-${Date.now()}.json`
    link.click()
  }

  // DEV-ONLY: Import settings
  const importSettings = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string)
        if (importedSettings.settings) {
          saveSettings(importedSettings.settings)
        }
      } catch (error) {
        console.error('Failed to import settings:', error)
      }
    }
    reader.readAsText(file)
  }

  // DEV-ONLY: Game clock timer with enhanced functionality
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gameState.isPlaying && gameState.currentTime > 0) {
      interval = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          currentTime: prev.currentTime - 1
        }))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [gameState.isPlaying, gameState.currentTime])

  // DEV-ONLY: Apply game configuration settings
  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      currentTime: settings.quarterDuration * 60,
      timeoutHome: settings.timeoutCount,
      timeoutAway: settings.timeoutCount
    }))
  }, [settings.quarterDuration, settings.timeoutCount])

  // DEV-ONLY: Apply workflow mode changes
  useEffect(() => {
    setWorkflowMode(settings.workflowMode)
  }, [settings.workflowMode])

  // DEV-ONLY: Check for halftime with settings integration
  useEffect(() => {
    if (gameState.quarter === 2 && gameState.currentTime === 300 && settings.halftimeReminder) {
      setShowHalftimeReport(true)
    }
  }, [gameState.quarter, gameState.currentTime, settings.halftimeReminder])

  // DEV-ONLY: Enhanced timeout tracking with settings integration
  const handleTimeout = (team: 'home' | 'away') => {
    // Save current state for undo
    const previousState = {
      players: players,
      gameState: gameState,
      events: events
    }

    const currentGameTime = (settings.quarterDuration * 60) - gameState.currentTime
    setLastTimeoutTime(currentGameTime)
    
    setGameState(prev => ({
      ...prev,
      timeoutHome: team === 'home' ? Math.max(0, prev.timeoutHome - 1) : prev.timeoutHome,
      timeoutAway: team === 'away' ? Math.max(0, prev.timeoutAway - 1) : prev.timeoutAway,
      isPlaying: settings.autoPauseOnTimeout ? false : prev.isPlaying
    }))
    
    // Show instant timeout report if enabled
    if (settings.timeoutReminder) {
      setShowTimeoutReport(true)
    }

    // Add to action history
    setActionHistory(prev => [{
      type: 'timeout',
      timestamp: Date.now(),
      data: { team },
      previousState
    }, ...prev.slice(0, 49)]) // Keep last 50 actions
  }

  // DEV-ONLY: Generate comprehensive halftime insights
  const generateHalftimeInsights = () => {
    const topScorer = players.reduce((max, p) => p.points > max.points ? p : max, players[0]);
    const topRebounder = players.reduce((max, p) => p.rebounds > max.rebounds ? p : max, players[0]);
    const topAssister = players.reduce((max, p) => p.assists > max.assists ? p : max, players[0]);
    const mostEfficient = players.reduce((max, p) => {
      const efficiency = p.points + p.rebounds + p.assists + p.steals + p.blocks - p.turnovers - p.fouls;
      return efficiency > max.efficiency ? { player: p, efficiency } : max;
    }, { player: players[0], efficiency: players[0].points + players[0].rebounds + players[0].assists + players[0].steals + players[0].blocks - players[0].turnovers - players[0].fouls });

    const teamStats = calculateTeamStats();
    // Calculate opponent stats for first half
    const opponentStats = {
      totalRebounds: events.filter(e => e.opponentEvent && (e.eventType === 'defensive_rebound' || e.eventType === 'offensive_rebound') && e.gameTime <= (settings.quarterDuration * 60 * 2)).length,
      totalTurnovers: events.filter(e => e.opponentEvent && e.eventType === 'turnover' && e.gameTime <= (settings.quarterDuration * 60 * 2)).length,
    };
    // Opponent run at end of half
    const recentOpponentRun = calculateOpponentRun(events.filter(e => e.gameTime >= (settings.quarterDuration * 60 * 2) - 120));
    // Opponent hot hand in first half
    const hotOpponent = findHotOpponent(events.filter(e => e.opponentEvent && e.gameTime <= (settings.quarterDuration * 60 * 2)));

    const halftimeData = {
      topScorer,
      topRebounder,
      topAssister,
      mostEfficient,
      teamStats,
      pace: teamStats.pace,
      recommendations: [] as string[],
      recentOpponentRun,
      hotOpponent,
    };
    halftimeData.recommendations = generateHalftimeRecommendations(
      teamStats,
      players,
      gameState,
      opponentStats,
      halftimeData
    );
    return halftimeData;
  };

  // Helper: Calculate opponent scoring run in recent events
  function calculateOpponentRun(recentEvents: StatEvent[]) {
    let run = 0;
    for (let i = recentEvents.length - 1; i >= 0; i--) {
      const e = recentEvents[i];
      if (e.opponentEvent && (e.eventType.includes('made') || e.eventType === 'points')) {
        run += e.value || (e.eventType === 'three_made' ? 3 : e.eventType === 'ft_made' ? 1 : 2);
      } else if (!e.opponentEvent && (e.eventType.includes('made') || e.eventType === 'points')) {
        break; // Our team scored, break the run
      }
    }
    return run;
  }

  // Helper: Find opponent hot hand (most points in recent events)
  function findHotOpponent(recentEvents: StatEvent[]) {
    const oppPoints: Record<string, number> = {};
    for (const e of recentEvents) {
      if (e.opponentEvent && (e.eventType.includes('made') || e.eventType === 'points')) {
        oppPoints[e.playerName] = (oppPoints[e.playerName] || 0) + (e.value || (e.eventType === 'three_made' ? 3 : e.eventType === 'ft_made' ? 1 : 2));
      }
    }
    let maxName = null, maxPoints = 0;
    for (const name in oppPoints) {
      if (oppPoints[name] > maxPoints) {
        maxPoints = oppPoints[name];
        maxName = name;
      }
    }
    return maxPoints >= 6 ? { name: maxName, points: maxPoints } : null;
  }

  // Advanced timeout recommendations
  function generateTimeoutRecommendations(
    momentum: string,
    recentEvents: StatEvent[],
    players: Player[],
    gameState: GameState,
    teamStats: any,
    opponentStats: any
  ) {
    const recommendations: string[] = [];

    // Momentum
    if (momentum === 'negative') {
      recommendations.push('Call a set play to stop the run');
      recommendations.push('Emphasize defense and communication');
    } else {
      recommendations.push('Keep up the tempo and pressure');
      recommendations.push('Look for transition opportunities');
    }

    // Scoring runs
    const opponentRun = calculateOpponentRun(recentEvents);
    if (opponentRun >= 6) {
      recommendations.push(`Opponent is on a ${opponentRun}-0 run. Consider a defensive switch or timeout.`);
    }

    // Foul trouble
    const foulTroublePlayers = players.filter(p => p.fouls >= 3);
    if (foulTroublePlayers.length > 0) {
      recommendations.push(`Watch foul trouble: ${foulTroublePlayers.map(p => p.name).join(', ')}`);
    }

    // Rebounding
    if (teamStats.totalRebounds < opponentStats.totalRebounds) {
      recommendations.push('Crash the boards harder—opponent is out-rebounding you.');
    }

    // Turnovers
    if (teamStats.totalTurnovers > opponentStats.totalTurnovers) {
      recommendations.push('Take care of the ball—limit turnovers.');
    }

    // Shot selection
    if (teamStats.fgPercentage < 40) {
      recommendations.push('Work for higher percentage shots—attack the rim.');
    }

    // Bench usage
    const tiredPlayers = players.filter(p => p.minutesPlayed > 20);
    if (tiredPlayers.length > 0) {
      recommendations.push(`Get fresh legs in: ${tiredPlayers.map(p => p.name).join(', ')}`);
    }

    // Opponent hot hand
    const hotOpponent = findHotOpponent(recentEvents);
    if (hotOpponent) {
      recommendations.push(`Deny the ball to ${hotOpponent.name}—they are heating up (${hotOpponent.points} pts).`);
    }

    // Turnovers in recent events
    if (recentEvents.some(e => e.eventType === 'turnover')) {
      recommendations.push('Take care of the ball - no more turnovers');
    }

    return recommendations;
  }

  // DEV-ONLY: Generate timeout insights
  const generateTimeoutInsights = () => {
    // Last 2 minutes of events
    const recentEvents = events.filter(e => e.gameTime >= lastTimeoutTime - 120);
    const recentScoring = recentEvents.filter(e => e.eventType.includes('made') || e.eventType === 'points');
    const recentTurnovers = recentEvents.filter(e => e.eventType === 'turnover');
    const momentum = recentScoring.length > recentTurnovers.length ? 'positive' : 'negative';

    // Player highlights (last 2 min)
    const playersInWindow = players.map(p => {
      // Aggregate stats for this player in recentEvents
      const stats = recentEvents.filter(e => e.playerId === p.id);
      const points = stats.filter(e => e.eventType.includes('made') || e.eventType === 'points').reduce((sum, e) => sum + (e.value || (e.eventType === 'three_made' ? 3 : e.eventType === 'ft_made' ? 1 : 2)), 0);
      const rebounds = stats.filter(e => e.eventType.includes('rebound')).length;
      const assists = stats.filter(e => e.eventType === 'assist').length;
      const plusMinus = stats.reduce((sum, e) => sum + (e.eventType.includes('made') ? (e.value || 2) : 0) - (e.eventType === 'turnover' ? 2 : 0), 0);
      const fouls = stats.filter(e => e.eventType === 'foul').length;
      const turnovers = stats.filter(e => e.eventType === 'turnover').length;
      const efficiency = points + rebounds + assists - turnovers - fouls;
      return {
        ...p,
        points,
        rebounds,
        assists,
        plusMinus,
        fouls,
        turnovers,
        efficiency,
      };
    });
    const topScorer = playersInWindow.reduce((max, p) => p.points > max.points ? p : max, playersInWindow[0]);
    const topRebounder = playersInWindow.reduce((max, p) => p.rebounds > max.rebounds ? p : max, playersInWindow[0]);
    const topAssister = playersInWindow.reduce((max, p) => p.assists > max.assists ? p : max, playersInWindow[0]);
    const mostEfficient = playersInWindow.reduce((max, p) => {
      const efficiency = p.points + p.rebounds + p.assists - p.turnovers - p.fouls;
      return efficiency > max.efficiency ? { player: p, efficiency } : max;
    }, { player: playersInWindow[0], efficiency: playersInWindow[0].points + playersInWindow[0].rebounds + playersInWindow[0].assists - playersInWindow[0].turnovers - playersInWindow[0].fouls });

    // Team stats (last 2 min)
    const teamStats = {
      totalPoints: playersInWindow.reduce((sum, p) => sum + p.points, 0),
      totalRebounds: playersInWindow.reduce((sum, p) => sum + p.rebounds, 0),
      totalAssists: playersInWindow.reduce((sum, p) => sum + p.assists, 0),
      totalTurnovers: playersInWindow.reduce((sum, p) => sum + (p.turnovers || 0), 0),
      fgAttempted: recentEvents.filter(e => e.eventType === 'fg_attempt' || e.eventType === 'fg_made').length,
      fgMade: recentEvents.filter(e => e.eventType === 'fg_made').length,
      assistToTurnoverRatio: playersInWindow.reduce((sum, p) => sum + p.assists, 0) / (playersInWindow.reduce((sum, p) => sum + (p.turnovers || 0), 0) || 1),
      pace: Math.round((playersInWindow.reduce((sum, p) => sum + p.points, 0) + gameState.opponentScore) / (120 / 60) * 40),
      projectedFinal: Math.round(((playersInWindow.reduce((sum, p) => sum + p.points, 0) + gameState.opponentScore) / (120 / 60)) * (settings.quarterDuration * settings.totalQuarters)),
      fgPercentage: 0, // placeholder
    };
    teamStats.fgPercentage = teamStats.fgAttempted > 0 ? Math.round((teamStats.fgMade / teamStats.fgAttempted) * 100) : 0;

    // Opponent run/hot hand (last 2 min)
    const opponentStats = {
      totalRebounds: recentEvents.filter(e => e.opponentEvent && (e.eventType === 'defensive_rebound' || e.eventType === 'offensive_rebound')).length,
      totalTurnovers: recentEvents.filter(e => e.opponentEvent && e.eventType === 'turnover').length,
    };
    const recentOpponentRun = calculateOpponentRun(recentEvents);
    const hotOpponent = findHotOpponent(recentEvents);

    // Recommendations (reuse halftime logic, but pass windowed stats)
    const recommendations = generateHalftimeRecommendations(
      teamStats,
      playersInWindow,
      gameState,
      opponentStats,
      { momentum, pace: teamStats.pace, hotOpponent }
    );

    return {
      recentEvents,
      momentum,
      keyPlayer: topScorer, // or mostEfficient
      recommendations,
      teamStats,
      topScorer,
      topRebounder,
      topAssister,
      mostEfficient,
      recentOpponentRun,
      hotOpponent,
      pace: teamStats.pace,
      projectedFinal: teamStats.projectedFinal,
      lead: gameState.homeScore - gameState.opponentScore,
    };
  }

  // DEV-ONLY: Generate halftime recommendations
  const generateRecommendations = (teamStats: any, players: Player[]) => {
    const recommendations = []
    
    if (teamStats.fgPercentage < 40) {
      recommendations.push('Focus on shot selection - consider driving to the basket more')
    }
    if (teamStats.assistToTurnoverRatio < 1) {
      recommendations.push('Improve ball security - reduce turnovers and increase assists')
    }
    if (teamStats.totalRebounds < 15) {
      recommendations.push('Crash the boards harder - need more rebounding effort')
    }
    if (gameState.opponentScore > gameState.homeScore) {
      recommendations.push('Tighten up defense - opponents scoring too easily')
    }
    
    return recommendations
  }

  // DEV-ONLY: Generate advanced halftime recommendations
  const generateHalftimeRecommendations = (
    teamStats: any,
    players: Player[],
    gameState: GameState,
    opponentStats: any,
    halftimeData: any
  ) => {
    const recommendations: string[] = []

    // Momentum analysis
    if (halftimeData.momentum === 'positive') {
      recommendations.push('Maintain the momentum - keep up the pressure and tempo')
      recommendations.push('Look for transition opportunities and fast breaks')
    } else {
      recommendations.push('Regroup and focus on fundamentals')
      recommendations.push('Emphasize defense and ball security')
    }

    // Scoring analysis
    if (teamStats.fgPercentage < 40) {
      recommendations.push('Improve shot selection - attack the rim more')
    }
    if (teamStats.threePercentage < 30) {
      recommendations.push('Consider fewer three-point attempts - focus on high-percentage shots')
    }

    // Ball security
    if (teamStats.assistToTurnoverRatio < 1) {
      recommendations.push('Improve ball movement and reduce turnovers')
    }
    if (teamStats.totalTurnovers > 8) {
      recommendations.push('Take care of the ball - too many turnovers')
    }

    // Rebounding
    if (teamStats.totalRebounds < opponentStats.totalRebounds) {
      recommendations.push('Crash the boards harder - opponent is out-rebounding you')
    }

    // Foul trouble
    const foulTroublePlayers = players.filter(p => p.fouls >= 3)
    if (foulTroublePlayers.length > 0) {
      recommendations.push(`Manage foul trouble: ${foulTroublePlayers.map(p => p.name).join(', ')}`)
    }

    // Bench usage
    const tiredPlayers = players.filter(p => p.minutesPlayed > 15)
    if (tiredPlayers.length > 0) {
      recommendations.push(`Get fresh legs in: ${tiredPlayers.map(p => p.name).join(', ')}`)
    }

    // Opponent analysis
    if (halftimeData.hotOpponent) {
      recommendations.push(`Deny the ball to ${halftimeData.hotOpponent.name} - they are heating up`)
    }

    // Lead/deficit analysis
    const scoreDiff = gameState.homeScore - gameState.opponentScore
    if (scoreDiff > 10) {
      recommendations.push('Maintain the lead - don\'t let up on defense')
    } else if (scoreDiff < -10) {
      recommendations.push('Need to pick up the pace - focus on scoring and defense')
    } else {
      recommendations.push('Close game - every possession matters')
    }

    // Pace analysis
    if (halftimeData.pace > 80) {
      recommendations.push('High-paced game - manage energy and substitutions')
    } else if (halftimeData.pace < 60) {
      recommendations.push('Slow game - look for transition opportunities')
    }

    return recommendations
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // DEV-ONLY: Undo last action function
  const undoLastAction = () => {
    if (actionHistory.length === 0) return

    const lastAction = actionHistory[0]
    const previousState = lastAction.previousState

    // Restore previous state
    setPlayers(previousState.players)
    setGameState(previousState.gameState)
    setEvents(previousState.events)

    // Remove the last action from history
    setActionHistory(prev => prev.slice(1))
  }

  // DEV-ONLY: Handle opponent score change with undo support
  const handleOpponentScoreChange = (points: number) => {
    // Save current state for undo
    const previousState = {
      players: players,
      gameState: gameState,
      events: events
    }

    setGameState(prev => ({ ...prev, opponentScore: prev.opponentScore + points }))

    // Add to action history
    setActionHistory(prev => [{
      type: 'score',
      timestamp: Date.now(),
      data: { points, team: 'opponent' },
      previousState
    }, ...prev.slice(0, 49)]) // Keep last 50 actions
  }

  // DEV-ONLY: Enhanced stat event handler with workflow mode support and undo tracking
  const handleStatEvent = useCallback((playerId: number, eventType: string, value?: number, isOpponent: boolean = false) => {
    const player = players.find(p => p.id === playerId)
    if (!player) return

    // Save current state for undo
    const previousState = {
      players: players,
      gameState: gameState,
      events: events
    }

    // DEV-ONLY: Apply foul trouble alert
    if (eventType === 'foul' && settings.foulTroubleAlert && player.fouls >= 2) {
      // Could show notification here
      console.log(`⚠️ Foul trouble alert: ${player.name} has ${player.fouls + 1} fouls`)
    }

    const newEvent: StatEvent = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      playerId,
      playerName: player.name,
      eventType,
      value,
      quarter: gameState.quarter,
      gameTime: (settings.quarterDuration * 60) - gameState.currentTime,
      opponentEvent: isOpponent
    }

    setEvents(prev => [newEvent, ...prev])

    // Update player stats
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const updated = { ...p };
      switch (eventType) {
        case 'points':
          updated.points += value || 2;
          updated.plusMinus += value || 2;
          break;
        case 'rebound':
          updated.rebounds += 1;
          break;
        case 'offensive_rebound':
          updated.offensiveRebounds += 1;
          updated.rebounds += 1;
          break;
        case 'defensive_rebound':
          updated.defensiveRebounds += 1;
          updated.rebounds += 1;
          break;
        case 'assist':
          updated.assists += 1;
          break;
        case 'steal':
          updated.steals += 1;
          updated.plusMinus += 2;
          break;
        case 'block':
          updated.blocks += 1;
          break;
        case 'foul':
          updated.fouls += 1;
          break;
        case 'turnover':
          updated.turnovers += 1;
          updated.plusMinus -= 2;
          break;
        case 'charge_taken':
          updated.chargesTaken += 1;
          updated.plusMinus += 2;
          break;
        case 'deflection':
          updated.deflections += 1;
          break;
        case 'fg_attempt':
          updated.fgAttempted += 1;
          break;
        case 'fg_made':
          updated.fgMade += 1;
          updated.points += 2;
          updated.plusMinus += 2;
          break;
        case 'three_attempt':
          updated.threeAttempted += 1;
          break;
        case 'three_made':
          updated.threeMade += 1;
          updated.points += 3;
          updated.plusMinus += 3;
          break;
        case 'ft_attempt':
          updated.ftAttempted += 1;
          break;
        case 'ft_made':
          updated.ftMade += 1;
          updated.points += 1;
          updated.plusMinus += 1;
          break;
      }
      return updated;
    }));

    // Update team score for points
    if (eventType.includes('made') || eventType === 'points') {
      const points = eventType === 'three_made' ? 3 : eventType === 'ft_made' ? 1 : value || 2
      if (isOpponent) {
        setGameState(prev => ({
          ...prev,
          opponentScore: prev.opponentScore + points
        }))
      } else {
        setGameState(prev => ({
          ...prev,
          homeScore: prev.homeScore + points
        }))
      }
    }

    // Add to action history
    setActionHistory(prev => [{
      type: 'stat',
      timestamp: Date.now(),
      data: { playerId, eventType, value, isOpponent },
      previousState
    }, ...prev.slice(0, 49)]) // Keep last 50 actions
  }, [players, gameState.quarter, gameState.currentTime, settings.foulTroubleAlert, actionHistory])

  // DEV-ONLY: Auto-export functionality
  useEffect(() => {
    if (settings.autoExport && gameState.isPlaying) {
      const interval = setInterval(() => {
        const gameData = {
          gameState,
          players,
          events,
          lineups,
          exportTime: new Date().toISOString()
        }
        
        if (settings.exportFormat === 'json') {
          const dataStr = JSON.stringify(gameData, null, 2)
          const dataBlob = new Blob([dataStr], { type: 'application/json' })
          const url = URL.createObjectURL(dataBlob)
          const link = document.createElement('a')
          link.href = url
          link.download = `auto-export-${Date.now()}.json`
          link.click()
        }
      }, settings.exportInterval * 60 * 1000) // Convert minutes to milliseconds
      
      return () => clearInterval(interval)
    }
  }, [settings.autoExport, settings.exportInterval, settings.exportFormat, gameState.isPlaying, players, events, lineups])

  // DEV-ONLY: Foul trouble alerts
  useEffect(() => {
    if (settings.foulTroubleAlert) {
      const playersInFoulTrouble = players.filter(p => p.fouls >= 3)
      if (playersInFoulTrouble.length > 0) {
        // Could show notification here
        console.log('Foul trouble alert:', playersInFoulTrouble.map(p => p.name))
      }
    }
  }, [players, settings.foulTroubleAlert])

  // DEV-ONLY: Apply display settings
  useEffect(() => {
    if (settings.darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [settings.darkMode])

  // DEV-ONLY: Enhanced export functionality for game data
  const exportGameData = (format: 'csv' | 'json' | 'pdf') => {
    const gameData: any = {
      exportTime: new Date().toISOString()
    }

    if (settings.includePlayerStats) {
      gameData.players = players
    }
    if (settings.includeTeamStats) {
      gameData.gameState = gameState
      gameData.teamStats = calculateTeamStats()
    }
    if (settings.includeLineupData) {
      gameData.lineups = lineups
    }
    gameData.events = events

    if (format === 'json') {
      const dataStr = JSON.stringify(gameData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `game-stats-${Date.now()}.json`
      link.click()
    } else if (format === 'csv') {
      // DEV-ONLY: Enhanced CSV export with settings
      const csvContent = generateCSV(gameData)
      const dataBlob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `game-stats-${Date.now()}.csv`
      link.click()
    }
  }

  // DEV-ONLY: Enhanced CSV generation with settings
  const generateCSV = (gameData: any) => {
    const headers = ['Player', 'Number', 'Position', 'Minutes', 'Points', 'Rebounds', 'Assists', 'Steals', 'Blocks', 'Fouls', 'Turnovers', 'FG%', '3PT%', 'FT%', '+/-']
    const rows = gameData.players.map((player: Player) => [
      player.name,
      settings.showPlayerNumbers ? player.number : '',
      settings.showPositions ? player.position : '',
      player.minutesPlayed,
      player.points,
      player.rebounds,
      player.assists,
      player.steals,
      player.blocks,
      player.fouls,
      player.turnovers,
      player.fgAttempted > 0 ? `${Math.round((player.fgMade / player.fgAttempted) * 100)}%` : '0%',
      player.threeAttempted > 0 ? `${Math.round((player.threeMade / player.threeAttempted) * 100)}%` : '0%',
      player.ftAttempted > 0 ? `${Math.round((player.ftMade / player.ftAttempted) * 100)}%` : '0%',
      player.plusMinus
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  // DEV-ONLY: Calculate team analytics with advanced stats
  const calculateTeamStats = () => {
    const totalPoints = players.reduce((sum, p) => sum + p.points, 0)
    const totalRebounds = players.reduce((sum, p) => sum + p.rebounds, 0)
    const totalAssists = players.reduce((sum, p) => sum + p.assists, 0)
    const totalTurnovers = players.reduce((sum, p) => sum + p.turnovers, 0)
    const totalFgAttempted = players.reduce((sum, p) => sum + p.fgAttempted, 0)
    const totalFgMade = players.reduce((sum, p) => sum + p.fgMade, 0)
    const totalSteals = players.reduce((sum, p) => sum + p.steals, 0)
    const totalBlocks = players.reduce((sum, p) => sum + p.blocks, 0)
    
    const gameTimeElapsed = (settings.quarterDuration * 60) - gameState.currentTime
    const pace = Math.round((totalPoints + gameState.opponentScore) / (gameTimeElapsed / 60) * 40)
    
    return {
      totalPoints,
      totalRebounds,
      totalAssists,
      totalTurnovers,
      totalSteals,
      totalBlocks,
      fgPercentage: totalFgAttempted > 0 ? Math.round((totalFgMade / totalFgAttempted) * 100) : 0,
      assistToTurnoverRatio: totalTurnovers > 0 ? (totalAssists / totalTurnovers).toFixed(2) : '0.00',
      pace,
      projectedFinal: Math.round(pace * 0.4)
    }
  }

  // DEV-ONLY: Enhanced lineup management functions
  const createLineup = () => {
    if (selectedLineupPlayers.length !== 5) {
      return // Need exactly 5 players
    }

    const newLineup: Lineup = {
      id: Date.now().toString(),
      players: selectedLineupPlayers,
      startTime: (settings.quarterDuration * 60) - gameState.currentTime,
      plusMinus: 0
    }

    setLineups(prev => [...prev, newLineup])
    setCurrentLineup(newLineup)
    setSelectedLineupPlayers([])
    setLineupName('')
    setShowLineupBuilder(false)

    // Update player court status
    setPlayers(prev => prev.map(p => ({
      ...p,
      isOnCourt: selectedLineupPlayers.includes(p.id)
    })))
  }

  const endCurrentLineup = () => {
    if (!currentLineup) return

    const endTime = (settings.quarterDuration * 60) - gameState.currentTime
    const lineupDuration = endTime - currentLineup.startTime
    
    // Calculate lineup plus/minus
    const lineupPlayers = players.filter(p => currentLineup.players.includes(p.id))
    const totalPlusMinus = lineupPlayers.reduce((sum, p) => sum + p.plusMinus, 0)

    setLineups(prev => prev.map(l => 
      l.id === currentLineup.id 
        ? { ...l, endTime, plusMinus: totalPlusMinus }
        : l
    ))

    setCurrentLineup(null)
    
    // Remove all players from court
    setPlayers(prev => prev.map(p => ({ ...p, isOnCourt: false })))
  }

  // DEV-ONLY: Enhanced substitution function with comprehensive tracking
  const substitutePlayer = (playerIn: Player, playerOut: Player) => {
    // Save current state for undo
    const previousState = {
      players: players,
      gameState: gameState,
      events: events,
      lineups: lineups,
      currentLineup: currentLineup
    }

    // End current lineup if it exists
    if (currentLineup) {
      const endTime = (settings.quarterDuration * 60) - gameState.currentTime
      const lineupDuration = endTime - currentLineup.startTime
      
      // Calculate lineup plus/minus
      const lineupPlayers = players.filter(p => currentLineup.players.includes(p.id))
      const totalPlusMinus = lineupPlayers.reduce((sum, p) => sum + p.plusMinus, 0)

      setLineups(prev => prev.map(l => 
        l.id === currentLineup.id 
          ? { ...l, endTime, plusMinus: totalPlusMinus }
          : l
      ))
    }

    // Create new lineup with the substitution
    const newLineupPlayers = currentLineup ? 
      currentLineup.players.map(p => p === playerOut.id ? playerIn.id : p) :
      [playerIn.id, ...players.slice(0, 4).map(p => p.id)]

    const newLineup: Lineup = {
      id: `lineup-${Date.now()}`,
      players: newLineupPlayers,
      startTime: (settings.quarterDuration * 60) - gameState.currentTime,
      plusMinus: 0
    }

    setCurrentLineup(newLineup)
    setLineups(prev => [...prev, newLineup])

    // Update player court status
    setPlayers(prev => prev.map(p => ({
      ...p,
      isOnCourt: p.id === playerIn.id ? true : p.id === playerOut.id ? false : p.isOnCourt
    })))

    // Track comprehensive substitution history
    const substitutionRecord = {
      playerIn,
      playerOut,
      timestamp: Date.now(),
      quarter: gameState.quarter,
      gameTime: (settings.quarterDuration * 60) - gameState.currentTime,
      lineupId: newLineup.id
    }
    setSubstitutionHistory(prev => [substitutionRecord, ...prev.slice(0, 49)]) // Keep last 50

    // Add detailed substitution events to game events
    const substitutionEvent: StatEvent = {
      id: `sub_${Date.now()}`,
      timestamp: Date.now(),
      playerId: playerIn.id,
      playerName: playerIn.name,
      eventType: 'substitution_in',
      quarter: gameState.quarter,
      gameTime: (settings.quarterDuration * 60) - gameState.currentTime
    }

    const substitutionOutEvent: StatEvent = {
      id: `sub_out_${Date.now()}`,
      timestamp: Date.now(),
      playerId: playerOut.id,
      playerName: playerOut.name,
      eventType: 'substitution_out',
      quarter: gameState.quarter,
      gameTime: (settings.quarterDuration * 60) - gameState.currentTime
    }

    const lineupChangeEvent: StatEvent = {
      id: `lineup_${Date.now()}`,
      timestamp: Date.now(),
      playerId: 0, // Team event
      playerName: 'TEAM',
      eventType: 'lineup_change',
      quarter: gameState.quarter,
      gameTime: (settings.quarterDuration * 60) - gameState.currentTime
    }

    setEvents(prev => [substitutionEvent, substitutionOutEvent, lineupChangeEvent, ...prev])

    // Auto-pause game during substitution if enabled
    if (settings.autoPauseOnTimeout && gameState.isPlaying) {
      setGameState(prev => ({ ...prev, isPlaying: false }))
    }

    // Add to action history for undo
    setActionHistory(prev => [{
      type: 'substitution',
      timestamp: Date.now(),
      data: { playerIn, playerOut, newLineup },
      previousState
    }, ...prev.slice(0, 49)]) // Keep last 50 actions
  }

  // DEV-ONLY: Quick substitution handler with undo support
  const handleQuickSubstitution = (playerIn: Player, playerOut: Player) => {
    // Save current state for undo
    const previousState = {
      players: players,
      gameState: gameState,
      events: events,
      lineups: lineups,
      currentLineup: currentLineup
    }

    substitutePlayer(playerIn, playerOut)
    
    // Update selected player if the substituted player was selected
    if (selectedPlayer?.id === playerOut.id) {
      setSelectedPlayer(playerIn)
    }
    
    // Add to action history
    setActionHistory(prev => [{
      type: 'substitution',
      timestamp: Date.now(),
      data: { playerIn, playerOut },
      previousState
    }, ...prev.slice(0, 49)]) // Keep last 50 actions
    
    setShowQuickSubModal(false)
    setSubstitutionPlayerIn(null)
    setSubstitutionPlayerOut(null)
  }

  // DEV-ONLY: Undo last substitution
  const undoLastSubstitution = () => {
    if (quickSubHistory.length > 0) {
      const lastSub = quickSubHistory[0]
      substitutePlayer(lastSub.playerOut, lastSub.playerIn)
      setQuickSubHistory(prev => prev.slice(1))
    }
  }

  // DEV-ONLY: Keyboard shortcuts for quick substitutions
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      // Quick substitution modal (Ctrl+S)
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        if (currentLineup) {
          setShowQuickSubModal(true)
        }
      }

      // Undo last action (Ctrl+Z)
      if (event.ctrlKey && event.key === 'z') {
        event.preventDefault()
        undoLastAction()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentLineup, actionHistory])

  // DEV-ONLY: Get substitution statistics
  const getSubstitutionStats = () => {
    const totalSubs = quickSubHistory.length
    const uniquePlayers = new Set(quickSubHistory.flatMap(sub => [sub.playerIn.id, sub.playerOut.id])).size
    const mostSubbedIn = players.reduce((most: { player: Player | null, count: number }, player: Player) => {
      const count = quickSubHistory.filter(sub => sub.playerIn.id === player.id).length
      return count > most.count ? { player, count } : most
    }, { player: null, count: 0 })

    return { totalSubs, uniquePlayers, mostSubbedIn }
  }

  // DEV-ONLY: Calculate lineup effectiveness
  const calculateLineupEffectiveness = (lineup: Lineup) => {
    const lineupPlayers = players.filter(p => lineup.players.includes(p.id))
    const totalPoints = lineupPlayers.reduce((sum, p) => sum + p.points, 0)
    const totalRebounds = lineupPlayers.reduce((sum, p) => sum + p.rebounds, 0)
    const totalAssists = lineupPlayers.reduce((sum, p) => sum + p.assists, 0)
    const totalTurnovers = lineupPlayers.reduce((sum, p) => sum + p.turnovers, 0)
    const totalPlusMinus = lineupPlayers.reduce((sum, p) => sum + p.plusMinus, 0)
    
    const duration = lineup.endTime ? lineup.endTime - lineup.startTime : (settings.quarterDuration * 60) - gameState.currentTime - lineup.startTime
    const minutesPlayed = Math.round(duration / 60 * 10) / 10

    return {
      totalPoints,
      totalRebounds,
      totalAssists,
      totalTurnovers,
      totalPlusMinus,
      minutesPlayed,
      efficiency: totalPlusMinus / minutesPlayed || 0
    }
  }

  // DEV-ONLY: Get available players for substitution
  const getAvailablePlayers = () => {
    return players.filter(p => !p.isOnCourt)
  }

  // DEV-ONLY: Get current court players
  const getCourtPlayers = () => {
    return players.filter(p => p.isOnCourt)
  }

  const toggleGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))
  }

  const resetGame = () => {
    setGameState({
      isPlaying: false,
      currentTime: settings.quarterDuration * 60,
      quarter: 1,
      homeScore: 0,
      awayScore: 0,
      opponentScore: 0,
      timeoutHome: settings.timeoutCount,
      timeoutAway: settings.timeoutCount
    })
    setPlayers(prev => prev.map(p => ({ 
      ...p, 
      minutesPlayed: 0, points: 0, rebounds: 0, offensiveRebounds: 0, defensiveRebounds: 0, 
      assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, fgAttempted: 0, fgMade: 0, 
      threeAttempted: 0, threeMade: 0, ftAttempted: 0, ftMade: 0, plusMinus: 0, 
      chargesTaken: 0, deflections: 0, isOnCourt: false 
    })))
    setEvents([])
    setLineups([])
  }

  const nextQuarter = () => {
    // Save current state for undo
    const previousState = {
      players: players,
      gameState: gameState,
      events: events
    }

    setGameState(prev => ({
      ...prev,
      quarter: Math.min(prev.quarter + 1, settings.totalQuarters),
      currentTime: settings.quarterDuration * 60
    }))
    
    // DEV-ONLY: Auto-pause on quarter end if enabled
    if (settings.autoPauseOnQuarterEnd) {
      setGameState(prev => ({ ...prev, isPlaying: false }))
    }

    // Add to action history
    setActionHistory(prev => [{
      type: 'quarter',
      timestamp: Date.now(),
      data: { quarter: gameState.quarter + 1 },
      previousState
    }, ...prev.slice(0, 49)]) // Keep last 50 actions
  }

  const teamStats = calculateTeamStats()
  const halftimeInsights = [
    { title: 'Shooting Efficiency', value: `${teamStats.fgPercentage}%`, status: teamStats.fgPercentage < 40 ? 'error' : teamStats.fgPercentage < 50 ? 'warning' : 'success' },
    { title: 'Rebound Rate', value: `${Math.round((teamStats.totalRebounds / (teamStats.totalRebounds + 20)) * 100)}%`, status: 'default' },
    { title: 'Assist/Turnover Ratio', value: teamStats.assistToTurnoverRatio, status: parseFloat(teamStats.assistToTurnoverRatio) < 1 ? 'error' : parseFloat(teamStats.assistToTurnoverRatio) < 1.5 ? 'warning' : 'success' },
    { title: 'Points per Quarter', value: Math.round(teamStats.totalPoints / gameState.quarter), status: 'default' }
  ]

  const halftimeData = generateHalftimeInsights()
  const timeoutData = generateTimeoutInsights()

  // DEV-ONLY: Enhanced player columns with settings
  const playerColumns = [
    { title: 'Player', dataIndex: 'name', key: 'name' },
    ...(settings.showPlayerNumbers ? [{ title: '#', dataIndex: 'number', key: 'number' }] : []),
    ...(settings.showPositions ? [{ title: 'Pos', dataIndex: 'position', key: 'position' }] : []),
    { title: 'PTS', dataIndex: 'points', key: 'points' },
    { title: 'REB', dataIndex: 'rebounds', key: 'rebounds' },
    { title: 'AST', dataIndex: 'assists', key: 'assists' },
    { title: 'STL', dataIndex: 'steals', key: 'steals' },
    { title: 'BLK', dataIndex: 'blocks', key: 'blocks' },
    { title: 'TO', dataIndex: 'turnovers', key: 'turnovers' },
    { title: 'FG%', key: 'fgPercentage', render: (text: any, record: Player) => 
      record.fgAttempted > 0 ? `${Math.round((record.fgMade / record.fgAttempted) * 100)}%` : '0%'
    },
    { title: '+/-', dataIndex: 'plusMinus', key: 'plusMinus' },
    ...(settings.showEfficiencyRatings ? [{ 
      title: 'EFF', 
      key: 'efficiency', 
      render: (text: any, record: Player) => {
        const efficiency = record.points + record.rebounds + record.assists + record.steals + record.blocks - record.turnovers - record.fouls
        return efficiency >= settings.efficiencyThreshold ? '⭐' : efficiency
      }
    }] : [])
  ]

  // DEV-ONLY: Create tabs items for modern API
  const tabItems = [
    {
      key: 'tracking',
      label: 'Live Tracking',
      children: (
        <Row gutter={[16, 16]}>
          {settings.workflowMode === 'player-first' ? (
            <>
              <Col span={12}>
                {/* Player box */}
                <Card title="Player" size={settings.compactMode ? 'small' : 'default'}>
                  <Row gutter={[8, 8]}>
                    <Col span={12}>
                      {players.slice(0, 3).map(player => (
                        <div key={player.id} className={`${style.playerCard} ${selectedPlayer?.id === player.id ? style.selected : ''}`}>
                          <div onClick={() => setSelectedPlayer(player)} style={{ cursor: 'pointer', flex: 1 }}>
                            <Text strong style={{ fontSize: settings.compactMode ? '0.8rem' : '0.9rem' }}>{settings.showPlayerNumbers && `#${player.number} `}{player.name}</Text>
                            {settings.showPositions && (<><br /><Text type="secondary" style={{ fontSize: settings.compactMode ? '0.6rem' : '0.8rem' }}>{player.position}</Text></>)}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                            <div>
                              <Badge count={player.points} style={{ backgroundColor: '#52c41a' }} />
                              <Text type="secondary" style={{ fontSize: settings.compactMode ? '0.6rem' : '0.8rem' }}> PTS</Text>
                              <br />
                              <Badge count={player.plusMinus} style={{ backgroundColor: player.plusMinus >= 0 ? '#52c41a' : '#f5222d' }} />
                              <Text type="secondary" style={{ fontSize: settings.compactMode ? '0.6rem' : '0.8rem' }}> +/-</Text>
                            </div>
                            {player.isOnCourt && (
                              <Button 
                                size="small" 
                                type="primary"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSubstitution(player)
                                }}
                                style={{ 
                                  fontSize: '0.7rem', 
                                  height: 24, 
                                  padding: '0 8px',
                                  backgroundColor: '#ff4d4f',
                                  borderColor: '#ff4d4f'
                                }}
                              >
                                Sub
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </Col>
                    <Col span={12}>
                      {players.slice(3, 5).map(player => (
                        <div key={player.id} className={`${style.playerCard} ${selectedPlayer?.id === player.id ? style.selected : ''}`}>
                          <div onClick={() => setSelectedPlayer(player)} style={{ cursor: 'pointer', flex: 1 }}>
                            <Text strong style={{ fontSize: settings.compactMode ? '0.8rem' : '0.9rem' }}>{settings.showPlayerNumbers && `#${player.number} `}{player.name}</Text>
                            {settings.showPositions && (<><br /><Text type="secondary" style={{ fontSize: settings.compactMode ? '0.6rem' : '0.8rem' }}>{player.position}</Text></>)}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                            <div>
                              <Badge count={player.points} style={{ backgroundColor: '#52c41a' }} />
                              <Text type="secondary" style={{ fontSize: settings.compactMode ? '0.6rem' : '0.8rem' }}> PTS</Text>
                              <br />
                              <Badge count={player.plusMinus} style={{ backgroundColor: player.plusMinus >= 0 ? '#52c41a' : '#f5222d' }} />
                              <Text type="secondary" style={{ fontSize: settings.compactMode ? '0.6rem' : '0.8rem' }}> +/-</Text>
                            </div>
                            {player.isOnCourt && (
                              <Button 
                                size="small" 
                                type="primary"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSubstitution(player)
                                }}
                                style={{ 
                                  fontSize: '0.7rem', 
                                  height: 24, 
                                  padding: '0 8px',
                                  backgroundColor: '#ff4d4f',
                                  borderColor: '#ff4d4f'
                                }}
                              >
                                Sub
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <div style={{ marginTop: 8 }}>
                        <Button type="primary" icon={<TeamOutlined />} onClick={() => {
                          if (!currentLineup) {
                            const firstFivePlayers = players.slice(0, 5).map(p => p.id)
                            const newLineup = { id: `lineup-${Date.now()}`, players: firstFivePlayers, startTime: gameState.currentTime, plusMinus: 0 }
                            setCurrentLineup(newLineup)
                            setLineups(prev => [...prev, newLineup])
                            setPlayers(prev => prev.map(p => ({ ...p, isOnCourt: firstFivePlayers.includes(p.id) })))
                          }
                          setShowQuickSubModal(true)
                        }} size="small" block style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', color: '#fff', fontWeight: 600, height: 40, fontSize: '0.9rem' }}>{currentLineup ? 'Quick Substitution' : 'Start Lineup & Sub'}</Button>
                        {quickSubHistory.length > 0 && (
                          <Button size="small" onClick={undoLastSubstitution} block style={{ marginTop: 4, height: 28, fontSize: '0.8rem' }}>Undo Last Sub</Button>
                        )}
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col span={12}>
                {/* Action box */}
                <Card title="Action" size={settings.compactMode ? 'small' : 'default'}>
                  <Row gutter={[8, 8]}>
                    <Col span={8}>
                      <Button 
                        size="middle"
                        block 
                        onClick={() => selectedPlayer && handleStatEvent(selectedPlayer.id, 'fg_made')}
                        disabled={!selectedPlayer}
                        className={style.quickStatButton}
                      >
                        2PT Made
                      </Button>
                    </Col>
                    <Col span={8}>
                      <Button 
                        size="middle"
                        block 
                        onClick={() => selectedPlayer && handleStatEvent(selectedPlayer.id, 'fg_missed')}
                        disabled={!selectedPlayer}
                        className={style.quickStatButton}
                      >
                        2PT Miss
                      </Button>
                    </Col>
                    <Col span={8}>
                      <Button 
                        size="middle"
                        block 
                        onClick={() => selectedPlayer && handleStatEvent(selectedPlayer.id, 'three_made')}
                        disabled={!selectedPlayer}
                        className={style.quickStatButton}
                      >
                        3PT Made
                      </Button>
                    </Col>
                    <Col span={8}>
                      <Button 
                        size="middle"
                        block 
                        onClick={() => selectedPlayer && handleStatEvent(selectedPlayer.id, 'three_missed')}
                        disabled={!selectedPlayer}
                        className={style.quickStatButton}
                      >
                        3PT Miss
                      </Button>
                    </Col>
                    <Col span={8}>
                      <Button 
                        size="middle"
                        block 
                        onClick={() => selectedPlayer && handleStatEvent(selectedPlayer.id, 'ft_made')}
                        disabled={!selectedPlayer}
                        className={style.quickStatButton}
                      >
                        FT Made
                      </Button>
                    </Col>
                    <Col span={8}>
                      <Button 
                        size="middle"
                        block 
                        onClick={() => selectedPlayer && handleStatEvent(selectedPlayer.id, 'ft_missed')}
                        disabled={!selectedPlayer}
                        className={style.quickStatButton}
                      >
                        FT Miss
                      </Button>
                    </Col>
                    <Col span={8}>
                      <Button 
                        size="middle"
                        block 
                        onClick={() => selectedPlayer && handleStatEvent(selectedPlayer.id, 'rebound')}
                        disabled={!selectedPlayer}
                        className={style.quickStatButton}
                      >
                        Rebound
                      </Button>
                    </Col>
                    <Col span={8}>
                      <Button 
                        size="middle"
                        block 
                        onClick={() => selectedPlayer && handleStatEvent(selectedPlayer.id, 'assist')}
                        disabled={!selectedPlayer}
                        className={style.quickStatButton}
                      >
                        Assist
                      </Button>
                    </Col>
                    <Col span={8}>
                      <Button 
                        size="middle"
                        block 
                        onClick={() => selectedPlayer && handleStatEvent(selectedPlayer.id, 'steal')}
                        disabled={!selectedPlayer}
                        className={style.quickStatButton}
                      >
                        Steal
                      </Button>
                    </Col>
                    <Col span={8}>
                      <Button 
                        size="middle"
                        block 
                        onClick={() => selectedPlayer && handleStatEvent(selectedPlayer.id, 'block')}
                        disabled={!selectedPlayer}
                        className={style.quickStatButton}
                      >
                        Block
                      </Button>
                    </Col>
                    <Col span={8}>
                      <Button 
                        size="middle"
                        block 
                        danger
                        onClick={() => selectedPlayer && handleStatEvent(selectedPlayer.id, 'turnover')}
                        disabled={!selectedPlayer}
                        className={style.quickStatButton}
                      >
                        Turnover
                      </Button>
                    </Col>
                    <Col span={8}>
                      <Button 
                        size="middle"
                        block 
                        danger
                        onClick={() => selectedPlayer && handleStatEvent(selectedPlayer.id, 'foul')}
                        disabled={!selectedPlayer}
                        className={style.quickStatButton}
                      >
                        Foul
                      </Button>
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Play by Play" size="small">
                  <div className={style.eventsFeed}>
                    {events.slice(0, 10).map(event => (
                      <div key={event.id} className={style.eventItem}>
                        <Text type="secondary">{formatTime(event.gameTime)}</Text>
                        <Text strong>{event.playerName}</Text>
                        <Text>{event.eventType}</Text>
                        {event.value && <Badge count={event.value} />}
                        {event.opponentEvent && <Badge count="OPP" style={{ backgroundColor: '#f5222d' }} />}
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Player Statistics" size="small">
                  {selectedPlayer ? (
                    <div>
                      <Title level={4}>
                        {settings.showPlayerNumbers && `#${selectedPlayer.number} `}{selectedPlayer.name}
                        {settings.showPositions && ` (${selectedPlayer.position})`}
                      </Title>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Statistic title="Points" value={selectedPlayer.points} />
                        </Col>
                        <Col span={8}>
                          <Statistic title="Rebounds" value={selectedPlayer.rebounds} />
                        </Col>
                        <Col span={8}>
                          <Statistic title="Assists" value={selectedPlayer.assists} />
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Statistic title="Steals" value={selectedPlayer.steals} />
                        </Col>
                        <Col span={8}>
                          <Statistic title="Blocks" value={selectedPlayer.blocks} />
                        </Col>
                        <Col span={8}>
                          <Statistic title="Fouls" value={selectedPlayer.fouls} />
                        </Col>
                      </Row>
                      <Divider />
                      <Text>FG: {selectedPlayer.fgMade}/{selectedPlayer.fgAttempted} ({selectedPlayer.fgAttempted > 0 ? Math.round((selectedPlayer.fgMade / selectedPlayer.fgAttempted) * 100) : 0}%)</Text>
                      <br />
                      <Text>3PT: {selectedPlayer.threeMade}/{selectedPlayer.threeAttempted} ({selectedPlayer.threeAttempted > 0 ? Math.round((selectedPlayer.threeMade / selectedPlayer.threeAttempted) * 100) : 0}%)</Text>
                      <br />
                      <Text>FT: {selectedPlayer.ftMade}/{selectedPlayer.ftAttempted} ({selectedPlayer.ftAttempted > 0 ? Math.round((selectedPlayer.ftMade / selectedPlayer.ftAttempted) * 100) : 0}%)</Text>
                      <br />
                      <Text>+/-: {selectedPlayer.plusMinus}</Text>
                      {settings.showEfficiencyRatings && (
                        <>
                          <br />
                          <Text>Efficiency: {selectedPlayer.points + selectedPlayer.rebounds + selectedPlayer.assists + selectedPlayer.steals + selectedPlayer.blocks - selectedPlayer.turnovers - selectedPlayer.fouls}</Text>
                        </>
                      )}
                      {settings.showTrends && selectedPlayer.plusMinus > 0 && (
                        <>
                          <br />
                          <Text type="success">📈 Positive impact on court</Text>
                        </>
                      )}
                    </div>
                  ) : (
                    <Text type="secondary">No player selected</Text>
                  )}
                </Card>
              </Col>
            </>
          ) : (
            <>
              <Col span={12}>
                {/* Action box */}
                <Card title="Action" size={settings.compactMode ? 'small' : 'default'}>
                  <Row gutter={[8, 8]}>
                    <Col span={settings.compactMode ? 12 : 8}>
                      <Button 
                        size={settings.compactMode ? 'small' : 'middle'}
                        block 
                        type={selectedAction === 'fg_made' ? 'primary' : 'default'}
                        onClick={() => setSelectedAction(selectedAction === 'fg_made' ? null : 'fg_made')}
                      >
                        {settings.compactMode ? '2PT' : '2PT Made'}
                      </Button>
                    </Col>
                    <Col span={settings.compactMode ? 12 : 8}>
                      <Button 
                        size={settings.compactMode ? 'small' : 'middle'}
                        block 
                        type={selectedAction === 'three_made' ? 'primary' : 'default'}
                        onClick={() => setSelectedAction(selectedAction === 'three_made' ? null : 'three_made')}
                      >
                        {settings.compactMode ? '3PT' : '3PT Made'}
                      </Button>
                    </Col>
                    <Col span={settings.compactMode ? 12 : 8}>
                      <Button 
                        size={settings.compactMode ? 'small' : 'middle'}
                        block 
                        type={selectedAction === 'ft_made' ? 'primary' : 'default'}
                        onClick={() => setSelectedAction(selectedAction === 'ft_made' ? null : 'ft_made')}
                      >
                        {settings.compactMode ? 'FT' : 'FT Made'}
                      </Button>
                    </Col>
                    <Col span={settings.compactMode ? 12 : 8}>
                      <Button 
                        size={settings.compactMode ? 'small' : 'middle'}
                        block 
                        type={selectedAction === 'defensive_rebound' ? 'primary' : 'default'}
                        onClick={() => setSelectedAction(selectedAction === 'defensive_rebound' ? null : 'defensive_rebound')}
                      >
                        {settings.compactMode ? 'DEF' : 'Def Rebound'}
                      </Button>
                    </Col>
                    <Col span={settings.compactMode ? 12 : 8}>
                      <Button 
                        size={settings.compactMode ? 'small' : 'middle'}
                        block 
                        type={selectedAction === 'offensive_rebound' ? 'primary' : 'default'}
                        onClick={() => setSelectedAction(selectedAction === 'offensive_rebound' ? null : 'offensive_rebound')}
                      >
                        {settings.compactMode ? 'OFF' : 'Off Rebound'}
                      </Button>
                    </Col>
                    <Col span={settings.compactMode ? 12 : 8}>
                      <Button 
                        size={settings.compactMode ? 'small' : 'middle'}
                        block 
                        type={selectedAction === 'assist' ? 'primary' : 'default'}
                        onClick={() => setSelectedAction(selectedAction === 'assist' ? null : 'assist')}
                      >
                        {settings.compactMode ? 'AST' : 'Assist'}
                      </Button>
                    </Col>
                    <Col span={settings.compactMode ? 12 : 8}>
                      <Button 
                        size={settings.compactMode ? 'small' : 'middle'}
                        block 
                        type={selectedAction === 'steal' ? 'primary' : 'default'}
                        onClick={() => setSelectedAction(selectedAction === 'steal' ? null : 'steal')}
                      >
                        {settings.compactMode ? 'STL' : 'Steal'}
                      </Button>
                    </Col>
                    <Col span={settings.compactMode ? 12 : 8}>
                      <Button 
                        size={settings.compactMode ? 'small' : 'middle'}
                        block 
                        type={selectedAction === 'block' ? 'primary' : 'default'}
                        onClick={() => setSelectedAction(selectedAction === 'block' ? null : 'block')}
                      >
                        {settings.compactMode ? 'BLK' : 'Block'}
                      </Button>
                    </Col>
                    <Col span={settings.compactMode ? 12 : 8}>
                      <Button 
                        size={settings.compactMode ? 'small' : 'middle'}
                        block 
                        danger
                        type={selectedAction === 'foul' ? 'primary' : 'default'}
                        onClick={() => setSelectedAction(selectedAction === 'foul' ? null : 'foul')}
                      >
                        {settings.compactMode ? 'FL' : 'Foul'}
                      </Button>
                    </Col>
                    <Col span={settings.compactMode ? 12 : 8}>
                      <Button 
                        size={settings.compactMode ? 'small' : 'middle'}
                        block 
                        danger
                        type={selectedAction === 'turnover' ? 'primary' : 'default'}
                        onClick={() => setSelectedAction(selectedAction === 'turnover' ? null : 'turnover')}
                      >
                        {settings.compactMode ? 'TO' : 'Turnover'}
                      </Button>
                    </Col>
                    <Col span={settings.compactMode ? 12 : 8}>
                      <Button 
                        size={settings.compactMode ? 'small' : 'middle'}
                        block 
                        type={selectedAction === 'charge_taken' ? 'primary' : 'default'}
                        onClick={() => setSelectedAction(selectedAction === 'charge_taken' ? null : 'charge_taken')}
                      >
                        {settings.compactMode ? 'CHG' : 'Charge'}
                      </Button>
                    </Col>
                    <Col span={settings.compactMode ? 12 : 8}>
                      <Button 
                        size={settings.compactMode ? 'small' : 'middle'}
                        block 
                        type={selectedAction === 'deflection' ? 'primary' : 'default'}
                        onClick={() => setSelectedAction(selectedAction === 'deflection' ? null : 'deflection')}
                      >
                        {settings.compactMode ? 'DEFL' : 'Deflection'}
                      </Button>
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col span={12}>
                {/* Player Selection for Action First */}
                <Card title="Player" size={settings.compactMode ? 'small' : 'default'}>
                  <Row gutter={[8, 8]}>
                    {/* First Column - Players 1-3 */}
                    <Col span={12}>
                      {players.slice(0, 3).map(player => (
                        <div 
                          key={player.id} 
                          className={`${style.playerCard} ${selectedPlayer?.id === player.id ? style.selected : ''}`}
                          onClick={() => {
                            if (selectedAction) {
                              // If an action is selected, record it for this player
                              handleStatEvent(player.id, selectedAction);
                              setSelectedAction(null); // Clear the selected action
                              setSelectedPlayer(player); // Also update the selected player
                            } else {
                              // If no action is selected, just select the player
                              setSelectedPlayer(player);
                            }
                          }}
                        >
                          <div>
                            <Text strong style={{ fontSize: settings.compactMode ? '0.8rem' : '0.9rem' }}>
                              {settings.showPlayerNumbers && `#${player.number} `}{player.name}
                            </Text>
                            {settings.showPositions && (
                              <>
                                <br />
                                <Text type="secondary" style={{ fontSize: settings.compactMode ? '0.6rem' : '0.8rem' }}>
                                  {player.position}
                                </Text>
                              </>
                            )}
                          </div>
                          <div>
                            <Badge count={player.points} style={{ backgroundColor: '#52c41a' }} />
                            <Text type="secondary" style={{ fontSize: settings.compactMode ? '0.6rem' : '0.8rem' }}> PTS</Text>
                            <br />
                            <Badge count={player.plusMinus} style={{ backgroundColor: player.plusMinus >= 0 ? '#52c41a' : '#f5222d' }} />
                            <Text type="secondary" style={{ fontSize: settings.compactMode ? '0.6rem' : '0.8rem' }}> +/-</Text>
                          </div>
                        </div>
                      ))}
                    </Col>
                    {/* Second Column - Players 4-5 + Substitution Button */}
                    <Col span={12}>
                      {players.slice(3, 5).map(player => (
                        <div 
                          key={player.id} 
                          className={`${style.playerCard} ${selectedPlayer?.id === player.id ? style.selected : ''}`}
                          onClick={() => {
                            if (selectedAction) {
                              // If an action is selected, record it for this player
                              handleStatEvent(player.id, selectedAction);
                              setSelectedAction(null); // Clear the selected action
                              setSelectedPlayer(player); // Also update the selected player
                            } else {
                              // If no action is selected, just select the player
                              setSelectedPlayer(player);
                            }
                          }}
                        >
                          <div>
                            <Text strong style={{ fontSize: settings.compactMode ? '0.8rem' : '0.9rem' }}>
                              {settings.showPlayerNumbers && `#${player.number} `}{player.name}
                            </Text>
                            {settings.showPositions && (
                              <>
                                <br />
                                <Text type="secondary" style={{ fontSize: settings.compactMode ? '0.6rem' : '0.8rem' }}>
                                  {player.position}
                                </Text>
                              </>
                            )}
                          </div>
                          <div>
                            <Badge count={player.points} style={{ backgroundColor: '#52c41a' }} />
                            <Text type="secondary" style={{ fontSize: settings.compactMode ? '0.6rem' : '0.8rem' }}> PTS</Text>
                            <br />
                            <Badge count={player.plusMinus} style={{ backgroundColor: player.plusMinus >= 0 ? '#52c41a' : '#f5222d' }} />
                            <Text type="secondary" style={{ fontSize: settings.compactMode ? '0.6rem' : '0.8rem' }}> +/-</Text>
                          </div>
                        </div>
                      ))}
                      {/* Substitution Button in 3rd row of second column */}
                      <div style={{ marginTop: 8 }}>
                        <Button
                          type="primary"
                          icon={<TeamOutlined />}
                          onClick={() => {
                            if (!currentLineup) {
                              const firstFivePlayers = players.slice(0, 5).map(p => p.id)
                              const newLineup = { id: `lineup-${Date.now()}`, players: firstFivePlayers, startTime: gameState.currentTime, plusMinus: 0 }
                              setCurrentLineup(newLineup)
                              setLineups(prev => [...prev, newLineup])
                              setPlayers(prev => prev.map(p => ({
                                ...p,
                                isOnCourt: firstFivePlayers.includes(p.id)
                              })))
                            }
                            setShowQuickSubModal(true)
                            setSubstitutionPlayerOut(null)
                            setSubstitutionPlayerIn(null)
                          }}
                          size="small"
                          block
                          style={{
                            backgroundColor: '#2563eb',
                            borderColor: '#2563eb',
                            color: '#fff',
                            fontWeight: 600,
                            height: 40,
                            fontSize: '0.9rem',
                          }}
                        >
                          {currentLineup ? 'Substitution' : 'Start Lineup & Sub'}
                        </Button>
                        {quickSubHistory.length > 0 && (
                          <Button
                            size="small"
                            onClick={undoLastSubstitution}
                            block
                            style={{
                              marginTop: 4,
                              height: 28,
                              fontSize: '0.8rem',
                            }}
                          >
                            Undo Last Sub
                          </Button>
                        )}
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Play by Play" size="small">
                  <div className={style.eventsFeed}>
                    {events.slice(0, 10).map(event => (
                      <div key={event.id} className={style.eventItem}>
                        <Text type="secondary">{formatTime(event.gameTime)}</Text>
                        <Text strong>{event.playerName}</Text>
                        <Text>{event.eventType}</Text>
                        {event.value && <Badge count={event.value} />}
                        {event.opponentEvent && <Badge count="OPP" style={{ backgroundColor: '#f5222d' }} />}
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Player Statistics" size="small">
                  {selectedPlayer ? (
                    <div>
                      <Title level={4}>
                        {settings.showPlayerNumbers && `#${selectedPlayer.number} `}{selectedPlayer.name}
                        {settings.showPositions && ` (${selectedPlayer.position})`}
                      </Title>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Statistic title="Points" value={selectedPlayer.points} />
                        </Col>
                        <Col span={8}>
                          <Statistic title="Rebounds" value={selectedPlayer.rebounds} />
                        </Col>
                        <Col span={8}>
                          <Statistic title="Assists" value={selectedPlayer.assists} />
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Statistic title="Steals" value={selectedPlayer.steals} />
                        </Col>
                        <Col span={8}>
                          <Statistic title="Blocks" value={selectedPlayer.blocks} />
                        </Col>
                        <Col span={8}>
                          <Statistic title="Fouls" value={selectedPlayer.fouls} />
                        </Col>
                      </Row>
                      <Divider />
                      <Text>FG: {selectedPlayer.fgMade}/{selectedPlayer.fgAttempted} ({selectedPlayer.fgAttempted > 0 ? Math.round((selectedPlayer.fgMade / selectedPlayer.fgAttempted) * 100) : 0}%)</Text>
                      <br />
                      <Text>3PT: {selectedPlayer.threeMade}/{selectedPlayer.threeAttempted} ({selectedPlayer.threeAttempted > 0 ? Math.round((selectedPlayer.threeMade / selectedPlayer.threeAttempted) * 100) : 0}%)</Text>
                      <br />
                      <Text>FT: {selectedPlayer.ftMade}/{selectedPlayer.ftAttempted} ({selectedPlayer.ftAttempted > 0 ? Math.round((selectedPlayer.ftMade / selectedPlayer.ftAttempted) * 100) : 0}%)</Text>
                      <br />
                      <Text>+/-: {selectedPlayer.plusMinus}</Text>
                      {settings.showEfficiencyRatings && (
                        <>
                          <br />
                          <Text>Efficiency: {selectedPlayer.points + selectedPlayer.rebounds + selectedPlayer.assists + selectedPlayer.steals + selectedPlayer.blocks - selectedPlayer.turnovers - selectedPlayer.fouls}</Text>
                        </>
                      )}
                      {settings.showTrends && selectedPlayer.plusMinus > 0 && (
                        <>
                          <br />
                          <Text type="success">📈 Positive impact on court</Text>
                        </>
                      )}
                    </div>
                  ) : (
                    <Text type="secondary">No player selected</Text>
                  )}
                </Card>
              </Col>
            </>
          )}
        </Row>
      )
    },
    {
      key: 'analytics',
      label: 'Analytics',
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="Player Performance" className={style.playerPerformanceCard}>
              <Table 
                dataSource={players} 
                columns={playerColumns} 
                size="small"
                pagination={false}
                scroll={{ y: 300 }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Team Statistics" className={style.teamStatsCard}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="Total Points" value={teamStats.totalPoints} />
                </Col>
                <Col span={12}>
                  <Statistic title="Total Rebounds" value={teamStats.totalRebounds} />
                </Col>
                <Col span={12}>
                  <Statistic title="Total Assists" value={teamStats.totalAssists} />
                </Col>
                <Col span={12}>
                  <Statistic title="Total Turnovers" value={teamStats.totalTurnovers} />
                </Col>
                <Col span={12}>
                  <Statistic title="FG%" value={`${teamStats.fgPercentage}%`} />
                </Col>
                <Col span={12}>
                  <Statistic title="A/T Ratio" value={teamStats.assistToTurnoverRatio} />
                </Col>
                {settings.showAdvancedStats && (
                  <>
                    <Col span={12}>
                      <Statistic title="Total Steals" value={teamStats.totalSteals} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Total Blocks" value={teamStats.totalBlocks} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Game Pace" value={`${teamStats.pace} pts/game`} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Projected Final" value={`${teamStats.projectedFinal} pts`} />
                    </Col>
                  </>
                )}
              </Row>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Substitution History & Analytics" size="small">
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Card title="Substitution Stats" size="small">
                    {(() => {
                      const stats = getSubstitutionStats()
                      return (
                        <div>
                          <Statistic title="Total Substitutions" value={stats.totalSubs} />
                          <Statistic title="Unique Players Used" value={stats.uniquePlayers} />
                          {stats.mostSubbedIn.player && (
                            <div style={{ marginTop: 16 }}>
                              <Text strong>Most Subbed In:</Text>
                              <br />
                              <Text>#{stats.mostSubbedIn.player.number} {stats.mostSubbedIn.player.name}</Text>
                              <br />
                              <Text type="secondary">{stats.mostSubbedIn.count} times</Text>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </Card>
                </Col>
                <Col span={16}>
                  <Card title="Recent Substitutions" size="small">
                    {quickSubHistory.length > 0 ? (
                      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {quickSubHistory.map((sub, index) => (
                          <div key={index} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '8px 12px',
                            margin: '4px 0',
                            background: '#f5f5f5',
                            borderRadius: 6,
                            border: '1px solid #e8e8e8'
                          }}>
                            <div>
                              <Text strong>#{sub.playerOut.number} {sub.playerOut.name}</Text>
                              <Text type="secondary" style={{ margin: '0 8px' }}>→</Text>
                              <Text strong>#{sub.playerIn.number} {sub.playerIn.name}</Text>
                            </div>
                            <div>
                              <Text type="secondary" style={{ fontSize: '0.8rem' }}>
                                {new Date(sub.timestamp).toLocaleTimeString()}
                              </Text>
                              <Button 
                                size="small" 
                                type="text"
                                onClick={() => {
                                  substitutePlayer(sub.playerOut, sub.playerIn)
                                  setQuickSubHistory(prev => prev.filter((_, i) => i !== index))
                                }}
                                style={{ marginLeft: 8 }}
                              >
                                Undo
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Text type="secondary">No substitutions yet</Text>
                    )}
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'lineups',
      label: 'Lineups',
      children: (
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="Current Lineup" size="small">
              {currentLineup ? (
                <div>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: '1.1rem', color: '#f5f7fa' }}>Active Lineup</Text>
                    <Button 
                      danger 
                      size="small" 
                      onClick={endCurrentLineup}
                      style={{ fontWeight: 600 }}
                    >
                      End Lineup
                    </Button>
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: 8, display: 'block' }}>
                      Court Players:
                    </Text>
                    {getCourtPlayers().map(player => (
                      <div key={player.id} className={style.courtPlayer}>
                        <div>
                          <Text strong style={{ fontSize: '1rem', color: '#f5f7fa' }}>#{player.number} {player.name}</Text>
                          <br />
                          <Text style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                            {player.position} • {player.points}PTS • {player.plusMinus}+/-
                          </Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Badge count={player.points} style={{ backgroundColor: '#2563eb' }} />
                          <Badge count={player.plusMinus} style={{ backgroundColor: player.plusMinus >= 0 ? '#2563eb' : '#ef4444' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Divider style={{ borderColor: '#334155' }} />
                  
                  <div>
                    <Text strong style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: 8, display: 'block' }}>
                      Lineup Performance:
                    </Text>
                    {(() => {
                      const effectiveness = calculateLineupEffectiveness(currentLineup)
                      return (
                        <Row gutter={[16, 8]}>
                          <Col span={8}>
                            <Statistic 
                              title="Points" 
                              value={effectiveness.totalPoints} 
                              valueStyle={{ fontSize: '1.2rem', fontWeight: 600 }}
                            />
                          </Col>
                          <Col span={8}>
                            <Statistic 
                              title="+/-" 
                              value={effectiveness.totalPlusMinus}
                              valueStyle={{ 
                                fontSize: '1.2rem', 
                                fontWeight: 600,
                                color: effectiveness.totalPlusMinus >= 0 ? '#52c41a' : '#f5222d'
                              }}
                            />
                          </Col>
                          <Col span={8}>
                            <Statistic 
                              title="Minutes" 
                              value={effectiveness.minutesPlayed}
                              valueStyle={{ fontSize: '1.2rem', fontWeight: 600 }}
                            />
                          </Col>
                          <Col span={12}>
                            <Statistic 
                              title="Efficiency" 
                              value={effectiveness.efficiency.toFixed(2)}
                              valueStyle={{ fontSize: '1.2rem', fontWeight: 600, color: '#1890ff' }}
                            />
                          </Col>
                          <Col span={12}>
                            <Statistic 
                              title="Rebounds" 
                              value={effectiveness.totalRebounds}
                              valueStyle={{ fontSize: '1.2rem', fontWeight: 600 }}
                            />
                          </Col>
                        </Row>
                      )
                    })()}
                  </div>
                </div>
                              ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text style={{ fontSize: '1rem', marginBottom: 16, display: 'block', color: '#94a3b8' }}>
                      No active lineup
                    </Text>
                    <Button 
                      type="primary" 
                      size="middle"
                      onClick={() => setShowLineupBuilder(true)}
                      style={{ fontWeight: 600 }}
                    >
                      Create Lineup
                    </Button>
                  </div>
                )}
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="Quick Substitutions" size="small">
              {currentLineup ? (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Button 
                      type="primary" 
                      size="middle"
                      icon={<TeamOutlined />}
                      onClick={() => setShowQuickSubModal(true)}
                      style={{ 
                        width: '100%', 
                        marginBottom: 8,
                        height: 40,
                        fontWeight: 600,
                        backgroundColor: '#2563eb',
                        borderColor: '#2563eb'
                      }}
                    >
                      Quick Substitution
                    </Button>
                    {quickSubHistory.length > 0 && (
                      <Button 
                        size="small"
                        onClick={undoLastSubstitution}
                        style={{ width: '100%', height: 32 }}
                      >
                        Undo Last Substitution
                      </Button>
                    )}
                  </div>

                  {quickSubHistory.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <Text strong style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: 8, display: 'block' }}>
                        Recent Substitutions:
                      </Text>
                      <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                        {quickSubHistory.slice(0, 3).map((sub, index) => (
                          <div key={index} style={{ 
                            padding: '8px 12px',
                            margin: '4px 0',
                            background: '#1e3a5c',
                            borderRadius: 6,
                            border: '1px solid #2563eb'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <Text strong style={{ fontSize: '0.9rem', color: '#f5f7fa' }}>
                                  #{sub.playerOut.number} {sub.playerOut.name}
                                </Text>
                                <Text style={{ margin: '0 8px', fontSize: '0.9rem', color: '#94a3b8' }}>→</Text>
                                <Text strong style={{ fontSize: '0.9rem', color: '#f5f7fa' }}>
                                  #{sub.playerIn.number} {sub.playerIn.name}
                                </Text>
                              </div>
                              <Text style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                {new Date(sub.timestamp).toLocaleTimeString()}
                              </Text>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: 8, display: 'block' }}>
                      Available Players:
                    </Text>
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {getAvailablePlayers().map(player => (
                        <div key={player.id} className={style.availablePlayer}>
                          <div>
                            <Text strong style={{ fontSize: '0.9rem', color: '#f5f7fa' }}>#{player.number} {player.name}</Text>
                            <br />
                            <Text style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                              {player.position} • {player.points}PTS • {player.plusMinus}+/-
                            </Text>
                          </div>
                          <Button 
                            size="small"
                            type="primary"
                            onClick={() => {
                              setSubstitutionPlayerIn(player)
                              setShowQuickSubModal(true)
                            }}
                            style={{ fontWeight: 600 }}
                          >
                            Sub In
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                              ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text style={{ fontSize: '1rem', marginBottom: 16, display: 'block', color: '#94a3b8' }}>
                      No active lineup for substitutions
                    </Text>
                    <Button 
                      type="primary" 
                      size="middle"
                      onClick={() => setShowLineupBuilder(true)}
                      style={{ fontWeight: 600 }}
                    >
                      Create Lineup First
                    </Button>
                  </div>
                )}
            </Card>
          </Col>
          
          <Col span={24}>
            <Card title="Lineup History" size="small">
              <div className={style.lineupHistory}>
                {lineups.length > 0 ? (
                  lineups.map(lineup => {
                    const effectiveness = calculateLineupEffectiveness(lineup)
                    return (
                      <div key={lineup.id} className={style.lineupCard}>
                        <div className={style.lineupHeader}>
                          <Text strong style={{ fontSize: '1rem' }}>Lineup #{lineup.id.slice(-4)}</Text>
                          <Badge 
                            count={effectiveness.totalPlusMinus} 
                            style={{ 
                              backgroundColor: effectiveness.totalPlusMinus >= 0 ? '#52c41a' : '#f5222d',
                              fontSize: '0.8rem',
                              fontWeight: 600
                            }}
                          />
                        </div>
                        <div className={style.lineupPlayers}>
                          {lineup.players.map(playerId => {
                            const player = players.find(p => p.id === playerId)
                            return player ? (
                              <Text key={playerId} type="secondary" style={{ fontSize: '0.9rem' }}>
                                #{player.number} {player.name} ({player.position})
                              </Text>
                            ) : null
                          })}
                        </div>
                        <div className={style.lineupStats}>
                          <Text type="secondary" style={{ fontSize: '0.8rem' }}>
                            {effectiveness.minutesPlayed}min • {effectiveness.totalPoints}pts • {effectiveness.efficiency.toFixed(2)} eff
                          </Text>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text style={{ fontSize: '1rem', color: '#94a3b8' }}>
                      No lineup history yet
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      )
    }
  ]

  // DEV-ONLY: Ensure consistent className to prevent hydration mismatch
  const containerClassName = [
    style.container,
    settings.compactMode ? style.compactMode : '',
    settings.darkMode ? style.darkMode : ''
  ].filter(Boolean).join(' ')

  // Focus input when editing
  useEffect(() => {
    if (isEditingClock && clockInputRef.current) {
      clockInputRef.current.focus();
      clockInputRef.current.select();
    }
  }, [isEditingClock]);

  // Parse mm:ss string to seconds
  const parseClockInput = (value: string) => {
    const match = value.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const min = parseInt(match[1], 10);
    const sec = parseInt(match[2], 10);
    if (isNaN(min) || isNaN(sec) || sec > 59) return null;
    return min * 60 + sec;
  };

  // Format seconds to mm:ss
  const formatClockInput = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // Handle clock edit save
  const saveClockEdit = () => {
    const newSeconds = parseClockInput(clockInputValue);
    if (newSeconds !== null) {
      setGameState(prev => ({ ...prev, currentTime: newSeconds }));
    }
    setIsEditingClock(false);
  };

  // Before return, compute if scrolling is needed
  const needsScoreScroll = gameState.homeScore >= 100 || gameState.opponentScore >= 100;

  // After all hooks, before return in Statistics component
  const selectedPlayerData = selectedPlayer ? players.find(p => p.id === selectedPlayer.id) : null;

  // 2. In the Modal, focus the Player In select when Player Out is set
  useEffect(() => {
    if (showQuickSubModal && substitutionPlayerOut && playerInSelectRef.current) {
      setTimeout(() => playerInSelectRef.current.focus?.(), 100);
    }
  }, [showQuickSubModal, substitutionPlayerOut]);

  // Add a new effect to open the modal after substitutionPlayerOut is set
  useEffect(() => {
    if (substitutionPlayerOut && !showQuickSubModal) {
      setShowQuickSubModal(true);
    }
  }, [substitutionPlayerOut]);

  // After the Modal JSX, add this effect:
  useEffect(() => {
    if (showQuickSubModal && substitutionPlayerOut && substitutionPlayerIn) {
      handleQuickSubstitution(substitutionPlayerIn, substitutionPlayerOut)
      setShowQuickSubModal(false)
      setSubstitutionPlayerIn(null)
      setSubstitutionPlayerOut(null)
    }
  }, [showQuickSubModal, substitutionPlayerOut, substitutionPlayerIn])

  // DEV-ONLY: Enhanced substitution handler with modal flow management
  const handleSubstitution = (playerOut: Player) => {
    setSubstitutionPlayerOut(playerOut)
    setSubstitutionStep('select-in')
    setShowSubstitutionModal(true)
  }

  // DEV-ONLY: Enhanced substitution confirmation
  const confirmSubstitution = () => {
    if (substitutionPlayerOut && substitutionPlayerIn) {
      substitutePlayer(substitutionPlayerIn, substitutionPlayerOut)
      
      // Update selected player if the substituted player was selected
      if (selectedPlayer?.id === substitutionPlayerOut.id) {
        setSelectedPlayer(substitutionPlayerIn)
      }
      
      // Reset substitution state
      setShowSubstitutionModal(false)
      setSubstitutionPlayerIn(null)
      setSubstitutionPlayerOut(null)
      setSubstitutionStep('select-out')
    }
  }

  // DEV-ONLY: Enhanced substitution modal management
  const resetSubstitutionModal = () => {
    setShowSubstitutionModal(false)
    setSubstitutionPlayerIn(null)
    setSubstitutionPlayerOut(null)
    setSubstitutionStep('select-out')
  }

  // DEV-ONLY: Get substitution analytics
  const getSubstitutionAnalytics = () => {
    const totalSubs = substitutionHistory.length
    const uniquePlayers = new Set(substitutionHistory.flatMap(sub => [sub.playerIn.id, sub.playerOut.id])).size
    const mostSubbedIn = players.reduce((most: { player: Player | null, count: number }, player: Player) => {
      const count = substitutionHistory.filter(sub => sub.playerIn.id === player.id).length
      return count > most.count ? { player, count } : most
    }, { player: null, count: 0 })
    const mostSubbedOut = players.reduce((most: { player: Player | null, count: number }, player: Player) => {
      const count = substitutionHistory.filter(sub => sub.playerOut.id === player.id).length
      return count > most.count ? { player, count } : most
    }, { player: null, count: 0 })

    return { totalSubs, uniquePlayers, mostSubbedIn, mostSubbedOut }
  }

  return (
    <div className={containerClassName}>
      <Row gutter={[16, 16]}>
        {/* Game Clock and Controls */}
        <Col span={24}>
          <Card
            className={style.gameControlBar + (needsScoreScroll ? ' scroll-on-large-score' : '')}
            styles={{ body: { padding: settings.compactMode ? '10px 8px' : '12px 12px' } }}
          >
            <div className={style.centerContent}>
              <div className={style.scoreboardInner}>
                <Row align="middle" justify="center" style={{ minHeight: settings.compactMode ? 90 : 120 }}>
                  {/* Left: Quarter, Clock, Pace, Projected */}
                  <Col flex="none" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 90 }}>
                    <Title level={settings.compactMode ? 2 : 1} style={{ margin: 0, letterSpacing: 2, lineHeight: 1 }}>
                      Q{gameState.quarter}
                    </Title>
                    <div
                      style={{ fontWeight: 700, fontSize: settings.compactMode ? '1.5rem' : '2.2rem', color: '#fff', lineHeight: 1, marginTop: 2, marginBottom: 2, cursor: isEditingClock ? 'auto' : 'pointer' }}
                      title="Click to edit clock"
                      onClick={() => {
                        if (!isEditingClock) {
                          setClockInputValue(formatClockInput(gameState.currentTime));
                          setIsEditingClock(true);
                        }
                      }}
                    >
                      {isEditingClock ? (
                        <input
                          ref={clockInputRef}
                          type="text"
                          value={clockInputValue}
                          onChange={e => setClockInputValue(e.target.value)}
                          onBlur={saveClockEdit}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveClockEdit();
                            if (e.key === 'Escape') setIsEditingClock(false);
                          }}
                          style={{
                            fontWeight: 700,
                            fontSize: settings.compactMode ? '1.5rem' : '2.2rem',
                            width: '100px',
                            textAlign: 'center',
                            borderRadius: 4,
                            border: '1px solid #1890ff',
                            outline: 'none',
                            color: '#222',
                            background: '#fff',
                            padding: '2px 6px',
                          }}
                          maxLength={5}
                          pattern="^\\d{1,2}:\\d{2}$"
                        />
                      ) : (
                        formatTime(gameState.currentTime)
                      )}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: settings.compactMode ? '0.8rem' : '1rem', display: 'block' }}>
                        Pace: {teamStats.pace}
                      </Text>
                      <Text type="secondary" style={{ fontSize: settings.compactMode ? '0.8rem' : '1rem', display: 'block' }}>
                        Projected: {teamStats.projectedFinal}
                      </Text>
                    </div>
                  </Col>

                  {/* Game Controls: vertical stack */}
                  <Col flex="none" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 12px' }}>
                    <Button 
                      type="primary" 
                      size={settings.compactMode ? 'small' : 'middle'}
                      icon={gameState.isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
                      onClick={toggleGame}
                      style={{ marginBottom: 8, width: 110 }}
                    >
                      {gameState.isPlaying ? 'Pause' : 'Start'}
                    </Button>
                    <Button 
                      size={settings.compactMode ? 'small' : 'middle'}
                      icon={<StopOutlined />} 
                      onClick={undoLastAction}
                      disabled={actionHistory.length === 0}
                      style={{ marginBottom: 8, width: 110 }}
                    >
                      Undo
                    </Button>
                    <Button 
                      size={settings.compactMode ? 'small' : 'middle'}
                      icon={<ClockCircleOutlined />} 
                      onClick={nextQuarter} 
                      disabled={gameState.quarter >= settings.totalQuarters}
                      style={{ width: 110 }}
                    >
                      Next Qtr
                    </Button>
                  </Col>

                  {/* Divider */}
                  <Col flex="none" style={{ display: 'flex', alignItems: 'stretch', height: '100%' }}>
                    <Divider type="vertical" className={style.scoreboardDivider} style={{ height: '100%', minHeight: 80, margin: '0 3px' }} />
                  </Col>

                  {/* Center: Score, Timeouts, Timeout Buttons */}
                  <Col flex="none" style={{ display: 'flex', alignItems: 'center', minWidth: 260 }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <Title level={settings.compactMode ? 2 : 1} style={{ margin: 0, letterSpacing: 2, lineHeight: 1 }}>
                        <span
                          className="score-value"
                          style={{ color: '#fff', fontWeight: 700 }}
                        >
                          HOME {gameState.homeScore}
                        </span>
                        <span style={{ color: '#aaa', fontWeight: 400 }}> - </span>
                        <span
                          className="score-value"
                          style={{ color: '#fff', fontWeight: 700 }}
                        >
                          {gameState.opponentScore} OPP
                        </span>
                      </Title>
                      <div style={{ marginTop: 4, marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: settings.compactMode ? '0.8rem' : '1rem' }}>
                          <span style={{ marginRight: 8 }}>Timeouts:</span>
                          <Badge count={gameState.timeoutHome} style={{ backgroundColor: '#1890ff', marginRight: 4 }} />
                          <Badge count={gameState.timeoutAway} style={{ backgroundColor: '#aaa', marginRight: 0 }} />
                        </Text>
                      </div>
                      {/* Opponent Score Controls */}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                        <Button size={settings.compactMode ? 'small' : 'middle'} onClick={() => handleOpponentScoreChange(1)}>+1 OPP</Button>
                        <Button size={settings.compactMode ? 'small' : 'middle'} onClick={() => handleOpponentScoreChange(2)}>+2 OPP</Button>
                        <Button size={settings.compactMode ? 'small' : 'middle'} onClick={() => handleOpponentScoreChange(3)}>+3 OPP</Button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 12 }}>
                      <div style={{ textAlign: 'center', marginBottom: 2 }}>
                        <Text style={{ fontSize: '0.7rem', color: '#fff', opacity: 0.4, letterSpacing: 1 }}>TIMEOUTS:</Text>
                      </div>
                      <Tooltip title="Timeout - Home">
                        <Badge count={gameState.timeoutHome} style={{ backgroundColor: '#1890ff', marginBottom: 8 }}>
                          <Button 
                            type="dashed" 
                            size={settings.compactMode ? 'small' : 'middle'}
                            onClick={() => handleTimeout('home')}
                            disabled={gameState.timeoutHome <= 0}
                            style={{ minWidth: 70, marginBottom: 8 }}
                          >
                            HOME
                          </Button>
                        </Badge>
                      </Tooltip>
                      <Tooltip title="Timeout - OPP">
                        <Badge count={gameState.timeoutAway} style={{ backgroundColor: '#aaa' }}>
                          <Button 
                            type="dashed" 
                            size={settings.compactMode ? 'small' : 'middle'}
                            onClick={() => handleTimeout('away')}
                            disabled={gameState.timeoutAway <= 0}
                            style={{ minWidth: 70 }}
                          >
                            OPP
                          </Button>
                        </Badge>
                      </Tooltip>
                    </div>
                  </Col>

                  {/* Divider */}
                  <Col flex="none" style={{ display: 'flex', alignItems: 'stretch', height: '100%' }}>
                    <Divider type="vertical" className={style.scoreboardDivider} style={{ height: '100%', minHeight: 80, margin: '0 12px' }} />
                  </Col>

                  {/* Right: Export/Settings vertical stack */}
                  <Col flex="none" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 140 }}>
                    <div className={style.scoreboardRightGrid}>
                      {/* Row 1 */}
                      <Button 
                        size={settings.compactMode ? 'small' : 'middle'}
                        icon={<ExportOutlined />} 
                        onClick={() => setShowExportModal(true)}
                        style={{ width: 110, gridRow: 1, gridColumn: 1 }}
                      >
                        Export
                      </Button>
                      <Button 
                        type={activeTab === 'tracking' ? 'primary' : 'default'} 
                        onClick={() => setActiveTab('tracking')}
                        style={{ width: 110, gridRow: 1, gridColumn: 2 }}
                      >
                        Live Tracking
                      </Button>
                      {/* Row 2 */}
                      <Button 
                        size={settings.compactMode ? 'small' : 'middle'}
                        icon={<SettingOutlined />} 
                        onClick={() => setShowSettingsModal(true)}
                        style={{ width: 110, gridRow: 2, gridColumn: 1 }}
                      >
                        Settings
                      </Button>
                      <Button 
                        type={activeTab === 'analytics' ? 'primary' : 'default'} 
                        onClick={() => setActiveTab('analytics')}
                        style={{ width: 110, gridRow: 2, gridColumn: 2 }}
                      >
                        Analytics
                      </Button>
                      {/* Row 3: Halftime Report spans both columns */}
                      <Button 
                        size={settings.compactMode ? 'small' : 'middle'}
                        icon={<TrophyOutlined />} 
                        onClick={() => setShowHalftimeReport(true)}
                        disabled={gameState.quarter < 2 || (gameState.quarter === 2 && gameState.currentTime > 1)}
                        style={{ 
                          width: 220,
                          gridRow: 3,
                          gridColumn: '1 / span 2',
                          backgroundColor: (gameState.quarter < 2 || (gameState.quarter === 2 && gameState.currentTime > 1)) ? '#666' : '#1890ff',
                          color: '#fff',
                          fontWeight: 600,
                          border: 'none',
                          borderRadius: 12,
                          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                          cursor: (gameState.quarter < 2 || (gameState.quarter === 2 && gameState.currentTime > 1)) ? 'not-allowed' : 'pointer',
                        }}
                      >
                        LKRM Halftime Report
                      </Button>
                    </div>
                  </Col>
                </Row>
              </div>
            </div>
          </Card>
        </Col>

        {/* Halftime Report */}
        {showHalftimeReport && (
          <Col span={24}>
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🏀 HALFTIME REPORT</span>
                  <Button type="primary" onClick={() => setShowHalftimeReport(false)}>Continue Game</Button>
                </div>
              }
              className={style.halftimeReport}
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card title="📊 Team Performance" size="small" className={style.insightCard}>
                    <Row gutter={16}>
                      {halftimeInsights.map((insight, index) => (
                        <Col span={12} key={index}>
                          <Statistic 
                            title={insight.title} 
                            value={insight.value}
                            valueStyle={{ color: insight.status === 'error' ? '#ff4d4f' : insight.status === 'warning' ? '#faad14' : '#52c41a' }}
                          />
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="🏆 Player Highlights" size="small" className={style.insightCard}>
                    <div style={{ color: 'white' }}>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Top Scorer:</Text> #{halftimeData.topScorer.number} {halftimeData.topScorer.name} ({halftimeData.topScorer.points} pts)
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Top Rebounder:</Text> #{halftimeData.topRebounder.number} {halftimeData.topRebounder.name} ({halftimeData.topRebounder.rebounds} reb)
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Top Assister:</Text> #{halftimeData.topAssister.number} {halftimeData.topAssister.name} ({halftimeData.topAssister.assists} ast)
                      </div>
                      <div>
                        <Text strong>Most Efficient:</Text> #{halftimeData.mostEfficient.player.number} {halftimeData.mostEfficient.player.name} (+{halftimeData.mostEfficient.efficiency})
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col span={24}>
                  <Card title="🎯 Game Pace & Projections" size="small" className={style.insightCard}>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Statistic title="Current Pace" value={`${halftimeData.pace} pts/game`} />
                      </Col>
                      <Col span={8}>
                        <Statistic title="Projected Final" value={`${Math.round(halftimeData.pace * 0.4)} pts`} />
                      </Col>
                      <Col span={8}>
                        <Statistic title="Lead/Deficit" value={gameState.homeScore - gameState.opponentScore} />
                      </Col>
                    </Row>
                  </Card>
                </Col>
                {settings.showRecommendations && (
                  <Col span={24}>
                    <Card title="💡 Strategic Recommendations" size="small" className={style.recommendations}>
                      <ul>
                        {halftimeData.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </Card>
                  </Col>
                )}
              </Row>
            </Card>
          </Col>
        )}

        {/* Timeout Report */}
        {showTimeoutReport && (
          <Col span={24}>
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>⏰ TIMEOUT INSIGHTS</span>
                  <Button type="primary" onClick={() => setShowTimeoutReport(false)}>Resume Game</Button>
                </div>
              }
              className={style.timeoutReport}
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card title="📈 Recent Momentum" size="small" className={style.insightCard}>
                    <div style={{ color: 'white' }}>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Momentum:</Text> 
                        <Badge 
                          count={timeoutData.momentum === 'positive' ? 'POSITIVE' : 'NEGATIVE'} 
                          style={{ 
                            backgroundColor: timeoutData.momentum === 'positive' ? '#52c41a' : '#ff4d4f',
                            marginLeft: 8
                          }} 
                        />
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Recent Events:</Text> {timeoutData.recentEvents.length} events
                      </div>
                      <div>
                        <Text strong>Key Player:</Text> #{timeoutData.keyPlayer.number} {timeoutData.keyPlayer.name} (+{timeoutData.keyPlayer.plusMinus})
                      </div>
                    </div>
                  </Card>
                </Col>
                {settings.showQuickActions && (
                  <Col span={12}>
                    <Card title="🎯 Quick Actions" size="small" className={style.insightCard}>
                      <div style={{ color: 'white' }}>
                        {timeoutData.recommendations.map((rec, index) => (
                          <div key={index} style={{ marginBottom: 4 }}>
                            • {rec}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </Col>
                )}
                <Col span={24}>
                  <Card title="📊 Score Update" size="small" className={style.insightCard}>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Statistic title="HOME" value={gameState.homeScore} />
                      </Col>
                      <Col span={8}>
                        <Statistic title="OPPONENT" value={gameState.opponentScore} />
                      </Col>
                      <Col span={8}>
                        <Statistic 
                          title="DIFFERENCE" 
                          value={gameState.homeScore - gameState.opponentScore}
                          valueStyle={{ color: (gameState.homeScore - gameState.opponentScore) >= 0 ? '#52c41a' : '#ff4d4f' }}
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="🏆 Player Highlights" size="small" className={style.insightCard}>
                    <div style={{ color: 'white' }}>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Top Scorer:</Text> #{timeoutData.topScorer.number} {timeoutData.topScorer.name} ({timeoutData.topScorer.points} pts)
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Top Rebounder:</Text> #{timeoutData.topRebounder.number} {timeoutData.topRebounder.name} ({timeoutData.topRebounder.rebounds} reb)
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Top Assister:</Text> #{timeoutData.topAssister.number} {timeoutData.topAssister.name} ({timeoutData.topAssister.assists} ast)
                      </div>
                      <div>
                        <Text strong>Most Efficient:</Text> #{timeoutData.mostEfficient.player.number} {timeoutData.mostEfficient.player.name} (+{timeoutData.mostEfficient.efficiency})
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="📊 Team Performance" size="small" className={style.insightCard}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic title="Shooting Efficiency" value={`${timeoutData.teamStats.fgPercentage}%`} />
                      </Col>
                      <Col span={12}>
                        <Statistic title="Rebound Rate" value={`${timeoutData.teamStats.totalRebounds}`} />
                      </Col>
                      <Col span={12}>
                        <Statistic title="A/T Ratio" value={timeoutData.teamStats.assistToTurnoverRatio.toFixed(2)} />
                      </Col>
                      <Col span={12}>
                        <Statistic title="Points (2min)" value={timeoutData.teamStats.totalPoints} />
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="🔥 Opponent Run & Hot Hand" size="small" className={style.insightCard}>
                    <div style={{ color: 'white' }}>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Opponent Run:</Text> {timeoutData.recentOpponentRun}
                      </div>
                      {timeoutData.hotOpponent && (
                        <div>
                          <Text strong>Hot Opponent:</Text> {timeoutData.hotOpponent.name} ({timeoutData.hotOpponent.points} pts)
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="🎯 Game Pace & Projections" size="small" className={style.insightCard}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic title="Current Pace" value={`${timeoutData.pace} pts/game`} />
                      </Col>
                      <Col span={12}>
                        <Statistic title="Projected Final" value={`${timeoutData.projectedFinal} pts`} />
                      </Col>
                      <Col span={12}>
                        <Statistic title="Lead/Deficit" value={timeoutData.lead} />
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col span={24}>
                  <Card title="💡 Strategic Recommendations" size="small" className={style.recommendations}>
                    <ul>
                      {timeoutData.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        )}

        {/* Main Content Section */}
        <Col span={24}>
          {activeTab === 'tracking' && tabItems.find(tab => tab.key === 'tracking')?.children}
          {activeTab === 'analytics' && tabItems.find(tab => tab.key === 'analytics')?.children}
          {activeTab === 'lineups' && tabItems.find(tab => tab.key === 'lineups')?.children}
        </Col>
      </Row>

      {/* Export Modal */}
      <Modal
        title="Export Game Data"
        open={showExportModal}
        onCancel={() => setShowExportModal(false)}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button icon={<DownloadOutlined />} onClick={() => exportGameData('json')} block>
            Export as JSON
          </Button>
          <Button icon={<DownloadOutlined />} onClick={() => exportGameData('csv')} block>
            Export as CSV
          </Button>
        </Space>
      </Modal>

      {/* Settings Modal */}
      <Modal
        title="Game Settings"
        open={showSettingsModal}
        onCancel={() => setShowSettingsModal(false)}
        width={800}
        footer={[
          <Button key="reset" onClick={resetSettings}>
            Reset to Defaults
          </Button>,
          // <Button key="export" onClick={exportSettings}>
          //   Export Settings
          // </Button>,
          <Button key="cancel" onClick={() => setShowSettingsModal(false)}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={() => setShowSettingsModal(false)}>
            Save Settings
          </Button>
        ]}
      >
        <Tabs
          defaultActiveKey="game"
          size="small"
          items={[
            {
              key: 'game',
              label: 'Game Configuration',
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <SettingRow label="Quarter Duration (minutes):" controlType="input" value={settings.quarterDuration} onChange={e => saveSettings({ quarterDuration: parseInt(e.target.value) || 10 })} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Total Quarters:" controlType="select" value={settings.totalQuarters} onChange={value => saveSettings({ totalQuarters: value })} options={[{value: 4, label: '4 Quarters'}, {value: 2, label: '2 Halves'}, {value: 6, label: '6 Quarters (Youth)'}]} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Timeouts per Team:" controlType="input" value={settings.timeoutCount} onChange={e => saveSettings({ timeoutCount: parseInt(e.target.value) || 4 })} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Shot Clock (seconds):" controlType="input" value={settings.shotClock} onChange={e => saveSettings({ shotClock: parseInt(e.target.value) || 30 })} />
                  </Col>
                </Row>
              )
            },
            {
              key: 'workflow',
              label: 'Workflow',
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <SettingRow label="Workflow Mode:" controlType="select" value={settings.workflowMode} onChange={value => saveSettings({ workflowMode: value })} options={[{value: 'player-first', label: 'Player First (Select player, then action)'}, {value: 'action-first', label: 'Action First (Select action, then player)'}]} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Auto-pause on Timeout:" controlType="switch" value={settings.autoPauseOnTimeout} onChange={checked => saveSettings({ autoPauseOnTimeout: checked })} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Auto-pause on Quarter End:" controlType="switch" value={settings.autoPauseOnQuarterEnd} onChange={checked => saveSettings({ autoPauseOnQuarterEnd: checked })} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Show Confirmations:" controlType="switch" value={settings.showConfirmations} onChange={checked => saveSettings({ showConfirmations: checked })} />
                  </Col>
                </Row>
              )
            },
            {
              key: 'display',
              label: 'Display',
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <SettingRow label="Show Player Numbers:" controlType="switch" value={settings.showPlayerNumbers} onChange={checked => saveSettings({ showPlayerNumbers: checked })} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Show Positions:" controlType="switch" value={settings.showPositions} onChange={checked => saveSettings({ showPositions: checked })} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Show Efficiency Ratings:" controlType="switch" value={settings.showEfficiencyRatings} onChange={checked => saveSettings({ showEfficiencyRatings: checked })} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Compact Mode:" controlType="switch" value={settings.compactMode} onChange={checked => saveSettings({ compactMode: checked })} />
                  </Col>
                </Row>
              )
            },
            {
              key: 'export',
              label: 'Export',
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <SettingRow label="Auto Export:" controlType="switch" value={settings.autoExport} onChange={checked => saveSettings({ autoExport: checked })} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Export Format:" controlType="select" value={settings.exportFormat} onChange={value => saveSettings({ exportFormat: value })} options={[{value: 'json', label: 'JSON'}, {value: 'csv', label: 'CSV'}, {value: 'pdf', label: 'PDF'}]} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Export Interval (minutes):" controlType="input" value={settings.exportInterval} onChange={e => saveSettings({ exportInterval: parseInt(e.target.value) || 5 })} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Include Player Stats:" controlType="switch" value={settings.includePlayerStats} onChange={checked => saveSettings({ includePlayerStats: checked })} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Include Team Stats:" controlType="switch" value={settings.includeTeamStats} onChange={checked => saveSettings({ includeTeamStats: checked })} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Include Lineup Data:" controlType="switch" value={settings.includeLineupData} onChange={checked => saveSettings({ includeLineupData: checked })} />
                  </Col>
                </Row>
              )
            },
            {
              key: 'analytics',
              label: 'Analytics',
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <SettingRow label="Show Advanced Stats:" controlType="switch" value={settings.showAdvancedStats} onChange={checked => saveSettings({ showAdvancedStats: checked })} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Show Projections:" controlType="switch" value={settings.showProjections} onChange={checked => saveSettings({ showProjections: checked })} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Show Trends:" controlType="switch" value={settings.showTrends} onChange={checked => saveSettings({ showTrends: checked })} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Highlight Top Performers:" controlType="switch" value={settings.highlightTopPerformers} onChange={checked => saveSettings({ highlightTopPerformers: checked })} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Efficiency Threshold:" controlType="input" value={settings.efficiencyThreshold} onChange={e => saveSettings({ efficiencyThreshold: parseInt(e.target.value) || 15 })} />
                  </Col>
                </Row>
              )
            },
            {
              key: 'notifications',
              label: 'Notifications',
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <SettingRow label="Halftime Reminder:" controlType="switch" value={settings.halftimeReminder} onChange={checked => saveSettings({ halftimeReminder: checked })} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Timeout Reminder:" controlType="switch" value={settings.timeoutReminder} onChange={checked => saveSettings({ timeoutReminder: checked })} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Foul Trouble Alert:" controlType="switch" value={settings.foulTroubleAlert} onChange={checked => saveSettings({ foulTroubleAlert: checked })} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Show Strategic Recommendations:" controlType="switch" value={settings.showRecommendations} onChange={checked => saveSettings({ showRecommendations: checked })} />
                  </Col>
                  <Col span={12}>
                    <SettingRow label="Show Quick Actions:" controlType="switch" value={settings.showQuickActions} onChange={checked => saveSettings({ showQuickActions: checked })} />
                  </Col>
                </Row>
              )
            }
          ]}
        />
      </Modal>

      {/* Lineup Builder Modal */}
      <Modal
        title="Create New Lineup"
        open={showLineupBuilder}
        onCancel={() => setShowLineupBuilder(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowLineupBuilder(false)}>
            Cancel
          </Button>,
          <Button 
            key="create" 
            type="primary" 
            onClick={createLineup}
            disabled={selectedLineupPlayers.length !== 5}
          >
            Create Lineup ({selectedLineupPlayers.length}/5)
          </Button>
        ]}
      >
        <div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Select 5 Players:</Text>
            <Input
              placeholder="Lineup name (optional)"
              value={lineupName}
              onChange={(e) => setLineupName(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
          <div className={style.playerSelection}>
            {players.map(player => (
              <div
                key={player.id}
                className={`${style.selectablePlayer} ${selectedLineupPlayers.includes(player.id) ? style.selected : ''}`}
                onClick={() => {
                  if (selectedLineupPlayers.includes(player.id)) {
                    setSelectedLineupPlayers(prev => prev.filter(id => id !== player.id))
                  } else if (selectedLineupPlayers.length < 5) {
                    setSelectedLineupPlayers(prev => [...prev, player.id])
                  }
                }}
              >
                <div>
                  <Text strong>#{player.number} {player.name}</Text>
                  <br />
                  <Text type="secondary">{player.position}</Text>
                </div>
                <div>
                  <Badge count={player.points} style={{ backgroundColor: '#52c41a' }} />
                  <Badge count={player.plusMinus} style={{ backgroundColor: player.plusMinus >= 0 ? '#52c41a' : '#f5222d' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* DEV-ONLY: Quick Substitution Modal */}
      <Modal
        title="Substitution"
        open={showQuickSubModal}
        onCancel={() => {
          setShowQuickSubModal(false)
          setSubstitutionPlayerIn(null)
          setSubstitutionPlayerOut(null)
        }}
        footer={null}
        width={600}
        styles={{
          content: {
            backgroundColor: '#17375c',
            color: '#f5f7fa'
          },
          header: {
            backgroundColor: '#17375c',
            color: '#f5f7fa'
          },
          body: {
            backgroundColor: '#17375c',
            color: '#f5f7fa'
          }
        }}
      >
        <div style={{ color: '#f5f7fa' }}>
          {/* Step 1: Select Player Out */}
          {!substitutionPlayerOut && (
            <>
              <div style={{
                background: '#1e3a5c',
                padding: 16,
                borderRadius: 8,
                marginBottom: 16,
                border: '1px solid #334155',
                textAlign: 'center',
              }}>
                <Text strong style={{ color: '#f5f7fa', fontSize: '1rem' }}>
                  Select Player to Sub OUT
                </Text>
              </div>
              <Select
                placeholder="Select player to sub out"
                style={{ width: '100%', marginBottom: 16 }}
                onChange={(value) => {
                  const player = players.find(p => p.id === value)
                  if (player) setSubstitutionPlayerOut(player)
                }}
                dropdownStyle={{ backgroundColor: '#1e293b' }}
              >
                {getCourtPlayers().map(player => (
                  <Option key={player.id} value={player.id}>
                    #{player.number} {player.name} ({player.position})
                  </Option>
                ))}
              </Select>
            </>
          )}
          {/* Step 2: Select Player In */}
          {substitutionPlayerOut && !substitutionPlayerIn && (
            <>
              <div style={{
                background: '#1e3a5c',
                padding: 16,
                borderRadius: 8,
                marginBottom: 16,
                border: '1px solid #334155',
                textAlign: 'center',
              }}>
                <Text strong style={{ color: '#f5f7fa', fontSize: '1rem' }}>
                  Subbing Out: #{substitutionPlayerOut.number} {substitutionPlayerOut.name}
                </Text>
              </div>
              <Text strong style={{ color: '#f5f7fa', marginBottom: 8, display: 'block', fontSize: '1rem' }}>
                Player In:
              </Text>
              <Select
                ref={playerInSelectRef}
                placeholder="Select player to sub in"
                style={{ width: '100%', marginBottom: 16 }}
                onChange={(value) => {
                  const player = players.find(p => p.id === value)
                  if (player && substitutionPlayerOut) {
                    setSubstitutionPlayerIn(player)
                    // handleQuickSubstitution will be called in the next effect
                  }
                }}
                dropdownStyle={{ backgroundColor: '#1e293b' }}
              >
                {getAvailablePlayers().map(player => (
                  <Option key={player.id} value={player.id}>
                    #{player.number} {player.name} ({player.position})
                  </Option>
                ))}
              </Select>
            </>
          )}
          {/* Step 3: Perform Substitution and Close Modal */}
          {substitutionPlayerOut && substitutionPlayerIn && (
            <>{/* This effect will run after both are set */}</>
          )}
        </div>
      </Modal>

      {/* DEV-ONLY: Enhanced Substitution Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🔄 SUBSTITUTION</span>
            <Badge count={substitutionHistory.length} style={{ backgroundColor: '#1890ff' }} />
          </div>
        }
        open={showSubstitutionModal}
        onCancel={resetSubstitutionModal}
        footer={[
          <Button key="cancel" onClick={resetSubstitutionModal}>
            Cancel
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            onClick={confirmSubstitution}
            disabled={!substitutionPlayerOut || !substitutionPlayerIn}
          >
            Confirm Substitution
          </Button>
        ]}
        width={700}
        styles={{
          content: {
            backgroundColor: '#17375c',
            color: '#f5f7fa'
          },
          header: {
            backgroundColor: '#17375c',
            color: '#f5f7fa'
          },
          body: {
            backgroundColor: '#17375c',
            color: '#f5f7fa'
          }
        }}
      >
        <div style={{ color: '#f5f7fa' }}>
          {/* Step 1: Select Player Out */}
          {substitutionStep === 'select-out' && (
            <>
              <div style={{
                background: '#1e3a5c',
                padding: 16,
                borderRadius: 8,
                marginBottom: 16,
                border: '1px solid #334155',
                textAlign: 'center',
              }}>
                <Text strong style={{ color: '#f5f7fa', fontSize: '1.1rem' }}>
                  Select Player to Sub OUT
                </Text>
                <br />
                <Text type="secondary" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                  Choose a player currently on the court
                </Text>
              </div>
              <Row gutter={[16, 16]}>
                {getCourtPlayers().map(player => (
                  <Col span={12} key={player.id}>
                    <div
                      className={`${style.selectablePlayer} ${substitutionPlayerOut?.id === player.id ? style.selected : ''}`}
                      onClick={() => {
                        setSubstitutionPlayerOut(player)
                        setSubstitutionStep('select-in')
                      }}
                      style={{
                        padding: 12,
                        border: '1px solid #334155',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: substitutionPlayerOut?.id === player.id ? '#2563eb' : '#1e3a5c',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong style={{ color: '#f5f7fa', fontSize: '1rem' }}>
                            #{player.number} {player.name}
                          </Text>
                          <br />
                          <Text style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                            {player.position} • {player.points}PTS • {player.plusMinus}+/-
                          </Text>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Badge count={player.points} style={{ backgroundColor: '#52c41a' }} />
                          <br />
                          <Badge count={player.plusMinus} style={{ backgroundColor: player.plusMinus >= 0 ? '#52c41a' : '#f5222d' }} />
                        </div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </>
          )}

          {/* Step 2: Select Player In */}
          {substitutionStep === 'select-in' && substitutionPlayerOut && (
            <>
              <div style={{
                background: '#1e3a5c',
                padding: 16,
                borderRadius: 8,
                marginBottom: 16,
                border: '1px solid #334155',
                textAlign: 'center',
              }}>
                <Text strong style={{ color: '#f5f7fa', fontSize: '1.1rem' }}>
                  Subbing Out: #{substitutionPlayerOut.number} {substitutionPlayerOut.name}
                </Text>
                <br />
                <Text type="secondary" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                  Select player to sub IN
                </Text>
              </div>
              <Row gutter={[16, 16]}>
                {getAvailablePlayers().map(player => (
                  <Col span={12} key={player.id}>
                    <div
                      className={`${style.selectablePlayer} ${substitutionPlayerIn?.id === player.id ? style.selected : ''}`}
                      onClick={() => {
                        setSubstitutionPlayerIn(player)
                        setSubstitutionStep('confirm')
                      }}
                      style={{
                        padding: 12,
                        border: '1px solid #334155',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: substitutionPlayerIn?.id === player.id ? '#2563eb' : '#1e3a5c',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong style={{ color: '#f5f7fa', fontSize: '1rem' }}>
                            #{player.number} {player.name}
                          </Text>
                          <br />
                          <Text style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                            {player.position} • {player.points}PTS • {player.plusMinus}+/-
                          </Text>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Badge count={player.points} style={{ backgroundColor: '#52c41a' }} />
                          <br />
                          <Badge count={player.plusMinus} style={{ backgroundColor: player.plusMinus >= 0 ? '#52c41a' : '#f5222d' }} />
                        </div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </>
          )}

          {/* Step 3: Confirm Substitution */}
          {substitutionStep === 'confirm' && substitutionPlayerOut && substitutionPlayerIn && (
            <>
              <div style={{
                background: '#1e3a5c',
                padding: 16,
                borderRadius: 8,
                marginBottom: 16,
                border: '1px solid #334155',
                textAlign: 'center',
              }}>
                <Text strong style={{ color: '#f5f7fa', fontSize: '1.2rem' }}>
                  Confirm Substitution
                </Text>
              </div>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card 
                    title="Player Out" 
                    size="small"
                    style={{ backgroundColor: '#1e3a5c', borderColor: '#334155' }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <Text strong style={{ color: '#f5222d', fontSize: '1.1rem' }}>
                        #{substitutionPlayerOut.number} {substitutionPlayerOut.name}
                      </Text>
                      <br />
                      <Text style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                        {substitutionPlayerOut.position}
                      </Text>
                      <br />
                      <Badge count={substitutionPlayerOut.points} style={{ backgroundColor: '#52c41a', marginRight: 8 }} />
                      <Badge count={substitutionPlayerOut.plusMinus} style={{ backgroundColor: substitutionPlayerOut.plusMinus >= 0 ? '#52c41a' : '#f5222d' }} />
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card 
                    title="Player In" 
                    size="small"
                    style={{ backgroundColor: '#1e3a5c', borderColor: '#334155' }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <Text strong style={{ color: '#52c41a', fontSize: '1.1rem' }}>
                        #{substitutionPlayerIn.number} {substitutionPlayerIn.name}
                      </Text>
                      <br />
                      <Text style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                        {substitutionPlayerIn.position}
                      </Text>
                      <br />
                      <Badge count={substitutionPlayerIn.points} style={{ backgroundColor: '#52c41a', marginRight: 8 }} />
                      <Badge count={substitutionPlayerIn.plusMinus} style={{ backgroundColor: substitutionPlayerIn.plusMinus >= 0 ? '#52c41a' : '#f5222d' }} />
                    </div>
                  </Card>
                </Col>
              </Row>
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Text type="secondary" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                  This will create a new lineup and track the substitution in analytics
                </Text>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Statistics 