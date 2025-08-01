"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, Input, Button, DatePicker } from "antd";
import { MenuOutlined, DragOutlined, ArrowsAltOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import Frame from "../stats-overview/components/Frame";
import GameFlowChart from "../stats-overview/components/GameFlowChart";
import QuarterPerformancePanel from "../stats-overview/components/QuarterPerformancePanel";
import PlayerImpactChart from "../stats-overview/components/PlayerImpactChart";
import ShotSelectionPanel from "../stats-overview/components/ShotSelectionPanel";
import KeyMomentsTimeline from "../stats-overview/components/KeyMomentsTimeline";
import PlayerRadarChart from "../stats-overview/components/PlayerRadarChart";
import PerformanceTrendLines from "../stats-overview/components/PerformanceTrendLines";
import ConsistencyBoxPlot from "../stats-overview/components/ConsistencyBoxPlot";
import PlayerComparisonMatrix from "../stats-overview/components/PlayerComparisonMatrix";
import GrowthTrajectoryChart from "../stats-overview/components/GrowthTrajectoryChart";
import TeamTrendLines from "../stats-overview/components/TeamTrendLines";
import EfficiencyComparisonChart from "../stats-overview/components/EfficiencyComparisonChart";
import PerformanceDistributionChart from "../stats-overview/components/PerformanceDistributionChart";
import SeasonArcVisualization from "../stats-overview/components/SeasonArcVisualization";
import TeamBalanceMetrics from "../stats-overview/components/TeamBalanceMetrics";
import ClutchPerformancePanel from "../stats-overview/components/ClutchPerformancePanel";
import LineupEfficiencyHeatmap from "../stats-overview/components/LineupEfficiencyHeatmap";
import SituationalBreakdownChart from "./components/SituationalBreakdownChart";
import ContextPerformancePanel from "./components/ContextPerformancePanel";
import StrategicRecommendations from "./components/StrategicRecommendations";
import styles from "../stats-overview/style.module.scss";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import TeamStatsPanel from "../stats-overview/components/TeamStatsPanel";
import GameStatsPanel from "../stats-overview/components/GameStatsPanel";
import Link from "next/link";

const ResponsiveGridLayout = WidthProvider(Responsive);
const imgUpload = "http://localhost:3845/assets/0949b5e892c7c87c77e810499883bad9a3464405.svg";
const CONFIG_STORAGE_KEY = 'advancedDashConfigs';

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
const mockTeamStatsConfig = {
  showFieldGoals: true,
  showTwoPointers: true,
  showThreePointers: true,
  showFreeThrows: true,
  showPointsFor: true,
  showPointsAgainst: true,
  showPointsPerGame: true,
  showFGPercent: true,
  showTwoPointPercent: true,
  showThreePointPercent: true,
  showFreeThrowPercent: true,
  showEffectiveFGPercent: true,
  showPointsInPaint: true,
  showInboundEfficiency: true,
  showPlusMinus: true,
  showLineupEfficiency: true,
  showIndividualMinutes: true,
  showValuePointSystem: true,
  showPointsPerPossession: true,
  showFreeThrowFactor: true,
  showDefensiveRebounds: true,
  showDefensiveReboundPercent: true,
  showOffensiveRebounds: true,
  showOffensiveReboundPercent: true,
  showSecondChancePoints: true,
  showPersonalFouls: true,
  showChargesTaken: true,
  showBlocks: true,
  showSteals: true,
  showDeflections: true,
  showAssists: true,
  showTurnovers: true,
  showAssistTurnoverRatio: true,
  showTurnoverPercent: true,
  showPointsOffTurnovers: true,
  showTransitionPoints: true,
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
];

const getGridCols = (width: number) => {
  if (width >= 1200) return 12;
  if (width >= 996) return 10;
  if (width >= 768) return 8;
  if (width >= 480) return 4;
  return 2;
};

const GRID_COLS = 12;
const GRID_ROW_HEIGHT = 90;
const GRID_MARGIN = 16; // gap between items
const GRID_WIDTH = 1200; // fallback, will use container width if possible

// Define moduleDefs and getDefaultLayout outside the component
const moduleDefs = [
  { id: "team-stats", render: (filters: any) => <TeamStatsPanel stats={mockTeamStats} config={mockTeamStatsConfig} filters={filters} /> },
  { id: "player-comparison", render: (filters: any) => <PlayerComparisonMatrix filters={filters} /> },
  { id: "game-stats", render: (filters: any) => <GameStatsPanel games={mockGameStats} filters={filters} /> },
  { id: "shot-selection", render: (filters: any) => <ShotSelectionPanel filters={filters} /> },
  { id: "quarter-performance", render: (filters: any) => <QuarterPerformancePanel filters={filters} /> },
  { id: "team-trend-lines", render: (filters: any) => <TeamTrendLines filters={filters} /> },
  { id: "trend-lines", render: (filters: any) => <PerformanceTrendLines filters={filters} /> },
  { id: "efficiency-comparison", render: (filters: any) => <EfficiencyComparisonChart filters={filters} /> },
  { id: "performance-distribution", render: (filters: any) => <PerformanceDistributionChart filters={filters} /> },
];

const getDefaultLayout = (containerWidth: number) => {
  const cols = getGridCols(containerWidth);
  const defaultW = 3;
  const defaultH = 3;
  const perRow = Math.max(1, Math.floor(cols / defaultW));
  return moduleDefs.map((mod, i) => ({
    i: mod.id,
    x: (i % perRow) * defaultW,
    y: Math.floor(i / perRow) * defaultH,
    w: defaultW,
    h: defaultH,
    minW: 1,
    minH: 1,
    maxH: 6,
  }));
};

const AdvancedStatsOverview: React.FC = () => {
  // Filter state
  const [timeframe, setTimeframe] = useState("Custom");
  const [events, setEvents] = useState("All");
  const [players, setPlayers] = useState("All");
  const [customDateRange, setCustomDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const filters = useMemo(() => ({ timeframe, events, players, customDateRange }), [timeframe, events, players, customDateRange]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  // Memoize moduleDefs so it updates when filters change
  // const moduleDefs = useMemo(() => [
  //   { id: "team-stats", render: () => <TeamStatsPanel stats={mockTeamStats} config={mockTeamStatsConfig} filters={filters} /> },
  //   { id: "player-comparison", render: () => <PlayerComparisonMatrix filters={filters} /> },
  //   { id: "game-stats", render: () => <GameStatsPanel games={mockGameStats} filters={filters} /> },
  //   { id: "shot-selection", render: () => <ShotSelectionPanel filters={filters} /> },
  //   { id: "quarter-performance", render: () => <QuarterPerformancePanel filters={filters} /> },
  //   { id: "team-trend-lines", render: () => <TeamTrendLines filters={filters} /> },
  //   { id: "trend-lines", render: () => <PerformanceTrendLines filters={filters} /> },
  //   { id: "efficiency-comparison", render: () => <EfficiencyComparisonChart filters={filters} /> },
  //   { id: "performance-distribution", render: () => <PerformanceDistributionChart filters={filters} /> },
  // ], [filters]);

  // Memoize getDefaultLayout so it always uses the latest moduleDefs
  // const getDefaultLayout = useCallback((containerWidth: number) => {
  //   const cols = getGridCols(containerWidth);
  //   const defaultW = 3;
  //   const defaultH = 3;
  //   const perRow = Math.max(1, Math.floor(cols / defaultW));
  //   return moduleDefs.map((mod, i) => ({
  //     i: mod.id,
  //     x: (i % perRow) * defaultW,
  //     y: Math.floor(i / perRow) * defaultH,
  //     w: defaultW,
  //     h: defaultH,
  //     minW: 1,
  //     minH: 1,
  //     maxH: 6,
  //   }));
  // }, [moduleDefs]);

  const [layout, setLayout] = useState(() => getDefaultLayout(1200));
  const [configName, setConfigName] = useState('');
  const [configs, setConfigs] = useState({});
  const [selectedConfig, setSelectedConfig] = useState('');
  // Store refs for each module
  const moduleRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  // Track if initial auto-fit has been performed
  const initialAutoFitDone = useRef(false);

  // Responsive: update container width and layout on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      const width = containerRef.current?.offsetWidth || 1200;
      setContainerWidth(width);
      setLayout(prev => getDefaultLayout(width));
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [getDefaultLayout]);

  // Helper: px to grid units
  const pxToGrid = useCallback((widthPx: number, heightPx: number) => {
    const cols = getGridCols(containerWidth);
    const colWidth = (containerWidth - (cols - 1) * GRID_MARGIN) / cols;
    const w = Math.max(1, Math.round(widthPx / colWidth));
    const h = Math.max(1, Math.round(heightPx / GRID_ROW_HEIGHT));
    return { w, h };
  }, [containerWidth]);

  // Auto-fit all modules to content on first load and on resize
  useEffect(() => {
    if (!initialAutoFitDone.current) {
      setTimeout(() => {
        setLayout(prevLayout => {
          let changed = false;
          const newLayout = prevLayout.map(item => {
            const ref = moduleRefs.current[item.i];
            if (ref) {
              const rect = ref.getBoundingClientRect();
              const { w, h } = pxToGrid(rect.width, rect.height);
              const maxH = item.maxH || 6;
              const clampedH = Math.min(h, maxH);
              if (item.w !== w || item.h !== clampedH) {
                changed = true;
                return { ...item, w, h: clampedH };
              }
            }
            return item;
          });
          if (changed) initialAutoFitDone.current = true;
          return changed ? newLayout : prevLayout;
        });
      }, 100);
    }
    // On window resize, re-fit all modules
    const handleResize = () => {
      setTimeout(() => {
        setLayout(prevLayout => {
          let changed = false;
          const newLayout = prevLayout.map(item => {
            const ref = moduleRefs.current[item.i];
            if (ref) {
              const rect = ref.getBoundingClientRect();
              const { w, h } = pxToGrid(rect.width, rect.height);
              const maxH = item.maxH || 6;
              const clampedH = Math.min(h, maxH);
              if (item.w !== w || item.h !== clampedH) {
                changed = true;
                return { ...item, w, h: clampedH };
              }
            }
            return item;
          });
          return changed ? newLayout : prevLayout;
        });
      }, 100);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pxToGrid]);

  // Manual fit-to-content handler
  const handleFitToContent = (id: string) => {
    const ref = moduleRefs.current[id];
    if (ref) {
      const rect = ref.getBoundingClientRect();
      const { w, h } = pxToGrid(rect.width, rect.height);
      setLayout(prevLayout => prevLayout.map(item => item.i === id ? { ...item, w, h } : item));
    }
  };

  const handleSaveConfig = () => {
    if (!configName) return;
    saveConfig(configName, layout);
    setConfigs(loadConfigs());
    setConfigName('');
  };

  const handleLoadConfig = (name: string) => {
    const configs = loadConfigs();
    if (configs[name]) {
      setLayout(configs[name]);
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
      setLayout(getDefaultLayout(containerWidth));
    }
  };

  const handleReset = () => {
    setLayout(getDefaultLayout(containerWidth));
    setSelectedConfig('');
  };

  return (
    <div className={styles.dashboardContainer} ref={containerRef}>
      {/* Figma Top Bar */}
      <div className={styles.figmaTopBar}>
        <span className={styles.figmaTitle}>Statistics</span>
        <Frame
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          events={events}
          setEvents={setEvents}
          players={players}
          setPlayers={setPlayers}
          showCustomDateRange={timeframe === "Custom"}
          customDateRange={customDateRange}
          setCustomDateRange={setCustomDateRange}
        />
        <Link href="/live-stat-tracker">
          <Button
            type="primary"
            icon={<MenuOutlined />}
            size="large"
            className={styles.figmaUploadBtn}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            Live Stats Tracker
          </Button>
        </Link>
      </div>
      {/* Save/Reset Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Input
          placeholder="Config name"
          value={configName}
          onChange={e => setConfigName(e.target.value)}
          style={{ width: 180 }}
        />
        <Button type="primary" onClick={handleSaveConfig}>Save Layout</Button>
        <select
          value={selectedConfig}
          onChange={e => handleLoadConfig(e.target.value)}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #3a4a5d', background: '#23272f', color: '#fff' }}
        >
          <option value="">Load Layout...</option>
          {Object.keys(configs).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        {selectedConfig && (
          <Button danger onClick={() => handleDeleteConfig(selectedConfig)}>Delete Layout</Button>
        )}
        <Button onClick={handleReset}>Reset to Default</Button>
      </div>
      <ResponsiveGridLayout
        className={styles.gridContainer}
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: getGridCols(containerWidth), md: 10, sm: 8, xs: 4, xxs: 2 }}
        rowHeight={GRID_ROW_HEIGHT}
        isResizable
        isDraggable
        onLayoutChange={(l: any) => setLayout(l)}
        measureBeforeMount={false}
        compactType="vertical"
        preventCollision={false}
      >
        {moduleDefs.map((mod) => (
          <div key={mod.id} data-grid={layout.find(l => l.i === mod.id) || { x: 0, y: 0, w: 3, h: 2 }} className={styles.gridItem} style={{ position: 'relative' }}>
            {/* Drag Handle */}
            <div
              className={styles.dragHandle}
              style={{ position: 'absolute', top: 4, right: 4, zIndex: 20, cursor: 'grab', padding: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 4 }}
              title="Drag to move"
            >
              <DragOutlined style={{ fontSize: 12, color: '#fff' }} />
            </div>
            {/* Resize Handle */}
            <div
              className={styles.resizeCorner}
              style={{ position: 'absolute', bottom: 4, right: 4, zIndex: 20, cursor: 'nwse-resize', padding: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 4 }}
              title="Resize"
            >
              <ArrowsAltOutlined style={{ fontSize: 12, color: '#fff' }} />
            </div>
            <div
              ref={el => { moduleRefs.current[mod.id] = el; }}
              style={{ width: '100%', height: '100%', padding: '24px 8px 8px 8px', flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', background: 'none', position: 'relative' }}
            >
              {mod.render(filters)}
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default AdvancedStatsOverview; 