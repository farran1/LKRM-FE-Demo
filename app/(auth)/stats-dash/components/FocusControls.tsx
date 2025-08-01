'use client'
import React from 'react';
import { Button, Space, Tooltip } from 'antd';
import { 
  TeamOutlined, 
  CalendarOutlined, 
  UserOutlined, 
  FullscreenExitOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { FocusPanel } from '../hooks/useDashboardFocus';
import style from '../style.module.scss';

interface FocusControlsProps {
  isFocusMode: boolean;
  focusedPanel: FocusPanel;
  onToggleFocus: (panel: FocusPanel) => void;
  onExitFocus: () => void;
}

const FocusControls: React.FC<FocusControlsProps> = ({
  isFocusMode,
  focusedPanel,
  onToggleFocus,
  onExitFocus,
}) => {
  const getButtonType = (panel: FocusPanel) => {
    if (!isFocusMode) return 'default';
    return focusedPanel === panel ? 'primary' : 'default';
  };

  const getButtonIcon = (panel: FocusPanel) => {
    switch (panel) {
      case 'team':
        return <TeamOutlined />;
      case 'games':
        return <CalendarOutlined />;
      case 'players':
        return <UserOutlined />;
      default:
        return null;
    }
  };

  const getButtonText = (panel: FocusPanel) => {
    switch (panel) {
      case 'team':
        return 'Team Stats';
      case 'games':
        return 'Game Stats';
      case 'players':
        return 'Player Stats';
      default:
        return '';
    }
  };

  return (
    <div className={style.focusControls}>
      <Space size="small">
        {/* Focus Mode Toggle Buttons */}
        <Tooltip title="Focus on Team Statistics">
          <Button
            type={getButtonType('team')}
            icon={getButtonIcon('team')}
            onClick={() => onToggleFocus('team')}
            size="small"
          >
            {getButtonText('team')}
          </Button>
        </Tooltip>

        <Tooltip title="Focus on Game Statistics">
          <Button
            type={getButtonType('games')}
            icon={getButtonIcon('games')}
            onClick={() => onToggleFocus('games')}
            size="small"
          >
            {getButtonText('games')}
          </Button>
        </Tooltip>

        <Tooltip title="Focus on Player Statistics">
          <Button
            type={getButtonType('players')}
            icon={getButtonIcon('players')}
            onClick={() => onToggleFocus('players')}
            size="small"
          >
            {getButtonText('players')}
          </Button>
        </Tooltip>

        {/* Exit Focus Mode Button */}
        {isFocusMode && (
          <Tooltip title="Exit Focus Mode">
            <Button
              type="default"
              icon={<FullscreenExitOutlined />}
              onClick={onExitFocus}
              size="small"
            >
              Exit Focus
            </Button>
          </Tooltip>
        )}

        {/* Overview Mode Indicator */}
        {!isFocusMode && (
          <Tooltip title="Overview Mode - All panels visible">
            <Button
              type="default"
              icon={<AppstoreOutlined />}
              disabled
              size="small"
            >
              Overview
            </Button>
          </Tooltip>
        )}
      </Space>
    </div>
  );
};

export default FocusControls; 