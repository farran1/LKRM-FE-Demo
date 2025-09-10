'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Card, Row, Col, Button, Typography, Space, Divider, Badge, Progress, Statistic, Modal, Table, Tabs, Select, Input, Tooltip, Alert, Switch, App } from 'antd'
import { PlayCircleOutlined, PauseCircleOutlined, StopOutlined, ClockCircleOutlined, BarChartOutlined, ExportOutlined, DownloadOutlined, TeamOutlined, TrophyOutlined, CloseOutlined, EditOutlined, SaveOutlined, ReloadOutlined, DeleteOutlined, SettingOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import style from './style.module.scss'
import api from '@/services/api'
import { useRouter } from 'next/navigation'
import { refinedLiveStatTrackerService } from '../../../src/services/refinedLiveStatTrackerService'
import type { OfflineGameData as RefinedOfflineGameData } from '../../../src/services/refinedLiveStatTrackerService'
import '@/utils/liveStatTrackerDebug' // Load debug utilities
import '@/utils/databaseDiagnostic' // Load database diagnostic utilities


const { Title, Text } = Typography
const { TabPane } = Tabs
const { Option } = Select

// Custom Locker Icon Component
const LockerIcon = ({ color = "currentColor" }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="3" width="12" height="18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <rect x="7" y="4" width="10" height="16" stroke={color} strokeWidth="1.5" fill="none"/>
    <circle cx="15" cy="12" r="1" fill={color}/>
    <line x1="9" y1="7" x2="15" y2="7" stroke={color} strokeWidth="1" strokeLinecap="round"/>
    <line x1="9" y1="9" x2="15" y2="9" stroke={color} strokeWidth="1" strokeLinecap="round"/>
    <line x1="9" y1="11" x2="13" y2="11" stroke={color} strokeWidth="1" strokeLinecap="round"/>
    <rect x="11" y="14" width="2" height="3" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round"/>
    <line x1="3" y1="21" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Team Comparison Table Component
type ComparisonStats = {
  fgMade?: number; fgAttempted?: number; fgPercentage?: number;
  twoPointMade?: number; twoPointAttempted?: number; twoPointPercentage?: number;
  threePointMade?: number; threePointAttempted?: number; threePointPercentage?: number;
  ftMade?: number; ftAttempted?: number; ftPercentage?: number;
  totalRebounds?: number; totalAssists?: number; totalSteals?: number; totalBlocks?: number;
  totalTurnovers?: number; totalFouls?: number; pointsInPaint?: number; secondChancePoints?: number;
  pointsOffTurnovers?: number; benchPoints?: number;
}

const TeamComparisonTable = ({ teamStats, opponentStats, teamName = "HOME", opponentName = "OPPONENT" }: { teamStats: ComparisonStats; opponentStats: ComparisonStats; teamName?: string; opponentName?: string }) => {
  const getComparisonBar = (teamValue: number, opponentValue: number, statKey: string) => {
    if (teamValue === opponentValue) return null;
    
    // Determine which direction is "better" for each stat type
    const isTeamBetter = (() => {
      switch (statKey) {
        // Higher is better
        case 'fg':
        case '2p':
        case '3p':
        case 'ft':
        case 'reb':
        case 'as':
        case 'st':
        case 'blk':
        case 'pip':
        case 'scp':
        case 'pto':
        case 'bp':
          return teamValue > opponentValue;
        // Lower is better
        case 'to':
        case 'tf':
        case 'f':
          return teamValue < opponentValue;
        default:
          return teamValue > opponentValue;
      }
    })();
    
    // Color based on which team is better (blue for home, red for opponent)
    const color = isTeamBetter ? '#1890ff' : '#ff4d4f';
    
    return (
      <div style={{
        position: 'absolute',
        right: isTeamBetter ? 'auto' : '8px',
        left: isTeamBetter ? '8px' : 'auto',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '14px',
        color: color, // Uses team colors (blue/red)
        fontWeight: 'bold'
      }}>
        {isTeamBetter ? '◀' : '▶'}
      </div>
    );
  };

  const formatStatValue = (value: any, type: 'number' | 'percentage' | 'ratio' | 'fraction' = 'number') => {
    if (type === 'percentage') {
      return `${value}%`;
    } else if (type === 'ratio') {
      return value.toFixed(2);
    } else if (type === 'fraction') {
      return value;
    }
    return value;
  };

  const stats = [
    { key: 'fg', label: 'Field Goals', type: 'fraction', teamValue: `${teamStats.fgMade || 0}/${teamStats.fgAttempted || 0}`, opponentValue: `${opponentStats.fgMade || 0}/${opponentStats.fgAttempted || 0}`, teamPercent: teamStats.fgPercentage || 0, opponentPercent: opponentStats.fgPercentage || 0 },
    { key: '2p', label: 'Two-Point', type: 'fraction', teamValue: `${teamStats.twoPointMade || 0}/${teamStats.twoPointAttempted || 0}`, opponentValue: `${opponentStats.twoPointMade || 0}/${opponentStats.twoPointAttempted || 0}`, teamPercent: teamStats.twoPointPercentage || 0, opponentPercent: opponentStats.twoPointPercentage || 0 },
    { key: '3p', label: 'Three-Point', type: 'fraction', teamValue: `${teamStats.threePointMade || 0}/${teamStats.threePointAttempted || 0}`, opponentValue: `${opponentStats.threePointMade || 0}/${opponentStats.threePointAttempted || 0}`, teamPercent: teamStats.threePointPercentage || 0, opponentPercent: opponentStats.threePointPercentage || 0 },
    { key: 'ft', label: 'Free Throws', type: 'fraction', teamValue: `${teamStats.ftMade || 0}/${teamStats.ftAttempted || 0}`, opponentValue: `${opponentStats.ftMade || 0}/${opponentStats.ftAttempted || 0}`, teamPercent: teamStats.ftPercentage || 0, opponentPercent: opponentStats.ftPercentage || 0 },
    { key: 'reb', label: 'Rebounds', type: 'number', teamValue: teamStats.totalRebounds || 0, opponentValue: opponentStats.totalRebounds || 0 },
    { key: 'as', label: 'Assists', type: 'number', teamValue: teamStats.totalAssists || 0, opponentValue: opponentStats.totalAssists || 0 },
    { key: 'st', label: 'Steals', type: 'number', teamValue: teamStats.totalSteals || 0, opponentValue: opponentStats.totalSteals || 0 },
    { key: 'blk', label: 'Blocks', type: 'number', teamValue: teamStats.totalBlocks || 0, opponentValue: opponentStats.totalBlocks || 0 },
    { key: 'to', label: 'Turnovers', type: 'number', teamValue: teamStats.totalTurnovers || 0, opponentValue: opponentStats.totalTurnovers || 0 },
    { key: 'tf', label: 'Total Fouls', type: 'number', teamValue: teamStats.totalFouls || 0, opponentValue: opponentStats.totalFouls || 0 },
    { key: 'pip', label: 'Points in Paint', type: 'number', teamValue: teamStats.pointsInPaint || 0, opponentValue: opponentStats.pointsInPaint || 0 },
    { key: 'scp', label: 'Second Chance', type: 'number', teamValue: teamStats.secondChancePoints || 0, opponentValue: opponentStats.secondChancePoints || 0 },
    { key: 'pto', label: 'Points off TO', type: 'number', teamValue: teamStats.pointsOffTurnovers || 0, opponentValue: opponentStats.pointsOffTurnovers || 0 },
    { key: 'bp', label: 'Bench Points', type: 'number', teamValue: teamStats.benchPoints || 0, opponentValue: opponentStats.benchPoints || 0 },
  ];

  // Split stats into two columns (6 stats left, 8 stats right)
  const leftColumnStats = stats.slice(0, 6);
  const rightColumnStats = stats.slice(6, 14);

  const renderStatRow = (stat: any) => (
              <tr key={stat.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ 
        padding: '8px 6px', 
                  textAlign: 'center', 
                  position: 'relative',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '4px'
                }}>
        <div style={{ fontWeight: 600, color: '#1890ff', fontSize: '14px' }}>
                    {stat.type === 'fraction' ? stat.teamValue : stat.teamValue}
                  </div>
                  {stat.teamPercent !== undefined && (
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                      ({stat.teamPercent}%)
                    </div>
                  )}
                </td>
                <td style={{ 
        padding: '8px 6px', 
                  textAlign: 'center', 
                  fontWeight: 600,
                  color: '#ffffff',
        background: 'rgba(255,255,255,0.1)',
        fontSize: '14px',
        position: 'relative'
                }}>
        {getComparisonBar(stat.teamValue, stat.opponentValue, stat.key)}
                  <Tooltip
                    title={
                      stat.key === 'fg' ? 'Field Goals made/attempted and percentage' :
                      stat.key === '2p' ? 'Two-point shots made/attempted and percentage' :
                      stat.key === '3p' ? 'Three-point shots made/attempted and percentage' :
                      stat.key === 'ft' ? 'Free throws made/attempted and percentage' :
                      stat.key === 'reb' ? 'Total rebounds' :
                      stat.key === 'as' ? 'Assists' :
                      stat.key === 'st' ? 'Steals' :
                      stat.key === 'blk' ? 'Blocks' :
                      stat.key === 'to' ? 'Turnovers' :
            stat.key === 'tf' ? 'Total fouls' :
                      stat.key === 'pip' ? 'Points in the paint' :
                      stat.key === 'scp' ? 'Second chance points' :
                      stat.key === 'pto' ? 'Points off turnovers' :
                      stat.key === 'bp' ? 'Bench points' :
                      ''
                    }
                  >
                    <span>{stat.label}</span>
                  </Tooltip>
                </td>
                <td style={{ 
        padding: '8px 6px', 
                  textAlign: 'center', 
                  position: 'relative',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '4px'
                }}>
        <div style={{ fontWeight: 600, color: '#ff4d4f', fontSize: '14px' }}>
                    {stat.type === 'fraction' ? stat.opponentValue : stat.opponentValue}
                  </div>
                  {stat.opponentPercent !== undefined && (
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                      ({stat.opponentPercent}%)
                    </div>
                  )}
                </td>
              </tr>
  );

  return (
    <Card title="Team Comparison" className={style.teamComparisonCard}>
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto' }}>
        {/* Left Column */}
        <div style={{ flex: 1 }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
            color: '#ffffff'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, color: '#1890ff', fontSize: '14px' }}>
                  {teamName}
                </th>
                <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, color: '#ffffff', fontSize: '14px' }}>
                  <Tooltip
                    title={
                      <div>
                        FG = Field Goals; 2P/3P = Two/Three-point shots; FT = Free Throws; REB = Rebounds; AS = Assists; ST = Steals; BLK = Blocks; TO = Turnovers; TF = Total Fouls; PIP = Points in Paint; SCP = Second Chance Points; PTO = Points off Turnovers; BP = Bench Points
                      </div>
                    }
                  >
                    <span>Stat</span>
                  </Tooltip>
                </th>
                <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, color: '#ff4d4f', fontSize: '14px' }}>
                  {opponentName}
                </th>
              </tr>
            </thead>
            <tbody>
              {leftColumnStats.map(renderStatRow)}
          </tbody>
        </table>
        </div>

        {/* Right Column */}
        <div style={{ flex: 1 }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
            color: '#ffffff'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, color: '#1890ff', fontSize: '14px' }}>
                  {teamName}
                </th>
                <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, color: '#ffffff', fontSize: '14px' }}>
                  <Tooltip
                    title={
                      <div>
                        FG = Field Goals; 2P/3P = Two/Three-point shots; FT = Free Throws; REB = Rebounds; AS = Assists; ST = Steals; BLK = Blocks; TO = Turnovers; TF = Total Fouls; PIP = Points in Paint; SCP = Second Chance Points; PTO = Points off Turnovers; BP = Bench Points
                      </div>
                    }
                  >
                    <span>Stat</span>
                  </Tooltip>
                </th>
                <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, color: '#ff4d4f', fontSize: '14px' }}>
                  {opponentName}
                </th>
              </tr>
            </thead>
            <tbody>
              {rightColumnStats.map(renderStatRow)}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

interface GameState {
  isPlaying: boolean
  currentTime: number // seconds
  quarter: number
  homeScore: number
  awayScore: number
  opponentScore: number
  timeoutHome: number
  timeoutAway: number
  gameStartTime: number
  teamFoulsHome: number
  teamFoulsAway: number
  isOvertime?: boolean
  overtimeNumber?: number
  regulationQuarters?: number
  isGameStarted?: boolean
  isGameEnded?: boolean
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
  twoPointAttempted: number
  twoPointMade: number
  threeAttempted: number
  threeMade: number
  ftAttempted: number
  ftMade: number
  plusMinus: number
  pointsInPaint?: number
  chargesTaken: number
  deflections: number
  isOnCourt: boolean
  isStarter: boolean // NEW: Designate if player is a starter
  isMainRoster: boolean // NEW: Designate if player is in main roster
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
  opponentJersey?: string
  metadata?: any
}

interface Lineup {
  id: string
  players: number[]
  startTime: number
  endTime?: number
  plusMinus: number
  stats?: any
  name?: string
}

// DEV-ONLY: Settings interface for comprehensive configuration
interface GameSettings {
  // Game Configuration
  quarterDuration: number // minutes
  totalQuarters: number
  timeoutCount: number
  shotClock: number // seconds
  
  // Workflow Settings
  autoPauseOnTimeout: boolean
  autoPauseOnQuarterEnd: boolean
  showConfirmations: boolean
  
  // Display Settings
  showPlayerNumbers: boolean
  showPositions: boolean
  showEfficiencyRatings: boolean
  askForPointsInPaint: boolean
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
      <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }}>{label}</div>
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

// (removed duplicate StatisticsProps with optional eventId)

// Alias for compatibility during transition
type OfflineGameData = RefinedOfflineGameData

// Note: OfflineStorageService completely replaced by refinedLiveStatTrackerService

// OfflineStorageService class definition has been completely removed
// All functionality is now handled by refinedLiveStatTrackerService

interface StatisticsProps {
  eventId: number
  onExit?: () => void
  autoStart?: boolean // New prop to control auto-start behavior
  choice?: 'resume' | 'startOver' | null // Choice from tracking page
}
const Statistics: React.FC<StatisticsProps> = ({ eventId, onExit, autoStart = true, choice = null }) => {
  const router = useRouter()
  const { modal, message } = App.useApp()
  
  // Use refined live stat tracker service (replaces both enhanced + offline services)
  const liveStatService = refinedLiveStatTrackerService
  
  // Initialize enhanced live stat tracker service
  const [liveSessionKey, setLiveSessionKey] = useState<string | null>(null)
  const [gameId, setGameId] = useState<number | null>(null)
  
  // Event data for team names
  const [eventData, setEventData] = useState<{ name: string; oppositionTeam?: string } | null>(null)
  
  // Debug: Track gameId changes
  useEffect(() => {
    console.log('🔍 gameId changed:', gameId)
  }, [gameId])

  // Fetch event data for team names
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) return
      
      try {
        const response = await fetch(`/api/events/${eventId}`)
        const event = await response.json()
        
        if (event && event.data) {
          setEventData({
            name: event.data.name || 'Home Team',
            oppositionTeam: event.data.oppositionTeam
          })
        }
      } catch (error) {
        console.error('Failed to fetch event data:', error)
        // Fallback to default names
        setEventData({
          name: 'Home Team',
          oppositionTeam: 'Opponent'
        })
      }
    }

    fetchEventData()
  }, [eventId])
  const [serviceStatus, setServiceStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const [hasUserStarted, setHasUserStarted] = useState(autoStart) // If autoStart is true, consider it already started
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showEndGameModal, setShowEndGameModal] = useState(false)
  const [isResuming, setIsResuming] = useState(false)

  // Function to manually start tracking
  const startTracking = async () => {
    if (hasUserStarted) return
    
    try {
      // Set a default user ID for the enhanced service
      liveStatService.setUserId(1)
      
      // Set the Supabase client from your existing app to prevent duplicate clients
      try {
        const { supabase } = await import('../../../src/lib/supabase')
        if (supabase) {
          liveStatService.setSupabaseClient(supabase)
        }
      } catch (error) {
        console.log('Could not import existing Supabase client, enhanced service will work offline only')
      }
      
      if (eventId) {
        const gameData = await liveStatService.startLiveGame(
          eventId,
          undefined, // No game ID yet - will be created
          {
            currentTime: 600,
            quarter: 1,
            homeScore: 0,
            awayScore: 0,
            opponentScore: 0,
            timeoutHome: 4,
            timeoutAway: 4,
            isPlaying: false
          }
        )
        setLiveSessionKey(gameData.sessionKey)
        setGameId(gameData.gameId) // Store the game ID for later use
        setServiceStatus('connected')
        setHasUserStarted(true)
        console.log('Refined live session started manually:', gameData.sessionKey)
      }
    } catch (error) {
      console.error('Failed to start refined live session:', error)
      setServiceStatus('error')
    }
  }
  
  // Offline functionality
  const [isOnline, setIsOnline] = useState(true)
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'syncing' | 'failed'>('synced')
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [offlineEvents, setOfflineEvents] = useState<StatEvent[]>([])
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setSyncStatus('pending')
      console.log('🌐 Back online - syncing pending events')
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setSyncStatus('failed')
      console.log('📴 Gone offline - events will be saved locally')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Check initial online status
    setIsOnline(navigator.onLine)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Periodic sync when online (every 2 minutes)
  useEffect(() => {
    if (isOnline && liveSessionKey) {
      // Clear any existing interval
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
      
      // Set up new interval
      syncIntervalRef.current = setInterval(async () => {
        // Check offline events length without causing re-renders
        if (offlineEvents.length > 0) {
          await syncOfflineEvents()
        }
      }, 2 * 60 * 1000) // 2 minutes
      
      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current)
        }
      }
    }
  }, [isOnline, liveSessionKey]) // Removed offlineEvents.length to prevent infinite loop

  // Sync offline events to database
  const syncOfflineEvents = async () => {
    if (!isOnline || offlineEvents.length === 0 || !liveSessionKey) return
    
    setSyncStatus('syncing')
    
    try {
      // Get session ID
      const sessionResponse = await fetch(`/api/live-stat-tracker?type=session&sessionKey=${liveSessionKey}`)
      const sessionData = await sessionResponse.json()
      
      if (!sessionData.success || !sessionData.data) {
        throw new Error('Failed to get session data')
      }
      
      const sessionId = sessionData.data.id
      
      // Sync each offline event
      for (const event of offlineEvents) {
        try {
          const response = await fetch('/api/live-stat-tracker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'record_event',
              data: {
                sessionId: sessionId,
                playerId: event.playerId || null,
                eventType: event.eventType,
                eventValue: event.value,
                quarter: event.quarter,
                gameTime: event.gameTime,
                isOpponentEvent: event.opponentEvent,
                opponentJersey: event.opponentEvent ? 'OPP' : null,
                metadata: event.metadata || {}
              }
            })
          })
          
          if (response.ok) {
            console.log('✅ Synced offline event:', event.eventType)
          } else {
            console.error('❌ Failed to sync event:', event.eventType)
          }
        } catch (error) {
          console.error('Error syncing individual event:', error)
        }
      }
      
      // Clear synced events
      setOfflineEvents([])
      setSyncStatus('synced')
      setLastSyncTime(new Date())
      
    } catch (error) {
      console.error('Error syncing offline events:', error)
      setSyncStatus('failed')
    }
  }

  // Function to save events to database in real-time or offline
  const saveEventToDatabase = async (eventType: string, playerId: number | null, eventValue: number, quarter: number, gameTime: number, isOpponent: boolean = false) => {
    console.log('💾 Attempting to save event:', { eventType, playerId, gameId, liveSessionKey, isOnline })
    console.log('🔍 Current state values:', { gameId, liveSessionKey, serviceStatus, hasUserStarted })
    
    if (!gameId || !liveSessionKey) {
      console.warn('❌ Cannot save event: missing gameId or sessionKey', { gameId, liveSessionKey })
      console.warn('🔍 Debug info:', { 
        gameId, 
        liveSessionKey, 
        serviceStatus, 
        hasUserStarted,
        isOnline 
      })
      return
    }

    // Skip saving if playerId is null/undefined and it's not an opponent event
    if (!playerId && !isOpponent) {
      console.warn('Cannot save event: missing playerId for team event')
      return
    }

    // Create event object
    const event: StatEvent = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      playerId: playerId || -1,
      playerName: playerId ? `Player ${playerId}` : 'Opponent',
      eventType: eventType,
      value: eventValue,
      quarter: quarter,
      gameTime: gameTime,
      opponentEvent: isOpponent,
      metadata: {}
    }

    if (isOnline) {
      // Try to save online first
      try {
        // Add a small delay to ensure session is fully created
        await new Promise(resolve => setTimeout(resolve, 100))
        
      // First get the session ID from the session key
      const sessionResponse = await fetch(`/api/live-stat-tracker?type=session&sessionKey=${liveSessionKey}`)
      const sessionData = await sessionResponse.json()
      
      if (!sessionData.success || !sessionData.data) {
          throw new Error('Failed to get session data')
      }

      const sessionId = sessionData.data.id

      const response = await fetch('/api/live-stat-tracker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'record-event',
          data: {
            sessionId: sessionId,
            playerId: playerId || null,
            eventType: eventType,
            eventValue: eventValue,
            quarter: quarter,
            gameTime: gameTime,
            isOpponentEvent: isOpponent,
            opponentJersey: isOpponent ? 'OPP' : null,
            metadata: {}
          }
        })
      })

      const responseData = await response.json()
      if (!response.ok) {
          throw new Error(`Failed to save event: ${responseData.error || 'Unknown error'}`)
      }
        
        console.log('✅ Event saved online:', eventType, playerId, eventValue)
        setSyncStatus('synced')
        setLastSyncTime(new Date())
        
    } catch (error) {
        console.error('❌ Failed to save online, saving offline:', error)
        // Fallback to offline storage
        setOfflineEvents(prev => [...prev, event])
        setSyncStatus('pending')
      }
    } else {
      // Save offline
      console.log('📴 Saving event offline:', eventType, playerId, eventValue)
      setOfflineEvents(prev => [...prev, event])
      setSyncStatus('pending')
    }
  }
  
  // Prevent double start in React StrictMode (dev) / re-mounts
  const hasStartedRef = useRef(false)
  
  // Start enhanced live session when component mounts (only if autoStart is true)
  useEffect(() => {
    if (!autoStart) {
      setServiceStatus('connected') // Mark as ready but not started
      return
    }
    
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    const startRefinedLiveSession = async () => {
      try {
        // Set a default user ID for the enhanced service
        liveStatService.setUserId(1)
        
        // Set the Supabase client from your existing app to prevent duplicate clients
        // Try to get it from your existing supabase lib
        try {
          const { supabase } = await import('../../../src/lib/supabase')
          if (supabase) {
            liveStatService.setSupabaseClient(supabase)
          }
        } catch (error) {
          console.log('Could not import existing Supabase client, enhanced service will work offline only')
        }
        
        if (eventId) {
          let gameResumed = false;
          
          // If resuming, load existing game data first
          if (choice === 'resume') {
            setIsResuming(true)
            try {
              console.log('🔄 Resuming existing game for event:', eventId)
              const sessionKey = await liveStatService.getSessionKeyForEvent(eventId)
              console.log('🔑 Session key found:', sessionKey)
              
              if (sessionKey) {
                const existingGameData = await liveStatService.loadGameDataFromDatabase(sessionKey)
                console.log('📋 Loaded existing game data:', existingGameData)
                
                if (existingGameData) {
                  console.log('📊 Game state to restore:', existingGameData.gameState)
                  console.log('📊 Events to restore:', existingGameData.events?.length || 0)
                  
                  // Restore the game state from existing data
                  if (existingGameData.gameState) {
                    console.log('🔄 Setting game state:', existingGameData.gameState)
                    console.log('🔍 Game state details:', {
                      quarter: existingGameData.gameState.quarter,
                      homeScore: existingGameData.gameState.homeScore,
                      opponentScore: existingGameData.gameState.opponentScore,
                      isGameStarted: existingGameData.gameState.isGameStarted,
                      isGameEnded: existingGameData.gameState.isGameEnded
                    })
                    // Force update the game state with explicit values
                    setGameState({
                      isPlaying: false,
                      currentTime: 600,
                      quarter: existingGameData.gameState.quarter || 1,
                      homeScore: existingGameData.gameState.homeScore || 0,
                      awayScore: existingGameData.gameState.awayScore || 0,
                      opponentScore: existingGameData.gameState.opponentScore || 0,
                      timeoutHome: 5,
                      timeoutAway: 5,
                      gameStartTime: Date.now(),
                      teamFoulsHome: 0,
                      teamFoulsAway: 0,
                      isOvertime: false,
                      overtimeNumber: 0,
                      regulationQuarters: 4,
                      isGameStarted: true,
                      isGameEnded: existingGameData.gameState.isGameEnded || false
                    })
                    setHasGameStarted(true)
                  }
                  
                  // Restore events
                  if (existingGameData.events && existingGameData.events.length > 0) {
                    console.log('🔄 Setting events:', existingGameData.events.length)
                    setEvents(existingGameData.events)
                  }
                  
                  // Restore lineups
                  if (existingGameData.lineups && existingGameData.lineups.length > 0) {
                    console.log('🔄 Setting lineups:', existingGameData.lineups.length)
                    setLineups(existingGameData.lineups)
                  }
                  
                  // Set the session key and game ID
                  setLiveSessionKey(sessionKey)
                  setGameId(existingGameData.gameId)
                  setServiceStatus('connected')
                  setHasUserStarted(true)
                  gameResumed = true;
                  
                  // IMPORTANT: Save the reconstructed data back to the database
                  // so that analytics and other parts of the app can access it
                  try {
                    console.log('💾 Saving reconstructed data back to database for analytics access...')
                    // We need to ensure the session is properly set up before calling aggregateStatsOnly
                    if (sessionKey && existingGameData.gameId) {
                      // Set the session ID in the service from the session key
                      const sessionSet = await refinedLiveStatTrackerService.setSessionFromKey(sessionKey)
                      if (sessionSet) {
                        // Get the current session ID after setting it
                        const currentSessionId = refinedLiveStatTrackerService.getCurrentSessionId()
                        if (currentSessionId) {
                          await refinedLiveStatTrackerService.aggregateStatsOnly(currentSessionId)
                          console.log('✅ Reconstructed data saved to database')
                        } else {
                          console.log('⚠️ Failed to get current session ID')
                        }
                      } else {
                        console.log('⚠️ Failed to set session from key')
                      }
                    } else {
                      console.log('⚠️ Cannot save reconstructed data - missing session key or game ID')
                    }
                  } catch (error) {
                    console.error('❌ Failed to save reconstructed data:', error)
                    // Don't fail the resume process, just log the error
                  }
                  
                  console.log('✅ Game resumed successfully:', { 
                    sessionKey, 
                    gameId: existingGameData.gameId, 
                    eventsCount: existingGameData.events?.length || 0,
                    gameState: existingGameData.gameState
                  })
                  // Reset resuming flag after a short delay to ensure events loading useEffect sees it
                  setTimeout(() => setIsResuming(false), 100)
                  return // IMPORTANT: Exit here to prevent normal game start
                }
              }
              console.log('⚠️ No existing game data found, starting fresh')
              setIsResuming(false) // Reset resuming flag
            } catch (error) {
              console.error('❌ Error during resume:', error)
              console.log('⚠️ Resume failed, starting fresh')
              setIsResuming(false) // Reset resuming flag
            }
          }
          
          // Only start new game if we didn't successfully resume
          if (!gameResumed) {
            console.log('🚀 Starting new game (not resuming)')
            const gameData = await liveStatService.startLiveGame(
            eventId,
            undefined, // No game ID yet - will be created
            {
              currentTime: 600,
              quarter: 1,
              homeScore: 0,
              awayScore: 0,
              opponentScore: 0,
              timeoutHome: 4,
              timeoutAway: 4,
              isPlaying: false
            }
          )
            setLiveSessionKey(gameData.sessionKey)
            setGameId(gameData.gameId) // Store the game ID for later use
            setServiceStatus('connected')
            setHasUserStarted(true)
            console.log('✅ Refined live session started:', { sessionKey: gameData.sessionKey, gameId: gameData.gameId })
          }
        }
      } catch (error) {
        console.error('Failed to start refined live session:', error)
        setServiceStatus('error')
      }
    }
    
    startRefinedLiveSession()
  }, [eventId, autoStart, choice])

  // Automatically collapse sidebar when live stat tracker opens
  useEffect(() => {
    collapseSidebar()
  }, [])
  
  // State for saved games
  const [savedGames, setSavedGames] = useState<Array<{ 
    id: string; 
    eventId: number; 
    sessionKey: string; 
    startedAt: string; 
    timestamp: string; 
    events: any[] 
  }>>([])

  // Ensure accurate online status on component mount
  useEffect(() => {
    // Force update of online status when component mounts
    if (typeof window !== 'undefined') {
      const currentOnlineStatus = navigator.onLine
      if (currentOnlineStatus !== liveStatService.getOfflineStatus().isOnline) {
        // Update the stored status to match current browser status
        localStorage.setItem('basketball-offline-status', JSON.stringify({
          isOnline: currentOnlineStatus,
          lastUpdated: Date.now()
        }))
      }
    }
  }, [])

  // Load saved games when component mounts
  useEffect(() => {
    const loadSavedGames = async () => {
      try {
        const games = await liveStatService.getAllSavedGamesFromDatabase()
        setSavedGames(games)
      } catch (error) {
        console.error('Failed to load saved games:', error)
      }
    }
    
    if (liveStatService.hasSupabaseClient()) {
      loadSavedGames()
    }
  }, [liveStatService])

  // Function to refresh saved games
  const refreshSavedGames = async () => {
    try {
      const games = await liveStatService.getAllSavedGamesFromDatabase()
      setSavedGames(games)
    } catch (error) {
      console.error('Failed to refresh saved games:', error)
    }
  }
  
  // DEV-ONLY: Default settings with comprehensive options
  const defaultSettings: GameSettings = {
    quarterDuration: 10,
    totalQuarters: 4,
    timeoutCount: 4,
    shotClock: 30,
    autoPauseOnTimeout: true,
    autoPauseOnQuarterEnd: true,
    showConfirmations: true,
    showPlayerNumbers: true,
    showPositions: true,
    showEfficiencyRatings: true,
    askForPointsInPaint: false,
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

  // Hydration-safe: always use defaultSettings for SSR, then load from service/localStorage on client
  const [settings, setSettings] = useState<GameSettings>(defaultSettings)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        // Prefer service-backed settings (Supabase by session), with localStorage fallback
        const loaded = await refinedLiveStatTrackerService.loadSettings()
        if (isMounted && loaded) {
          setSettings({ ...defaultSettings, ...loaded })
        }
      } catch (error) {
        // Fallback to previous localStorage path if service not ready
        if (typeof window !== 'undefined') {
          const savedSettings = localStorage.getItem('basketballStatsSettings')
          if (savedSettings) {
            try {
              if (isMounted) setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) })
            } catch (e) {
              console.warn('Failed to load settings from localStorage:', e)
            }
          }
        }
      }
    }
    load()
    return () => { isMounted = false }
  }, [])

  // Helper function to convert position names to abbreviations
  const getPositionAbbreviation = (positionName: string): string => {
    const position = positionName?.toLowerCase() || ''
    if (position.includes('guard')) return 'G'
    if (position.includes('center')) return 'C'
    if (position.includes('forward')) return 'F'
    return positionName?.substring(0, 2)?.toUpperCase() || 'N/A'
  }

  // Fetch real player data from API
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        console.log('Live Stat Tracker: Fetching players from API...')
        const response: any = await api.get('/api/players')
        const playersData = (response as any).data?.data || (response as any).data || []
        
        console.log('Live Stat Tracker: Received players:', response.data)
        console.log('Live Stat Tracker: Players array:', playersData)
        
        // Transform API data to match the Player interface
        const transformedPlayers: Player[] = playersData.map((dbPlayer: any) => {
          // Get position name, abbreviation, or fallback
          const positionName = dbPlayer.position?.name || 'N/A'
          const positionAbbr = getPositionAbbreviation(positionName)
          
          // Construct player name
          const playerName = dbPlayer.first_name && dbPlayer.last_name 
            ? `${dbPlayer.first_name} ${dbPlayer.last_name}`
            : dbPlayer.name || 'Unknown Player'
          
          return {
            id: dbPlayer.id,
            name: playerName,
            number: dbPlayer.jersey_number || dbPlayer.jersey || '0',
            position: positionAbbr,
            minutesPlayed: 0,
            points: 0,
            rebounds: 0,
            offensiveRebounds: 0,
            defensiveRebounds: 0,
            assists: 0,
            steals: 0,
            blocks: 0,
            fouls: 0,
            turnovers: 0,
            fgAttempted: 0,
            fgMade: 0,
            threeAttempted: 0,
            threeMade: 0,
            ftAttempted: 0,
            ftMade: 0,
            plusMinus: 0,
            chargesTaken: 0,
            deflections: 0,
            isOnCourt: false,
            isStarter: false, // NEW: Designate if player is a starter
            isMainRoster: false // NEW: Designate if player is in main roster
          }
        })
        
        console.log('Live Stat Tracker: Transformed players:', transformedPlayers)
        setPlayers(transformedPlayers)
      } catch (error) {
        console.error('Live Stat Tracker: Error fetching players:', error)
        // Keep empty array on error
        setPlayers([])
      }
    }

    fetchPlayers()
  }, [])

  const [gameState, setGameState] = useState<GameState>(() => ({
    isPlaying: false,
    currentTime: defaultSettings.quarterDuration * 60, // Use default settings for initial state
    quarter: 1,
    homeScore: 0,
    awayScore: 0,
    opponentScore: 0,
    timeoutHome: defaultSettings.timeoutCount,
    timeoutAway: defaultSettings.timeoutCount,
    gameStartTime: Date.now(),
    teamFoulsHome: 0,
    teamFoulsAway: 0,
    isOvertime: false,
    overtimeNumber: 0,
    regulationQuarters: defaultSettings.totalQuarters
  }))

  const [players, setPlayers] = useState<Player[]>([])

  // Opponent on-court jersey slots (5) and selection
  const [opponentOnCourt, setOpponentOnCourt] = useState<string[]>(['', '', '', '', ''])
  const [selectedOpponentSlot, setSelectedOpponentSlot] = useState<number | null>(null)
  // Track opponent fouls by jersey number, not slot position
  const [opponentFouls, setOpponentFouls] = useState<Record<string, number>>({})

  const [events, setEvents] = useState<StatEvent[]>([])
  const [deletedEvents, setDeletedEvents] = useState<StatEvent[]>([])
  const [lineups, setLineups] = useState<Lineup[]>([])
  const [showHalftimeReport, setShowHalftimeReport] = useState(false)
  const [showTimeoutReport, setShowTimeoutReport] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showPipModal, setShowPipModal] = useState(false)
  const [pendingPipEvent, setPendingPipEvent] = useState<any>(null)
  const [showAssistModal, setShowAssistModal] = useState(false)
  const [pendingAssistEvent, setPendingAssistEvent] = useState<any>(null)
  const [showReboundModal, setShowReboundModal] = useState(false)
  const [pendingReboundEvent, setPendingReboundEvent] = useState<any>(null)
  const [showStealModal, setShowStealModal] = useState(false)
  const [pendingStealEvent, setPendingStealEvent] = useState<any>(null)
  const [showTurnoverModal, setShowTurnoverModal] = useState(false)
  const [pendingTurnoverEvent, setPendingTurnoverEvent] = useState<any>(null)
  const [showFoulModal, setShowFoulModal] = useState(false)
  const [pendingFoulEvent, setPendingFoulEvent] = useState<any>(null)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [pendingBlockEvent, setPendingBlockEvent] = useState<any>(null)
  // Allow in-app dialogs (like Settings) to bypass the leave/stay confirmation
  const [suppressNavigationGuard, setSuppressNavigationGuard] = useState(false)
  
  // Track sidebar collapsed state for responsive layout
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [activeTab, setActiveTab] = useState('tracking')
  // Track last timeout moment using wall-clock time (ms since epoch)
  const [lastTimeoutTs, setLastTimeoutTs] = useState<number>(0)
  const [currentLineup, setCurrentLineup] = useState<Lineup | null>(null)
  const [showLineupBuilder, setShowLineupBuilder] = useState(false)
  const [selectedLineupPlayers, setSelectedLineupPlayers] = useState<number[]>([])
  const [lineupName, setLineupName] = useState('')
  const [showBulkSubModal, setShowBulkSubModal] = useState(false)
  const [selectedBulkSubPlayers, setSelectedBulkSubPlayers] = useState<number[]>([])
  const [isEditingClock, setIsEditingClock] = useState(false);
  const [editingLineupId, setEditingLineupId] = useState<string | null>(null)
  const [editingLineupName, setEditingLineupName] = useState('')
  
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

  // Bench/SCP/PTO tracking
  const starterIdsRef = useRef<number[]>([])
  // Track opponent starter jersey numbers for bench points calculation
  const opponentStarterJerseysRef = useRef<string[]>([])
  // Track if opponent starting 5 has been set (allows initial editing)
  const [opponentStarting5Set, setOpponentStarting5Set] = useState<boolean>(false)
  // Track previous opponent lineup for undo functionality
  const [previousOpponentLineup, setPreviousOpponentLineup] = useState<string[]>(['', '', '', '', ''])
  const scpWindowHomeRef = useRef<boolean>(false)
  const scpWindowAwayRef = useRef<boolean>(false)
  const ptoWindowHomeRef = useRef<boolean>(false)
  const ptoWindowAwayRef = useRef<boolean>(false)
  const lastPossessionRef = useRef<'home' | 'away' | null>(null)

  const [analyticsTotals, setAnalyticsTotals] = useState<Record<number, { home: { scp: number; pto: number; benchPoints: number }; away: { scp: number; pto: number; benchPoints: number } }>>({})

  const addAnalytics = (quarter: number, team: 'home'|'away', points: number, flags: { scp?: boolean; pto?: boolean; bench?: boolean }) => {
    setAnalyticsTotals(prev => {
      const q = prev[quarter] || { home: { scp: 0, pto: 0, benchPoints: 0 }, away: { scp: 0, pto: 0, benchPoints: 0 } }
      const t = { ...q[team] }
      if (flags.scp) t.scp += points
      if (flags.pto) t.pto += points
      if (flags.bench) t.benchPoints += points
      return { ...prev, [quarter]: { ...q, [team]: t } }
    })
  }

  // Debounced sync of analytics to Supabase when online
  const syncAnalytics = useCallback(() => {
    if (!liveSessionKey) return
    try {
      refinedLiveStatTrackerService.updateAnalytics({ byQuarter: analyticsTotals })
    } catch (e) {
      // noop offline
    }
  }, [liveSessionKey]) // Removed analyticsTotals to prevent infinite loop

  useEffect(() => {
    const id = setTimeout(syncAnalytics, 800)
    return () => clearTimeout(id)
  }, [syncAnalytics])

  // DEV-ONLY: Enhanced substitution state
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false)
  const [showReportButton, setShowReportButton] = useState(false)
  const [isReportEnabled, setIsReportEnabled] = useState(false)
  // Real-time start for current quarter (ms since epoch)
  const [quarterStartTime, setQuarterStartTime] = useState<number | null>(null)
  const halftimeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [substitutionStep, setSubstitutionStep] = useState<'select-out' | 'select-in' | 'confirm'>('select-out')
  const [substitutionHistory, setSubstitutionHistory] = useState<Array<{
    playerIn: Player
    playerOut: Player
    timestamp: number
    quarter: number
    gameTime: number
    lineupId?: string
  }>>([])
  const [hasGameStarted, setHasGameStarted] = useState(false)

  // DEV-ONLY: Save settings to localStorage
  const saveSettings = useCallback((newSettings: Partial<GameSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    
    // Save through service (mirrors to Supabase and localStorage when available)
    try {
      refinedLiveStatTrackerService.saveSettings(updatedSettings)
    } catch (error) {
      // Also mirror to localStorage as a hard fallback
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('basketballStatsSettings', JSON.stringify(updatedSettings)) } catch {}
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


  // DEV-ONLY: Apply game configuration settings
  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      timeoutHome: settings.timeoutCount,
      timeoutAway: settings.timeoutCount,
    }))
  }, [settings.timeoutCount])

  // DEV-ONLY: Apply workflow mode changes
  useEffect(() => {
    // Workflow mode removed - using consistent player-first layout
  }, [])

  // DEV-ONLY: Check for halftime with settings integration
  // Auto-activate LKRM Halftime Report 9:30 after Q2 starts (real time)
  useEffect(() => {
    if (!settings.halftimeReminder) return
    // Clear any existing timer
    if (halftimeTimerRef.current) {
      clearTimeout(halftimeTimerRef.current)
      halftimeTimerRef.current = null
    }
    // When quarter 2 starts and we have a real start time, schedule after 9m30s
    if (gameState.quarter === 2 && quarterStartTime) {
      const delayMs = 9 * 60 * 1000 + 30 * 1000 // 9:30
      halftimeTimerRef.current = setTimeout(() => {
        setShowHalftimeReport(true)
      }, delayMs)
    }
    return () => {
      if (halftimeTimerRef.current) {
        clearTimeout(halftimeTimerRef.current)
        halftimeTimerRef.current = null
      }
    }
  }, [gameState.quarter, quarterStartTime, settings.halftimeReminder])

  // DEV-ONLY: Enhanced timeout tracking with settings integration
  const handleTimeout = (team: 'home' | 'away') => {
    // Save current state for undo
    const previousState = {
      players: players,
      gameState: gameState,
      events: events,
      lineups: lineups,
      opponentOnCourt: opponentOnCourt,
      substitutionHistory: substitutionHistory,
      quickSubHistory: quickSubHistory,
      quarterStartTime: quarterStartTime
    }

    const nowTs = Date.now()
    setLastTimeoutTs(nowTs)
    
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

    // Auto-save after timeout
    setTimeout(() => saveGameDataOffline({ silent: true }), 1000)
  }

  // DEV-ONLY: Generate comprehensive halftime insights
  const generateHalftimeInsights = () => {
    // Return empty insights if no players loaded yet
    if (!players || players.length === 0) {
      return {
        topScorer: null,
        topRebounder: null,
        topAssister: null,
        mostEfficient: null,
        teamStats: calculateTeamStats(),
        pace: 0,
        recommendations: [],
        recentOpponentRun: null,
        hotOpponent: null,
        insights: []
      };
    }

    const topScorer = players.reduce((max, p) => p.points > max.points ? p : max, players[0]);
    const topRebounder = players.reduce((max, p) => p.rebounds > max.rebounds ? p : max, players[0]);
    const topAssister = players.reduce((max, p) => p.assists > max.assists ? p : max, players[0]);
    const mostEfficient = players.reduce((max, p) => {
      const missedFg = (p.fgAttempted || 0) - (p.fgMade || 0);
      const missedFt = (p.ftAttempted || 0) - (p.ftMade || 0);
      const efficiency = p.points + p.rebounds + p.assists + p.steals + p.blocks - missedFg - missedFt - (p.turnovers || 0);
      return efficiency > max.efficiency ? { player: p, efficiency } : max;
    }, { player: players[0], efficiency: (players[0].points + players[0].rebounds + players[0].assists + players[0].steals + players[0].blocks - ((players[0].fgAttempted||0)-(players[0].fgMade||0)) - ((players[0].ftAttempted||0)-(players[0].ftMade||0)) - (players[0].turnovers||0)) });

    const teamStats = calculateTeamStats();
    // Opponent metrics using all events so far (independent of game clock)
    const opponentStats = {
      totalRebounds: events.filter(e => e.opponentEvent && (e.eventType === 'defensive_rebound' || e.eventType === 'offensive_rebound')).length,
      totalTurnovers: events.filter(e => e.opponentEvent && e.eventType === 'turnover').length,
    };
    // Opponent run in last 2 minutes of real time
    const twoMinAgo = Date.now() - 120000;
    const recentOpponentRun = calculateOpponentRun(events.filter(e => e.timestamp >= twoMinAgo));
    // Opponent hot hand over all events so far
    const hotOpponent = findHotOpponent(events.filter(e => e.opponentEvent));

    const halftimeData = {
      topScorer,
      topRebounder,
      topAssister,
      mostEfficient,
      teamStats,
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
    // Return empty insights if no players loaded yet
    if (!players || players.length === 0) {
      return {
        topScorer: null,
        topRebounder: null,
        topAssister: null,
        mostEfficient: null,
        teamStats: {
          totalPoints: 0,
          totalRebounds: 0,
          totalAssists: 0,
          totalTurnovers: 0,
          fgAttempted: 0,
          fgMade: 0,
          assistToTurnoverRatio: 0,
          pace: 0,
          projectedFinal: 0,
          fgPercentage: 0
        },
        momentum: 'neutral',
        recommendations: []
      };
    }

    // Last 2 minutes of events
    // Use the last 2 minutes of wall-clock time from last timeout
    const recentEvents = events.filter(e => e.timestamp >= (lastTimeoutTs - 120000));
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
      const fgAttempted = stats.filter(e => e.eventType === 'fg_attempt' || e.eventType === 'fg_made').length;
      const fgMade = stats.filter(e => e.eventType === 'fg_made').length;
      const ftAttempted = stats.filter(e => e.eventType === 'ft_attempt' || e.eventType === 'ft_made').length;
      const ftMade = stats.filter(e => e.eventType === 'ft_made').length;
      const missedFg = (fgAttempted || 0) - (fgMade || 0);
      const missedFt = (ftAttempted || 0) - (ftMade || 0);
      const efficiency = points + rebounds + assists - missedFg - missedFt - turnovers;
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
      const missedFg = (p.fgAttempted || 0) - (p.fgMade || 0);
      const missedFt = (p.ftAttempted || 0) - (p.ftMade || 0);
      const efficiency = p.points + p.rebounds + p.assists - missedFg - missedFt - (p.turnovers || 0);
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

  const formatWallClock = (ts: number) => {
    const d = new Date(ts)
    const hh = d.getHours().toString().padStart(2, '0')
    const mm = d.getMinutes().toString().padStart(2, '0')
    const ss = d.getSeconds().toString().padStart(2, '0')
    return `${hh}:${mm}:${ss}`
  }

  // DEV-ONLY: Enhanced undo last action function
  const undoLastAction = () => {
    if (actionHistory.length === 0) {
      message.warning('No actions to undo')
      return
    }

    const lastAction = actionHistory[0]
    const previousState = lastAction.previousState

    // Restore all previous state
    setPlayers(previousState.players || players)
    setGameState(previousState.gameState || gameState)
    setEvents(previousState.events || events)
    setLineups(previousState.lineups || lineups)
    setOpponentOnCourt(previousState.opponentOnCourt || opponentOnCourt)
    // Handle both old array format and new object format for opponentFouls
    if (Array.isArray(previousState.opponentFouls)) {
      // Convert old array format to new object format
      const newOpponentFouls: Record<string, number> = {}
      previousState.opponentOnCourt?.forEach((jersey: string, idx: number) => {
        if (jersey) {
          newOpponentFouls[jersey] = previousState.opponentFouls[idx] || 0
        }
      })
      setOpponentFouls(newOpponentFouls)
    } else {
      setOpponentFouls(previousState.opponentFouls || {})
    }
    setSubstitutionHistory(previousState.substitutionHistory || substitutionHistory)
    setQuickSubHistory(previousState.quickSubHistory || quickSubHistory)
    if (previousState.showReportButton !== undefined) setShowReportButton(previousState.showReportButton)
    if (previousState.isReportEnabled !== undefined) setIsReportEnabled(previousState.isReportEnabled)
    
    // Restore quarter start time if it was saved
    if (previousState.quarterStartTime !== undefined) {
      setQuarterStartTime(previousState.quarterStartTime)
    }

    // Handle specific action types for additional cleanup and user feedback
    if (lastAction.type === 'quarter') {
      const { action, quarter } = lastAction.data
      
      if (action === 'start') {
        // Undoing a quarter start - game is no longer playing
        setGameState(prev => ({ ...prev, isPlaying: false }))
        setHasGameStarted(false)
        message.success(`Undid Q${quarter} start - Game paused`)
      } else if (action === 'stop') {
        // Undoing a quarter stop - game is playing again
        setGameState(prev => ({ ...prev, isPlaying: true }))
        message.success(`Undid Q${quarter} stop - Game resumed`)
      } else if (action === 'end_game') {
        // Undoing end game - restore to previous quarter
        setGameState(prev => ({ ...prev, isPlaying: true }))
        message.success('Undid end game - Game resumed')
      } else if (action === 'next_quarter') {
        // Undoing next quarter - go back to previous quarter
        message.success(`Undid advance to Q${quarter} - Back to Q${quarter - 1}`)
      }
    } else if (lastAction.type === 'stat') {
      const { eventType, playerId, isOpponent } = lastAction.data
      const playerName = isOpponent ? `Opponent #${playerId}` : players.find(p => p.id === playerId)?.name || 'Player'
      message.success(`Undid ${eventType} for ${playerName}`)
    } else if (lastAction.type === 'substitution') {
      const { playerIn, playerOut } = lastAction.data
      message.success(`Undid substitution: ${playerOut?.name || 'Player'} ↔ ${playerIn?.name || 'Player'}`)
    } else if (lastAction.type === 'timeout') {
      const { team } = lastAction.data
      message.success(`Undid ${team} timeout`)
    } else if (lastAction.type === 'score') {
      const { points, team } = lastAction.data
      message.success(`Undid ${points} point(s) for ${team}`)
    } else {
      message.success('Undid last action')
    }

    // Remove the last action from history
    setActionHistory(prev => prev.slice(1))
  }

  // DEV-ONLY: Handle opponent score change with undo support
  const handleOpponentScoreChange = (points: number) => {
    // Save current state for undo
    const previousState = {
      players: players,
      gameState: gameState,
      events: events,
      lineups: lineups,
      opponentOnCourt: opponentOnCourt,
      substitutionHistory: substitutionHistory,
      quickSubHistory: quickSubHistory,
      quarterStartTime: quarterStartTime
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
  const handleStatEvent = useCallback((playerId: number, eventType: string, value?: number, isOpponent: boolean = false, metadata?: any) => {
    const player = players.find(p => p.id === playerId)
    if (!player) return

    // Save current state for undo
    const previousState = {
      players: players,
      gameState: gameState,
      events: events,
      lineups: lineups,
      opponentOnCourt: opponentOnCourt,
      substitutionHistory: substitutionHistory,
      quickSubHistory: quickSubHistory,
      quarterStartTime: quarterStartTime
    }

    // DEV-ONLY: Apply foul trouble alert
    if (eventType === 'foul' && settings.foulTroubleAlert && player.fouls >= 2) {
      // Could show notification here
      console.log(`⚠️ Foul trouble alert: ${player.name} has ${player.fouls + 1} fouls`)
    }

    const pointsForThis = (eventType === 'three_made' ? 3 : eventType === 'ft_made' ? 1 : value || 0)
    const willScore = (eventType.includes('made') || eventType === 'points') && pointsForThis > 0
    // Determine bench/scp/pto flags (before state changes)
    const isBench = starterIdsRef.current.length > 0 ? !starterIdsRef.current.includes(playerId) : false
    const scp = willScore && (lastPossessionRef.current === 'home') && scpWindowHomeRef.current
    const pto = willScore && (lastPossessionRef.current === 'away') && ptoWindowHomeRef.current

    const newEvent: StatEvent = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      playerId,
      playerName: player.name,
      eventType,
      value,
      quarter: gameState.quarter,
      // gameTime kept for backward-compat, but downstream views should use timestamp
      gameTime: Date.now(),
      opponentEvent: isOpponent,
      metadata: { ...(metadata || {}), bench: isBench, scp, pto }
    }

    setEvents(prev => [newEvent, ...prev])

    // Save event to database in real-time
    saveEventToDatabase(
      eventType, 
      playerId, 
      value || 0, 
      gameState.quarter, 
      Math.floor((defaultSettings.quarterDuration * 60) - gameState.currentTime), // Convert to seconds from start of quarter
      isOpponent
    )

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
          updated.twoPointAttempted += 1;
          break;
        case 'fg_made':
          updated.fgMade += 1;
          updated.fgAttempted += 1;
          updated.twoPointMade += 1;
          updated.twoPointAttempted += 1;
          updated.points += 2;
          updated.plusMinus += 2;
          // Add PIP if metadata indicates it
          if (metadata?.pip) {
            updated.pointsInPaint = (updated.pointsInPaint || 0) + 2;
          }
          // Note: Assist is now handled by creating a separate assist event
          break;
        case 'fg_missed':
          console.log('🔍 handleStatEvent - Processing fg_missed for player:', player.name, 'Current stats:', { fgAttempted: updated.fgAttempted, twoPointAttempted: updated.twoPointAttempted })
          updated.fgAttempted += 1;
          updated.twoPointAttempted += 1;
          console.log('🔍 handleStatEvent - Updated stats:', { fgAttempted: updated.fgAttempted, twoPointAttempted: updated.twoPointAttempted })
          break;
        case 'three_attempt':
          updated.threeAttempted += 1;
          updated.fgAttempted += 1;
          break;
        case 'three_made':
          updated.threeMade += 1;
          updated.threeAttempted += 1;
          updated.fgMade += 1;
          updated.fgAttempted += 1;
          updated.points += 3;
          updated.plusMinus += 3;
          break;
        case 'three_missed':
          console.log('🔍 handleStatEvent - Processing three_missed for player:', player.name, 'Current stats:', { threeAttempted: updated.threeAttempted, fgAttempted: updated.fgAttempted })
          updated.threeAttempted += 1;
          updated.fgAttempted += 1;
          console.log('🔍 handleStatEvent - Updated stats:', { threeAttempted: updated.threeAttempted, fgAttempted: updated.fgAttempted })
          break;
        case 'ft_attempt':
          updated.ftAttempted += 1;
          break;
        case 'ft_made':
          updated.ftMade += 1;
          updated.ftAttempted += 1;
          updated.points += 1;
          updated.plusMinus += 1;
          break;
        case 'ft_missed':
          updated.ftAttempted += 1;
          break;
      }
      return updated;
    }));

    // Update team score for points
    if (willScore) {
      const points = pointsForThis || 2
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
        // Update analytics for home scoring
        addAnalytics(gameState.quarter, 'home', points, { scp, pto, bench: isBench })
      }
    }

    // Add to action history
    setActionHistory(prev => [{
      type: 'stat',
      timestamp: Date.now(),
      data: { playerId, eventType, value, isOpponent },
      previousState
    }, ...prev.slice(0, 49)]) // Keep last 50 actions

    // Auto-save after each stat event
    setTimeout(() => saveGameDataOffline({ silent: true }), 1000)
    
    // Enhanced service: Record live stat event
    if (liveSessionKey) {
      // Guard: wait until session is active before sending events
      if (!liveStatService.hasActiveSession || !liveStatService.hasActiveSession()) {
        message.info('Connecting to live session… please try again in a moment')
        return
      }
      try {
        liveStatService.recordLiveEvent(
          eventType,
          value,
          playerId,
          gameState.quarter,
          Math.max(0, Math.min(3599, Math.floor((defaultSettings.quarterDuration * 60) - gameState.currentTime))),
          isOpponent,
          undefined, // No opponent jersey for team players
          { playerName: player.name, timestamp: new Date().toISOString(), isOpponent, bench: isBench, scp, pto, ...(metadata || {}) }
        )
      } catch (error) {
        console.error('Failed to record enhanced live event:', error)
      }
    }
  }, [players, gameState.quarter, gameState.currentTime, settings.foulTroubleAlert, actionHistory, liveSessionKey, settings.quarterDuration])

  // Delete event function with stat reversal
  const handleDeleteEvent = (eventId: string) => {
    const eventToDelete = events.find(event => event.id === eventId)
    if (!eventToDelete) return

    // Confirm deletion
    modal.confirm({
      title: 'Delete Event',
      content: `Are you sure you want to delete this ${eventToDelete.eventType} event for ${eventToDelete.playerName}?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
              onOk: () => {
          // Move event to deleted events array instead of permanently removing
          const eventToDelete = events.find(event => event.id === eventId)
          if (!eventToDelete) return
          
          setDeletedEvents(prev => [...prev, eventToDelete])
          setEvents(prev => prev.filter(event => event.id !== eventId))

        // Persist deletion as an audit event in Supabase (no reinstatement)
        if (liveSessionKey) {
          // Guard: wait until session is active before sending events
          if (!liveStatService.hasActiveSession || !liveStatService.hasActiveSession()) {
            console.info('Skipping deletion audit event until session connects')
            return
          }
          try {
            liveStatService.recordLiveEvent(
              'deleted_event',
              undefined,
              (!!eventToDelete.opponentEvent || (eventToDelete.playerId || 0) <= 0) ? undefined : eventToDelete.playerId,
              gameState.quarter,
              Math.max(0, Math.min(3599, Math.floor((defaultSettings.quarterDuration * 60) - gameState.currentTime))),
              !!eventToDelete.opponentEvent,
              undefined,
              {
                deletedLocalId: eventToDelete.id,
                originalEventType: eventToDelete.eventType,
                originalValue: eventToDelete.value,
                originalTimestamp: new Date(eventToDelete.timestamp).toISOString(),
                playerName: eventToDelete.playerName,
                isOpponent: !!eventToDelete.opponentEvent
              }
            )
          } catch (err) {
            console.error('Failed to persist deletion event:', err)
          }
        }

        // Reverse the stat changes
        const player = players.find(p => p.id === eventToDelete.playerId)
        if (player) {
          setPlayers(prev => prev.map(p => {
            if (p.id !== eventToDelete.playerId) return p
            const updated = { ...p }
            
            // Reverse the stat changes based on event type
            switch (eventToDelete.eventType) {
              case 'points':
                updated.points -= eventToDelete.value || 2
                updated.plusMinus -= eventToDelete.value || 2
                break
              case 'rebound':
                updated.rebounds -= 1
                break
              case 'offensive_rebound':
                updated.offensiveRebounds -= 1
                updated.rebounds -= 1
                break
              case 'defensive_rebound':
                updated.defensiveRebounds -= 1
                updated.rebounds -= 1
                break
              case 'assist':
                updated.assists -= 1
                break
              case 'steal':
                updated.steals -= 1
                updated.plusMinus -= 2
                break
              case 'block':
                updated.blocks -= 1
                break
              case 'foul':
                updated.fouls -= 1
                break
              case 'turnover':
                updated.turnovers -= 1
                updated.plusMinus += 2
                break
              case 'charge_taken':
                updated.chargesTaken -= 1
                updated.plusMinus -= 2
                break
              case 'deflection':
                updated.deflections -= 1
                break
              case 'fg_attempt':
                updated.fgAttempted -= 1
                break
              case 'fg_made':
                updated.fgMade -= 1
                updated.points -= 2
                updated.plusMinus -= 2
                if (eventToDelete.metadata?.pip) {
                  updated.pointsInPaint = (updated.pointsInPaint || 0) - 2
                }
                break
              case 'three_attempt':
                updated.threeAttempted -= 1
                break
              case 'three_made':
                updated.threeMade -= 1
                updated.points -= 3
                updated.plusMinus -= 3
                break
              case 'ft_attempt':
                updated.ftAttempted -= 1
                break
              case 'ft_made':
                updated.ftMade -= 1
                updated.points -= 1
                updated.plusMinus -= 1
                break
            }
            return updated
          }))
        }

        // Reverse team score changes
        if (eventToDelete.eventType.includes('made') || eventToDelete.eventType === 'points') {
          const points = eventToDelete.eventType === 'three_made' ? 3 : 
                        eventToDelete.eventType === 'ft_made' ? 1 : 
                        eventToDelete.value || 2
          
          if (eventToDelete.opponentEvent) {
            setGameState(prev => ({
              ...prev,
              opponentScore: prev.opponentScore - points
            }))
          } else {
            setGameState(prev => ({
              ...prev,
              homeScore: prev.homeScore - points
            }))
          }
        }

        message.success('Event deleted and stats reversed')
      }
    })
  }

  // Undo last deleted event
  const undoLastDeletedEvent = useCallback(() => {
    if (deletedEvents.length === 0) {
      message.warning('No deleted events to undo')
      return
    }

    const eventToRestore = deletedEvents[deletedEvents.length - 1]
    
    // Create a new event with a unique ID to avoid key conflicts
    const restoredEvent: StatEvent = {
      ...eventToRestore,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}` // Generate unique ID consistent with other events
    }
    
    // Restore the event to the events array
    setEvents(prev => [...prev, restoredEvent])
    
    // Remove from deleted events
    setDeletedEvents(prev => prev.slice(0, -1))

    // Re-apply the stat changes
    const player = players.find(p => p.id === eventToRestore.playerId)
    if (player) {
      setPlayers(prev => prev.map(p => {
        if (p.id !== eventToRestore.playerId) return p
        const updated = { ...p }
        
        // Re-apply the stat changes based on event type
        switch (eventToRestore.eventType) {
          case 'points':
            updated.points += eventToRestore.value || 2
            updated.plusMinus += eventToRestore.value || 2
            break
          case 'rebound':
            updated.rebounds += 1
            break
          case 'offensive_rebound':
            updated.offensiveRebounds += 1
            updated.rebounds += 1
            break
          case 'defensive_rebound':
            updated.defensiveRebounds += 1
            updated.rebounds += 1
            break
          case 'assist':
            updated.assists += 1
            break
          case 'steal':
            updated.steals += 1
            updated.plusMinus += 2
            break
          case 'block':
            updated.blocks += 1
            break
          case 'foul':
            updated.fouls += 1
            break
          case 'turnover':
            updated.turnovers += 1
            updated.plusMinus -= 2
            break
          case 'charge_taken':
            updated.chargesTaken += 1
            updated.plusMinus += 2
            break
          case 'deflection':
            updated.deflections += 1
            break
          case 'fg_attempt':
            updated.fgAttempted += 1
            break
          case 'fg_made':
            updated.fgMade += 1
            updated.points += 2
            updated.plusMinus += 2
            if (eventToRestore.metadata?.pip) {
              updated.pointsInPaint = (updated.pointsInPaint || 0) + 2
            }
            break
          case 'three_attempt':
            updated.threeAttempted += 1
            break
          case 'three_made':
            updated.threeMade += 1
            updated.points += 3
            updated.plusMinus += 3
            break
          case 'ft_attempt':
            updated.ftAttempted += 1
            break
          case 'ft_made':
            updated.ftMade += 1
            updated.points += 1
            updated.plusMinus += 1
            break
        }
        return updated
      }))
    }

    // Re-apply team score changes
    if (eventToRestore.eventType.includes('made') || eventToRestore.eventType === 'points') {
      const points = eventToRestore.eventType === 'three_made' ? 3 : 
                    eventToRestore.eventType === 'ft_made' ? 1 : 
                    eventToRestore.value || 2
      
      if (eventToRestore.opponentEvent) {
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

    message.success(`Event restored: ${restoredEvent.eventType} for ${restoredEvent.playerName}`)
  }, [deletedEvents, players])

  // Set opponent starting 5 - allows initial editing of jersey numbers
  const setOpponentStarting5 = useCallback(() => {
    if (opponentOnCourt.some(jersey => jersey)) {
      // Save current lineup as previous state for undo
      setPreviousOpponentLineup([...opponentOnCourt])
      opponentStarterJerseysRef.current = [...opponentOnCourt]
      setOpponentStarting5Set(true)
      console.log('🏀 Opponent starting 5 set:', opponentStarterJerseysRef.current)
    }
  }, [opponentOnCourt])

  // Undo opponent starting 5 - restore previous lineup and allow editing
  const undoOpponentStarting5 = useCallback(() => {
    setOpponentOnCourt([...previousOpponentLineup])
    opponentStarterJerseysRef.current = []
    setOpponentStarting5Set(false)
    console.log('🏀 Opponent starting 5 undone, restored lineup:', previousOpponentLineup)
  }, [previousOpponentLineup])

  // Handle opponent substitution - preserve fouls by jersey number
  const handleOpponentSubstitution = useCallback((slotIndex: number, newJerseyNumber: string) => {
    const oldJerseyNumber = opponentOnCourt[slotIndex]
    
    // Set initial opponent starters if this is the first substitution and we haven't set them yet
    if (opponentStarterJerseysRef.current.length === 0 && opponentOnCourt.some(jersey => jersey)) {
      opponentStarterJerseysRef.current = [...opponentOnCourt]
      setOpponentStarting5Set(true)
      console.log('🏀 Initial opponent starters set:', opponentStarterJerseysRef.current)
    }
    
    // Update the on-court lineup
    setOpponentOnCourt(prev => {
      const next = [...prev]
      next[slotIndex] = newJerseyNumber
      return next
    })
    
    // Record the substitution event
    const substitutionEvent: StatEvent = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      playerId: -1,
      playerName: `Substitution: #${oldJerseyNumber} → #${newJerseyNumber}`,
      eventType: 'substitution',
      quarter: gameState.quarter,
      gameTime: Date.now(),
      opponentEvent: true,
      opponentJersey: newJerseyNumber,
      metadata: { 
        oldJersey: oldJerseyNumber, 
        newJersey: newJerseyNumber,
        slotIndex: slotIndex
      }
    }
    
    setEvents(prev => [substitutionEvent, ...prev])
    
    // Save state for undo
    const previousState = {
      players: players,
      gameState: gameState,
      events: events,
      lineups: lineups,
      opponentOnCourt: opponentOnCourt,
      substitutionHistory: substitutionHistory,
      quickSubHistory: quickSubHistory,
      quarterStartTime: quarterStartTime
    }
    
    setActionHistory(prev => [{
      type: 'substitution',
      timestamp: Date.now(),
      data: { oldJersey: oldJerseyNumber, newJersey: newJerseyNumber, slotIndex },
      previousState
    }, ...prev.slice(0, 49)])
    
    console.log(`🔄 Opponent substitution: #${oldJerseyNumber} → #${newJerseyNumber} (Slot ${slotIndex})`)
  }, [opponentOnCourt, gameState.quarter, players, events, lineups, substitutionHistory, quickSubHistory, quarterStartTime])

  // Record opponent stat by jersey number only (no player object updates)
  const handleOpponentStatEvent = useCallback((jerseyNumber: string, eventType: string, value?: number, metadata?: any) => {
    if (!jerseyNumber) return

    // Update opponent fouls if this is a foul event - track by jersey number
    if (eventType === 'foul') {
      setOpponentFouls(prev => ({
        ...prev,
        [jerseyNumber]: (prev[jerseyNumber] || 0) + 1
      }))
    }

    // Save current state for undo
    const previousState = {
      players: players,
      gameState: gameState,
      events: events,
      lineups: lineups,
      opponentOnCourt: opponentOnCourt,
      substitutionHistory: substitutionHistory,
      quickSubHistory: quickSubHistory,
      quarterStartTime: quarterStartTime
    }

    const newEvent: StatEvent = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      playerId: -1, // indicates opponent jersey-based
      playerName: `#${jerseyNumber}`,
      eventType,
      value,
      quarter: gameState.quarter,
      gameTime: Date.now(),
      opponentEvent: true,
      opponentJersey: jerseyNumber, // Add this field
      metadata: metadata || {}
    }

    setEvents(prev => [newEvent, ...prev])

    // Update opponent team score for points
    if (eventType.includes('made') || eventType === 'points') {
      const points = eventType === 'three_made' ? 3 : eventType === 'ft_made' ? 1 : value || 2
      setGameState(prev => ({ ...prev, opponentScore: prev.opponentScore + points }))
      // Update analytics for away scoring
      const scp = (lastPossessionRef.current === 'away') && scpWindowAwayRef.current
      const pto = (lastPossessionRef.current === 'home') && ptoWindowAwayRef.current
      // Determine if this is a bench player (not in initial starting lineup)
      const isBench = opponentStarterJerseysRef.current.length > 0 ? !opponentStarterJerseysRef.current.includes(jerseyNumber) : false
      addAnalytics(gameState.quarter, 'away', points, { scp, pto, bench: isBench })
    }



    // Add to action history for undo
    setActionHistory(prev => [{
      type: 'stat',
      timestamp: Date.now(),
      data: { jerseyNumber, eventType, value, isOpponent: true },
      previousState
    }, ...prev.slice(0, 49)])

    // Auto-save after each opponent stat event
    setTimeout(() => saveGameDataOffline({ silent: true }), 1000)
    
    // Enhanced service: Record opponent live stat event
    if (liveSessionKey) {
      // Guard: wait until session is active before sending events
      if (!liveStatService.hasActiveSession || !liveStatService.hasActiveSession()) {
        message.info('Connecting to live session… please try again in a moment')
        return
      }
      try {
        liveStatService.recordLiveEvent(
          eventType,
          value,
          undefined, // No player ID for opponent
          gameState.quarter,
          Math.max(0, Math.min(3599, Math.floor((defaultSettings.quarterDuration * 60) - gameState.currentTime))),
          true, // Is opponent event
          jerseyNumber, // Opponent jersey number
          { playerName: `#${jerseyNumber}`, timestamp: new Date().toISOString(), isOpponent: true, ...(metadata || {}) }
        )
      } catch (error) {
        console.error('Failed to record enhanced opponent live event:', error)
      }
    }
  }, [players, gameState.quarter, gameState.currentTime, events, settings.quarterDuration, liveSessionKey])

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
  const exportGameData = (format: 'csv' | 'json' | 'pdf' | 'maxpreps') => {
    const gameData: any = {
      exportTime: new Date().toISOString()
    }
    if (format === 'maxpreps') {
      const txtContent = generateMaxPrepsTxt({ players })
      const dataBlob = new Blob([txtContent], { type: 'text/plain' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `maxpreps-export-${Date.now()}.txt` // avoid quotes/parentheses
      link.click()
      setShowExportModal(false)
      return
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
      setShowExportModal(false)
    } else if (format === 'csv') {
      // DEV-ONLY: Enhanced CSV export with settings
      const csvContent = generateCSV(gameData)
      const dataBlob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `game-stats-${Date.now()}.csv`
      link.click()
      setShowExportModal(false)
    }

    // Also export complete offline data
    if (format === 'json') {
      const offlineData = liveStatService.exportOfflineData()
      const dataBlob = new Blob([offlineData], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `complete-offline-data-${Date.now()}.json`
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

  // Generate MaxPreps pipe-delimited .txt (basketball)
  const generateMaxPrepsTxt = ({ players }: { players: Player[] }) => {
    // Placeholder 32-char Supplier ID line (replace when provided)
    const supplierId = '00000000000000000000000000000000'

    // Second line: declare fields (Jersey first)
    const fields = [
      'Jersey',
      'MinutesPlayed',
      'Points',
      'TwoPointsMade',
      'TwoPointAttempts',
      'ThreePointsMade',
      'ThreePointAttempts',
      'FreeThrowsMade',
      'FreeThrowAttempts',
      'OffensiveRebounds',
      'DefensiveRebounds',
      'Rebounds',
      'Assists',
      'BlockedShots',
      'Steals',
      'Deflections',
      'Turnovers',
      'Charges',
      'PersonalFouls'
    ]

    const escapeVal = (v: any) => (v === undefined || v === null ? '' : String(v))

    const lines: string[] = []
    lines.push(supplierId)
    lines.push(fields.join('|'))

    players.forEach((p) => {
      // Compute two-point stats from FG - 3PT
      const twoMade = Math.max(0, (p.fgMade || 0) - (p.threeMade || 0))
      const twoAtt = Math.max(0, (p.fgAttempted || 0) - (p.threeAttempted || 0))
      const defReb = p.defensiveRebounds ?? Math.max(0, (p.rebounds || 0) - (p.offensiveRebounds || 0))
      const totalReb = p.rebounds ?? ((p.offensiveRebounds || 0) + (defReb || 0))

      const row = [
        escapeVal(p.number),
        escapeVal(p.minutesPlayed),
        escapeVal(p.points),
        escapeVal(twoMade),
        escapeVal(twoAtt),
        escapeVal(p.threeMade),
        escapeVal(p.threeAttempted),
        escapeVal(p.ftMade),
        escapeVal(p.ftAttempted),
        escapeVal(p.offensiveRebounds),
        escapeVal(defReb),
        escapeVal(totalReb),
        escapeVal(p.assists),
        escapeVal(p.blocks), // BlockedShots
        escapeVal(p.steals),
        escapeVal(p.deflections),
        escapeVal(p.turnovers),
        escapeVal(p.chargesTaken),
        escapeVal(p.fouls)
      ]

      lines.push(row.join('|'))
    })

    return lines.join('\n') + '\n'
  }

  // Calculate second chance points - field goals after offensive rebounds following missed shots
  const calculateSecondChancePoints = (events: StatEvent[]) => {
    let secondChancePoints = 0
    
    // Sort events by timestamp to process chronologically
    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp)
    
    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i]
      
      // Look for missed shots by home team
      if (!event.opponentEvent && (event.eventType === 'fg_missed' || event.eventType === 'three_missed')) {
        // Look for the next rebound (either team)
        let foundRebound = false
        let j = i + 1
        
        while (j < sortedEvents.length && !foundRebound) {
          const nextEvent = sortedEvents[j]
          
          // If opponent gets the rebound, break the chain (no second chance)
          if (nextEvent.opponentEvent && nextEvent.eventType === 'rebound') {
            break // Opponent got possession, no second chance
          }
          
          // If home team gets an offensive rebound, look for the next score
          if (!nextEvent.opponentEvent && nextEvent.eventType === 'rebound') {
            foundRebound = true
            
            // Now look for the next score by home team
            let k = j + 1
            
            while (k < sortedEvents.length) {
              const scoreEvent = sortedEvents[k]
              
              // If opponent does anything, break the chain
              if (scoreEvent.opponentEvent && (
                scoreEvent.eventType === 'fg_made' || 
                scoreEvent.eventType === 'fg_missed' || 
                scoreEvent.eventType === 'three_made' || 
                scoreEvent.eventType === 'three_missed' ||
                scoreEvent.eventType === 'ft_made' ||
                scoreEvent.eventType === 'ft_missed' ||
                scoreEvent.eventType === 'rebound' ||
                scoreEvent.eventType === 'steal' ||
                scoreEvent.eventType === 'block' ||
                scoreEvent.eventType === 'turnover'
              )) {
                break
              }
              
              // If home team scores, count as second chance
              if (!scoreEvent.opponentEvent && 
                  (scoreEvent.eventType === 'fg_made' || scoreEvent.eventType === 'three_made')) {
                
                const points = scoreEvent.eventType === 'three_made' ? 3 : 2
                secondChancePoints += points
                
                console.log('🔍 Second Chance Point:', {
                  missedShot: event.eventType,
                  rebound: nextEvent.eventType,
                  score: scoreEvent.eventType,
                  points,
                  missedShotTime: event.timestamp,
                  reboundTime: nextEvent.timestamp,
                  scoreTime: scoreEvent.timestamp
                })
                break // Found the score, move to next missed shot
              }
              
              k++
            }
            break // Found the rebound, move to next missed shot
          }
          
          j++
        }
      }
    }
    
    return secondChancePoints
  }
  
  // Calculate points off turnovers - field goals immediately following opponent turnovers
  const calculatePointsOffTurnovers = (events: StatEvent[]) => {
    let pointsOffTurnovers = 0
    
    // Sort events by timestamp to process chronologically
    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp)
    
    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i]
      
      // Check if this is a turnover by opponent
      if (event.opponentEvent && event.eventType === 'turnover') {
        // Look for the next scoring event by home team
        let foundScore = false
        let j = i + 1
        
        while (j < sortedEvents.length && !foundScore) {
          const nextEvent = sortedEvents[j]
          
          // If opponent does anything (shot, rebound, steal, block, etc.), break the chain
          if (nextEvent.opponentEvent && (
            nextEvent.eventType === 'fg_made' || 
            nextEvent.eventType === 'fg_missed' || 
            nextEvent.eventType === 'three_made' || 
            nextEvent.eventType === 'three_missed' ||
            nextEvent.eventType === 'ft_made' ||
            nextEvent.eventType === 'ft_missed' ||
            nextEvent.eventType === 'rebound' ||
            nextEvent.eventType === 'steal' ||
            nextEvent.eventType === 'block' ||
            nextEvent.eventType === 'turnover'
          )) {
            break // Opponent interrupted the possession
          }
          
          // If home team scores (field goal only, not free throws), count as points off turnover
          if (!nextEvent.opponentEvent && 
              (nextEvent.eventType === 'fg_made' || nextEvent.eventType === 'three_made')) {
            
            const points = nextEvent.eventType === 'three_made' ? 3 : 2
            pointsOffTurnovers += points
            foundScore = true
            
            console.log('🔍 Points Off Turnover:', {
              eventType: nextEvent.eventType,
              points,
              turnoverTime: event.timestamp,
              shotTime: nextEvent.timestamp
            })
          }
          
          j++
        }
      }
    }
    
    return pointsOffTurnovers
  }

  // DEV-ONLY: Calculate team analytics with advanced stats
  const calculateTeamStats = () => {
    const totalPoints = players.reduce((sum, p) => sum + p.points, 0)
    const totalRebounds = players.reduce((sum, p) => sum + p.rebounds, 0)
    const totalAssists = players.reduce((sum, p) => sum + p.assists, 0)
    const totalTurnovers = players.reduce((sum, p) => sum + p.turnovers, 0)
    const totalFouls = players.reduce((sum, p) => sum + p.fouls, 0)
    const totalFgAttempted = players.reduce((sum, p) => sum + (p.fgAttempted || 0), 0)
    const totalFgMade = players.reduce((sum, p) => sum + (p.fgMade || 0), 0)
    const totalSteals = players.reduce((sum, p) => sum + p.steals, 0)
    const totalBlocks = players.reduce((sum, p) => sum + p.blocks, 0)
    
    // Calculate detailed shooting stats
    const totalTwoPointMade = players.reduce((sum, p) => sum + (p.twoPointMade || 0), 0)
    const totalTwoPointAttempted = players.reduce((sum, p) => sum + (p.twoPointAttempted || 0), 0)
    const totalThreePointMade = players.reduce((sum, p) => sum + (p.threeMade || 0), 0)
    const totalThreePointAttempted = players.reduce((sum, p) => sum + (p.threeAttempted || 0), 0)
    
    // Fallback calculation: if two-point stats are 0 but we have field goals, calculate from difference
    const calculatedTwoPointMade = totalTwoPointMade || (totalFgMade - totalThreePointMade)
    const calculatedTwoPointAttempted = totalTwoPointAttempted || (totalFgAttempted - totalThreePointAttempted)
    const totalFtMade = players.reduce((sum, p) => sum + (p.ftMade || 0), 0)
    const totalFtAttempted = players.reduce((sum, p) => sum + (p.ftAttempted || 0), 0)
    
    // Calculate bench points from analytics totals
    const benchPoints = Object.values(analyticsTotals).reduce((sum, quarter) => sum + quarter.home.benchPoints, 0)
    
    console.log('🔍 Bench Points Calculation:', {
      benchPoints,
      analyticsTotals: Object.values(analyticsTotals).map(q => q.home.benchPoints)
    })
    
    // Calculate points in paint - only count shots explicitly marked as pip: true
    const pointsInPaint = events
      .filter(event => event.eventType === 'fg_made' && event.metadata?.pip === true)
      .reduce((sum, event) => sum + 2, 0)
    
    console.log('🔍 Points in Paint Calculation:', {
      totalFgMade,
      totalFgAttempted,
      totalThreePointMade,
      totalThreePointAttempted,
      totalTwoPointMade,
      totalTwoPointAttempted,
      calculatedTwoPointMade,
      calculatedTwoPointAttempted,
      pointsInPaint,
      pipEvents: events.filter(event => event.eventType === 'fg_made' && event.metadata?.pip === true).length,
      breakdown: {
        fgMade: totalFgMade,
        fgAttempted: totalFgAttempted,
        threePointMade: totalThreePointMade,
        threePointAttempted: totalThreePointAttempted,
        twoPointMade: calculatedTwoPointMade,
        twoPointAttempted: calculatedTwoPointAttempted
      }
    })
    
    // Calculate second chance points - field goals after rebounds with no interruption
    const secondChancePoints = calculateSecondChancePoints(events)
    
    // Calculate points off turnovers - field goals after turnovers
    const pointsOffTurnovers = calculatePointsOffTurnovers(events)
    
    const gameTimeElapsed = Date.now() - gameState.gameStartTime
    const pace = Math.round((totalPoints + gameState.opponentScore) / (gameTimeElapsed / 60) * 40)
    
    console.log('🔍 calculateTeamStats - Detailed stats:', {
      totalFgMade,
      totalFgAttempted,
      totalTwoPointMade,
      totalTwoPointAttempted,
      totalThreePointMade,
      totalThreePointAttempted,
      totalFtMade,
      totalFtAttempted,
      calculatedTwoPointMade,
      calculatedTwoPointAttempted,
      secondChancePoints,
      pointsOffTurnovers,
      players: players.map(p => ({
        name: p.name,
        fgMade: p.fgMade,
        fgAttempted: p.fgAttempted,
        twoPointMade: p.twoPointMade,
        twoPointAttempted: p.twoPointAttempted,
        threePointMade: p.threeMade,
        threePointAttempted: p.threeAttempted
      }))
    })
    
    return {
      // Basic stats
      totalPoints,
      totalRebounds,
      totalAssists,
      totalTurnovers,
      totalFouls,
      totalSteals,
      totalBlocks,
      
      // Field goal stats
      fgMade: totalFgMade,
      fgAttempted: totalFgAttempted,
      fgPercentage: totalFgAttempted > 0 ? Math.round((totalFgMade / totalFgAttempted) * 100) : 0,
      
      // Two-point stats
      twoPointMade: calculatedTwoPointMade,
      twoPointAttempted: calculatedTwoPointAttempted,
      twoPointPercentage: calculatedTwoPointAttempted > 0 ? Math.round((calculatedTwoPointMade / calculatedTwoPointAttempted) * 100) : 0,
      
      // Three-point stats
      threePointMade: totalThreePointMade,
      threePointAttempted: totalThreePointAttempted,
      threePointPercentage: totalThreePointAttempted > 0 ? Math.round((totalThreePointMade / totalThreePointAttempted) * 100) : 0,
      
      // Free throw stats
      ftMade: totalFtMade,
      ftAttempted: totalFtAttempted,
      ftPercentage: totalFtAttempted > 0 ? Math.round((totalFtMade / totalFtAttempted) * 100) : 0,
      
      // Advanced stats
      assistToTurnoverRatio: totalTurnovers > 0 ? (totalAssists / totalTurnovers).toFixed(2) : '0.00',
      pace,
      projectedFinal: Math.round(pace * 0.4),
      
      // Additional analytics
      benchPoints: benchPoints,
      pointsInPaint: pointsInPaint,
      secondChancePoints: secondChancePoints,
      pointsOffTurnovers: pointsOffTurnovers
    }
  }

  // DEV-ONLY: Calculate opponent statistics from event feed
  const calculateOpponentStats = () => {
    const opp = events.filter(e => e.opponentEvent === true)
    console.log('🔍 calculateOpponentStats - Total events:', events.length)
    console.log('🔍 calculateOpponentStats - Opponent events:', opp.length)
    console.log('🔍 calculateOpponentStats - Opponent events details:', opp)
    
    const points = opp.reduce((sum, e) => {
      if (e.eventType === 'three_made') return sum + 3
      if (e.eventType === 'ft_made') return sum + 1
      if (e.eventType === 'fg_made' || e.eventType === 'points') return sum + (e.value || 2)
      return sum
    }, 0)
    const rebounds = opp.filter(e => e.eventType.includes('rebound')).length
    const assists = opp.filter(e => e.eventType === 'assist').length
    const steals = opp.filter(e => e.eventType === 'steal').length
    const blocks = opp.filter(e => e.eventType === 'block').length
    const turnovers = opp.filter(e => e.eventType === 'turnover').length
    const fouls = opp.filter(e => e.eventType === 'foul').length
    const fgMade = opp.filter(e => e.eventType === 'fg_made').length + opp.filter(e => e.eventType === 'three_made').length
    const fgMissed = opp.filter(e => e.eventType === 'fg_missed').length + opp.filter(e => e.eventType === 'three_missed').length
    const twoPointMade = opp.filter(e => e.eventType === 'fg_made').length
    const twoPointMissed = opp.filter(e => e.eventType === 'fg_missed').length
    const threeMade = opp.filter(e => e.eventType === 'three_made').length
    const threeMissed = opp.filter(e => e.eventType === 'three_missed').length
    const ftMade = opp.filter(e => e.eventType === 'ft_made').length
    const ftMissed = opp.filter(e => e.eventType === 'ft_missed').length

    const fgAttempted = fgMade + fgMissed
    const twoPointAttempted = twoPointMade + twoPointMissed
    const threeAttempted = threeMade + threeMissed
    const ftAttempted = ftMade + ftMissed
    // Calculate points in paint - only count shots explicitly marked as pip: true
    const pointsInPaint = events
      .filter(event => event.opponentEvent && event.eventType === 'fg_made' && event.metadata?.pip === true)
      .reduce((sum, event) => sum + 2, 0)
    const secondChancePoints = rebounds * 2 // Simplified calculation
    const pointsOffTurnovers = steals * 2 // Simplified calculation

    const result = {
      // Basic stats
      totalPoints: points,
      totalRebounds: rebounds,
      totalAssists: assists,
      totalTurnovers: turnovers,
      totalFouls: fouls,
      totalSteals: steals,
      totalBlocks: blocks,
      
      // Field goal stats
      fgMade: fgMade,
      fgAttempted: fgAttempted,
      fgPercentage: fgAttempted > 0 ? Math.round((fgMade / fgAttempted) * 100) : 0,
      
      // Two-point stats
      twoPointMade: twoPointMade,
      twoPointAttempted: twoPointAttempted,
      twoPointPercentage: twoPointAttempted > 0 ? Math.round((twoPointMade / twoPointAttempted) * 100) : 0,
      
      // Three-point stats
      threePointMade: threeMade,
      threePointAttempted: threeAttempted,
      threePointPercentage: threeAttempted > 0 ? Math.round((threeMade / threeAttempted) * 100) : 0,
      
      // Free throw stats
      ftMade: ftMade,
      ftAttempted: ftAttempted,
      ftPercentage: ftAttempted > 0 ? Math.round((ftMade / ftAttempted) * 100) : 0,
      
      // Additional analytics
      pointsInPaint: pointsInPaint,
      secondChancePoints: secondChancePoints,
      pointsOffTurnovers: pointsOffTurnovers,
      // Calculate bench points from analytics totals
      benchPoints: Object.values(analyticsTotals).reduce((sum, quarter) => sum + quarter.away.benchPoints, 0)
    }
    
    console.log('🔍 calculateOpponentStats - Final opponent stats:', result)
    console.log('🔍 calculateOpponentStats - Points breakdown:', {
      points,
      fgMade,
      threeMade,
      ftMade,
      scoringEvents: opp.filter(e => ['fg_made', 'three_made', 'ft_made'].includes(e.eventType))
    })
    return result
  }

  // DEV-ONLY: Enhanced lineup management functions
  const createLineup = () => {
    if (selectedLineupPlayers.length !== 5) {
      return // Need exactly 5 players
    }

    const newLineup: Lineup = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      players: selectedLineupPlayers,
      startTime: Date.now(),
      plusMinus: 0,
      name: lineupName || undefined
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
    
    // Set initial starter IDs for bench points calculation
    starterIdsRef.current = selectedLineupPlayers
    console.log('🏀 Initial lineup set - Starter IDs:', selectedLineupPlayers)
    
    // Set initial opponent starters if they haven't been set yet
    if (opponentStarterJerseysRef.current.length === 0 && opponentOnCourt.some(jersey => jersey)) {
      opponentStarterJerseysRef.current = [...opponentOnCourt]
      console.log('🏀 Initial opponent starters set:', opponentStarterJerseysRef.current)
    }
  }
  
  // Set initial lineup when game starts (if no lineup exists)
  const setInitialLineup = () => {
    if (players.length >= 5 && starterIdsRef.current.length === 0) {
      // Auto-select first 5 players as starters
      const firstFivePlayers = players.slice(0, 5).map(p => p.id)
      starterIdsRef.current = firstFivePlayers
      console.log('🏀 Auto-set initial lineup - Starter IDs:', firstFivePlayers)
    }
  }

  const updateLineup = () => {
    if (selectedLineupPlayers.length !== 5 || !currentLineup) {
      return // Need exactly 5 players and existing lineup
    }

    // Update the current lineup with new players
    const updatedLineup: Lineup = {
      ...currentLineup,
      players: selectedLineupPlayers,
      name: lineupName || currentLineup.name
    }

    // Update lineups array
    setLineups(prev => prev.map(l => 
      l.id === currentLineup.id ? updatedLineup : l
    ))
    
    // Update current lineup
    setCurrentLineup(updatedLineup)
    
    // Reset form
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

    const endTime = Date.now()
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

  // Bulk substitution function
  const applyBulkSubstitution = () => {
    if (selectedBulkSubPlayers.length !== 5) {
      message.error('Please select exactly 5 players for the lineup')
      return
    }

    // Check if game is started
    if (!gameState.isPlaying) {
      message.info('Please start the game first before making substitutions')
      setShowBulkSubModal(false)
      setSelectedBulkSubPlayers([])
      return
    }

    // End current lineup if it exists
    if (currentLineup) {
      const endTime = Date.now()
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

    // Create new lineup with selected players
    const newLineup: Lineup = {
      id: `bulk-sub-${Date.now()}`,
      players: selectedBulkSubPlayers,
      startTime: Date.now(),
      plusMinus: 0,
      name: `Bulk Sub ${new Date().toLocaleTimeString()}`
    }

    setCurrentLineup(newLineup)
    setLineups(prev => [...prev, newLineup])

    // Update player court status
    setPlayers(prev => prev.map(p => ({
      ...p,
      isOnCourt: selectedBulkSubPlayers.includes(p.id)
    })))

    // Clear selection and close modal
    setSelectedBulkSubPlayers([])
    setShowBulkSubModal(false)

    message.success('Bulk substitution applied successfully!')
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
      const endTime = Date.now()
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
      startTime: Date.now(),
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
      gameTime: Date.now(),
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
      gameTime: Date.now()
    }

    const substitutionOutEvent: StatEvent = {
      id: `sub_out_${Date.now()}`,
      timestamp: Date.now(),
      playerId: playerOut.id,
      playerName: playerOut.name,
      eventType: 'substitution_out',
      quarter: gameState.quarter,
      gameTime: Date.now()
    }

    const lineupChangeEvent: StatEvent = {
      id: `lineup_${Date.now()}`,
      timestamp: Date.now(),
      playerId: 0, // Team event
      playerName: 'TEAM',
      eventType: 'lineup_change',
      quarter: gameState.quarter,
      gameTime: Date.now()
    }

    setEvents(prev => [substitutionEvent, substitutionOutEvent, lineupChangeEvent, ...prev])



    // Add to action history for undo
    setActionHistory(prev => [{
      type: 'substitution',
      timestamp: Date.now(),
      data: { playerIn, playerOut, newLineup },
      previousState
    }, ...prev.slice(0, 49)]) // Keep last 50 actions

    // Auto-save after substitution
    setTimeout(() => saveGameDataOffline({ silent: true }), 1000)
  }

  // DEV-ONLY: Quick substitution handler with undo support
  const handleQuickSubstitution = (playerIn: Player, playerOut: Player) => {
    // Save current state for undo
    const previousState = {
      players: players,
      gameState: gameState,
      events: events,
      lineups: lineups,
      opponentOnCourt: opponentOnCourt,
      substitutionHistory: substitutionHistory,
      quickSubHistory: quickSubHistory,
      quarterStartTime: quarterStartTime,
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
    
    const duration = lineup.endTime ? lineup.endTime - lineup.startTime : Date.now() - lineup.startTime
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

  // Function to collapse the sidebar
  const collapseSidebar = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', 'true')
      setSidebarCollapsed(true)
      // Dispatch custom event to notify layout component
      window.dispatchEvent(new CustomEvent('sidebar-toggle'))
    }
  }

  // Listen for sidebar toggle events to update state
  useEffect(() => {
    const handleSidebarToggle = () => {
      // Check localStorage to determine current sidebar state
      const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true'
      setSidebarCollapsed(isCollapsed)
    }
    
    // Listen for sidebar toggle events from the layout
    window.addEventListener('sidebar-toggle', handleSidebarToggle)
    
    // Initialize sidebar state on mount
    handleSidebarToggle()
    
    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle)
    }
  }, [])

  const toggleGame = () => {
    // Require exactly 5 players on court to start; no starters prerequisite here
    if (!gameState.isPlaying) {
      const onCourt = players.filter(p => p.isOnCourt)
      if (onCourt.length !== 5) {
        message.warning('You need exactly 5 players on the court to start the game')
        return
      }
    }
    
    const newIsPlaying = !gameState.isPlaying
    
    // Save current state for undo
    const previousState = {
      players: players,
      gameState: gameState,
      events: events,
      lineups: lineups,
      opponentOnCourt: opponentOnCourt,
      substitutionHistory: substitutionHistory,
      quickSubHistory: quickSubHistory,
      quarterStartTime: quarterStartTime
    }
    
    setGameState(prev => ({ ...prev, isPlaying: newIsPlaying }))
    
    if (newIsPlaying) {
      // Starting the quarter - log timestamp
      const startTime = Date.now()
      setQuarterStartTime(startTime)
      
      // Mark that the game has started (for the first time)
      if (!hasGameStarted) {
        setHasGameStarted(true)
        setGameState(prev => ({ ...prev, gameStartTime: startTime }))
      }
      
      console.log(`Quarter ${gameState.quarter} started at:`, new Date(startTime).toLocaleTimeString())

      // Capture starters at the first Q1 start only
      if (gameState.quarter === 1 && starterIdsRef.current.length === 0) {
        setInitialLineup()
      } else {
        starterIdsRef.current = players.filter(p => p.isOnCourt).map(p => p.id)
      }
      
      // Add start event to play by play
      const startEvent: StatEvent = {
        id: `start-${Date.now()}`,
        timestamp: startTime,
        playerId: 0,
        playerName: 'GAME',
        eventType: `Q${gameState.quarter} STARTED`,
        quarter: gameState.quarter,
        gameTime: gameState.currentTime,
        opponentEvent: false
      }
      setEvents(prev => [startEvent, ...prev])
      
      // Add to action history for undo
      setActionHistory(prev => [{
        type: 'quarter',
        timestamp: Date.now(),
        data: { action: 'start', quarter: gameState.quarter, startTime },
        previousState
      }, ...prev.slice(0, 49)]) // Keep last 50 actions
      
      // Enhanced service: Update game state
      if (liveSessionKey) {
        try {
          liveStatService.updateGameState({
            quarter: gameState.quarter,
            currentTime: gameState.currentTime,
            homeScore: gameState.homeScore,
            awayScore: gameState.opponentScore,
            opponentScore: gameState.opponentScore,
            timeoutHome: gameState.timeoutHome,
            timeoutAway: gameState.timeoutAway,
            isPlaying: true
          })
        } catch (error) {
          console.error('Failed to update enhanced game state on start:', error)
        }
      }
    } else {
      // Stopping the quarter - log timestamp and enable report if applicable
      const stopTime = Date.now()
      const duration = quarterStartTime ? stopTime - quarterStartTime : 0
      console.log(`Quarter ${gameState.quarter} stopped at:`, new Date(stopTime).toLocaleTimeString())
      console.log(`Quarter duration:`, Math.round(duration / 1000), 'seconds')
      
      // Add stop event to play by play
      const stopEvent: StatEvent = {
        id: `stop-${Date.now()}`,
        timestamp: stopTime,
        playerId: 0,
        playerName: 'GAME',
        eventType: `Q${gameState.quarter} STOPPED`,
        quarter: gameState.quarter,
        gameTime: gameState.currentTime,
        opponentEvent: false
      }
      setEvents(prev => [stopEvent, ...prev])
      
      // Add to action history for undo
      setActionHistory(prev => [{
        type: 'quarter',
        timestamp: Date.now(),
        data: { action: 'stop', quarter: gameState.quarter, stopTime, duration },
        previousState
      }, ...prev.slice(0, 49)]) // Keep last 50 actions
      
      // Enhanced service: Update game state
      if (liveSessionKey) {
        try {
          liveStatService.updateGameState({
            quarter: gameState.quarter,
            currentTime: gameState.currentTime,
            homeScore: gameState.homeScore,
            awayScore: gameState.opponentScore,
            opponentScore: gameState.opponentScore,
            timeoutHome: gameState.timeoutHome,
            timeoutAway: gameState.timeoutAway,
            isPlaying: false
          })
          // Push analytics snapshot at quarter stop
          refinedLiveStatTrackerService.updateAnalytics({ byQuarter: analyticsTotals })
        } catch (error) {
          console.error('Failed to update enhanced game state on stop:', error)
        }
      }
      
      // Enable report button if it's visible and this is Q2
      if (showReportButton && gameState.quarter === 2) {
        setIsReportEnabled(true)
      }

      // Reset possession windows on stop
      scpWindowHomeRef.current = false
      scpWindowAwayRef.current = false
      ptoWindowHomeRef.current = false
      ptoWindowAwayRef.current = false
      lastPossessionRef.current = null
    }
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
      timeoutAway: settings.timeoutCount,
      gameStartTime: Date.now(),
      teamFoulsHome: 0,
      teamFoulsAway: 0
    })
    setPlayers(prev => prev.map(p => ({ 
      ...p, 
      minutesPlayed: 0, points: 0, rebounds: 0, offensiveRebounds: 0, defensiveRebounds: 0, 
      assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, fgAttempted: 0, fgMade: 0, 
      threeAttempted: 0, threeMade: 0, ftAttempted: 0, ftMade: 0, plusMinus: 0, 
      chargesTaken: 0, deflections: 0, isOnCourt: false, isStarter: false, isMainRoster: false 
    })))
    setEvents([])
    setLineups([])
    setOpponentOnCourt(['', '', '', '', ''])
    setSelectedOpponentSlot(null)
    setOpponentFouls({})
    setHasGameStarted(false)
  }
  const nextQuarter = () => {
    // Guards: don't allow advancing if game not started or not enough players on court
    if (!hasGameStarted) {
      message.warning('Start the game before advancing to next quarter')
      return
    }
    const onCourt = players.filter(p => p.isOnCourt)
    if (onCourt.length !== 5) {
      message.warning('You need exactly 5 players on the court to advance to next quarter')
      return
    }

    // Save current state for undo
    const previousState = {
      players: players,
      gameState: gameState,
      events: events,
      lineups: lineups,
      opponentOnCourt: opponentOnCourt,
      substitutionHistory: substitutionHistory,
      quickSubHistory: quickSubHistory,
      quarterStartTime: quarterStartTime,
      showReportButton: showReportButton,
      isReportEnabled: isReportEnabled
    }

    // If regulation completed and not in OT: only suggest OT; do not auto-end
    if (gameState.quarter >= settings.totalQuarters && !gameState.isOvertime && gameState.homeScore !== gameState.opponentScore) {
      // Not tied: leave end-of-game to the End Game button
      message.info('Regulation finished. Use End Game to finalize or Overtime if tied.')
      return
    }

    setGameState(prev => {
      const next = prev.quarter + 1
      const isOT = next > (prev.regulationQuarters || settings.totalQuarters)
      const otNum = isOT ? (next - (prev.regulationQuarters || settings.totalQuarters)) : 0
      return {
        ...prev,
        quarter: isOT ? next : Math.min(next, settings.totalQuarters),
        isOvertime: isOT,
        overtimeNumber: otNum
      }
    })
    
    // Enhanced service: Update game state
    if (liveSessionKey) {
      try {
        liveStatService.updateGameState({
          quarter: gameState.quarter + 1,
          currentTime: gameState.currentTime,
          homeScore: gameState.homeScore,
          awayScore: gameState.opponentScore,
          opponentScore: gameState.opponentScore,
          timeoutHome: gameState.timeoutHome,
          timeoutAway: gameState.timeoutAway,
          isPlaying: true
        })
      } catch (error) {
        console.error('Failed to update enhanced game state:', error)
      }
    }
    
    // DEV-ONLY: Auto-pause on quarter end if enabled
    if (settings.autoPauseOnQuarterEnd) {
      setGameState(prev => ({ ...prev, isPlaying: false }))
    }

    // Add to action history
    setActionHistory(prev => [{
      type: 'quarter',
      timestamp: Date.now(),
      data: { quarter: gameState.quarter + 1, action: 'next_quarter' },
      previousState
    }, ...prev.slice(0, 49)]) // Keep last 50 actions
    
    // Add next quarter event to play by play
    const nextQtrEvent: StatEvent = {
      id: `nextqtr-${Date.now()}`,
      timestamp: Date.now(),
      playerId: 0,
      playerName: 'GAME',
      eventType: `ADVANCED TO Q${gameState.quarter + 1}`,
      quarter: gameState.quarter,
      gameTime: gameState.currentTime,
      opponentEvent: false
    }
    setEvents(prev => [nextQtrEvent, ...prev])
    
    // Show report button only when advancing to Q2
    if (gameState.quarter === 1) {
      setShowReportButton(true)
      setIsReportEnabled(false) // Disabled until stop is clicked
    }

    // Record real-time start for new quarter
    setQuarterStartTime(Date.now())
  }

  const handleReportClick = () => {
    if (isReportEnabled) {
      // Add halftime report event to play by play
      const halftimeEvent: StatEvent = {
        id: `halftime-${Date.now()}`,
        timestamp: Date.now(),
        playerId: 0,
        playerName: 'GAME',
        eventType: 'HALFTIME REPORT',
        quarter: gameState.quarter,
        gameTime: gameState.currentTime,
        opponentEvent: false
      }
      setEvents(prev => [halftimeEvent, ...prev])
      
      setShowHalftimeReport(true)
    }
  }

  // Start Overtime period
  const startOvertime = () => {
    const regulation = gameState.regulationQuarters || settings.totalQuarters
    const nextQuarterNumber = Math.max(gameState.quarter + 1, regulation + 1)
    const nextOt = nextQuarterNumber - regulation
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      quarter: nextQuarterNumber,
      isOvertime: true,
      overtimeNumber: nextOt
    }))

    const startEvent: StatEvent = {
      id: `otstart-${Date.now()}`,
      timestamp: Date.now(),
      playerId: 0,
      playerName: 'GAME',
      eventType: `OT${nextOt} STARTED`,
      quarter: nextQuarterNumber,
      gameTime: 0,
      opponentEvent: false
    }
    setEvents(prev => [startEvent, ...prev])

    if (liveSessionKey) {
      try {
        liveStatService.updateGameState({
          quarter: nextQuarterNumber,
          currentTime: gameState.currentTime,
          homeScore: gameState.homeScore,
          awayScore: gameState.opponentScore,
          opponentScore: gameState.opponentScore,
          timeoutHome: gameState.timeoutHome,
          timeoutAway: gameState.timeoutAway,
          isPlaying: false
        })
      } catch (e) {}
    }
  }

  const handlePipConfirm = (isPip: boolean) => {
    if (pendingPipEvent) {
      const { eventType, playerId, isOpponent, opponentSlot } = pendingPipEvent
      
      // After points in paint, ask about assist
      setPendingAssistEvent({ eventType, playerId, isOpponent, opponentSlot, pip: isPip })
      setShowAssistModal(true)
    }
    
    setShowPipModal(false)
    setPendingPipEvent(null)
  }

  const handleAssistConfirm = (assistPlayerId: number | string | null) => {
    console.log('🎯 Assist modal confirmed:', assistPlayerId, 'Pending event:', pendingAssistEvent)
    
    if (pendingAssistEvent) {
      const { eventType, playerId, isOpponent, opponentSlot, pip } = pendingAssistEvent
      
      if (isOpponent) {
        console.log('📊 Recording opponent field goal with assist')
        // For opponent players, record the field goal made with assist metadata
        handleOpponentStatEvent(opponentOnCourt[opponentSlot!], eventType, eventType === 'three_made' ? 3 : 2, { pip, assist: assistPlayerId })
        
        // If there's an assist, record it for the assisting opponent player
        if (assistPlayerId && typeof assistPlayerId === 'string' && assistPlayerId.startsWith('opponent-')) {
          const assistSlotIndex = parseInt(assistPlayerId.split('-')[1])
          handleOpponentStatEvent(opponentOnCourt[assistSlotIndex], 'assist', 1)
        }
      } else if (playerId) {
        console.log('📊 Recording team field goal with assist for player:', playerId)
        // First, record the field goal made with assist metadata
        handleStatEvent(playerId, eventType, eventType === 'three_made' ? 3 : 2, false, { pip, assist: assistPlayerId })
        
        // Then, if there's an assist, create a separate assist event for the assist player
        if (assistPlayerId && typeof assistPlayerId === 'number') {
          console.log('📊 Recording assist for player:', assistPlayerId)
          handleStatEvent(assistPlayerId, 'assist', 1, false)
        }
      }
    }
    
    setShowAssistModal(false)
    setPendingAssistEvent(null)
  }

  const handleReboundConfirm = (reboundPlayerId: number | null, isOpponent: boolean = false) => {
    if (pendingReboundEvent) {
      const { eventType, playerId, isOpponent: originalIsOpponent, opponentSlot } = pendingReboundEvent
      
      console.log('🔍 handleReboundConfirm - Recording missed shot:', { eventType, playerId, originalIsOpponent, opponentSlot })
      
      // First record the missed shot
      if (originalIsOpponent) {
        handleOpponentStatEvent(opponentOnCourt[opponentSlot!], eventType)
      } else if (playerId) {
        handleStatEvent(playerId, eventType)
      }
      
      // Then record the rebound if someone got it
      if (reboundPlayerId) {
        if (isOpponent) {
          // Find the opponent player by slot
          const opponentPlayer = opponentOnCourt[reboundPlayerId]
          if (opponentPlayer) {
            handleOpponentStatEvent(opponentPlayer, 'rebound')
          }
        } else {
          handleStatEvent(reboundPlayerId, 'rebound')
        }
      }

      // Update possession windows
      if (reboundPlayerId) {
        if (isOpponent) {
          lastPossessionRef.current = 'away'
          if (originalIsOpponent) {
            scpWindowAwayRef.current = true
          } else {
            scpWindowHomeRef.current = false
            ptoWindowHomeRef.current = false
          }
        } else {
          lastPossessionRef.current = 'home'
          if (!originalIsOpponent) {
            scpWindowHomeRef.current = true
          } else {
            scpWindowAwayRef.current = false
            ptoWindowAwayRef.current = false
          }
        }
      }
    }
    
    setShowReboundModal(false)
    setPendingReboundEvent(null)
  }

  const handleStealConfirm = (turnoverPlayerId: number | null, isOpponent: boolean = false) => {
    if (pendingStealEvent) {
      const { playerId, isOpponent: originalIsOpponent, opponentSlot } = pendingStealEvent
      
      // First record the steal for the stealing player
      if (originalIsOpponent) {
        handleOpponentStatEvent(opponentOnCourt[opponentSlot!], 'steal')
      } else if (playerId) {
        handleStatEvent(playerId, 'steal')
      }
      
      // Then record the turnover for the player who turned it over
      if (turnoverPlayerId) {
        if (isOpponent) {
          // Find the opponent player by slot
          const opponentPlayer = opponentOnCourt[turnoverPlayerId]
          if (opponentPlayer) {
            handleOpponentStatEvent(opponentPlayer, 'turnover')
          }
        } else {
          handleStatEvent(turnoverPlayerId, 'turnover')
        }
      }
    }
    
    setShowStealModal(false)
    setPendingStealEvent(null)
  }

  const handleTurnoverConfirm = (stealPlayerId: number | null, isOpponent: boolean = false) => {
    if (pendingTurnoverEvent) {
      const { playerId, isOpponent: originalIsOpponent, opponentSlot } = pendingTurnoverEvent
      
      // First record the turnover for the player who turned it over
      if (originalIsOpponent) {
        handleOpponentStatEvent(opponentOnCourt[opponentSlot!], 'turnover')
      } else if (playerId) {
        handleStatEvent(playerId, 'turnover')
      }
      
      // Then record the steal for the player who stole it (if any)
      if (stealPlayerId) {
        if (isOpponent) {
          // Find the opponent player by slot
          const opponentPlayer = opponentOnCourt[stealPlayerId]
          if (opponentPlayer) {
            handleOpponentStatEvent(opponentPlayer, 'steal')
          }
        } else {
          handleStatEvent(stealPlayerId, 'steal')
        }
      }

      // Update PTO windows and possession
      if (originalIsOpponent) {
        // Opponent committed turnover -> our possession
        lastPossessionRef.current = 'home'
        ptoWindowHomeRef.current = true
        scpWindowAwayRef.current = false
      } else {
        // We committed turnover -> opponent possession
        lastPossessionRef.current = 'away'
        ptoWindowAwayRef.current = true
        scpWindowHomeRef.current = false
      }
    }
    
    setShowTurnoverModal(false)
    setPendingTurnoverEvent(null)
  }

  const handleFoulConfirm = (isOffensive: boolean) => {
    if (pendingFoulEvent) {
      const { playerId, isOpponent, opponentSlot } = pendingFoulEvent
      
      // Record the individual player foul
      if (isOpponent) {
        handleOpponentStatEvent(opponentOnCourt[opponentSlot!], 'foul', 1, { isOffensive })
      } else if (playerId) {
        handleStatEvent(playerId, 'foul', 1, false, { isOffensive })
      }
      
      // Only defensive fouls count towards team fouls
      if (!isOffensive) {
        setGameState(prev => ({
          ...prev,
          teamFoulsHome: isOpponent ? prev.teamFoulsHome : prev.teamFoulsHome + 1,
          teamFoulsAway: isOpponent ? prev.teamFoulsAway + 1 : prev.teamFoulsAway
        }))
      }
    }
    
    setShowFoulModal(false)
    setPendingFoulEvent(null)
  }

  const handleBlockConfirm = (blockedPlayerId: number | string | null) => {
    if (pendingBlockEvent) {
      const { playerId, isOpponent, opponentSlot } = pendingBlockEvent
      
      // Record the block for the blocking player
      if (isOpponent) {
        handleOpponentStatEvent(opponentOnCourt[opponentSlot!], 'block', 1)
      } else if (playerId) {
        handleStatEvent(playerId, 'block', 1, false)
      }
      
      // Record the missed shot for the blocked player
      if (blockedPlayerId) {
        if (typeof blockedPlayerId === 'string' && blockedPlayerId.startsWith('opponent-')) {
          // Blocked an opponent player
          const blockedSlotIndex = parseInt(blockedPlayerId.split('-')[1])
          handleOpponentStatEvent(opponentOnCourt[blockedSlotIndex], 'fg_missed', 1)
        } else if (typeof blockedPlayerId === 'number') {
          // Blocked a home team player
          handleStatEvent(blockedPlayerId, 'fg_missed', 1, false)
        }
      }
    }
    
    setShowBlockModal(false)
    setPendingBlockEvent(null)
  }

  const handleHalftimeResume = () => {
    setShowHalftimeReport(false)
    // Advance to Q3 and reset report button state
    setGameState(prev => ({
      ...prev,
      quarter: 3,
      teamFoulsHome: 0,    // Team fouls reset at halftime
      teamFoulsAway: 0     // Team fouls reset at halftime
      // Note: Individual player fouls do NOT reset at halftime
    }))
    setShowReportButton(false)
    setIsReportEnabled(false)
    setQuarterStartTime(null)
  }

  // Calculate all analytics data from live events and player stats
  const teamStats = calculateTeamStats()
  const opponentStats = calculateOpponentStats()
  
  // Calculate live game analytics
  const liveGameAnalytics = useMemo(() => {
    const totalEvents = events.length
    const teamEvents = events.filter(e => !e.opponentEvent).length
    const opponentEvents = events.filter(e => e.opponentEvent).length
    
    // Calculate pace (events per minute)
    const gameTimeElapsed = Date.now() - gameState.gameStartTime
    const gameTimeMinutes = gameTimeElapsed / (1000 * 60)
    const pace = gameTimeMinutes > 0 ? Math.round((totalEvents / gameTimeMinutes) * 40) : 0
    
    // Calculate lead changes (simplified - based on score differences)
    const scoreDiff = Math.abs(gameState.homeScore - gameState.opponentScore)
    const leadChanges = scoreDiff > 0 ? Math.floor(scoreDiff / 5) : 0
    
    // Calculate shooting efficiency
    const teamFgPct = teamStats.fgAttempted > 0 ? Math.round((teamStats.fgMade / teamStats.fgAttempted) * 100) : 0
    const opponentFgPct = opponentStats.fgAttempted > 0 ? Math.round((opponentStats.fgMade / opponentStats.fgAttempted) * 100) : 0
    
    return {
      totalEvents,
      teamEvents,
      opponentEvents,
      pace,
      leadChanges,
      teamFgPct,
      opponentFgPct,
      gameTimeMinutes: Math.round(gameTimeMinutes * 10) / 10
    }
  }, [events, gameState, teamStats, opponentStats])
  
  // Calculate player performance metrics
  const playerAnalytics = useMemo(() => {
    return players.map(player => {
      const efficiency = player.points + player.rebounds + player.assists + player.steals + player.blocks - 
                       ((player.fgAttempted || 0) - (player.fgMade || 0)) - 
                       ((player.ftAttempted || 0) - (player.ftMade || 0)) - 
                       (player.turnovers || 0)
      
      const trueShooting = (player.fgAttempted || 0) + (player.ftAttempted || 0) > 0 ? 
        Math.round((player.points / (2 * ((player.fgAttempted || 0) + 0.44 * (player.ftAttempted || 0)))) * 100) : 0
      
      const effectiveFg = (player.fgAttempted || 0) > 0 ? 
        Math.round(((player.fgMade || 0) + 0.5 * (player.threeMade || 0)) / (player.fgAttempted || 0) * 100) : 0
      
      return {
        ...player,
        efficiency,
        trueShooting,
        effectiveFg
      }
    })
  }, [players])

  // Calculate opponent player analytics from events
  const opponentPlayerAnalytics = useMemo(() => {
    // Group opponent events by jersey number
    const opponentEvents = events.filter(e => e.opponentEvent === true)
    const opponentStats: Record<string, any> = {}
    
    console.log('🔍 Opponent Player Analytics - Processing events:', {
      totalOpponentEvents: opponentEvents.length,
      events: opponentEvents.map(e => ({ type: e.eventType, jersey: e.opponentJersey, value: e.value }))
    })
    
    opponentEvents.forEach(event => {
      const jersey = event.opponentJersey || 'Unknown'
      if (!opponentStats[jersey]) {
        opponentStats[jersey] = {
          id: jersey,
          number: jersey,
          points: 0,
          rebounds: 0,
          assists: 0,
          steals: 0,
          blocks: 0,
          turnovers: 0,
          fgMade: 0,
          fgAttempted: 0,
          twoPointMade: 0,
          twoPointAttempted: 0,
          threePointMade: 0,
          threePointAttempted: 0,
          ftMade: 0,
          ftAttempted: 0,
          efficiency: 0,
          trueShooting: 0,
          effectiveFg: 0
        }
      }
      
      // Update stats based on event type
      switch (event.eventType) {
        case 'fg_made':
          opponentStats[jersey].points += event.value || 2
          opponentStats[jersey].fgMade += 1
          opponentStats[jersey].fgAttempted += 1
          if (event.value === 3) {
            opponentStats[jersey].threePointMade += 1
            opponentStats[jersey].threePointAttempted += 1
          } else {
            opponentStats[jersey].twoPointMade += 1
            opponentStats[jersey].twoPointAttempted += 1
          }
          break
        case 'fg_missed':
          opponentStats[jersey].fgAttempted += 1
          if (event.value === 3) {
            opponentStats[jersey].threePointAttempted += 1
          } else {
            opponentStats[jersey].twoPointAttempted += 1
          }
          break
        case 'three_made':
          opponentStats[jersey].points += 3
          opponentStats[jersey].fgMade += 1
          opponentStats[jersey].fgAttempted += 1
          opponentStats[jersey].threePointMade += 1
          opponentStats[jersey].threePointAttempted += 1
          break
        case 'three_missed':
          opponentStats[jersey].fgAttempted += 1
          opponentStats[jersey].threePointAttempted += 1
          break
        case 'ft_made':
          opponentStats[jersey].points += 1
          opponentStats[jersey].ftMade += 1
          opponentStats[jersey].ftAttempted += 1
          break
        case 'ft_missed':
          opponentStats[jersey].ftAttempted += 1
          break
        case 'rebound':
          opponentStats[jersey].rebounds += 1
          break
        case 'assist':
          opponentStats[jersey].assists += 1
          break
        case 'steal':
          opponentStats[jersey].steals += 1
          break
        case 'block':
          opponentStats[jersey].blocks += 1
          break
        case 'turnover':
          opponentStats[jersey].turnovers += 1
          break
      }
    })
    
    // Calculate advanced metrics for each opponent player
    const result = Object.values(opponentStats).map(player => {
      const efficiency = player.points + player.rebounds + player.assists + player.steals + player.blocks - 
                       (player.fgAttempted - player.fgMade) - 
                       (player.ftAttempted - player.ftMade) - 
                       player.turnovers
      
      const trueShooting = player.fgAttempted + player.ftAttempted > 0 ? 
        Math.round((player.points / (2 * (player.fgAttempted + 0.44 * player.ftAttempted))) * 100) : 0
      
      const effectiveFg = player.fgAttempted > 0 ? 
        Math.round(((player.fgMade + 0.5 * player.threeMade) / player.fgAttempted) * 100) : 0
      
      return {
        ...player,
        efficiency,
        trueShooting,
        effectiveFg
      }
    }).sort((a, b) => b.points - a.points) // Sort by points descending
    
    console.log('🔍 Opponent Player Analytics - Final result:', {
      totalPlayers: result.length,
      players: result.map(p => ({ number: p.number, points: p.points, fgMade: p.fgMade, fgAttempted: p.fgAttempted }))
    })
    
    return result
  }, [events])
  
  // Calculate team comparison data
  const teamComparisonData = useMemo(() => {
    return {
      team: {
        ...teamStats,
        // Ensure all required fields are present
        fgMade: teamStats.fgMade || 0,
        fgAttempted: teamStats.fgAttempted || 0,
        fgPercentage: teamStats.fgPercentage || 0,
        twoPointMade: teamStats.twoPointMade || 0,
        twoPointAttempted: teamStats.twoPointAttempted || 0,
        twoPointPercentage: teamStats.twoPointPercentage || 0,
        threePointMade: teamStats.threePointMade || 0,
        threePointAttempted: teamStats.threePointAttempted || 0,
        threePointPercentage: teamStats.threePointPercentage || 0,
        ftMade: teamStats.ftMade || 0,
        ftAttempted: teamStats.ftAttempted || 0,
        ftPercentage: teamStats.ftPercentage || 0,
        totalRebounds: teamStats.totalRebounds || 0,
        totalAssists: teamStats.totalAssists || 0,
        totalSteals: teamStats.totalSteals || 0,
        totalBlocks: teamStats.totalBlocks || 0,
        totalTurnovers: teamStats.totalTurnovers || 0,
        pointsInPaint: teamStats.pointsInPaint || 0,
        secondChancePoints: teamStats.secondChancePoints || 0,
        pointsOffTurnovers: teamStats.pointsOffTurnovers || 0,
        benchPoints: teamStats.benchPoints || 0
      },
      opponent: {
        ...opponentStats,
        // Ensure all required fields are present
        fgMade: opponentStats.fgMade || 0,
        fgAttempted: opponentStats.fgAttempted || 0,
        fgPercentage: opponentStats.fgPercentage || 0,
        twoPointMade: opponentStats.twoPointMade || 0,
        twoPointAttempted: opponentStats.twoPointAttempted || 0,
        twoPointPercentage: opponentStats.twoPointPercentage || 0,
        threePointMade: opponentStats.threePointMade || 0,
        threePointAttempted: opponentStats.threePointAttempted || 0,
        threePointPercentage: opponentStats.threePointPercentage || 0,
        ftMade: opponentStats.ftMade || 0,
        ftAttempted: opponentStats.ftAttempted || 0,
        ftPercentage: opponentStats.ftPercentage || 0,
        totalRebounds: opponentStats.totalRebounds || 0,
        totalAssists: opponentStats.totalAssists || 0,
        totalSteals: opponentStats.totalSteals || 0,
        totalBlocks: opponentStats.totalBlocks || 0,
        totalTurnovers: opponentStats.totalTurnovers || 0,
        pointsInPaint: opponentStats.pointsInPaint || 0,
        secondChancePoints: opponentStats.secondChancePoints || 0,
        pointsOffTurnovers: opponentStats.pointsOffTurnovers || 0,
        benchPoints: opponentStats.benchPoints || 0
      }
    }
  }, [teamStats, opponentStats])

  const halftimeInsights = [
    { title: 'Shooting Efficiency', value: `${teamStats.fgPercentage}%`, status: teamStats.fgPercentage < 40 ? 'error' : teamStats.fgPercentage < 50 ? 'warning' : 'success' },
    { title: 'Rebound Rate', value: `${Math.round((teamStats.totalRebounds / (teamStats.totalRebounds + 20)) * 100)}%`, status: 'default' },
    { title: 'Assist/Turnover Ratio', value: teamStats.assistToTurnoverRatio, status: parseFloat(teamStats.assistToTurnoverRatio) < 1 ? 'error' : parseFloat(teamStats.assistToTurnoverRatio) < 1.5 ? 'warning' : 'success' },
    { title: 'Points per Quarter', value: Math.round(teamStats.totalPoints / gameState.quarter), status: 'default' }
  ]

  const halftimeData = generateHalftimeInsights()
  const timeoutData = generateTimeoutInsights()

  // Analytics table: helper tooltips for column titles
  const columnHelp: Record<string, string> = {
    name: 'Player name.',
    number: 'Jersey number.',
    position: 'Player position.',
    points: 'Total points scored.',
    rebounds: 'Total rebounds (offensive + defensive).',
    assists: 'Total assists.',
    steals: 'Total steals.',
    blocks: 'Total blocks.',
    turnovers: 'Total turnovers.',
    fgPercentage: 'Field goal percentage: FG made / FG attempted.',
    plusMinus: 'Team point differential while the player is on court.',
    efficiency: 'EFF = PTS + REB + AST + STL + BLK - Missed FG - Missed FT − TO.'
  }

  // DEV-ONLY: Enhanced player columns with settings, sortable, header tooltips (no click for sorting)
  const playerColumns = [
    { 
      title: (<Tooltip title={columnHelp.name}><span>Player</span></Tooltip>),
      dataIndex: 'name', key: 'name',
      sorter: (a: Player, b: Player) => a.name.localeCompare(b.name),
      width: 150
    },
    ...(settings.showPlayerNumbers ? [{ 
      title: (<Tooltip title={columnHelp.number}><span>#</span></Tooltip>),
      dataIndex: 'number', key: 'number',
      sorter: (a: Player, b: Player) => Number(a.number) - Number(b.number),
      width: 60
    }] : []),
    { 
      title: (<Tooltip title={columnHelp.points}><span>PTS</span></Tooltip>), 
      dataIndex: 'points', 
      key: 'points', 
      sorter: (a: Player, b: Player) => a.points - b.points,
      render: (text: any, record: Player) => record.points === 0 ? '' : record.points
    },

    { 
      title: (<Tooltip title={columnHelp.rebounds}><span>REB</span></Tooltip>), 
      dataIndex: 'rebounds', 
      key: 'rebounds', 
      sorter: (a: Player, b: Player) => a.rebounds - b.rebounds,
      render: (text: any, record: Player) => record.rebounds === 0 ? '' : record.rebounds
    },
    { 
      title: (<Tooltip title={columnHelp.assists}><span>AST</span></Tooltip>), 
      dataIndex: 'assists', 
      key: 'assists', 
      sorter: (a: Player, b: Player) => a.assists - b.assists,
      render: (text: any, record: Player) => record.assists === 0 ? '' : record.assists
    },
    { 
      title: (<Tooltip title={columnHelp.steals}><span>STL</span></Tooltip>), 
      dataIndex: 'steals', 
      key: 'steals', 
      sorter: (a: Player, b: Player) => a.steals - b.steals,
      render: (text: any, record: Player) => record.steals === 0 ? '' : record.steals
    },
    { 
      title: (<Tooltip title={columnHelp.blocks}><span>BLK</span></Tooltip>), 
      dataIndex: 'blocks', 
      key: 'blocks', 
      sorter: (a: Player, b: Player) => a.blocks - b.blocks,
      render: (text: any, record: Player) => record.blocks === 0 ? '' : record.blocks
    },
    { 
      title: (<Tooltip title={columnHelp.turnovers}><span>TO</span></Tooltip>), 
      dataIndex: 'turnovers', 
      key: 'turnovers', 
      sorter: (a: Player, b: Player) => a.turnovers - b.turnovers,
      render: (text: any, record: Player) => record.turnovers === 0 ? '' : record.turnovers
    },
    { 
      title: (<Tooltip title="Personal Fouls"><span>PF</span></Tooltip>), 
      dataIndex: 'fouls', 
      key: 'fouls', 
      sorter: (a: Player, b: Player) => a.fouls - b.fouls,
      render: (text: any, record: Player) => record.fouls === 0 ? '' : record.fouls
    },
    { 
      title: (<Tooltip title="Two-Point Field Goals"><span>2PT</span></Tooltip>),
      key: 'twoPoint',
      render: (text: any, record: Player) => {
        return record.twoPointAttempted > 0 ? `${record.twoPointMade || 0}/${record.twoPointAttempted || 0}` : '0/0'
      },
      sorter: (a: Player, b: Player) => {
        const aPct = a.twoPointAttempted > 0 ? (a.twoPointMade || 0) / a.twoPointAttempted : 0
        const bPct = b.twoPointAttempted > 0 ? (b.twoPointMade || 0) / b.twoPointAttempted : 0
        return aPct - bPct
      },
      width: 75
    },
    { 
      title: (<Tooltip title="Three-Point Field Goals"><span>3PT</span></Tooltip>), 
      key: 'threePoint',
      render: (text: any, record: Player) => record.threeAttempted > 0 ? `${record.threeMade || 0}/${record.threeAttempted || 0}` : '0/0',
      sorter: (a: Player, b: Player) => {
        const aPct = a.threeAttempted > 0 ? (a.threeMade || 0) / a.threeAttempted : 0
        const bPct = b.threeAttempted > 0 ? (b.threeMade || 0) / b.threeAttempted : 0
        return aPct - bPct
      }
    },
    { 
      title: (<Tooltip title={columnHelp.plusMinus}><span>+/-</span></Tooltip>), 
      dataIndex: 'plusMinus', 
      key: 'plusMinus', 
      sorter: (a: Player, b: Player) => a.plusMinus - b.plusMinus,
      render: (text: any, record: Player) => record.plusMinus === 0 ? '' : record.plusMinus,
      width: 70
    },
    ...(settings.showEfficiencyRatings ? [{ 
      title: (<Tooltip title={columnHelp.efficiency}><span>EFF</span></Tooltip>),
      key: 'efficiency', 
      render: (text: any, record: Player) => {
        const missedFg = (record.fgAttempted || 0) - (record.fgMade || 0)
        const missedFt = (record.ftAttempted || 0) - (record.ftMade || 0)
        const efficiency = record.points + record.rebounds + record.assists + record.steals + record.blocks - missedFg - missedFt - (record.turnovers || 0)
        // Temporarily disable threshold-based star so coaches can see raw EFF values
        // and calibrate what “good” looks like for their level. Keeping the code
        // here allows us to re‑enable the highlight quickly once a consensus
        // threshold is chosen per program:
        // return efficiency >= settings.efficiencyThreshold ? '⭐' : efficiency
        return efficiency
      },
      sorter: (a: Player, b: Player) => {
        const effA = a.points + a.rebounds + a.assists + a.steals + a.blocks - ((a.fgAttempted||0)-(a.fgMade||0)) - ((a.ftAttempted||0)-(a.ftMade||0)) - (a.turnovers||0)
        const effB = b.points + b.rebounds + b.assists + b.steals + b.blocks - ((b.fgAttempted||0)-(b.fgMade||0)) - ((b.ftAttempted||0)-(b.ftMade||0)) - (b.turnovers||0)
        return effA - effB
      }
    }] : [])
  ]

  // Opponent player columns (simplified version)
  const opponentPlayerColumns = [
    { 
      title: 'Player',
      dataIndex: 'number', 
      key: 'number',
      sorter: (a: any, b: any) => Number(a.number) - Number(b.number),
      width: 80,
      render: (text: any, record: any) => (
        <div style={{ fontWeight: 600, color: '#ff4d4f', fontSize: '16px' }}>
          #{record.number}
        </div>
      )
    },
    { 
      title: 'PTS', 
      dataIndex: 'points', 
      key: 'points', 
      sorter: (a: any, b: any) => a.points - b.points,
      render: (text: any, record: any) => record.points === 0 ? '' : record.points,
      width: 50
    },
    { 
      title: 'REB', 
      dataIndex: 'rebounds', 
      key: 'rebounds', 
      sorter: (a: any, b: any) => a.rebounds - b.rebounds,
      render: (text: any, record: any) => record.rebounds === 0 ? '' : record.rebounds,
      width: 50
    },
    { 
      title: 'AST', 
      dataIndex: 'assists', 
      key: 'assists', 
      sorter: (a: any, b: any) => a.assists - b.assists,
      render: (text: any, record: any) => record.assists === 0 ? '' : record.assists,
      width: 50
    },
    { 
      title: 'STL', 
      dataIndex: 'steals', 
      key: 'steals', 
      sorter: (a: any, b: any) => a.steals - b.steals,
      render: (text: any, record: any) => record.steals === 0 ? '' : record.steals,
      width: 50
    },
    { 
      title: 'BLK', 
      dataIndex: 'blocks', 
      key: 'blocks', 
      sorter: (a: any, b: any) => a.blocks - b.blocks,
      render: (text: any, record: any) => record.blocks === 0 ? '' : record.blocks,
      width: 50
    },
    { 
      title: 'TO', 
      dataIndex: 'turnovers', 
      key: 'turnovers', 
      sorter: (a: any, b: any) => a.turnovers - b.turnovers,
      render: (text: any, record: any) => record.turnovers === 0 ? '' : record.turnovers,
      width: 50
    },
    { 
      title: '2PT', 
      key: 'twoPoint',
      render: (text: any, record: any) => {
        return record.twoPointAttempted > 0 ? `${record.twoPointMade || 0}/${record.twoPointAttempted || 0}` : '0/0'
      },
      sorter: (a: any, b: any) => {
        const aPct = a.twoPointAttempted > 0 ? (a.twoPointMade || 0) / a.twoPointAttempted : 0
        const bPct = b.twoPointAttempted > 0 ? (b.twoPointMade || 0) / b.twoPointAttempted : 0
        return aPct - bPct
      },
      width: 60
    },
    { 
      title: '3PT', 
      key: 'threePoint',
      render: (text: any, record: any) => record.threePointAttempted > 0 ? `${record.threePointMade || 0}/${record.threePointAttempted || 0}` : '0/0',
      sorter: (a: any, b: any) => {
        const aPct = a.threePointAttempted > 0 ? (a.threePointMade || 0) / a.threePointAttempted : 0
        const bPct = b.threePointAttempted > 0 ? (b.threePointMade || 0) / b.threePointAttempted : 0
        return aPct - bPct
      },
      width: 60
    },
    { 
      title: 'FT', 
      key: 'ftPercentage',
      render: (text: any, record: any) => record.ftAttempted > 0 ? `${record.ftMade}/${record.ftAttempted}` : '0/0',
      sorter: (a: any, b: any) => {
        const aPct = a.ftAttempted > 0 ? a.ftMade / a.ftAttempted : 0
        const bPct = b.ftAttempted > 0 ? b.ftMade / b.ftAttempted : 0
        return aPct - bPct
      },
      width: 60
    }
  ]

  // DEV-ONLY: Create tabs items for modern API
  const tabItems = [
    {
      key: 'tracking',
      label: 'Live Tracking',
      children: (
        <>
          <Row gutter={[16, 8]}>
            <Col span={24}>
      
            </Col>
          </Row>
          <Row gutter={[16, 8]} style={{ flexWrap: 'nowrap' }}>
            <Col flex="1" style={{ minWidth: 0 }}>
                  {/* Player box */}
                   <Card 
                     title="Player" 
                     size="default" 
                     styles={{ body: { padding: 8 } }}
                   >
                     <Row gutter={[8, 6]}>
                    <Col span={12}>
                      {currentLineup ? (
                        // Show selected players when lineup is active
                        currentLineup.players.slice(0, 3).map(playerId => {
                          const player = players.find(p => p.id === playerId)
                          if (!player) return null
                          return (
                            <div key={player.id} className={`${style.playerCard} ${selectedPlayer?.id === player.id ? style.selected : ''}`} style={{ padding: 6, margin: '2px 0' }}>
                              <div onClick={() => selectPlayer(player)} style={{ cursor: 'pointer', flex: 1 }}>
                                <Text strong style={{ fontSize: '0.9rem' }}>{settings.showPlayerNumbers && `#${player.number} `}{player.name}</Text>
                                {settings.showPositions && (<><br /><Text type="secondary" style={{ fontSize: '0.8rem' }}>{player.position} | Fouls: {player.fouls}</Text></>)}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                <div>
                                  <Badge count={player.points} style={{ backgroundColor: '#52c41a' }} />
                                  <Text type="secondary" style={{ fontSize: '0.8rem' }}> PTS</Text>
                                  <br />
                                  <Badge count={player.plusMinus} style={{ backgroundColor: player.plusMinus >= 0 ? '#52c41a' : '#f5222d' }} />
                                  <Text type="secondary" style={{ fontSize: '0.8rem' }}> +/-</Text>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        // Show empty player boxes when no lineup selected
                        Array.from({ length: 3 }, (_, index) => (
                          <div 
                            key={index} 
                            className={style.playerCard} 
                            onClick={() => setShowLineupBuilder(true)}
                            style={{ 
                            padding: 6, 
                            margin: '2px 0',
                            border: '2px dashed #666',
                            background: '#333',
                            minHeight: '60px',
                            display: 'flex',
                            alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#444'
                              e.currentTarget.style.borderColor = '#888'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#333'
                              e.currentTarget.style.borderColor = '#666'
                            }}
                          >
                            <Text type="secondary" style={{ fontSize: '0.9rem', color: '#999' }}>
                              Select Player {index + 1}
                            </Text>
                          </div>
                        ))
                      )}
                    </Col>
                    <Col span={12}>
                      {currentLineup ? (
                        // Show selected players when lineup is active
                        currentLineup.players.slice(3, 5).map(playerId => {
                          const player = players.find(p => p.id === playerId)
                          if (!player) return null
                          return (
                            <div key={player.id} className={`${style.playerCard} ${selectedPlayer?.id === player.id ? style.selected : ''}`} style={{ padding: 6, margin: '2px 0' }}>
                              <div onClick={() => selectPlayer(player)} style={{ cursor: 'pointer', flex: 1 }}>
                                <Text strong style={{ fontSize: '0.9rem' }}>{settings.showPlayerNumbers && `#${player.number} `}{player.name}</Text>
                                {settings.showPositions && (<><br /><Text type="secondary" style={{ fontSize: '0.8rem' }}>{player.position} | Fouls: {player.fouls}</Text></>)}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                <div>
                                  <Badge count={player.points} style={{ backgroundColor: '#52c41a' }} />
                                  <Text type="secondary" style={{ fontSize: '0.8rem' }}> PTS</Text>
                                  <br />
                                  <Badge count={player.plusMinus} style={{ backgroundColor: player.plusMinus >= 0 ? '#52c41a' : '#f5222d' }} />
                                  <Text type="secondary" style={{ fontSize: '0.8rem' }}> +/-</Text>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        // Show empty player boxes when no lineup selected
                        Array.from({ length: 2 }, (_, index) => (
                          <div 
                            key={index + 3} 
                            className={style.playerCard} 
                            onClick={() => setShowLineupBuilder(true)}
                            style={{ 
                            padding: 6, 
                            margin: '2px 0',
                            border: '2px dashed #666',
                            background: '#333',
                            minHeight: '60px',
                            display: 'flex',
                            alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#444'
                              e.currentTarget.style.borderColor = '#888'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#333'
                              e.currentTarget.style.borderColor = '#666'
                            }}
                          >
                            <Text type="secondary" style={{ fontSize: '0.9rem', color: '#999' }}>
                              Select Player {index + 4}
                            </Text>
                          </div>
                        ))
                      )}
                      <div style={{ marginTop: 8 }}>
                        <Button type="primary" icon={<TeamOutlined />} onClick={() => {
                          if (!currentLineup) {
                            // Open modal to select starting 5 players
                            setShowLineupBuilder(true)
                          } else {
                            // Only allow lineup editing before the game has ever started
                            if (!hasGameStarted && gameState.quarter === 1) {
                              // If game has never started and we're still in quarter 1, allow editing the lineup
                              setShowLineupBuilder(true)
                            } else {
                              // Game has started or quarter has advanced, open Bulk Substitution modal
                              const activePlayerIds = players
                                .filter(p => p.isOnCourt)
                                .map(p => p.id)
                                .filter(id => id !== (selectedPlayer?.id ?? -1))
                              setSelectedBulkSubPlayers(activePlayerIds)
                              setShowBulkSubModal(true)
                            }
                          }
                        }} block style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', color: '#fff', fontWeight: 600, height: 40, fontSize: '0.9rem' }}>{currentLineup ? (hasGameStarted || gameState.quarter > 1 ? 'Quick Substitution' : 'Edit Starting Lineup') : 'Select Starting Lineup'}</Button>
                        {quickSubHistory.length > 0 && (
                          <Button onClick={undoLastSubstitution} block style={{ marginTop: 4, height: 28, fontSize: '0.8rem' }}>Undo Last Sub</Button>
                        )}
                      </div>
                    </Col>
                  </Row>
                  <Divider style={{ margin: '12px 0' }} />
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text strong>Opponent On-Court</Text>
                      {!opponentStarting5Set && (
                        <Button 
                          size="small" 
                          type="primary"
                          onClick={setOpponentStarting5}
                          disabled={!opponentOnCourt.some(jersey => jersey)}
                        >
                          Set Starting 5
                        </Button>
                      )}
                      {opponentStarting5Set && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text type="secondary" style={{ fontSize: '0.8rem' }}>
                            ✓ Starting 5 Set
                          </Text>
                          <Button 
                            size="small" 
                            type="text"
                            onClick={undoOpponentStarting5}
                            style={{ 
                              color: '#ff4d4f', 
                              fontSize: '0.7rem',
                              padding: '2px 6px',
                              height: 'auto'
                            }}
                          >
                            Undo
                          </Button>
                        </div>
                      )}
                    </div>
                     <Row gutter={[8, 6]}>
                      {opponentOnCourt.map((jersey, idx) => {
                        const isSelected = selectedOpponentSlot === idx
                        return (
                          <Col key={idx} span={12}>
                            <div
                              onClick={() => selectOpponentSlot(idx)}
                              style={{
                                display: 'flex',
                                gap: 8,
                                alignItems: 'center',
                                padding: 8,
                                borderRadius: 6,
                                border: isSelected ? '1px solid #2563eb' : '1px solid #334155',
                                background: isSelected ? '#0b2a4a' : '#0f2741',
                                cursor: 'pointer'
                              }}
                            >
                              <Input
                                placeholder="Opp #"
                                value={jersey}
                                readOnly={opponentStarting5Set}
                                onChange={(e) => {
                                  // Only allow editing if starting 5 hasn't been set yet
                                  if (!opponentStarting5Set) {
                                    const next = [...opponentOnCourt]
                                    next[idx] = e.target.value.replace(/[^0-9]/g, '').slice(0, 3)
                                    setOpponentOnCourt(next)
                                  }
                                }}
                                style={{ 
                                  width: 80,
                                  backgroundColor: opponentStarting5Set ? '#1e293b' : undefined,
                                  color: opponentStarting5Set ? '#94a3b8' : undefined,
                                  cursor: opponentStarting5Set ? 'not-allowed' : 'text'
                                }}
                              />
                              <Button
                                danger
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const newJersey = prompt(`Enter new jersey number for slot ${idx + 1}:`)
                                  if (newJersey && newJersey.trim()) {
                                    handleOpponentSubstitution(idx, newJersey.trim())
                                  }
                                }}
                              >
                                Sub
                              </Button>
                              {jersey && (
                                <Text style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ff4d4f', padding: '2px 6px' }}>
                                  Fouls: {opponentFouls[jersey] || 0}
                                </Text>
                              )}
                            </div>
                          </Col>
                        )
                      })}
                    </Row>
                  </div>
                </Card>
              </Col>
              <Col flex="1" style={{ minWidth: 0 }}>
                {/* Action box */}
                <Card title="Action" size="default" styles={{ body: { padding: 8 } }}>
                  {(() => {
                    const canRecordOpponent = selectedOpponentSlot !== null && !!opponentOnCourt[selectedOpponentSlot!]?.trim()
                      const recordAction = (eventType: string) => {
    console.log('🎬 Action button clicked:', eventType, 'Selected player:', selectedPlayer?.name, 'Can record opponent:', canRecordOpponent)
    
    // Check if game is started
    if (!gameState.isPlaying) {
      console.log('⚠️ Game not started, cannot record action')
      message.info('Please start the game first before recording actions')
      return
    }
    
    // Handle Points in Paint modal for 2PT made
    if (eventType === 'fg_made' && settings.askForPointsInPaint) {
      setPendingPipEvent({ eventType, playerId: selectedPlayer?.id, isOpponent: canRecordOpponent, opponentSlot: selectedOpponentSlot })
      setShowPipModal(true)
      return
    }
    
    // Handle Assist modal for 2PT made (when not using points in paint workflow)
    if (eventType === 'fg_made' && !settings.askForPointsInPaint) {
      setPendingAssistEvent({ eventType, playerId: selectedPlayer?.id, isOpponent: canRecordOpponent, opponentSlot: selectedOpponentSlot, pip: false })
      setShowAssistModal(true)
      return
    }
    
    // Handle Assist modal for 3PT made
    if (eventType === 'three_made') {
      setPendingAssistEvent({ eventType, playerId: selectedPlayer?.id, isOpponent: canRecordOpponent, opponentSlot: selectedOpponentSlot, pip: false })
      setShowAssistModal(true)
      return
    }
    
    // Handle Rebound modal for 2PT, 3PT, and FT missed
    if (eventType === 'fg_missed' || eventType === 'three_missed' || eventType === 'ft_missed') {
      setPendingReboundEvent({ eventType, playerId: selectedPlayer?.id, isOpponent: canRecordOpponent, opponentSlot: selectedOpponentSlot })
      setShowReboundModal(true)
      return
    }
    
    // Handle Steal modal
    if (eventType === 'steal') {
      setPendingStealEvent({ playerId: selectedPlayer?.id, isOpponent: canRecordOpponent, opponentSlot: selectedOpponentSlot })
      setShowStealModal(true)
      return
    }
    
    // Handle Turnover modal
    if (eventType === 'turnover') {
      setPendingTurnoverEvent({ playerId: selectedPlayer?.id, isOpponent: canRecordOpponent, opponentSlot: selectedOpponentSlot })
      setShowTurnoverModal(true)
      return
    }
    
    // Handle Foul modal
    if (eventType === 'foul') {
      setPendingFoulEvent({ playerId: selectedPlayer?.id, isOpponent: canRecordOpponent, opponentSlot: selectedOpponentSlot })
      setShowFoulModal(true)
      return
    }
    
    // Handle Block modal
    if (eventType === 'block') {
      setPendingBlockEvent({ playerId: selectedPlayer?.id, isOpponent: canRecordOpponent, opponentSlot: selectedOpponentSlot })
      setShowBlockModal(true)
      return
    }
    
    if (canRecordOpponent) {
      console.log('📊 Recording opponent event:', eventType, 'for opponent slot:', selectedOpponentSlot)
      handleOpponentStatEvent(opponentOnCourt[selectedOpponentSlot!], eventType)
    } else if (selectedPlayer) {
      console.log('📊 Recording team event:', eventType, 'for player:', selectedPlayer.name, 'ID:', selectedPlayer.id)
      handleStatEvent(selectedPlayer.id, eventType)
    } else {
      console.log('⚠️ No player selected and cannot record opponent event')
    }
  }
                    const isDisabled = !(selectedPlayer || canRecordOpponent)
                    return (
                      <Row gutter={[8, 8]}>
                        {/* Column 1: 2PT Made/Miss stacked vertically */}
                        <Col span={8}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <Button 
                            size="middle"
                            block 
                            onClick={() => recordAction('fg_made')}
                            disabled={isDisabled}
                            className={style.quickStatButton}
                          >
                            2PT Made
                          </Button>
                          <Button 
                            size="middle"
                            block 
                            onClick={() => recordAction('fg_missed')}
                            disabled={isDisabled}
                            className={style.quickStatButton}
                          >
                            2PT Miss
                          </Button>
                          </div>
                        </Col>
                        
                        {/* Column 2: 3PT Made/Miss stacked vertically */}
                        <Col span={8}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <Button 
                            size="middle"
                            block 
                            onClick={() => recordAction('three_made')}
                            disabled={isDisabled}
                            className={style.quickStatButton}
                          >
                            3PT Made
                          </Button>
                          <Button 
                            size="middle"
                            block 
                            onClick={() => recordAction('three_missed')}
                            disabled={isDisabled}
                            className={style.quickStatButton}
                          >
                            3PT Miss
                          </Button>
                          </div>
                        </Col>
                        
                        {/* Column 3: FT Made/Miss stacked vertically */}
                        <Col span={8}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <Button 
                            size="middle"
                            block 
                            onClick={() => recordAction('ft_made')}
                            disabled={isDisabled}
                            className={style.quickStatButton}
                          >
                            FT Made
                          </Button>
                          <Button 
                            size="middle"
                            block 
                            onClick={() => recordAction('ft_missed')}
                            disabled={isDisabled}
                            className={style.quickStatButton}
                          >
                            FT Miss
                          </Button>
                          </div>
                        </Col>
                        
                        {/* Row 2: Assist over Rebound, Block over Steal, Foul over Turnover */}
                        <Col span={8}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <Button 
                            size="middle"
                            block 
                              onClick={() => recordAction('assist')}
                            disabled={isDisabled}
                            className={style.quickStatButton}
                          >
                              Assist
                          </Button>
                          <Button 
                            size="middle"
                            block 
                              onClick={() => recordAction('rebound')}
                            disabled={isDisabled}
                            className={style.quickStatButton}
                          >
                              Rebound
                          </Button>
                          </div>
                        </Col>
                        <Col span={8}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <Button 
                            size="middle"
                            block 
                              onClick={() => recordAction('block')}
                            disabled={isDisabled}
                            className={style.quickStatButton}
                          >
                              Block
                          </Button>
                          <Button 
                            size="middle"
                            block 
                              onClick={() => recordAction('steal')}
                            disabled={isDisabled}
                            className={style.quickStatButton}
                          >
                              Steal
                          </Button>
                          </div>
                        </Col>
                        <Col span={8}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <Button 
                            size="middle"
                            block 
                            danger
                              onClick={() => recordAction('foul')}
                            disabled={isDisabled}
                            className={style.quickStatButton}
                          >
                              Foul
                          </Button>
                          <Button 
                            size="middle"
                            block 
                            danger
                              onClick={() => recordAction('turnover')}
                            disabled={isDisabled}
                            className={style.quickStatButton}
                          >
                              Turnover
                          </Button>
                          </div>
                        </Col>
                      </Row>
                    )
                  })()}
                </Card>
                                                                   <Card title="Play by Play" styles={{ body: { padding: '2px 8px' } }} style={{ marginTop: 8, height: '221px', overflow: 'hidden' }}>
                  <div className={style.eventsFeed} style={{ height: '175px', overflowY: 'auto' }}> 
                    {events.slice(0, 10).map(event => {
                      // Format event type for better readability
                      const formatEventType = (eventType: string) => {
                        switch (eventType) {
                          case 'fg_made': return '2PT Made'
                          case 'fg_missed': return '2PT Miss'
                          case 'three_made': return '3PT Made'
                          case 'three_missed': return '3PT Miss'
                          case 'ft_made': return 'FT Made'
                          case 'ft_missed': return 'FT Miss'
                          case 'rebound': return 'Rebound'
                          case 'assist': return 'Assist'
                          case 'steal': return 'Steal'
                          case 'block': return 'Block'
                          case 'foul': return 'Foul'
                          case 'turnover': return 'Turnover'
                          case 'charge_taken': return 'Charge Taken'
                          case 'deflection': return 'Deflection'
                          case 'fg_attempt': return '2PT Attempt'
                          case 'three_attempt': return '3PT Attempt'
                          case 'ft_attempt': return 'FT Attempt'
                          default: return eventType
                        }
                      }
                      
                      return (
                      <div key={event.id} className={style.eventItem}>
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <Text type="secondary" style={{ minWidth: '60px' }}>{formatWallClock(event.timestamp)}</Text>
                          <Text strong style={{ margin: '0 12px', flex: 1 }}>{event.playerName}</Text>
                            <Text style={{ marginRight: 8 }}>{formatEventType(event.eventType)}</Text>
                          {event.value && <Badge count={event.value} style={{ marginRight: 8 }} />}
                          {event.opponentEvent && <Badge count="OPP" style={{ backgroundColor: '#f5222d', marginRight: 8 }} />}
                        </div>
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteEvent(event.id)
                          }}
                          style={{ 
                            padding: '4px 8px',
                            height: 'auto',
                            minWidth: 'auto'
                          }}
                        />
                      </div>
                      )
                    })}
                  </div>
                </Card>
              </Col>
            </Row>
          </>
        )
    },
    {
      key: 'analytics',
      label: 'Analytics',
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <TeamComparisonTable 
              teamStats={teamComparisonData.team} 
              opponentStats={teamComparisonData.opponent} 
              teamName={eventData?.name || "HOME"}
              opponentName={eventData?.oppositionTeam || "OPPONENT"}
            />
          </Col>
          <Col span={24}>
            <Card title="Box Score" className={style.playerPerformanceCard}>
              <Table 
                dataSource={playerAnalytics} 
                columns={playerColumns} 
                rowKey="id"
                pagination={false}
                scroll={{ y: 300 }}
                showSorterTooltip={false}
              />
            </Card>
          </Col>
          <Col span={24}>
            <Card title="Opponent Box Score" className={style.playerPerformanceCard}>
              <Table 
                dataSource={opponentPlayerAnalytics} 
                columns={opponentPlayerColumns} 
                rowKey="id"
                pagination={false}
                scroll={{ y: 300 }}
                showSorterTooltip={false}
              />
            </Card>
          </Col>
          {/* Team Statistics - Commented out for now */}
          {/* <Col span={12}>
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
                  </>
                )}
              </Row>
            </Card>
          </Col> */}
          {/* Opponent Statistics - Commented out for now */}
          {/* <Col span={12}>
            <Card title="Opponent Statistics" className={style.teamStatsCard}>
              {(() => {
                const oppStats = calculateOpponentStats()
                return (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic title="Total Points" value={oppStats.totalPoints} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Total Rebounds" value={oppStats.totalRebounds} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Total Assists" value={oppStats.totalAssists} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Total Turnovers" value={oppStats.totalTurnovers} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="FG%" value={`${oppStats.fgPercentage}%`} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="3PT%" value={`${oppStats.threePercentage}%`} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="FT%" value={`${oppStats.ftPercentage}%`} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Steals" value={oppStats.totalSteals} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Blocks" value={oppStats.totalBlocks} />
                    </Col>
                  </Row>
                )
              })()}
            </Card>
          </Col> */}
          {/* Substitution History & Analytics - temporarily disabled */}
          {false && (
            <Col span={12}>
              <Card title="Substitution History & Analytics">
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Card title="Substitution Stats">
                      {(() => {
                        const stats = getSubstitutionStats()
                        return (
                          <div>
                            <Statistic title="Total Substitutions" value={stats.totalSubs} />
                            <Statistic title="Unique Players Used" value={stats.uniquePlayers} />
                            {(stats.mostSubbedIn && stats.mostSubbedIn.player) && (
                              <div style={{ marginTop: 16 }}>
                                <Text strong>Most Subbed In:</Text>
                                <br />
                                <Text>#{stats.mostSubbedIn.player!.number} {stats.mostSubbedIn.player!.name}</Text>
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
                    <Card title="Recent Substitutions">
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
          )}
        </Row>
      )
    },
    {
      key: 'lineups',
      label: 'Lineups',
      children: (
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="Current Lineup">
              {currentLineup ? (
                <div>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: '1.1rem', color: '#f5f7fa' }}>Active Lineup</Text>
                    <Button 
                      danger 
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
            <Card title="Quick Substitutions">
              {currentLineup ? (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Button 
                      type="primary" 
                      size="middle"
                      icon={<TeamOutlined />}
                      onClick={() => {
                        const activePlayerIds = players
                          .filter(p => p.isOnCourt)
                          .map(p => p.id)
                          .filter(id => id !== (selectedPlayer?.id ?? -1))
                        setSelectedBulkSubPlayers(activePlayerIds)
                        setShowBulkSubModal(true)
                      }}
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text strong style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Recent Substitutions</Text>
                        <Button size="small" onClick={() => setQuickSubHistory([])}>Clear</Button>
                      </div>
                      <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                        {quickSubHistory.slice(0, 5).map((sub, index) => (
                          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', margin: '4px 0', background: '#0f2741', borderRadius: 6, border: '1px solid #1e3a8a' }}>
                            <div>
                              <Text strong style={{ fontSize: '0.9rem', color: '#f5f7fa' }}>#{sub.playerOut.number} {sub.playerOut.name}</Text>
                              <Text style={{ margin: '0 6px', color: '#94a3b8' }}>→</Text>
                              <Text strong style={{ fontSize: '0.9rem', color: '#f5f7fa' }}>#{sub.playerIn.number} {sub.playerIn.name}</Text>
                            </div>
                            <Text style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(sub.timestamp).toLocaleTimeString()}</Text>
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
            <Card title="Lineup History">
              <div className={style.lineupHistory}>
                {lineups.length > 0 ? (
                  lineups.map(lineup => {
                    const effectiveness = calculateLineupEffectiveness(lineup)
                    return (
                      <div key={lineup.id} className={style.lineupCard}>
                        <div className={style.lineupHeader}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text strong style={{ fontSize: '1rem' }}>Lineup #{lineup.id.slice(-4)}</Text>
                            <Button 
                              size="small" 
                              type="text" 
                              icon={<EditOutlined />}
                              onClick={() => {
                                setEditingLineupId(lineup.id)
                                setEditingLineupName(lineup.name || `Lineup ${lineup.id.slice(-4)}`)
                              }}
                              style={{ padding: '2px 4px', height: 'auto' }}
                            />
                          </div>
                          <Badge 
                            count={effectiveness.totalPlusMinus} 
                            style={{ 
                              backgroundColor: effectiveness.totalPlusMinus >= 0 ? '#52c41a' : '#f5222d',
                              fontSize: '0.8rem',
                              fontWeight: 600
                            }}
                          />
                        </div>
                        {editingLineupId === lineup.id ? (
                          <div style={{ marginBottom: 8 }}>
                            <Input
                              value={editingLineupName}
                              onChange={(e) => setEditingLineupName(e.target.value)}
                              onPressEnter={() => {
                                // Update lineup name
                                setLineups(prev => prev.map(l => 
                                  l.id === lineup.id ? { ...l, name: editingLineupName } : l
                                ))
                                setEditingLineupId(null)
                                setEditingLineupName('')
                              }}
                              onBlur={() => {
                                setEditingLineupId(null)
                                setEditingLineupName('')
                              }}
                              style={{ fontSize: '0.9rem' }}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div style={{ marginBottom: 8 }}>
                            <Text type="secondary" style={{ fontSize: '0.9rem', color: '#a6a6a6' }}>
                              {lineup.name || `Lineup ${lineup.id.slice(-4)}`}
                            </Text>
                          </div>
                        )}
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
            '',
    settings.darkMode ? style.darkMode : ''
  ].filter(Boolean).join(' ')

  // Focus input when editing
  useEffect(() => {
    if (isEditingClock && clockInputRef.current) {
      clockInputRef.current.focus();
      clockInputRef.current.select();
    }
  }, [isEditingClock]);

  // Pre-populate lineup builder when editing existing lineup
  useEffect(() => {
    if (showLineupBuilder && currentLineup && !hasGameStarted && gameState.quarter === 1) {
      // Editing existing lineup - pre-populate form (only before game has ever started)
      setSelectedLineupPlayers(currentLineup.players)
      setLineupName(currentLineup.name || '')
    } else if (showLineupBuilder && !currentLineup) {
      // Creating new lineup - reset form
      setSelectedLineupPlayers([])
      setLineupName('')
    }
  }, [showLineupBuilder, currentLineup, hasGameStarted, gameState.quarter]);

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

  // Before return, compute if scrolling is needed and calculate dynamic padding
  const needsScoreScroll = gameState.homeScore >= 100 || gameState.opponentScore >= 100;
  const needsLargeScoreScroll = gameState.homeScore >= 1000 || gameState.opponentScore >= 1000;
  
  // Force horizontal scrolling when sidebar is open to prevent wrapping
  const needsSidebarScroll = !sidebarCollapsed;
  
  // Calculate dynamic padding based on score size and sidebar state
  const calculatePadding = () => {
    const maxScore = Math.max(gameState.homeScore, gameState.opponentScore);
    
    if (sidebarCollapsed) {
      // Sidebar is collapsed - use normal padding
      if (maxScore >= 1000) return '2px'; // Minimal padding for 4-digit scores
      if (maxScore >= 100) return '8px'; // Minimal padding for 3-digit scores
      if (maxScore >= 50) return '24px'; // Medium padding for 2-digit scores
      if (maxScore >= 10) return '36px'; // Good padding for double-digit scores
      return '48px'; // Full padding for single-digit scores
    } else {
      // Sidebar is open - use minimal padding to prevent wrapping
      if (maxScore >= 1000) return '1px'; // Almost no padding for 4-digit scores
      if (maxScore >= 100) return '2px'; // Almost no padding for 3-digit scores
      if (maxScore >= 50) return '4px'; // Minimal padding for 2-digit scores
      if (maxScore >= 10) return '6px'; // Small padding for double-digit scores
      return '8px'; // Small padding for single-digit scores
    }
  };

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
  // DEV-ONLY: Enhanced substitution handler with modal flow management
  const handleSubstitution = (playerOut: Player, playerIn: Player) => {
    // End current lineup and save its stats
    if (currentLineup) {
      const endTime = Date.now()
      const lineupDuration = endTime - currentLineup.startTime
      
      // Calculate aggregate stats for the lineup
      const lineupPlayers = players.filter(p => currentLineup.players.includes(p.id))
      const aggregateStats = {
        points: lineupPlayers.reduce((sum, p) => sum + p.points, 0),
        rebounds: lineupPlayers.reduce((sum, p) => sum + p.rebounds, 0),
        assists: lineupPlayers.reduce((sum, p) => sum + p.assists, 0),
        steals: lineupPlayers.reduce((sum, p) => sum + p.steals, 0),
        blocks: lineupPlayers.reduce((sum, p) => sum + p.blocks, 0),
        turnovers: lineupPlayers.reduce((sum, p) => sum + p.turnovers, 0),
        fgMade: lineupPlayers.reduce((sum, p) => sum + p.fgMade, 0),
        fgAttempted: lineupPlayers.reduce((sum, p) => sum + p.fgAttempted, 0),
        plusMinus: lineupPlayers.reduce((sum, p) => sum + p.plusMinus, 0),
        duration: lineupDuration
      }
      
      // Update lineup with final stats
      setLineups(prev => prev.map(l => 
        l.id === currentLineup.id 
          ? { ...l, endTime, plusMinus: aggregateStats.plusMinus, stats: aggregateStats }
          : l
      ))
    }

    // Create new lineup with the substitution
    const newLineupPlayers = currentLineup ? 
      currentLineup.players.map(p => p === playerOut.id ? playerIn.id : p) :
      [playerIn.id, ...players.filter(p => p.isOnCourt && p.id !== playerOut.id).map(p => p.id)]

    const newLineup: Lineup = {
      id: `lineup-${Date.now()}`,
      players: newLineupPlayers,
      startTime: Date.now(),
      plusMinus: 0,
      stats: {
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fgMade: 0,
        fgAttempted: 0,
        plusMinus: 0,
        duration: 0
      }
    }

    setCurrentLineup(newLineup)
    setLineups(prev => [...prev, newLineup])

    // Update player court status
    setPlayers(prev => prev.map(p => ({
      ...p,
      isOnCourt: p.id === playerIn.id ? true : p.id === playerOut.id ? false : p.isOnCourt
    })))

    // Add substitution event
    const substitutionEvent: StatEvent = {
      id: `sub_${Date.now()}`,
      timestamp: Date.now(),
      playerId: playerIn.id,
      playerName: playerIn.name,
      eventType: 'substitution_in',
      quarter: gameState.quarter,
      gameTime: Date.now()
    }

    const substitutionOutEvent: StatEvent = {
      id: `sub_out_${Date.now()}`,
      timestamp: Date.now(),
      playerId: playerOut.id,
      playerName: playerOut.name,
      eventType: 'substitution_out',
      quarter: gameState.quarter,
      gameTime: Date.now()
    }

    setEvents(prev => [substitutionEvent, substitutionOutEvent, ...prev])
    
    // Close modal and reset state
    setShowSubModal(false)
    setPlayerToSubOut(null)
    setAvailableSubs([])
  }

  // Unified selection system - only one player can be selected at a time
  const selectPlayer = (player: Player) => {
    console.log('🎯 Player selected:', player.name, 'ID:', player.id)
    
    // If no lineup exists, open the lineup builder modal instead of selecting player
    if (!currentLineup) {
      console.log('⚠️ No lineup exists, opening lineup builder')
      setShowLineupBuilder(true)
      return
    }
    
    // Clear any opponent selection first
    setSelectedOpponentSlot(null)
    // Set the new player selection
    setSelectedPlayer(player)
    console.log('✅ Player selection updated:', player.name)
  }

  const selectOpponentSlot = (slotIndex: number) => {
    // Clear any player selection first
    setSelectedPlayer(null)
    // Set the new opponent slot selection
    setSelectedOpponentSlot(slotIndex)
  }

  // Open substitution modal
  const openSubModal = (player: Player) => {
    // Check if game is started
    if (!gameState.isPlaying) {
      message.info('Please start the game first before making substitutions')
      return
    }
    
    setSubstitutionPlayerOut(player)
    // Get available substitutes (players not currently on court)
    const subs = players.filter(p => !p.isOnCourt && p.id !== player.id)
    setAvailableSubs(subs)
    setShowQuickSubModal(true)
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

  // Substitution state
  const [showSubModal, setShowSubModal] = useState(false)
  const [playerToSubOut, setPlayerToSubOut] = useState<Player | null>(null)
  const [availableSubs, setAvailableSubs] = useState<Player[]>([])
  const [currentLineupStats, setCurrentLineupStats] = useState<any>(null)

  // Auto-save game data every 30 seconds and on important actions
  useEffect(() => {
    if (!eventId) return
    
    const autoSaveInterval = setInterval(() => {
      if (hasGameStarted || events.length > 0) {
        saveGameDataOffline({ silent: true })
      }
    }, 30000) // Save every 30 seconds
    
    return () => clearInterval(autoSaveInterval)
  }, [eventId, hasGameStarted]) // Removed events.length to prevent infinite loop

  // Load saved game data on component mount
  useEffect(() => {
    if (!eventId) return
    
    const savedGameData = liveStatService.loadGameData(eventId)
    if (savedGameData) {
      // Restore game state
      setGameState(savedGameData.gameState)
      setPlayers(savedGameData.players)
      setEvents(savedGameData.events)
      setLineups(savedGameData.lineups)
      setOpponentOnCourt(savedGameData.opponentOnCourt)
      // Handle both old array format and new object format for opponentFouls
      if (Array.isArray(savedGameData.opponentFouls)) {
        // Convert old array format to new object format
        const newOpponentFouls: Record<string, number> = {}
        savedGameData.opponentOnCourt?.forEach((jersey: string, idx: number) => {
          if (jersey) {
            newOpponentFouls[jersey] = savedGameData.opponentFouls[idx] || 0
          }
        })
        setOpponentFouls(newOpponentFouls)
      } else {
        setOpponentFouls(savedGameData.opponentFouls || {})
      }
      setOpponentStarting5Set(savedGameData.opponentStarting5Set || false)
      setPreviousOpponentLineup(savedGameData.previousOpponentLineup || ['', '', '', '', ''])
      setSubstitutionHistory(savedGameData.substitutionHistory)
      setQuickSubHistory(savedGameData.quickSubHistory)
      setActionHistory(savedGameData.actionHistory)
      
      // Check if game was in progress
      if (savedGameData.gameState.isPlaying || savedGameData.events.length > 0) {
        setHasGameStarted(true)
        message.success('Previous game data restored from offline storage')
      }
    }
  }, [eventId])

  // Process loaded events to update player stats
  const processLoadedEvents = (loadedEvents: StatEvent[]) => {
    console.log('🔄 Processing loaded events to update player stats:', loadedEvents.length)
    
    // Create a copy of players to update
    const updatedPlayers = [...players]
    
    // Initialize analytics tracking
    const analyticsTotals: Record<number, { home: { scp: number; pto: number; benchPoints: number }; away: { scp: number; pto: number; benchPoints: number } }> = {}
    
    // Process each event
    loadedEvents.forEach(event => {
      if (event.opponentEvent) return // Skip opponent events
      
      const player = updatedPlayers.find(p => p.id === event.playerId)
      if (!player) return
      
      console.log('🔄 Processing event for player:', player.name, event.eventType, 'Metadata:', event.metadata)
      
      // Apply the event to update player stats
      switch (event.eventType) {
        case 'fg_made':
          player.fgMade += 1
          player.fgAttempted += 1
          player.twoPointMade += 1
          player.twoPointAttempted += 1
          player.points += 2
          player.plusMinus += 2
          
          // Handle metadata for analytics
          if (event.metadata?.pip) {
            player.pointsInPaint = (player.pointsInPaint || 0) + 2
          }
          break
        case 'fg_missed':
          player.fgAttempted += 1
          player.twoPointAttempted += 1
          break
        case 'three_made':
          player.threeMade += 1
          player.threeAttempted += 1
          player.fgMade += 1
          player.fgAttempted += 1
          player.points += 3
          player.plusMinus += 3
          break
        case 'three_missed':
          player.threeAttempted += 1
          player.fgAttempted += 1
          break
        case 'ft_made':
          player.ftMade += 1
          player.ftAttempted += 1
          player.points += 1
          player.plusMinus += 1
          break
        case 'ft_missed':
          player.ftAttempted += 1
          break
        case 'rebound':
          player.rebounds += 1
          break
        case 'assist':
          player.assists += 1
          break
        case 'steal':
          player.steals += 1
          break
        case 'block':
          player.blocks += 1
          break
        case 'foul':
          player.fouls += 1
          break
        case 'turnover':
          player.turnovers += 1
          player.plusMinus -= 1
          break
      }
      
      // Process analytics metadata
      if (event.metadata) {
        const quarter = event.quarter || 1
        const points = event.eventType === 'three_made' ? 3 : event.eventType === 'ft_made' ? 1 : event.eventType === 'fg_made' ? 2 : 0
        
        if (points > 0) {
          // Initialize quarter if not exists
          if (!analyticsTotals[quarter]) {
            analyticsTotals[quarter] = { home: { scp: 0, pto: 0, benchPoints: 0 }, away: { scp: 0, pto: 0, benchPoints: 0 } }
          }
          
          // Add to analytics
          if (event.metadata.scp) {
            analyticsTotals[quarter].home.scp += points
          }
          if (event.metadata.pto) {
            analyticsTotals[quarter].home.pto += points
          }
          if (event.metadata.bench) {
            analyticsTotals[quarter].home.benchPoints += points
          }
        }
      }
    })
    
    // Update the players state
    setPlayers(updatedPlayers)
    
    // Update analytics totals
    setAnalyticsTotals(analyticsTotals)
    
    console.log('✅ Updated player stats from loaded events')
    console.log('📊 Analytics totals:', analyticsTotals)
  }

  // Load events from database when session is active (but not when resuming)
  useEffect(() => {
    if (!liveSessionKey || isResuming) {
      console.log('🚫 Skipping events load - liveSessionKey:', !!liveSessionKey, 'isResuming:', isResuming)
      return
    }

    const loadEventsFromDatabase = async () => {
      try {
        // Don't load events if we already have events (from resume)
        if (events.length > 0) {
          console.log('🚫 Skipping events load - already have events:', events.length)
          return
        }
        
        const response = await fetch(`/api/live-stat-tracker?type=session&sessionKey=${liveSessionKey}`)
        const sessionData = await response.json()
        
        if (sessionData.success && sessionData.data && sessionData.data.live_game_events) {
          // Convert database events to StatEvent format and sort by created_at descending (newest first)
          const dbEvents: StatEvent[] = sessionData.data.live_game_events
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((event: any) => ({
              id: event.id.toString(),
              timestamp: new Date(event.created_at).getTime(),
              playerId: event.player_id || -1,
              playerName: event.player_id ? `Player ${event.player_id}` : 'Opponent',
              eventType: event.event_type,
              value: event.event_value,
              quarter: event.quarter,
              gameTime: event.game_time,
              opponentEvent: event.is_opponent_event,
              metadata: event.metadata || {}
            }))
          
          setEvents(dbEvents)
          console.log('Loaded events from database:', dbEvents.length)
          
          // Process events to update player stats
          processLoadedEvents(dbEvents)
        }
      } catch (error) {
        console.error('Failed to load events from database:', error)
      }
    }

    loadEventsFromDatabase()
  }, [liveSessionKey, isResuming, events.length])

  // Debug: Monitor game state changes
  useEffect(() => {
    console.log('🔍 Game state changed:', {
      quarter: gameState.quarter,
      homeScore: gameState.homeScore,
      opponentScore: gameState.opponentScore,
      isGameStarted: gameState.isGameStarted,
      isGameEnded: gameState.isGameEnded
    })
  }, [gameState.quarter, gameState.homeScore, gameState.opponentScore, gameState.isGameStarted, gameState.isGameEnded])

  // Enhanced save function for offline storage
  const saveGameDataOffline = (options?: { showToast?: boolean; silent?: boolean; throttle?: boolean }) => {
    if (!eventId) return
    
    const gameData: Partial<OfflineGameData> = {
      gameState,
      players,
      events,
      lineups,
      opponentOnCourt,
      opponentFouls,
      opponentStarting5Set,
      previousOpponentLineup,
      substitutionHistory,
      quickSubHistory,
      actionHistory
    }
    
    try {
      liveStatService.saveGameData(eventId, gameData)
      if (options?.showToast) {
        message.success('Game data saved offline successfully')
      }
    } catch (error: any) {
      if ((error as any).name === 'QuotaExceededError') {
        message.warning('Storage space low. Automatically cleaned up old data and saved essential game data.', 5)
      } else {
        message.error('Failed to save game data offline')
        console.error('Save error:', error)
      }
    }
  }

  // Add offline status indicator to the UI
  const renderOfflineStatus = () => {
    const getStatusColor = () => {
      if (!isOnline) return '#f5222d' // Red for offline
      if (syncStatus === 'synced') return '#52c41a' // Green for synced
      if (syncStatus === 'syncing') return '#faad14' // Yellow for syncing
      if (syncStatus === 'pending') return '#1890ff' // Blue for pending
      return '#f5222d' // Red for failed
    }

    const getStatusText = () => {
      if (!isOnline) return 'Offline - Events saved locally'
      if (syncStatus === 'synced') return 'Online - All data synced'
      if (syncStatus === 'syncing') return 'Syncing data...'
      if (syncStatus === 'pending') return `Online - ${offlineEvents.length} events pending sync`
      return 'Sync failed - Check connection'
    }

    const getStatusIcon = () => {
      if (!isOnline) return '📴'
      if (syncStatus === 'synced') return '✅'
      if (syncStatus === 'syncing') return '🔄'
      if (syncStatus === 'pending') return '⏳'
      return '❌'
    }
    
    return (
      <div style={{ 
        position: 'fixed', 
        top: 20, 
        right: 20, 
        zIndex: 1000,
        background: getStatusColor(),
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 600,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        maxWidth: '300px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '16px' }}>{getStatusIcon()}</span>
          <span>{getStatusText()}</span>
        </div>
        {lastSyncTime && syncStatus === 'synced' && (
          <div style={{ 
            fontSize: '12px', 
            marginTop: 4, 
            opacity: 0.8,
            textAlign: 'center'
          }}>
            Last sync: {lastSyncTime.toLocaleTimeString()}
        </div>
        )}
        {offlineEvents.length > 0 && (
          <div style={{ 
            fontSize: '12px', 
            marginTop: 4, 
            opacity: 0.8,
            textAlign: 'center'
          }}>
            {offlineEvents.length} events queued for sync
        </div>
        )}
      </div>
    )
  }

  // Navigation guard to prevent accidental exits during active game
  const navigationGuardEnabled = !suppressNavigationGuard && (hasGameStarted || gameState.isPlaying || events.length > 0)
  // Navigation guard - prevent accidental exits during active game
  useEffect(() => {
    if (!navigationGuardEnabled) return

    // 1) Block all navigation attempts globally
    // 1) Warn on browser refresh/close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
      return ''
    }

    // 2) Intercept anchor clicks and external navigations
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Bubble up to find anchor
      const anchor = target?.closest && target.closest('a') as HTMLAnchorElement | null
      const menuItem = target?.closest && (target.closest('.ant-menu-item') as HTMLElement | null)
      const roleMenuItem = target?.closest && (target.closest('[role="menuitem"]') as HTMLElement | null)

              // Case 1: Regular anchor navigation
        if (anchor) {
          const href = anchor.getAttribute('href') || ''
          if (!href || href.startsWith('#') || href.startsWith('javascript:')) return
          const url = new URL(href, window.location.href)
          const sameLocation = url.pathname === window.location.pathname && url.search === window.location.search
          if (sameLocation) return
          e.preventDefault()
          e.stopPropagation()
          modal.confirm({
          title: 'Leave Live Stat Tracking?',
          content: 'You have an active game in progress. Leaving this screen may interrupt tracking. Do you want to continue?',
          okText: 'Leave',
          cancelText: 'Stay',
          okButtonProps: { danger: true },
          onOk: () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
            document.removeEventListener('click', handleDocumentClick, true)
            window.removeEventListener('popstate', handlePopState)
            window.location.href = url.toString()
          }
        })
        return
      }

      // Case 2: AntD Menu or custom elements that navigate via router.push
      if (menuItem || roleMenuItem) {
        e.preventDefault()
        e.stopPropagation()
        modal.confirm({
          title: 'Leave Live Stat Tracking?',
          content: 'You have an active game in progress. Leaving this screen may interrupt tracking. Do you want to continue?',
          okText: 'Leave',
          cancelText: 'Stay',
          okButtonProps: { danger: true },
          onOk: () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
            document.removeEventListener('click', handleDocumentClick, true)
            window.removeEventListener('popstate', handlePopState)
            // Re-dispatch original click to proceed
            ;(menuItem || roleMenuItem)?.click()
          }
        })
      }
    }

    // Also capture pointer events for robustness
    const handlePointerDown = (e: PointerEvent) => {
      if (!navigationGuardEnabled) return
      const target = e.target as HTMLElement
      if (target.closest('.ant-menu-item') || target.closest('[role="menuitem"]')) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    // 4) Override router.push and router.replace to catch Next.js navigation
    const originalRouterPush = router.push
    const originalRouterReplace = router.replace
    
    router.push = function(href: string) {
      if (navigationGuardEnabled) {
        modal.confirm({
          title: 'Leave Live Stat Tracking?',
          content: 'You have an active game in progress. Leaving this screen may interrupt tracking. Do you want to continue?',
          okText: 'Leave',
          cancelText: 'Stay',
          okButtonProps: { danger: true },
          onOk: () => {
            // Temporarily remove all guards and navigate
            window.removeEventListener('beforeunload', handleBeforeUnload)
            document.removeEventListener('click', handleDocumentClick, true)
            document.removeEventListener('pointerdown', handlePointerDown, true)
            window.removeEventListener('popstate', handlePopState)
            setTimeout(() => originalRouterPush(href), 100)
          }
        })
        return
      }
      return originalRouterPush(href)
    }
    
    router.replace = function(href: string) {
      if (navigationGuardEnabled) {
        modal.confirm({
          title: 'Leave Live Stat Tracking?',
          content: 'You have an active game in progress. Leaving this screen may interrupt tracking. Do you want to continue?',
          okText: 'Leave',
          cancelText: 'Stay',
          okButtonProps: { danger: true },
          onOk: () => {
            // Temporarily remove all guards and navigate
            window.removeEventListener('beforeunload', handleBeforeUnload)
            document.removeEventListener('click', handleDocumentClick, true)
            document.removeEventListener('pointerdown', handlePointerDown, true)
            window.removeEventListener('popstate', handlePopState)
            setTimeout(() => originalRouterReplace(href), 100)
          }
        })
        return
      }
      return originalRouterReplace(href)
    }

    // 5) Add global navigation interceptor for any missed navigation attempts
    const handleGlobalNavigation = (e: Event) => {
      if (!navigationGuardEnabled) return
      
      // Check if this is a navigation event
      const target = e.target as HTMLElement
      if (target?.closest && (
        target.closest('a') ||
        target.closest('.ant-menu-item') ||
        target.closest('[role="menuitem"]') ||
        target.closest('.ant-menu-submenu') ||
        target.closest('[class*="menu"]') ||
        target.closest('[class*="nav"]') ||
        target.closest('[class*="sidebar"]')
      )) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        
        modal.confirm({
          title: 'Leave Live Stat Tracking?',
          content: 'You have an active game in progress. Leaving this screen may interrupt tracking. Do you want to continue?',
          okText: 'Leave',
          cancelText: 'Stay',
          okButtonProps: { danger: true },
          onOk: () => {
            // Temporarily remove all guards and allow navigation
            window.removeEventListener('beforeunload', handleBeforeUnload)
            document.removeEventListener('click', handleDocumentClick, true)
            document.removeEventListener('pointerdown', handlePointerDown, true)
            window.removeEventListener('popstate', handlePopState)
            // Re-trigger the original event
            setTimeout(() => {
              if (target) {
                target.click()
              }
            }, 100)
          }
        })
      }
    }

    // 3) Block back/forward button
    const pushState = () => {
      try { history.pushState(null, '', window.location.href) } catch {}
    }
    const handlePopState = (e: PopStateEvent) => {
      // Immediately push state back to block navigation
      pushState()
      modal.confirm({
        title: 'Leave Live Stat Tracking?',
        content: 'You have an active game in progress. Leaving this screen may interrupt tracking. Do you want to continue?',
        okText: 'Leave',
        cancelText: 'Stay',
        okButtonProps: { danger: true },
        onOk: () => {
          // Remove guards and go back
          window.removeEventListener('beforeunload', handleBeforeUnload)
          document.removeEventListener('click', handleDocumentClick, true)
          document.removeEventListener('pointerdown', handlePointerDown, true)
          window.removeEventListener('popstate', handlePopState)
          history.back()
        }
      })
    }

         // Attach
     window.addEventListener('beforeunload', handleBeforeUnload)
     document.addEventListener('click', handleDocumentClick, true)
     document.addEventListener('pointerdown', handlePointerDown, true)
     document.addEventListener('click', handleGlobalNavigation, true)
     document.addEventListener('mousedown', handleGlobalNavigation, true)
     document.addEventListener('touchstart', handleGlobalNavigation, true)
     pushState()
     window.addEventListener('popstate', handlePopState)

         // Cleanup
     return () => {
       window.removeEventListener('beforeunload', handleBeforeUnload)
       document.removeEventListener('click', handleDocumentClick, true)
       document.removeEventListener('pointerdown', handlePointerDown, true)
       document.removeEventListener('click', handleGlobalNavigation, true)
       document.removeEventListener('mousedown', handleGlobalNavigation, true)
       document.removeEventListener('touchstart', handleGlobalNavigation, true)
       window.removeEventListener('popstate', handlePopState)
       // Restore original router methods
       router.push = originalRouterPush
       router.replace = originalRouterReplace
     }
  }, [navigationGuardEnabled])
  // Show start screen if not auto-started and user hasn't started yet
  if (!autoStart && !hasUserStarted) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Card style={{ backgroundColor: '#17375c', border: '1px solid #295a8f' }}
          styles={{
            body: { backgroundColor: '#17375c', color: '#f5f7fa' },
            header: { backgroundColor: '#17375c', color: '#f5f7fa' }
          }}
        >
          <Space direction="vertical" size="large">
            <div>
              <Title level={2} style={{ color: '#f5f7fa' }}>
                🏀 Ready to Track Stats
              </Title>
              <Text type="secondary" style={{ color: '#dbeafe', fontSize: '16px' }}>
                Event #{eventId} is ready for live stat tracking
              </Text>
              {choice === 'resume' && (
                <div style={{ marginTop: 16 }}>
                  <Text style={{ color: '#52c41a', fontSize: '14px' }}>
                    📋 Will resume existing game data
                  </Text>
                </div>
              )}
              {choice === 'startOver' && (
                <div style={{ marginTop: 16 }}>
                  <Text style={{ color: '#faad14', fontSize: '14px' }}>
                    🔄 Will start fresh (existing data cleared)
                  </Text>
                </div>
              )}
            </div>
            
            <Space>
              <Button 
                type="primary" 
                size="large" 
                onClick={() => setShowConfirmModal(true)}
                style={{ height: '48px', fontSize: '16px', minWidth: '200px' }}
              >
                Start Live Stat Tracking
              </Button>
              <Button 
                size="large" 
                onClick={() => router.push('/live-stat-tracker')}
                style={{ height: '48px', fontSize: '16px' }}
              >
                Back to Event Selection
              </Button>
            </Space>
          </Space>
        </Card>
      </div>
    );
  }

  // Confirmation Modal
  const renderConfirmModal = () => (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#69b1ff' }} />
          <span style={{ color: '#f5f7fa' }}>Confirm Live Stat Tracking</span>
        </Space>
      }
      open={showConfirmModal}
      onOk={async () => {
        setShowConfirmModal(false);
        await startTracking();
      }}
      onCancel={() => setShowConfirmModal(false)}
      okText="Start Tracking"
      cancelText="Cancel"
      okButtonProps={{
        type: 'primary',
        icon: <TeamOutlined />,
        style: { backgroundColor: '#52c41a', borderColor: '#52c41a' }
      }}
      cancelButtonProps={{
        style: { borderColor: '#334155', color: '#e6e6e6', background: '#0f2741' }
      }}
      styles={{
        content: { backgroundColor: '#17375c', color: '#f5f7fa' },
        header: { backgroundColor: '#17375c', color: '#f5f7fa' },
        body: { backgroundColor: '#17375c', color: '#f5f7fa' }
      }}
      width={500}
    >
      <div style={{ padding: '16px 0' }}>
        <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#f5f7fa' }}>
          Are you sure you want to start live stat tracking for <strong>Event #{eventId}</strong>?
        </Text>
        <br /><br />
        <Text type="secondary" style={{ fontSize: '14px', color: '#cbd5e1' }}>
          This will launch the live stat tracker where you can:
        </Text>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li><Text type="secondary" style={{ color: '#cbd5e1' }}>Track player statistics in real-time</Text></li>
          <li><Text type="secondary" style={{ color: '#cbd5e1' }}>Monitor game progress and scoring</Text></li>
          <li><Text type="secondary" style={{ color: '#cbd5e1' }}>Manage player substitutions and lineups</Text></li>
          <li><Text type="secondary" style={{ color: '#cbd5e1' }}>Export game data and analytics</Text></li>
        </ul>
        <Text type="secondary" style={{ fontSize: '14px', color: '#cbd5e1' }}>
          You can return to event selection at any time.
        </Text>
      </div>
    </Modal>
  );

  return (
    <div 
      className={containerClassName}
      style={{
        paddingLeft: sidebarCollapsed ? '24px' : '16px',
        paddingRight: sidebarCollapsed ? '24px' : '16px',
        maxWidth: sidebarCollapsed ? '1400px' : '1200px',
        margin: '0 auto',
        width: '100%',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Offline status indicator */}
      {renderOfflineStatus()}
      
      {/* Enhanced Service Status Indicator */}
      <div style={{ 
        marginBottom: '16px', 
        padding: '8px 16px', 
        backgroundColor: serviceStatus === 'connected' ? '#f6ffed' : serviceStatus === 'error' ? '#fff2f0' : '#fff7e6',
        border: `1px solid ${serviceStatus === 'connected' ? '#b7eb8f' : serviceStatus === 'error' ? '#ffccc7' : '#ffe58f'}`,
        borderRadius: '6px',
        textAlign: 'center'
      }}>
        <Badge 
          status={serviceStatus === 'connected' ? 'success' : serviceStatus === 'error' ? 'error' : 'processing'}
          text={
            serviceStatus === 'connected' ? 'Enhanced Live Stat Tracker Active - Data syncing to database' :
            serviceStatus === 'error' ? 'Enhanced Service Error - Check console for details' :
            'Connecting to Enhanced Live Stat Tracker...'
          }
          style={{ 
            color: serviceStatus === 'connected' ? '#52c41a' : serviceStatus === 'error' ? '#ff4d4f' : '#faad14',
            fontSize: '14px',
            fontWeight: 500
          }}
        />
      </div>
      
      <Row gutter={[16, 16]}>
        {/* Game Clock and Controls */}
        <Col span={24}>
                      <Card
              className={style.gameControlBar + (needsScoreScroll || needsSidebarScroll ? ' scroll-on-large-score' : '')}
              styles={{ body: { padding: `12px ${sidebarCollapsed ? '16px' : '12px'}` } }}
              title={needsSidebarScroll ? '← Scroll to see all controls →' : undefined}
            >
                        <div className={style.centerContent}>
              <div className={style.scoreboardInner}>
                <Row 
                  align="middle" 
                  justify="space-around" 
                  wrap={false}
                  style={{ 
                    minHeight: 80, 
                    width: needsSidebarScroll ? '1200px' : '100%',
                    minWidth: needsSidebarScroll ? '1200px' : 'auto'
                  }}
                >
                  {/* Left: Start button above Quarter */}
                  <Col 
                    flex={needsSidebarScroll ? "0 0 110px" : "none"} 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      minWidth: 110,
                      width: needsSidebarScroll ? '110px' : 'auto'
                    }}
                  >
                    <Button 
                      type="primary" 
                      size={'middle'}
                      icon={gameState.isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
                      onClick={toggleGame}
                      disabled={
                        gameState.quarter >= settings.totalQuarters ||
                        (!gameState.isPlaying && !currentLineup)
                      }
                      style={{ marginBottom: 8, width: 110 }}
                    >
                      {gameState.isPlaying ? 'Pause' : 'Start'}
                    </Button>
                    <Title level={1} style={{ margin: 0, letterSpacing: 2, lineHeight: 1 }}>
                      {gameState.isOvertime ? `OT${Math.max(1, gameState.overtimeNumber || 1)}` : `Q${gameState.quarter}`}
                    </Title>
                  </Col>

                  {/* Game Controls: Undo and Next Qtr */}
                  <Col flex="none" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 12px' }}>
                    <Button 
                      size={'middle'}
                      icon={<StopOutlined />} 
                      onClick={undoLastAction}
                      disabled={actionHistory.length === 0 || gameState.quarter >= settings.totalQuarters}
                      style={{ marginBottom: 8, width: 110 }}
                    >
                      Undo
                    </Button>
                    <Button 
                      type={showReportButton && isReportEnabled ? 'primary' : 'default'}
                      size={'middle'}
                      icon={showReportButton ? <LockerIcon color={isReportEnabled ? '#b58842' : '#ccc'} /> : <ClockCircleOutlined />} 
                      onClick={showReportButton ? handleReportClick : nextQuarter} 
                      disabled={showReportButton ? !isReportEnabled : (() => {
                        if (gameState.quarter >= settings.totalQuarters) return true
                        if (!hasGameStarted) return true
                        const onCourt = players.filter(p => p.isOnCourt)
                        if (onCourt.length !== 5) return true
                        if (gameState.isPlaying) return true
                        return false
                      })()}
                      style={{ 
                        width: 110,
                        backgroundColor: showReportButton && !isReportEnabled ? '#666' : undefined,
                        borderColor: showReportButton && !isReportEnabled ? '#666' : undefined,
                        color: showReportButton && !isReportEnabled ? '#ccc' : undefined
                      }}
                    >
                      {showReportButton
                        ? 'Report'
                        : (
                          (gameState.quarter >= settings.totalQuarters && (gameState.homeScore === gameState.opponentScore) && !gameState.isPlaying)
                            ? 'Overtime?'
                            : (gameState.quarter >= settings.totalQuarters ? 'End Game' : 'Next Qtr')
                        )}
                    </Button>
                  </Col>

                  {/* Divider */}
                  <Col flex="none" style={{ display: 'flex', alignItems: 'stretch', height: '100%' }}>
                    <Divider type="vertical" className={style.scoreboardDivider} style={{ height: '100%', minHeight: 80, margin: '0 12px' }} />
                  </Col>

                  {/* Center: Score, Timeouts, Timeout Buttons */}
                  <Col flex="none" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    minWidth: sidebarCollapsed ? 320 : 260,
                    maxWidth: sidebarCollapsed ? 'none' : 400
                  }}>
                    <div style={{ 
                      textAlign: 'center', 
                      flex: 1,
                      padding: `0 ${calculatePadding()}`
                    }}>
                      <Title level={1} style={{ 
                        margin: 0, 
                        letterSpacing: needsLargeScoreScroll ? 0.5 : (needsScoreScroll ? 1 : 2), 
                        lineHeight: 1,
                        fontSize: needsLargeScoreScroll ? '2rem' : (needsScoreScroll ? '2.5rem' : '3rem')
                      }}>
                        <span
                          className="score-value"
                          style={{ 
                            color: '#fff', 
                            fontWeight: 700,
                            display: 'inline-block',
                            minWidth: needsLargeScoreScroll ? '100px' : (needsScoreScroll ? '80px' : '60px'),
                            textAlign: 'right'
                          }}
                        >
                          HOME {gameState.homeScore}
                        </span>
                        <span style={{ 
                          color: '#aaa', 
                          fontWeight: 400,
                          margin: '0 8px'
                        }}> - </span>
                        <span
                          className="score-value"
                          style={{ 
                            color: '#fff', 
                            fontWeight: 700,
                            display: 'inline-block',
                            minWidth: needsLargeScoreScroll ? '100px' : (needsScoreScroll ? '80px' : '60px'),
                            textAlign: 'left'
                          }}
                        >
                          {gameState.opponentScore} OPP
                        </span>
                      </Title>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4, marginBottom: 4, gap: 8 }}>
                        <Tooltip title="Team Fouls - Home">
                          <Text style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e6f2ff', padding: '4px 10px', border: '1px solid #295a8f', borderRadius: 6, background: '#0f2e52' }}>
                            TF: {gameState.teamFoulsHome}
                          </Text>
                        </Tooltip>
                        <Tooltip title="Timeout - Home">
                          <Badge count={gameState.timeoutHome} style={{ backgroundColor: '#1890ff' }}>
                            <Button 
                              type="dashed" 
                              size={'middle'}
                              onClick={() => handleTimeout('home')}
                              disabled={gameState.timeoutHome <= 0 || gameState.quarter >= settings.totalQuarters}
                              style={{ minWidth: 50 }}
                            >
                              HOME
                            </Button>
                          </Badge>
                        </Tooltip>
                        <Text type="secondary" style={{ fontSize: '0.9rem', margin: '0 12px' }}>
                          Timeouts
                        </Text>
                        <Tooltip title="Timeout - OPP">
                          <Badge count={gameState.timeoutAway} style={{ backgroundColor: '#aaa' }}>
                            <Button 
                              type="dashed" 
                              size={'middle'}
                              onClick={() => handleTimeout('away')}
                              disabled={gameState.timeoutAway <= 0 || gameState.quarter >= settings.totalQuarters}
                              style={{ minWidth: 50 }}
                            >
                              OPP
                            </Button>
                          </Badge>
                        </Tooltip>
                        <Tooltip title="Team Fouls - Away">
                          <Text style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e6f2ff', padding: '4px 10px', border: '1px solid #295a8f', borderRadius: 6, background: '#0f2e52' }}>
                            TF: {gameState.teamFoulsAway}
                          </Text>
                        </Tooltip>
                      </div>

                    </div>
                  </Col>

                  {/* Divider */}
                  <Col flex="none" style={{ display: 'flex', alignItems: 'stretch', height: '100%' }}>
                    <Divider type="vertical" className={style.scoreboardDivider} style={{ height: '100%', minHeight: 80, margin: '0 16px' }} />
                  </Col>

                  {/* Right: Export/Settings vertical stack */}
                  <Col flex="none" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 140 }}>
                    <div className={style.scoreboardRightGrid}>
                      {/* Row 1 */}
                      <Button 
                        size={'middle'}
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
                        type={activeTab === 'analytics' ? 'primary' : 'default'} 
                        onClick={() => setActiveTab('analytics')}
                        style={{ width: 110, gridRow: 2, gridColumn: 2 }}
                      >
                        Analytics
                      </Button>
                      {/* Settings under Export (same column, next row) */}
                      <Button 
                        icon={<SettingOutlined />}
                        onClick={() => { setShowSettingsModal(true); setSuppressNavigationGuard(true) }}
                        style={{ width: 110, gridRow: 2, gridColumn: 1 }}
                      >
                        Settings
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
                  <Button type="primary" onClick={handleHalftimeResume}>Continue Game</Button>
                </div>
              }
              className={style.halftimeReport}
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card title="📊 Team Performance" className={style.insightCard}>
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
                  <Card title="🏆 Player Highlights" className={style.insightCard}>
                    <div style={{ color: 'white' }}>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Top Scorer:</Text> #{halftimeData.topScorer?.number ?? 'N/A'} {halftimeData.topScorer?.name ?? 'N/A'} ({halftimeData.topScorer?.points ?? 0} pts)
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Top Rebounder:</Text> #{halftimeData.topRebounder?.number ?? 'N/A'} {halftimeData.topRebounder?.name ?? 'N/A'} ({halftimeData.topRebounder?.rebounds ?? 0} reb)
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Top Assister:</Text> #{halftimeData.topAssister?.number ?? 'N/A'} {halftimeData.topAssister?.name ?? 'N/A'} ({halftimeData.topAssister?.assists ?? 0} ast)
                      </div>
                      <div>
                        <Text strong>Most Efficient:</Text> #{halftimeData.mostEfficient?.player?.number ?? 'N/A'} {halftimeData.mostEfficient?.player?.name ?? 'N/A'} (+{halftimeData.mostEfficient?.efficiency ?? 0})
                      </div>
                    </div>
                  </Card>
                </Col>
                {/* Removed score context per request */}
                <Col span={24}>
                  <TeamComparisonTable 
                    teamStats={halftimeData.teamStats} 
                    opponentStats={(halftimeData as any).opponentStats || {}} 
                    teamName={eventData?.name || "HOME"}
                    opponentName={eventData?.oppositionTeam || "OPPONENT"}
                  />
                </Col>
                {/* {settings.showRecommendations && (
                  <Col span={24}>
                    <Card title="💡 Strategic Recommendations" className={style.recommendations}>
                      <ul>
                        {halftimeData.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </Card>
                  </Col>
                )} */}
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
                  <Card title="📈 Recent Momentum" className={style.insightCard}>
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
                        <Text strong>Recent Events:</Text> {timeoutData.recentEvents?.length ?? 0} events
                      </div>
                      <div>
                        <Text strong>Key Player:</Text> #{timeoutData.keyPlayer?.number ?? 'N/A'} {timeoutData.keyPlayer?.name ?? 'N/A'} (+{timeoutData.keyPlayer?.plusMinus ?? 0})
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
                  <Card title="📊 Score Update" className={style.insightCard}>
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
                  <Card title="🏆 Player Highlights" className={style.insightCard}>
                    <div style={{ color: 'white' }}>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Top Scorer:</Text> #{timeoutData.topScorer?.number ?? 'N/A'} {timeoutData.topScorer?.name ?? 'N/A'} ({timeoutData.topScorer?.points ?? 0} pts)
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Top Rebounder:</Text> #{timeoutData.topRebounder?.number ?? 'N/A'} {timeoutData.topRebounder?.name ?? 'N/A'} ({timeoutData.topRebounder?.rebounds ?? 0} reb)
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Top Assister:</Text> #{timeoutData.topAssister?.number ?? 'N/A'} {timeoutData.topAssister?.name ?? 'N/A'} ({timeoutData.topAssister?.assists ?? 0} ast)
                      </div>
                      <div>
                        <Text strong>Most Efficient:</Text> #{timeoutData.mostEfficient?.player?.number ?? 'N/A'} {timeoutData.mostEfficient?.player?.name ?? 'N/A'} (+{timeoutData.mostEfficient?.efficiency ?? 0})
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="📊 Team Performance" className={style.insightCard}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic title="Shooting Efficiency" value={`${timeoutData.teamStats?.fgPercentage ?? 0}%`} />
                      </Col>
                      <Col span={12}>
                        <Statistic title="Rebound Rate" value={`${timeoutData.teamStats?.totalRebounds ?? 0}`} />
                      </Col>
                      <Col span={12}>
                        <Statistic title="A/T Ratio" value={(timeoutData.teamStats?.assistToTurnoverRatio ?? 0).toFixed(2)} />
                      </Col>
                      <Col span={12}>
                        <Statistic title="Points (2min)" value={timeoutData.teamStats?.totalPoints ?? 0} />
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="🔥 Opponent Run & Hot Hand" className={style.insightCard}>
                    <div style={{ color: 'white' }}>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Opponent Run:</Text> {timeoutData.recentOpponentRun}
                      </div>
                      {timeoutData.hotOpponent && (
                        <div>
                          <Text strong>Hot Opponent:</Text> {timeoutData.hotOpponent?.name ?? 'N/A'} ({timeoutData.hotOpponent?.points ?? 0} pts)
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
                {/* Removed score context per request */}
                <Col span={24}>
                  <TeamComparisonTable 
                    teamStats={timeoutData.teamStats || {}} 
                    opponentStats={(timeoutData as any).opponentStats || {}} 
                    teamName={eventData?.name || "HOME"}
                    opponentName={eventData?.oppositionTeam || "OPPONENT"}
                  />
                </Col>
                {/* <Col span={24}>
                  <Card title="💡 Strategic Recommendations" className={style.recommendations}>
                    <ul>
                      {timeoutData.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </Card>
                </Col> */}
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
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button icon={<DownloadOutlined />} onClick={() => exportGameData('json')} block>
            Export as JSON
          </Button>
          <Button icon={<DownloadOutlined />} onClick={() => exportGameData('csv')} block>
            Export as CSV
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={() => exportGameData('maxpreps')} 
            block
            style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', color: '#ffffff', fontWeight: 700 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div>Export for MaxPreps (.txt)</div>
              
            </div>
          </Button>
        </Space>
      </Modal>

      {/* Points in Paint Modal */}
      <Modal
        open={showPipModal}
        onCancel={() => handlePipConfirm(false)}
        footer={null}
        centered
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
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: '22px', marginBottom: '24px' }}>
            Was this 2-point field goal made in the paint?
          </p>
          <Space size="large">
            <Button 
              type="primary" 
              size="large"
              onClick={() => handlePipConfirm(true)}
              style={{ 
                minWidth: '200px', 
                height: '80px', 
                fontSize: '24px',
                fontWeight: 'bold',
                padding: '12px 24px'
              }}
            >
              ✓ Yes
            </Button>
            <Button 
              size="large"
              onClick={() => handlePipConfirm(false)}
              style={{ 
                minWidth: '200px', 
                height: '80px', 
                fontSize: '24px',
                fontWeight: 'bold',
                padding: '12px 24px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div>✕ No</div>
                <Text type="secondary" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                  (or click out)
                </Text>
              </div>
            </Button>
          </Space>
        </div>
      </Modal>

      {/* Assist Selection Modal */}
      <Modal
        open={showAssistModal}
        onCancel={() => handleAssistConfirm(null)}
        footer={null}
        centered
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
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '22px', marginBottom: '24px', textAlign: 'center' }}>
            Who assisted on this field goal?
          </p>
          
          {/* 2x2 Grid of other 4 players */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px', 
            marginBottom: '24px',
            maxWidth: '400px',
            margin: '0 auto 24px auto'
          }}>
            {(() => {
              if (!pendingAssistEvent) return null
              
              // Get the other 4 players (excluding the scorer)
              const scorerId = pendingAssistEvent.playerId
              const isOpponent = pendingAssistEvent.isOpponent
              const opponentSlot = pendingAssistEvent.opponentSlot
              
              let otherPlayers = []
              
              if (isOpponent) {
                // For opponent players, get the other 4 opponent players on court
                otherPlayers = opponentOnCourt
                  .map((jersey, index) => ({ jersey, index }))
                  .filter(({ jersey, index }) => jersey && index !== opponentSlot)
                  .map(({ jersey, index }) => ({
                    id: `opponent-${index}`,
                    number: jersey,
                    name: `#${jersey}`,
                    position: 'Opponent'
                  }))
              } else {
                // For home team players, get the other 4 players from current lineup
                if (!currentLineup) return null
                otherPlayers = currentLineup.players
                  .filter(playerId => playerId !== scorerId)
                  .map(playerId => players.find(p => p.id === playerId))
                  .filter(Boolean)
              }
              
              return otherPlayers.map((player, index) => {
                if (!player) return null
                return (
                  <div
                    key={player.id}
                    onClick={() => handleAssistConfirm(player.id)}
                    style={{
                      padding: '16px',
                      border: '2px solid #434343',
                      borderRadius: '12px',
                      background: '#262626',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                      minHeight: '80px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#1890ff'
                      e.currentTarget.style.background = '#1a3a5c'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#434343'
                      e.currentTarget.style.background = '#262626'
                    }}
                  >
                    <Text strong style={{ color: '#f5f7fa', fontSize: '1.25rem', display: 'block' }}>
                      {player.name}
                    </Text>
                    {!isOpponent && (
                      <Text type="secondary" style={{ color: '#a6a6a6', fontSize: '1.35rem' }}>
                        {`#${player.number} | ${player.position}`}
                      </Text>
                    )}
                    {isOpponent && (
                      <Text type="secondary" style={{ color: '#a6a6a6', fontSize: '1.1rem' }}>
                        Opponent
                      </Text>
                    )}
                  </div>
                )
              })
            })()}
          </div>
          
          {/* Wide red No Assist button */}
          <div style={{ textAlign: 'center' }}>
            <Button 
              danger
              size="large"
              onClick={() => handleAssistConfirm(null)}
              style={{ 
                minWidth: '300px',
                height: '48px',
                fontSize: '16px',
                fontWeight: 600
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div>✕   No Assist   ✕</div>
                <Text type="secondary" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                  (or click out)
                </Text>
              </div>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Block Selection Modal */}
      <Modal
        open={showBlockModal}
        onCancel={() => {
          message.warning('Please select whose shot was blocked to complete the block')
        }}
        footer={null}
        centered
        closable={false}
        styles={{
          content: {
            backgroundColor: '#17375c',
            color: '#f5f7fa',
            position: 'relative'
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
        {/* X button to undo the block action - positioned at top right of modal */}
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={() => {
            // Undo the block action by removing the last block event
            if (pendingBlockEvent) {
              const { playerId, isOpponent, opponentSlot } = pendingBlockEvent
              
              // Remove the block event from events
              setEvents(prev => prev.filter(event => 
                !(event.eventType === 'block' && 
                  event.playerId === (isOpponent ? -1 : playerId) &&
                  event.timestamp > Date.now() - 5000) // Remove recent block events
              ))
              
              // Update player stats to remove the block
              if (isOpponent) {
                // For opponent, we can't easily track individual stats, so just remove the event
              } else if (playerId) {
                // For home team, update the player's block count
                setPlayers(prev => prev.map(p => 
                  p.id === playerId 
                    ? { ...p, blocks: Math.max(0, p.blocks - 1) }
                    : p
                ))
              }
            }
            
            setShowBlockModal(false)
            setPendingBlockEvent(null)
            message.success('Block action undone')
          }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            color: '#ff4d4f',
            fontSize: '18px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ff4d4f',
            borderRadius: '50%',
            zIndex: 1000
          }}
        />
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '22px', marginBottom: '24px', textAlign: 'center' }}>
            Select the player whose shot was blocked:
          </p>
          
          {/* 2x2 Grid of all 5 players on court */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px', 
            marginBottom: '24px',
            maxWidth: '400px',
            margin: '0 auto 24px auto'
          }}>
            {(() => {
              if (!pendingBlockEvent) return null
              
              const { isOpponent } = pendingBlockEvent
              let allPlayers = []
              
              if (isOpponent) {
                // For opponent blocks, show all 5 home team players from current lineup
                if (!currentLineup) return null
                allPlayers = currentLineup.players
                  .map(playerId => players.find(p => p.id === playerId))
                  .filter(Boolean)
              } else {
                // For home team blocks, show all 5 opponent players on court
                allPlayers = opponentOnCourt
                  .map((jersey, index) => ({ jersey, index }))
                  .filter(({ jersey }) => jersey)
                  .map(({ jersey, index }) => ({
                    id: `opponent-${index}`,
                    number: jersey,
                    name: jersey,
                    position: 'Opponent'
                  }))
              }
              
              return allPlayers.map((player, index) => {
                if (!player) return null
                return (
                  <div
                    key={player.id}
                    onClick={() => handleBlockConfirm(player.id)}
                    style={{
                      padding: '16px',
                      border: '2px solid #434343',
                      borderRadius: '12px',
                      background: '#262626',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                      minHeight: '80px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#1890ff'
                      e.currentTarget.style.background = '#1a3a5c'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#434343'
                      e.currentTarget.style.background = '#262626'
                    }}
                  >
                    <Text strong style={{ color: '#f5f7fa', fontSize: '1.25rem', display: 'block' }}>
                      {player.name}
                    </Text>
                    <Text type="secondary" style={{ color: '#a6a6a6', fontSize: '1.1rem' }}>
                    #{player.number} | {player.position}
                    </Text>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </Modal>

      {/* Rebound Selection Modal */}
      <Modal
        
        open={showReboundModal}
        onCancel={() => handleReboundConfirm(null)}
        footer={null}
        centered
        width={1100}
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
        <div style={{ padding: '12px 0' }}>
          <p style={{ fontSize: '22px', marginBottom: '12px', textAlign: 'center' }}>
            Who got the rebound?
          </p>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            {/* Home Team */}
            <div style={{ flex: 1 }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <Text strong style={{ fontSize: '18px', color: '#f5f7fa' }}>Home Team</Text>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '8px'
              }}>
                {(() => {
                  const homePlayers = players.filter(p => p.isOnCourt)
                  return homePlayers.slice(0, 5).map((player, index) => (
                    <div key={player.id}>
                      <div
                        onClick={() => handleReboundConfirm(player.id, false)}
                        style={{
                          padding: '8px',
                          border: '2px solid #434343',
                          borderRadius: '12px',
                          background: '#262626',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          textAlign: 'center',
                          width: '240px',
                          height: '70px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#1890ff'
                          e.currentTarget.style.background = '#1a3a5c'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#434343'
                          e.currentTarget.style.background = '#262626'
                        }}
                      >
                        <Text strong style={{ 
                          color: '#f5f7fa', 
                          fontSize: `#${player.number} ${player.name}`.length > 20 ? '1rem' : '1.25rem', 
                          display: 'block',
                          lineHeight: '1.2',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                           {player.name}
                        </Text>
                        <Text type="secondary" style={{ color: '#a6a6a6', fontSize: '1.1rem' }}>
                        #{player.number} | {player.position}
                        </Text>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </div>
            
            {/* Vertical Divider */}
            <div style={{ 
              width: '2px', 
              background: '#434343', 
              margin: '6px 10px',
              height: '225px' // Shorter height for just the first 2 rows
            }}></div>
            
            {/* Opponent Team */}
            <div style={{ flex: 1 }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <Text strong style={{ fontSize: '18px', color: '#f5f7fa' }}>Opponent</Text>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '8px'
              }}>
                {(() => {
                  const opponentEntries = Object.entries(opponentOnCourt).filter(([slot, jerseyNumber]) => jerseyNumber?.trim())
                  const players = opponentEntries.slice(0, 5)
                  
                  // Create a 2x3 grid with empty slots where needed
                  const gridSlots = [
                    [players[0], players[1]], // Row 1: players 1, 2
                    [players[2], players[3]], // Row 2: players 3, 4  
                    [null, players[4]]        // Row 3: empty, player 5 (right column)
                  ]
                  
                  return gridSlots.flat().map((player, index) => (
                    <div key={player ? player[0] : `empty-${index}`}>
                      {player ? (
                        <div
                          onClick={() => handleReboundConfirm(parseInt(player[0]), true)}
                        style={{
                            padding: '8px',
                          border: '2px solid #434343',
                          borderRadius: '12px',
                          background: '#262626',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          textAlign: 'center',
                            width: '240px',
                            height: '70px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#ff4d4f'
                          e.currentTarget.style.background = '#5c1a1a'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#434343'
                          e.currentTarget.style.background = '#262626'
                        }}
                      >
                          <Text strong style={{ 
                            color: '#f5f7fa', 
                            fontSize: '1.25rem', 
                            display: 'block',
                            lineHeight: '1.2',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            #{player[1]}
                        </Text>
                        <Text type="secondary" style={{ color: '#a6a6a6', fontSize: '1.1rem' }}>
                        Opponent
                        </Text>
                      </div>
                      ) : (
                        <div style={{ width: '240px', height: '70px' }}></div>
                      )}
                    </div>
                  ))
                })()}
              </div>
            </div>
          </div>
          
          {/* No Rebound button - positioned in the empty slot between teams below the divider */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: '0px',
            paddingLeft: '60px', // Start from halfway of second home column (240px/2)
            paddingRight: '60px' // End at halfway of first opponent column (240px/2)
          }}>
            <div style={{ 
              padding: '8px',
              border: '2px solid #434343',
              borderRadius: '12px',
              background: '#262626',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              height: '70px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: '100%',
              maxWidth: '300px'
            }}
            onClick={() => handleReboundConfirm(null)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ff4d4f'
              e.currentTarget.style.background = '#5c1a1a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#434343'
              e.currentTarget.style.background = '#262626'
            }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Text strong style={{ color: '#f5f7fa', fontSize: '1.25rem', display: 'block' }}>
                  ✕ No Rebound ✕
                </Text>
                <Text type="secondary" style={{ fontSize: '0.8rem', marginTop: '0px', color: '#a6a6a6' }}>
                  (or click out)
                </Text>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Steal Selection Modal */}
      <Modal
        open={showStealModal}
        onCancel={() => {
          message.warning('Please select who turned the ball over to complete the steal')
        }}
        closable={false}
        footer={null}
        centered
        width={600}
        styles={{
          content: {
            backgroundColor: '#17375c',
            color: '#f5f7fa',
            position: 'relative'
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
        {/* X button to undo the steal action - positioned at top right of modal */}
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={() => {
            // Undo the steal action by removing the last steal event
            if (pendingStealEvent) {
              const { playerId, isOpponent, opponentSlot } = pendingStealEvent
              
              // Remove the steal event from events
              setEvents(prev => prev.filter(event => 
                !(event.eventType === 'steal' && 
                  event.playerId === (isOpponent ? -1 : playerId) &&
                  event.timestamp > Date.now() - 5000) // Remove recent steal events
              ))
              
              // Update player stats to remove the steal
              if (isOpponent) {
                // For opponent, we can't easily track individual stats, so just remove the event
              } else if (playerId) {
                // For home team, update the player's steal count
                setPlayers(prev => prev.map(p => 
                  p.id === playerId 
                    ? { ...p, steals: Math.max(0, p.steals - 1) }
                    : p
                ))
              }
            }
            
            setShowStealModal(false)
            setPendingStealEvent(null)
            message.success('Steal action undone')
          }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            color: '#ff4d4f',
            fontSize: '18px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ff4d4f',
            borderRadius: '50%',
            zIndex: 1000
          }}
        />
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '22px', marginBottom: '24px', textAlign: 'center' }}>
            Who turned the ball over?
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px'
          }}>
            {(() => {
              // Show opposite team players (if home player stole, show opponent players)
              const { isOpponent } = pendingStealEvent || {}
              
              if (isOpponent) {
                // Opponent stole, show home team players
                const homePlayers = players.filter(p => p.isOnCourt)
                return homePlayers.map((player) => (
                  <div key={player.id}>
                    <div
                      onClick={() => handleStealConfirm(player.id, false)}
                      style={{
                        padding: '16px',
                        border: '2px solid #434343',
                        borderRadius: '12px',
                        background: '#262626',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        minHeight: '80px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#1890ff'
                        e.currentTarget.style.background = '#1a3a5c'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#434343'
                        e.currentTarget.style.background = '#262626'
                      }}
                    >
                      <Text strong style={{ color: '#f5f7fa', fontSize: '1.25rem', display: 'block' }}>
                        #{player.number} {player.name}
                      </Text>
                      <Text type="secondary" style={{ color: '#a6a6a6', fontSize: '1.1rem' }}>
                        {player.position}
                      </Text>
                    </div>
                  </div>
                ))
              } else {
                // Home player stole, show opponent players
                const opponentEntries = Object.entries(opponentOnCourt).filter(([slot, jerseyNumber]) => jerseyNumber?.trim())
                return opponentEntries.map(([slot, jerseyNumber]) => (
                  <div key={slot}>
                    <div
                      onClick={() => handleStealConfirm(parseInt(slot), true)}
                      style={{
                        padding: '16px',
                        border: '2px solid #434343',
                        borderRadius: '12px',
                        background: '#262626',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        minHeight: '80px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#ff4d4f'
                        e.currentTarget.style.background = '#5c1a1a'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#434343'
                        e.currentTarget.style.background = '#262626'
                      }}
                    >
                      <Text strong style={{ color: '#f5f7fa', fontSize: '1.25rem', display: 'block' }}>
                        #{jerseyNumber}
                      </Text>
                      <Text type="secondary" style={{ color: '#a6a6a6', fontSize: '1.1rem' }}>
                        Opponent
                      </Text>
                    </div>
                  </div>
                ))
              }
            })()}
          </div>
        </div>
      </Modal>

      {/* Turnover Selection Modal */}
      <Modal
        open={showTurnoverModal}
        onCancel={() => handleTurnoverConfirm(null)}
        footer={null}
        centered
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
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '22px', marginBottom: '24px', textAlign: 'center' }}>
            Who stole the ball?
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            {(() => {
              // Show opposite team players (if home player turned it over, show opponent players)
              const { isOpponent } = pendingTurnoverEvent || {}
              
              if (isOpponent) {
                // Opponent turned it over, show home team players
                const homePlayers = players.filter(p => p.isOnCourt)
                return homePlayers.map((player) => (
                  <div key={player.id}>
                    <div
                      onClick={() => handleTurnoverConfirm(player.id, false)}
                      style={{
                        padding: '8px',
                        border: '2px solid #434343',
                        borderRadius: '12px',
                        background: '#262626',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        width: '100%',
                        height: '70px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#1890ff'
                        e.currentTarget.style.background = '#1a3a5c'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#434343'
                        e.currentTarget.style.background = '#262626'
                      }}
                    >
                      <Text strong style={{ color: '#f5f7fa', fontSize: '1.25rem', display: 'block' }}>
                        #{player.number} {player.name}
                      </Text>
                      <Text type="secondary" style={{ color: '#a6a6a6', fontSize: '1.1rem' }}>
                        {player.position}
                      </Text>
                    </div>
                  </div>
                ))
              } else {
                // Home player turned it over, show opponent players
                const opponentEntries = Object.entries(opponentOnCourt).filter(([slot, jerseyNumber]) => jerseyNumber?.trim())
                return opponentEntries.map(([slot, jerseyNumber]) => (
                  <div key={slot}>
                    <div
                      onClick={() => handleTurnoverConfirm(parseInt(slot), true)}
                      style={{
                        padding: '8px',
                        border: '2px solid #434343',
                        borderRadius: '12px',
                        background: '#262626',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        width: '100%',
                        height: '70px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#1890ff'
                        e.currentTarget.style.background = '#1a3a5c'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#434343'
                        e.currentTarget.style.background = '#262626'
                      }}
                    >
                      <Text strong style={{ color: '#f5f7fa', fontSize: '1.25rem', display: 'block' }}>
                        #{jerseyNumber}
                      </Text>
                      <Text type="secondary" style={{ color: '#a6a6a6', fontSize: '1.1rem' }}>
                        Opponent
                      </Text>
                    </div>
                  </div>
                ))
              }
            })()}
            
            {/* No Steal button */}
            <div>
              <div
                onClick={() => handleTurnoverConfirm(null)}
                style={{
                  padding: '8px',
                  border: '2px solid #434343',
                  borderRadius: '12px',
                  background: '#262626',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                  width: '100%',
                  height: '70px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ff4d4f'
                  e.currentTarget.style.background = '#5c1a1a'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#434343'
                  e.currentTarget.style.background = '#262626'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Text strong style={{ color: '#f5f7fa', fontSize: '1.25rem', display: 'block' }}>
                    ✕ No Steal ✕
                  </Text>
                  <Text type="secondary" style={{ fontSize: '0.8rem', marginTop: '4px', color: '#a6a6a6' }}>
                    (or click out)
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Foul Type Selection Modal */}
      <Modal
        open={showFoulModal}
        onCancel={() => handleFoulConfirm(false)}
        footer={null}
        centered
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
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: '22px', marginBottom: '24px' }}>
            What type of foul was this?
          </p>
          <Space size="large">
            <Button 
              type="primary" 
              size="large"
              onClick={() => handleFoulConfirm(false)}
              style={{ 
                minWidth: '200px', 
                height: '80px', 
                fontSize: '24px',
                fontWeight: 'bold',
                padding: '12px 24px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div>Defensive</div>
                <Text type="secondary" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                  (or click out)
                </Text>
              </div>
            </Button>
            <Button 
              size="large"
              onClick={() => handleFoulConfirm(true)}
              style={{ 
                minWidth: '200px', 
                height: '80px', 
                fontSize: '24px',
                fontWeight: 'bold',
                padding: '12px 24px'
              }}
                        >
              Offensive
            </Button>
          </Space>
          
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        title="Game Settings"
        open={showSettingsModal}
        onCancel={() => { setShowSettingsModal(false); setSuppressNavigationGuard(false) }}
        width={800}
        footer={[
          <Button key="reset" onClick={resetSettings}>
            Reset to Defaults
          </Button>,
          // <Button key="export" onClick={exportSettings}>
          //   Export Settings
          // </Button>,
          <Button key="cancel" onClick={() => { setShowSettingsModal(false); setSuppressNavigationGuard(false) }}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={() => { setShowSettingsModal(false); setSuppressNavigationGuard(false) }}>
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
                    <SettingRow label="Ask after 2PT Made: Points in Paint?" controlType="switch" value={settings.askForPointsInPaint} onChange={checked => saveSettings({ askForPointsInPaint: checked })} />
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
            },
            {
              key: 'offline',
              label: 'Offline Management',
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card title="Offline Storage Status" size="small" style={{ marginBottom: 16 }}>
                      <Row gutter={[16, 16]}>
                        <Col span={8}>
                          <Statistic 
                            title="Storage Used" 
                            value={liveStatService.getStorageUsage().percentage} 
                            suffix="%" 
                            valueStyle={{ color: liveStatService.getStorageUsage().percentage > 80 ? '#f5222d' : '#52c41a' }}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic 
                            title="Saved Games" 
                            value={savedGames.length} 
                            suffix="games"
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic 
                            title="Connection" 
                            value={liveStatService.getOfflineStatus().isOnline ? 'Online' : 'Offline'} 
                            valueStyle={{ color: liveStatService.getOfflineStatus().isOnline ? '#52c41a' : '#f5222d' }}
                          />
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Button 
                      type="primary" 
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        const data = liveStatService.exportOfflineData()
                        const blob = new Blob([data], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = `offline-data-${Date.now()}.json`
                        link.click()
                        message.success('Offline data exported successfully')
                      }}
                      block
                    >
                      Export All Offline Data
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button 
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => {
                        modal.confirm({
                          title: 'Clear All Offline Data',
                          content: 'This will permanently delete all saved games and offline data. This action cannot be undone.',
                          okText: 'Clear All',
                          cancelText: 'Cancel',
                          onOk: async () => {
                            liveStatService.clearAllOfflineData()
                            message.success('All offline data cleared')
                            refreshSavedGames()
                          }
                        })
                      }}
                      block
                    >
                      Clear All Offline Data
                    </Button>
                  </Col>
                  <Col span={24}>
                    <Card 
                      title="Saved Games" 
                      size="small"
                      extra={
                        <Space>
                          <Button 
                            size="small" 
                            icon={<ReloadOutlined />} 
                            onClick={refreshSavedGames}
                          >
                            Refresh
                          </Button>
                          <Button 
                            size="small" 
                            type="primary"
                            onClick={async () => {
                              try {
                                const sessionId = liveStatService.getCurrentSessionKey()
                                if (sessionId) {
                                  const result = await liveStatService.aggregateGameStats(parseInt(sessionId))
                                  message.success(`Stats aggregated! Game ID: ${result.gameId}`)
                                  refreshSavedGames()
                                } else {
                                  message.info('No active session to aggregate')
                                }
                              } catch (error) {
                                console.error('Failed to aggregate stats:', error)
                                message.error('Failed to aggregate stats')
                              }
                            }}
                          >
                            Aggregate Current
                          </Button>
                          <Button 
                            size="small" 
                            type="default"
                            onClick={async () => {
                              try {
                                // Aggregate the existing session (ID 1) that has data
                                const result = await liveStatService.aggregateExistingSession(1)
                                message.success(`Existing session aggregated! Game ID: ${result.gameId}`)
                                refreshSavedGames()
                              } catch (error) {
                                console.error('Failed to aggregate existing session:', error)
                                message.error('Failed to aggregate existing session')
                              }
                            }}
                          >
                            Aggregate Existing
                          </Button>
                        </Space>
                      }
                    >
                      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {savedGames.length > 0 ? (
                          savedGames.map((game, index) => (
                            <div key={game.id} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              padding: '10px 14px',
                              margin: '6px 0',
                              background: index % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)',
                              borderRadius: 8,
                              border: '1px solid rgba(255,255,255,0.12)'
                            }}>
                              <div>
                                <Text strong>Event #{game.eventId}</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: '0.8rem' }}>
                                  {new Date(game.timestamp).toLocaleString()} • {game.events.length} events
                                </Text>
                              </div>
                              <Space>
                                <Button 
                                  size="small" 
                                  onClick={async () => {
                                    if (game.eventId === eventId) {
                                      // Load this game data from database
                                      const gameData = await liveStatService.loadGameDataFromDatabase(game.sessionKey)
                                      if (gameData) {
                                        setGameState(gameData.gameState)
                                        setPlayers(gameData.players)
                                        setEvents(gameData.events)
                                        setLineups(gameData.lineups)
                                        setOpponentOnCourt(gameData.opponentOnCourt)
                                        setSubstitutionHistory(gameData.substitutionHistory)
                                        setQuickSubHistory(gameData.quickSubHistory)
                                        setActionHistory(gameData.actionHistory)
                                        message.success('Game data loaded successfully from database')
                                      } else {
                                        message.error('Failed to load game data from database')
                                      }
                                    } else {
                                      message.info('Switch to Event #' + game.eventId + ' to load this game')
                                    }
                                  }}
                                >
                                  Load
                                </Button>
                                <Button 
                                  size="small" 
                                  danger
                                  onClick={async () => {
                                    await liveStatService.deleteGameData(game.eventId)
                                    message.success('Game data deleted')
                                    await refreshSavedGames()
                                  }}
                                >
                                  Delete
                                </Button>
                              </Space>
                            </div>
                          ))
                        ) : (
                          <Text type="secondary">No saved games found</Text>
                        )}
                      </div>
                    </Card>
                  </Col>
                </Row>
              )
            }
          ]}
        />
      </Modal>


      {/* Lineup Builder Modal */}
      <Modal
        title={currentLineup && !hasGameStarted && gameState.quarter === 1 ? "Edit Starting Lineup" : "Create New Lineup"}
        open={showLineupBuilder}
        onCancel={() => setShowLineupBuilder(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setShowLineupBuilder(false)}>
            Cancel
          </Button>,
          <Button 
            key="create" 
            type="primary" 
            onClick={currentLineup && !hasGameStarted && gameState.quarter === 1 ? updateLineup : createLineup}
            disabled={selectedLineupPlayers.length !== 5}
          >
            {currentLineup && !hasGameStarted && gameState.quarter === 1 ? "Update Starting Lineup" : "Create Lineup"} ({selectedLineupPlayers.length}/5)
          </Button>
        ]}
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
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ color: '#f5f7fa' }}>Select 5 Players:</Text>
            <Input
              placeholder="Lineup name (optional)"
              value={lineupName}
              onChange={(e) => setLineupName(e.target.value)}
              style={{ marginTop: 8 }}
              allowClear
            />
            {lineupName && (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ color: '#a6a6a6', fontSize: '0.8rem' }}>
                  Lineup will be saved as: "{lineupName}"
                </Text>
              </div>
            )}
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: '12px',
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '8px',
            border: '1px solid #434343',
            borderRadius: '8px',
            backgroundColor: '#1e293b'
          }}>
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
                style={{
                  cursor: 'pointer',
                  padding: '12px',
                  borderRadius: '8px',
                  border: selectedLineupPlayers.includes(player.id) 
                    ? '2px solid #49aa19' 
                    : '1px solid #434343',
                  background: selectedLineupPlayers.includes(player.id)
                    ? '#1a3a1a'
                    : '#262626',
                  transition: 'all 0.2s ease',
                  minHeight: '100px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                  <Badge count={player.points} style={{ backgroundColor: '#52c41a', fontSize: '0.7rem' }} />
                  <Badge 
                    count={player.plusMinus >= 0 ? `+${player.plusMinus}` : player.plusMinus} 
                    style={{ 
                      backgroundColor: player.plusMinus >= 0 ? '#52c41a' : '#f5222d',
                      fontSize: '0.7rem'
                    }} 
                  />
                </div>
                <div style={{ marginTop: '20px' }}>
                  <Text strong style={{ color: '#f5f7fa', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
                    #{player.number}
                  </Text>
                  <Text strong style={{ color: '#f5f7fa', fontSize: '0.85rem', display: 'block', marginBottom: '4px', lineHeight: '1.2' }}>
                    {player.name}
                  </Text>
                  <Text type="secondary" style={{ color: '#a6a6a6', fontSize: '0.75rem', display: 'block' }}>
                    {player.position}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Bulk Substitution Modal */}
      <Modal
        title="Bulk Substitution"
        open={showBulkSubModal}
        onCancel={() => {
          setShowBulkSubModal(false)
          setSelectedBulkSubPlayers([])
        }}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => {
            setShowBulkSubModal(false)
            setSelectedBulkSubPlayers([])
          }}>
            Cancel
          </Button>,
          <Button 
            key="apply" 
            type="primary" 
            onClick={applyBulkSubstitution}
            disabled={selectedBulkSubPlayers.length !== 5}
          >
            Apply Substitution ({selectedBulkSubPlayers.length}/5)
          </Button>
        ]}
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
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ color: '#f5f7fa' }}>Select 5 Players for New Lineup:</Text>
            <div style={{ marginTop: 8, padding: '8px 12px', background: '#1a3a1a', borderRadius: 6, border: '1px solid #49aa19' }}>
              <Text style={{ color: '#52c41a', fontSize: '0.9rem' }}>
                Selected: {selectedBulkSubPlayers.length}/5 players
              </Text>
            </div>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: '12px',
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '8px',
            border: '1px solid #434343',
            borderRadius: '8px',
            backgroundColor: '#1e293b'
          }}>
            {players.map(player => (
              <div
                key={player.id}
                className={`${style.selectablePlayer} ${selectedBulkSubPlayers.includes(player.id) ? style.selected : ''}`}
                onClick={() => {
                  if (selectedBulkSubPlayers.includes(player.id)) {
                    setSelectedBulkSubPlayers(prev => prev.filter(id => id !== player.id))
                  } else if (selectedBulkSubPlayers.length < 5) {
                    setSelectedBulkSubPlayers(prev => [...prev, player.id])
                  }
                }}
                style={{
                  cursor: 'pointer',
                  padding: '12px',
                  borderRadius: '8px',
                  border: selectedBulkSubPlayers.includes(player.id) 
                    ? '2px solid #49aa19' 
                    : '1px solid #434343',
                  background: selectedBulkSubPlayers.includes(player.id)
                    ? '#1a3a1a'
                    : '#262626',
                  transition: 'all 0.2s ease',
                  minHeight: '100px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                  <Badge count={player.points} style={{ backgroundColor: '#52c41a', fontSize: '0.7rem' }} />
                  <Badge 
                    count={player.plusMinus >= 0 ? `+${player.plusMinus}` : player.plusMinus} 
                    style={{ 
                      backgroundColor: player.plusMinus >= 0 ? '#52c41a' : '#f5222d',
                      fontSize: '0.7rem'
                    }} 
                  />
                </div>
                <div style={{ marginTop: '20px' }}>
                  <Text strong style={{ color: '#f5f7fa', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
                    #{player.number}
                  </Text>
                  <Text strong style={{ color: '#f5f7fa', fontSize: '0.85rem', display: 'block', marginBottom: '4px', lineHeight: '1.2' }}>
                    {player.name}
                  </Text>
                  <Text type="secondary" style={{ color: '#a6a6a6', fontSize: '0.75rem', display: 'block' }}>
                    {player.position}
                  </Text>
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
          
          {/* Step 3: Confirmation */}
          {substitutionPlayerOut && substitutionPlayerIn && (
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
                  Confirm Substitution
                </Text>
                <div style={{ marginTop: 8 }}>
                  <Text style={{ color: '#f5f7fa' }}>
                    <span style={{ color: '#ff4d4f' }}>OUT:</span> #{substitutionPlayerOut.number} {substitutionPlayerOut.name}
                  </Text>
                  <br />
                  <Text style={{ color: '#f5f7fa' }}>
                    <span style={{ color: '#52c41a' }}>IN:</span> #{substitutionPlayerIn.number} {substitutionPlayerIn.name}
                  </Text>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <Button 
                  onClick={() => {
                    setSubstitutionPlayerIn(null)
                    setSubstitutionPlayerOut(null)
                    setShowQuickSubModal(false)
                  }}
                  style={{ minWidth: 100 }}
                >
                  Cancel
                </Button>
                <Button 
                  type="primary"
                  onClick={() => {
                    handleQuickSubstitution(substitutionPlayerIn, substitutionPlayerOut)
                  }}
                  style={{ 
                    minWidth: 100,
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a'
                  }}
                >
                  Confirm Sub
                </Button>
              </div>
            </>
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

      {/* Bottom Action Row: Exit, Save Game Data, End Game */}
      <div style={{ 
        backgroundColor: '#1a1a1a', 
        borderTop: '2px solid #333333',
        padding: '24px',
        marginTop: '32px',
        textAlign: 'center'
      }}>
        <Space size={16}>
          <Button 
            type="primary" 
            danger
            size="large"
            icon={<CloseOutlined />}
            onClick={async () => {
              // Just trigger the exit - let the parent component handle the data processing
              if (onExit) {
                setSuppressNavigationGuard(true);
                onExit();
              }
            }}
            style={{ 
              height: '48px', 
              fontSize: '16px',
              backgroundColor: '#ff4d4f',
              borderColor: '#ff4d4f',
              boxShadow: '0 2px 8px rgba(255, 77, 79, 0.3)',
              minWidth: '200px'
            }}
          >
            Exit Live Stat Tracking
          </Button>

          <Button 
            type="primary"
            icon={<SaveOutlined />}
            onClick={async () => {
              // Enhanced service: Update game state before saving
              if (liveSessionKey) {
                try {
                  await liveStatService.updateGameState({
                    quarter: gameState.quarter,
                    currentTime: gameState.currentTime,
                    homeScore: gameState.homeScore,
                    awayScore: gameState.opponentScore,
                    opponentScore: gameState.opponentScore,
                    timeoutHome: gameState.timeoutHome,
                    timeoutAway: gameState.timeoutAway,
                    isPlaying: true
                  })
                  console.log('Enhanced game state updated before save')
                } catch (error) {
                  console.error('Failed to update enhanced game state before save:', error)
                }
              }
              
              saveGameDataOffline({ showToast: true })
            }}
            style={{ 
              height: '48px', 
              fontSize: '16px',
              backgroundColor: '#52c41a',
              borderColor: '#52c41a',
              minWidth: '200px'
            }}
          >
            Save Game Data
          </Button>

          <Button 
            type="primary"
            size="large"
            icon={<StopOutlined />}
            disabled={gameState.quarter < 4}
            onClick={() => {
              setShowEndGameModal(true)
            }}
            style={{ 
              height: '48px', 
              fontSize: '16px',
              backgroundColor: '#1677ff',
              borderColor: '#1677ff',
              minWidth: '200px'
            }}
          >
            End Game
          </Button>
        </Space>
      </div>

      {/* Substitution Modal */}
      <Modal
        title="Substitution"
        open={showSubModal}
        onCancel={() => {
          setShowSubModal(false)
          setPlayerToSubOut(null)
          setAvailableSubs([])
        }}
        footer={null}
        width={400}
      >
        {playerToSubOut && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Substituting out:</Text>
              <div style={{ 
                padding: 8, 
                background: '#f0f0f0', 
                borderRadius: 4, 
                marginTop: 4 
              }}>
                #{playerToSubOut.number} {playerToSubOut.name} ({playerToSubOut.position})
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>Choose replacement:</Text>
              <div style={{ marginTop: 8 }}>
                {availableSubs.length > 0 ? (
                  availableSubs.map(player => (
                    <Button
                      key={player.id}
                      block
                      style={{ 
                        marginBottom: 8, 
                        textAlign: 'left',
                        height: 'auto',
                        padding: '8px 12px'
                      }}
                      onClick={() => handleSubstitution(playerToSubOut, player)}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          #{player.number} {player.name}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          {player.position}
                        </div>
                      </div>
                    </Button>
                  ))
                ) : (
                  <Text type="secondary">No available substitutes</Text>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* End Game Confirmation Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            <span style={{ color: '#f5f7fa' }}>End Game?</span>
          </Space>
        }
        open={showEndGameModal}
        onOk={async () => {
          setShowEndGameModal(false);
          try {
            // Save current game data first
            if (liveSessionKey) {
              try {
                await liveStatService.updateGameState({
                  quarter: gameState.quarter,
                  currentTime: gameState.currentTime,
                  homeScore: gameState.homeScore,
                  awayScore: gameState.opponentScore,
                  opponentScore: gameState.opponentScore,
                  timeoutHome: gameState.timeoutHome,
                  timeoutAway: gameState.timeoutAway,
                  isPlaying: false
                })
              } catch {}
            }
            saveGameDataOffline({ showToast: false })

            // End session (and aggregate if available in refined service flow)
            if (liveSessionKey) {
              try {
                const sessionId = refinedLiveStatTrackerService.getCurrentSessionKey()
                if (sessionId) {
                  await refinedLiveStatTrackerService.endGameAndAggregate(parseInt(sessionId))
                } else {
                  await refinedLiveStatTrackerService.endLiveGame()
                }
              } catch (e) {
                console.error('Failed to end game via service:', e)
              }
            }
            message.success('Game ended and saved')
          } catch (e) {
            message.error('Failed to end game')
          }
        }}
        onCancel={() => setShowEndGameModal(false)}
        okText="Save and End"
        cancelText="Cancel"
        okButtonProps={{
          type: 'primary',
          icon: <StopOutlined />,
          style: { backgroundColor: '#1677ff', borderColor: '#1677ff' }
        }}
        cancelButtonProps={{
          style: { borderColor: '#334155', color: '#e6e6e6', background: '#0f2741' }
        }}
        styles={{
          content: { backgroundColor: '#17375c', color: '#f5f7fa' },
          header: { backgroundColor: '#17375c', color: '#f5f7fa' },
          body: { backgroundColor: '#17375c', color: '#f5f7fa' }
        }}
        width={500}
      >
        <div style={{ color: '#f5f7fa', fontSize: '16px', lineHeight: '1.6' }}>
          Do you want to save game data before ending? This will finalize the session.
        </div>
      </Modal>

      {/* Confirmation Modal */}
      {renderConfirmModal()}
    </div>
  )
}

export default Statistics 
