// Dashboard focus management hook
// Controls which panel is currently in focus mode

import { useState, useCallback } from 'react';

export type FocusPanel = 'team' | 'games' | 'players' | null;

export const useDashboardFocus = () => {
  const [focusedPanel, setFocusedPanel] = useState<FocusPanel>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const toggleFocus = useCallback((panel: FocusPanel) => {
    if (focusedPanel === panel) {
      // If clicking the same panel, exit focus mode
      setFocusedPanel(null);
      setIsFocusMode(false);
    } else {
      // Focus on the selected panel
      setFocusedPanel(panel);
      setIsFocusMode(true);
    }
  }, [focusedPanel]);

  const exitFocusMode = useCallback(() => {
    setFocusedPanel(null);
    setIsFocusMode(false);
  }, []);

  const getPanelVisibility = useCallback((panel: FocusPanel) => {
    if (!isFocusMode) {
      // Show all panels in overview mode
      return true;
    }
    // Only show the focused panel
    return focusedPanel === panel;
  }, [isFocusMode, focusedPanel]);

  const getPanelSize = useCallback((panel: FocusPanel) => {
    if (!isFocusMode) {
      // Equal size in overview mode
      return { xs: 24, lg: 8 };
    }
    // Full width when focused
    return { xs: 24, lg: 24 };
  }, [isFocusMode]);

  return {
    focusedPanel,
    isFocusMode,
    toggleFocus,
    exitFocusMode,
    getPanelVisibility,
    getPanelSize,
  };
}; 