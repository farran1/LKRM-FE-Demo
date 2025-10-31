'use client'

import React from 'react'
import { Card, Tooltip } from 'antd'

export type ComparisonStats = {
  fgMade?: number; fgAttempted?: number; fgPercentage?: number;
  twoPointMade?: number; twoPointAttempted?: number; twoPointPercentage?: number;
  threePointMade?: number; threePointAttempted?: number; threePointPercentage?: number;
  ftMade?: number; ftAttempted?: number; ftPercentage?: number;
  totalRebounds?: number; totalAssists?: number; totalSteals?: number; totalBlocks?: number;
  totalTurnovers?: number; totalFouls?: number; pointsInPaint?: number; secondChancePoints?: number;
  pointsOffTurnovers?: number; benchPoints?: number;
}

const TeamComparisonTable = ({
  teamStats,
  opponentStats,
  teamName = 'HOME',
  opponentName = 'OPPONENT'
}: { teamStats: ComparisonStats; opponentStats: ComparisonStats; teamName?: string; opponentName?: string }) => {
  const getComparisonBar = (teamValue: number | string, opponentValue: number | string, statKey: string, teamPercent?: number, opponentPercent?: number) => {
    // For percentage-based stats, compare percentages instead of raw values
    let teamComparisonValue: number
    let opponentComparisonValue: number
    
    if (statKey === 'fg' || statKey === '2p' || statKey === '3p' || statKey === 'ft') {
      // Use percentages for percentage-based stats
      teamComparisonValue = teamPercent ?? 0
      opponentComparisonValue = opponentPercent ?? 0
    } else {
      // For non-percentage stats, convert to numbers if strings
      teamComparisonValue = typeof teamValue === 'string' ? parseFloat(teamValue) || 0 : teamValue
      opponentComparisonValue = typeof opponentValue === 'string' ? parseFloat(opponentValue) || 0 : opponentValue
    }
    
    if (teamComparisonValue === opponentComparisonValue) return null
    
    const isTeamBetter = (() => {
      switch (statKey) {
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
          return teamComparisonValue > opponentComparisonValue
        case 'to':
        case 'tf':
        case 'f':
          return teamComparisonValue < opponentComparisonValue
        default:
          return teamComparisonValue > opponentComparisonValue
      }
    })()
    const color = isTeamBetter ? '#1890ff' : '#ff4d4f'
    return (
      <div style={{ position: 'absolute', right: isTeamBetter ? 'auto' : '8px', left: isTeamBetter ? '8px' : 'auto', top: '50%', transform: 'translateY(-50%)', fontSize: 14, color, fontWeight: 'bold' }}>
        {isTeamBetter ? '◀' : '▶'}
      </div>
    )
  }

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
  ]

  const leftColumnStats = stats.slice(0, 6)
  const rightColumnStats = stats.slice(6, 14)

  const renderStatRow = (stat: any) => (
    <tr key={stat.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      <td style={{ padding: '8px 6px', textAlign: 'center', position: 'relative', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
        <div style={{ fontWeight: 600, color: '#1890ff', fontSize: 14 }}>{stat.teamValue}</div>
        {stat.teamPercent !== undefined && (
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>({stat.teamPercent}%)</div>
        )}
      </td>
      <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 600, color: '#ffffff', background: 'rgba(255,255,255,0.1)', fontSize: 14, position: 'relative' }}>
        {getComparisonBar(stat.teamValue, stat.opponentValue, stat.key, stat.teamPercent, stat.opponentPercent)}
        <Tooltip title={
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
          stat.key === 'bp' ? 'Bench points' : ''
        }>
          <span>{stat.label}</span>
        </Tooltip>
      </td>
      <td style={{ padding: '8px 6px', textAlign: 'center', position: 'relative', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
        <div style={{ fontWeight: 600, color: '#ff4d4f', fontSize: 14 }}>{stat.opponentValue}</div>
        {stat.opponentPercent !== undefined && (
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>({stat.opponentPercent}%)</div>
        )}
      </td>
    </tr>
  )

  return (
    <Card title="Team Comparison" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto' }}>
        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, color: '#ffffff' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, color: '#1890ff', fontSize: 14 }}>{teamName}</th>
                <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, color: '#ffffff', fontSize: 14 }}>
                  <Tooltip title={<div>FG = Field Goals; 2P/3P = Two/Three-point shots; FT = Free Throws; REB = Rebounds; AS = Assists; ST = Steals; BLK = Blocks; TO = Turnovers; TF = Total Fouls; PIP = Points in Paint; SCP = Second Chance Points; PTO = Points off Turnovers; BP = Bench Points</div>}>
                    <span>Stat</span>
                  </Tooltip>
                </th>
                <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, color: '#ff4d4f', fontSize: 14 }}>{opponentName}</th>
              </tr>
            </thead>
            <tbody>
              {leftColumnStats.map(renderStatRow)}
            </tbody>
          </table>
        </div>
        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, color: '#ffffff' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, color: '#1890ff', fontSize: 14 }}>{teamName}</th>
                <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, color: '#ffffff', fontSize: 14 }}>
                  <Tooltip title={<div>FG = Field Goals; 2P/3P = Two/Three-point shots; FT = Free Throws; REB = Rebounds; AS = Assists; ST = Steals; BLK = Blocks; TO = Turnovers; TF = Total Fouls; PIP = Points in Paint; SCP = Second Chance Points; PTO = Points off Turnovers; BP = Bench Points</div>}>
                    <span>Stat</span>
                  </Tooltip>
                </th>
                <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, color: '#ff4d4f', fontSize: 14 }}>{opponentName}</th>
              </tr>
            </thead>
            <tbody>
              {rightColumnStats.map(renderStatRow)}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  )
}

export default TeamComparisonTable


