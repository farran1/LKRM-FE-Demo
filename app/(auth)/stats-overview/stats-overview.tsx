"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./style.module.scss";
import { Card } from "antd";
import TeamStatsPanel from "./components/TeamStatsPanel";
import GameStatsPanel from "./components/GameStatsPanel";
import PlayerComparisonPanel from "./components/PlayerComparisonPanel";
import QuickActionsCard from "./components/QuickActionsCard";
import SummaryStatCard from "./components/SummaryStatCard";
import { TrophyOutlined, FireOutlined, ArrowUpOutlined, ArrowDownOutlined, MenuOutlined, EditOutlined } from "@ant-design/icons";
// Removed: import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Modal, Checkbox, Space } from "antd";

// Mock data (can be replaced with real data service)
const mockTeamStats = {
  name: "Wildcats",
  wins: 18,
  losses: 4,
  ppg: 72.3,
  oppg: 65.1,
  fgPct: 48.2,
  threePct: 36.7,
  ftPct: 75.4,
};

const mockGameStats = [
  { opponent: "Eagles", date: "2024-02-10", result: "W 68-62" },
  { opponent: "Bears", date: "2024-02-07", result: "L 59-61" },
  { opponent: "Lions", date: "2024-02-03", result: "W 77-70" },
  { opponent: "Tigers", date: "2024-01-30", result: "W 80-75" },
  { opponent: "Sharks", date: "2024-01-27", result: "L 60-65" },
  { opponent: "Wolves", date: "2024-01-24", result: "W 72-68" },
  { opponent: "Panthers", date: "2024-01-20", result: "W 69-66" },
  { opponent: "Hawks", date: "2024-01-17", result: "W 74-70" },
  { opponent: "Falcons", date: "2024-01-14", result: "L 58-62" },
  { opponent: "Raptors", date: "2024-01-10", result: "W 81-77" },
  { opponent: "Bulls", date: "2024-01-07", result: "W 79-73" },
  { opponent: "Celtics", date: "2024-01-03", result: "W 85-80" },
  { opponent: "Knicks", date: "2023-12-30", result: "L 61-67" },
  { opponent: "Nets", date: "2023-12-27", result: "W 70-65" },
];

const mockPlayers = [
  { name: "J. Smith", pts: 18.2, reb: 7.1, ast: 4.3 },
  { name: "A. Johnson", pts: 15.6, reb: 5.4, ast: 6.2 },
  { name: "M. Lee", pts: 12.9, reb: 8.3, ast: 2.1 },
  { name: "C. Brown", pts: 10.4, reb: 6.7, ast: 3.5 },
  { name: "D. White", pts: 9.8, reb: 4.2, ast: 2.9 },
  { name: "E. Green", pts: 8.7, reb: 5.1, ast: 1.8 },
  { name: "F. Black", pts: 7.5, reb: 3.9, ast: 2.2 },
  { name: "G. Blue", pts: 6.3, reb: 2.7, ast: 1.5 },
  { name: "H. Red", pts: 5.9, reb: 4.0, ast: 1.1 },
  { name: "I. Orange", pts: 4.8, reb: 2.2, ast: 0.9 },
  { name: "J. Purple", pts: 3.7, reb: 1.8, ast: 0.7 },
  { name: "K. Yellow", pts: 2.5, reb: 1.2, ast: 0.5 },
  { name: "L. Silver", pts: 1.9, reb: 0.8, ast: 0.3 },
  { name: "M. Gold", pts: 0.7, reb: 0.4, ast: 0.1 },
];

const summaryStats = [
  {
    id: "season-record",
    icon: <TrophyOutlined style={{ color: '#4be04b' }} />,
    label: "Season Record",
    value: "15-3",
    valueColor: "#4be04b",
  },
  {
    id: "win-pct",
    icon: <FireOutlined style={{ color: '#2db7f5' }} />,
    label: "Win %",
    value: "83.3%",
    valueColor: "#2db7f5",
  },
  {
    id: "avg-points-for",
    icon: <ArrowUpOutlined style={{ color: '#4be04b' }} />,
    label: "Avg Points For",
    value: "72.4",
    valueColor: "#4be04b",
  },
  {
    id: "avg-points-against",
    icon: <ArrowDownOutlined style={{ color: '#ff4d4f' }} />,
    label: "Avg Points Against",
    value: "58.2",
    valueColor: "#ff4d4f",
  },
];

const createDefaultModules = (teamStatsConfig: any) => [
  { id: "quick-actions", width: 360, height: 220, render: () => <QuickActionsCard /> },
  { id: "summary-stats", width: 600, height: 220, render: () => (
      <div className={styles.summaryStatsRow}>
        {summaryStats.map(stat => (
          <SummaryStatCard key={stat.id} {...stat} />
        ))}
      </div>
    ) },
  { id: "team-stats", width: 360, height: 320, render: () => (
      <Card className={styles.panelCard} title="Team Stats" variant="outlined">
        <TeamStatsPanel stats={mockTeamStats} config={teamStatsConfig} />
      </Card>
    ) },
  { id: "game-stats", width: 360, height: 320, render: () => (
      <Card className={styles.panelCard} title="Recent Games" variant="outlined">
        <GameStatsPanel games={mockGameStats} />
      </Card>
    ) },
  { id: "player-comparison", width: 360, height: 320, render: () => (
      <Card className={styles.panelCard} title="Player Comparison" variant="outlined">
        <PlayerComparisonPanel players={mockPlayers} />
      </Card>
    ) },
];

const CONFIG_STORAGE_KEY = 'statsDashConfigs';

function saveConfig(name: string, modules: any[]) {
  // Only save id, width, and height
  const toSave = modules.map(m => ({ id: m.id, width: m.width, height: m.height }));
  const configs = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || '{}');
  configs[name] = toSave;
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configs));
}

function loadConfigs() {
  return JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || '{}');
}

function rehydrateModules(saved: any[], teamStatsConfig: any): any[] {
  const defaultModules = createDefaultModules(teamStatsConfig);
  return saved.map(savedMod => {
    const def = defaultModules.find((m: any) => m.id === savedMod.id);
    return def ? { ...def, ...savedMod } : savedMod;
  });
}

function calculateFontSize(width: number, height: number, baseSize: number = 14): number {
  // Scale font based on container size
  const minSize = 10;
  const maxSize = 24;
  const scale = Math.min(width / 300, height / 200); // Base scale on 300x200 reference
  return Math.max(minSize, Math.min(maxSize, baseSize * scale));
}

const StatsOverviewDashboard = React.memo(() => {
  const [teamStatsConfig, setTeamStatsConfig] = useState({
    // Shots
    showFieldGoals: true,
    showTwoPointers: true,
    showThreePointers: true,
    showFreeThrows: true,
    
    // Points
    showPointsFor: true,
    showPointsAgainst: true,
    showPointsPerGame: true,
    
    // Shooting Efficiencies
    showFGPercent: true,
    showTwoPointPercent: true,
    showThreePointPercent: true,
    showFreeThrowPercent: true,
    showEffectiveFGPercent: true,
    
    // Shot Type
    showPointsInPaint: true,
    
    // Advanced Efficiencies
    showInboundEfficiency: false,
    showPlusMinus: false,
    showLineupEfficiency: false,
    showIndividualMinutes: false,
    showValuePointSystem: false,
    showPointsPerPossession: false,
    showFreeThrowFactor: false,
    
    // Rebounding
    showDefensiveRebounds: false,
    showDefensiveReboundPercent: false,
    showOffensiveRebounds: false,
    showOffensiveReboundPercent: false,
    showSecondChancePoints: false,
    
    // Defense
    showPersonalFouls: false,
    showChargesTaken: false,
    showBlocks: false,
    showSteals: false,
    showDeflections: false,
    
    // Assists and Turnovers
    showAssists: false,
    showTurnovers: false,
    showAssistTurnoverRatio: false,
    showTurnoverPercent: false,
    showPointsOffTurnovers: false,
    showTransitionPoints: false,
  });
  
  const [modules, setModules] = useState(() => createDefaultModules(teamStatsConfig));
  const [resizing, setResizing] = useState<{ idx: number; startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  const [configName, setConfigName] = useState('');
  const [configs, setConfigs] = useState({});
  const [selectedConfig, setSelectedConfig] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
  const [overflowMode, setOverflowMode] = useState<'clipped' | 'scroll'>('clipped');
  const [fontSizes, setFontSizes] = useState<{[key: string]: number}>({});
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);

  useEffect(() => {
    setConfigs(loadConfigs());
  }, []);

  // Update font sizes when modules change
  useEffect(() => {
    const newFontSizes: {[key: string]: number} = {};
    modules.forEach(mod => {
      newFontSizes[mod.id] = calculateFontSize(mod.width, mod.height);
    });
    setFontSizes(newFontSizes);
  }, [modules]);

  const getModuleStyle = (mod: any, idx: number) => {
    const fontSize = fontSizes[mod.id] || 14;
    return {
      width: (typeof mod.width === 'number' && !isNaN(mod.width)) ? `${mod.width}px` : '300px',
      height: (typeof mod.height === 'number' && !isNaN(mod.height)) ? `${mod.height}px` : '200px',
      opacity: 1,
      position: 'relative' as const,
      overflow: overflowMode === 'clipped' ? 'hidden' : 'auto',
      fontSize: `${fontSize}px`,
      display: 'flex',
      flexDirection: 'column' as const,
    };
  };

  const handleSaveConfig = () => {
    if (!configName) return;
    saveConfig(configName, modules);
    setConfigs(loadConfigs());
    setConfigName('');
  };

  const handleLoadConfig = (name: string) => {
    const configs = loadConfigs();
    if (configs[name]) {
      setModules(rehydrateModules(configs[name], teamStatsConfig));
      setSelectedConfig(name);
    }
  };

  const handleDeleteConfig = (name: string) => {
    const configs = loadConfigs();
    delete configs[name];
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configs));
    setConfigs(loadConfigs());
    if (selectedConfig === name) {
      setSelectedConfig('');
      setModules(createDefaultModules(teamStatsConfig));
    }
  };

  // Removed: const onDragEnd = (result: DropResult) => { ... };

  // Handle mouse events for resizing (corner)
  const handleResizeMouseDown = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      idx,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: modules[idx].width,
      startHeight: modules[idx].height,
    });
    document.body.style.cursor = "nwse-resize";
  };

  React.useEffect(() => {
    if (!resizing) return;
    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizing.startX;
      const deltaY = e.clientY - resizing.startY;
      let newWidth = Math.max(120, resizing.startWidth + deltaX);
      let newHeight = Math.max(100, resizing.startHeight + deltaY);
      setModules(mods => {
        const currentModule = mods[resizing.idx];
        if (currentModule.width !== newWidth || currentModule.height !== newHeight) {
          return mods.map((m, i) => i === resizing.idx ? { ...m, width: newWidth, height: newHeight } : m);
        }
        return mods;
      });
    };
    const onMouseUp = () => {
      setResizing(null);
      document.body.style.cursor = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [resizing]);

  const handleTeamStatsConfig = () => {
    setIsConfigModalVisible(true);
  };

  const handleConfigModalOk = () => {
    setIsConfigModalVisible(false);
  };

  const handleConfigModalCancel = () => {
    setIsConfigModalVisible(false);
  };

  // Update modules when teamStatsConfig changes
  useEffect(() => {
    setModules(prevModules => {
      return prevModules.map(mod => {
        if (mod.id === 'team-stats') {
          return {
            ...mod,
            render: () => (
              <Card className={styles.panelCard} title="Team Stats" variant="outlined">
                <TeamStatsPanel stats={mockTeamStats} config={teamStatsConfig} />
              </Card>
            )
          };
        }
        return mod;
      });
    });
  }, [teamStatsConfig]);

  const updateTeamStatsConfig = (key: string, checked: boolean) => {
    setTeamStatsConfig(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  return (
    <div className={styles.dashboardContainer}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
        <button
          style={{ fontWeight: 600, borderRadius: 6, border: '1px solid #3a4a5d', background: activeTab === 'dashboard' ? '#1890ff' : '#23272f', color: '#fff', cursor: 'pointer', padding: '6px 16px' }}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          style={{ fontWeight: 600, borderRadius: 6, border: '1px solid #3a4a5d', background: activeTab === 'settings' ? '#1890ff' : '#23272f', color: '#fff', cursor: 'pointer', padding: '6px 16px' }}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>
      {activeTab === 'settings' ? (
        <div style={{ marginBottom: 24 }}>
          <label style={{ color: '#fff', fontWeight: 600, marginRight: 12 }}>Overflow Mode:</label>
          <select
            value={overflowMode}
            onChange={e => setOverflowMode(e.target.value as 'clipped' | 'scroll')}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #3a4a5d', background: '#23272f', color: '#fff' }}
          >
            <option value="clipped">Clipped (Hide Overflow)</option>
            <option value="scroll">Scroll (Show Scrollbars)</option>
          </select>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <button
            style={{ padding: '6px 16px', fontWeight: 600, borderRadius: 6, border: '1px solid #3a4a5d', background: '#23272f', color: '#fff', cursor: 'pointer' }}
            onClick={() => setModules(createDefaultModules(teamStatsConfig))}
          >
            Reset to Default Sizes
          </button>
          <input
            type="text"
            placeholder="Config name"
            value={configName}
            onChange={e => setConfigName(e.target.value)}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #3a4a5d', background: '#23272f', color: '#fff' }}
          />
          <button
            style={{ padding: '6px 16px', fontWeight: 600, borderRadius: 6, border: '1px solid #3a4a5d', background: '#1890ff', color: '#fff', cursor: 'pointer' }}
            onClick={handleSaveConfig}
          >
            Save Config
          </button>
          <select
            value={selectedConfig}
            onChange={e => handleLoadConfig(e.target.value)}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #3a4a5d', background: '#23272f', color: '#fff' }}
          >
            <option value="">Load Config...</option>
            {Object.keys(configs).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          {selectedConfig && (
            <button
              style={{ padding: '6px 16px', fontWeight: 600, borderRadius: 6, border: '1px solid #3a4a5d', background: '#ff4d4f', color: '#fff', cursor: 'pointer' }}
              onClick={() => handleDeleteConfig(selectedConfig)}
            >
              Delete Config
            </button>
          )}
        </div>
      )}
      {activeTab === 'dashboard' && (
        <div
          className={styles.gridContainer}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${modules.length}, 1fr)`,
            gap: '12px',
            padding: '12px',
            overflow: overflowMode === 'clipped' ? 'hidden' : 'auto',
          }}
        >
          {modules.map((mod, idx) => (
            <div
              key={mod.id}
              className={styles.gridItem}
              style={getModuleStyle(mod, idx)}
            >
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                {/* Drag handle - positioned at top right */}
                <div
                  className={styles.dragHandle}
                  title="Drag to move"
                  style={{ 
                    position: 'absolute', 
                    top: 4, 
                    right: 4, 
                    zIndex: 20, 
                    cursor: 'grab', 
                    padding: 4,
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '24px',
                    minHeight: '24px'
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.currentTarget.style.cursor = 'grabbing';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.cursor = 'grab';
                  }}
                >
                  <MenuOutlined style={{ fontSize: 14, color: '#fff' }} />
                </div>
                
                {/* Edit button for team stats configuration */}
                {mod.id === 'team-stats' && (
                  <div
                    className={styles.editHandle}
                    title="Configure Team Stats"
                    style={{ 
                      position: 'absolute', 
                      top: 4, 
                      right: 36, 
                      zIndex: 15, 
                      cursor: 'pointer', 
                      padding: 4,
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '24px',
                      minHeight: '24px',
                      opacity: 0.7,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTeamStatsConfig();
                    }}
                  >
                    <EditOutlined style={{ fontSize: 12, color: '#1890ff' }} />
                  </div>
                )}
                
                {/* Module content */}
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  paddingTop: '32px',
                  flex: 1,
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {mod.id === 'team-stats' ? (
                    <TeamStatsPanel stats={mockTeamStats} config={teamStatsConfig} />
                  ) : (
                    mod.render()
                  )}
                </div>
                
                {/* Resize corner */}
                <div
                  className={styles.resizeCorner}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleResizeMouseDown(e, idx);
                  }}
                  style={{ 
                    cursor: 'nwse-resize', 
                    position: 'absolute', 
                    right: 0, 
                    bottom: 0, 
                    width: 20, 
                    height: 20, 
                    zIndex: 10,
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '0 0 4px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Resize"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" style={{ display: 'block' }}>
                    <polyline points="4,16 16,4" stroke="#2db7f5" strokeWidth="1.5" fill="none" />
                    <polyline points="8,16 16,8" stroke="#2db7f5" strokeWidth="1.5" fill="none" />
                    <polyline points="12,16 16,12" stroke="#2db7f5" strokeWidth="1.5" fill="none" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal
        title="Configure Team Stats"
        open={isConfigModalVisible}
        onOk={handleConfigModalOk}
        onCancel={handleConfigModalCancel}
        okText="Save"
        cancelText="Cancel"
        width={500}
        styles={{
          body: { background: '#23272f', color: '#fff' },
          header: { background: '#1b2736', color: '#fff' },
          content: { background: '#23272f' }
        }}
      >
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ color: '#1890ff', marginBottom: '8px' }}>Shots</h4>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Checkbox 
                checked={teamStatsConfig.showFieldGoals}
                onChange={(e) => updateTeamStatsConfig('showFieldGoals', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Field Goals
              </Checkbox>
              <Checkbox 
                checked={teamStatsConfig.showTwoPointers}
                onChange={(e) => updateTeamStatsConfig('showTwoPointers', e.target.checked)}
                style={{ color: '#fff' }}
              >
                2-Pointers
              </Checkbox>
              <Checkbox 
                checked={teamStatsConfig.showThreePointers}
                onChange={(e) => updateTeamStatsConfig('showThreePointers', e.target.checked)}
                style={{ color: '#fff' }}
              >
                3-Pointers
              </Checkbox>
              <Checkbox 
                checked={teamStatsConfig.showFreeThrows}
                onChange={(e) => updateTeamStatsConfig('showFreeThrows', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Free Throws
              </Checkbox>
            </Space>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ color: '#52c41a', marginBottom: '8px' }}>Points</h4>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Checkbox 
                checked={teamStatsConfig.showPointsFor}
                onChange={(e) => updateTeamStatsConfig('showPointsFor', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Points For
              </Checkbox>
              <Checkbox 
                checked={teamStatsConfig.showPointsAgainst}
                onChange={(e) => updateTeamStatsConfig('showPointsAgainst', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Points Against
              </Checkbox>
              <Checkbox 
                checked={teamStatsConfig.showPointsPerGame}
                onChange={(e) => updateTeamStatsConfig('showPointsPerGame', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Points per Game
              </Checkbox>
            </Space>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ color: '#fa8c16', marginBottom: '8px' }}>Shooting Efficiencies</h4>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Checkbox 
                checked={teamStatsConfig.showFGPercent}
                onChange={(e) => updateTeamStatsConfig('showFGPercent', e.target.checked)}
                style={{ color: '#fff' }}
              >
                FG %
              </Checkbox>
              <Checkbox 
                checked={teamStatsConfig.showTwoPointPercent}
                onChange={(e) => updateTeamStatsConfig('showTwoPointPercent', e.target.checked)}
                style={{ color: '#fff' }}
              >
                2-Point %
              </Checkbox>
              <Checkbox 
                checked={teamStatsConfig.showThreePointPercent}
                onChange={(e) => updateTeamStatsConfig('showThreePointPercent', e.target.checked)}
                style={{ color: '#fff' }}
              >
                3-Point %
              </Checkbox>
              <Checkbox 
                checked={teamStatsConfig.showFreeThrowPercent}
                onChange={(e) => updateTeamStatsConfig('showFreeThrowPercent', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Free Throw %
              </Checkbox>
              <Checkbox 
                checked={teamStatsConfig.showEffectiveFGPercent}
                onChange={(e) => updateTeamStatsConfig('showEffectiveFGPercent', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Effective FG %
              </Checkbox>
            </Space>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ color: '#722ed1', marginBottom: '8px' }}>Advanced Stats</h4>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Checkbox 
                checked={teamStatsConfig.showPointsInPaint}
                onChange={(e) => updateTeamStatsConfig('showPointsInPaint', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Points in the Paint
              </Checkbox>
              <Checkbox 
                checked={teamStatsConfig.showInboundEfficiency}
                onChange={(e) => updateTeamStatsConfig('showInboundEfficiency', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Inbound Efficiency
              </Checkbox>
              <Checkbox 
                checked={teamStatsConfig.showPlusMinus}
                onChange={(e) => updateTeamStatsConfig('showPlusMinus', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Plus-Minus
              </Checkbox>
              <Checkbox 
                checked={teamStatsConfig.showPointsPerPossession}
                onChange={(e) => updateTeamStatsConfig('showPointsPerPossession', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Points per Possession
              </Checkbox>
            </Space>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ color: '#13c2c2', marginBottom: '8px' }}>Rebounding</h4>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Checkbox 
                checked={teamStatsConfig.showDefensiveRebounds}
                onChange={(e) => updateTeamStatsConfig('showDefensiveRebounds', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Defensive Rebounds
              </Checkbox>
              <Checkbox 
                checked={teamStatsConfig.showOffensiveRebounds}
                onChange={(e) => updateTeamStatsConfig('showOffensiveRebounds', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Offensive Rebounds
              </Checkbox>
              <Checkbox 
                checked={teamStatsConfig.showSecondChancePoints}
                onChange={(e) => updateTeamStatsConfig('showSecondChancePoints', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Second Chance Points
              </Checkbox>
            </Space>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ color: '#ff4d4f', marginBottom: '8px' }}>Defense</h4>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Checkbox 
                checked={teamStatsConfig.showPersonalFouls}
                onChange={(e) => updateTeamStatsConfig('showPersonalFouls', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Personal Fouls
              </Checkbox>
              <Checkbox 
                checked={teamStatsConfig.showBlocks}
                onChange={(e) => updateTeamStatsConfig('showBlocks', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Blocks
              </Checkbox>
              <Checkbox 
                checked={teamStatsConfig.showSteals}
                onChange={(e) => updateTeamStatsConfig('showSteals', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Steals
              </Checkbox>
            </Space>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ color: '#eb2f96', marginBottom: '8px' }}>Assists & Turnovers</h4>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Checkbox 
                checked={teamStatsConfig.showAssists}
                onChange={(e) => updateTeamStatsConfig('showAssists', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Assists
              </Checkbox>
              <Checkbox 
                checked={teamStatsConfig.showTurnovers}
                onChange={(e) => updateTeamStatsConfig('showTurnovers', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Turnovers
              </Checkbox>
              <Checkbox 
                checked={teamStatsConfig.showAssistTurnoverRatio}
                onChange={(e) => updateTeamStatsConfig('showAssistTurnoverRatio', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Assist/Turnover Ratio
              </Checkbox>
              <Checkbox 
                checked={teamStatsConfig.showPointsOffTurnovers}
                onChange={(e) => updateTeamStatsConfig('showPointsOffTurnovers', e.target.checked)}
                style={{ color: '#fff' }}
              >
                Points off Turnovers
              </Checkbox>
            </Space>
          </div>
        </div>
      </Modal>
    </div>
  );
});

StatsOverviewDashboard.displayName = 'StatsOverviewDashboard';

export default StatsOverviewDashboard; 