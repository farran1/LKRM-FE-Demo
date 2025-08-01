// Utility functions for managing global settings across the platform

export interface AppSettings {
  // Notification Settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  mentionNotifications: boolean;
  taskAssignmentNotifications: boolean;
  deadlineReminders: boolean;
  
  // Dashboard Settings
  autoRefreshDashboard: boolean;
  showWelcomeMessage: boolean;
  defaultDashboardView: string;
  
  // Theme Settings
  compactMode: boolean;
  
  // Performance Settings
  animationsEnabled: boolean;
  autoSaveInterval: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  // Notification Settings
  emailNotifications: true,
  pushNotifications: true,
  mentionNotifications: true,
  taskAssignmentNotifications: true,
  deadlineReminders: true,
  
  // Dashboard Settings
  autoRefreshDashboard: true,
  showWelcomeMessage: true,
  defaultDashboardView: 'dashboard3',
  
  // Theme Settings
  compactMode: false,
  
  // Performance Settings
  animationsEnabled: true,
  autoSaveInterval: 30
};

const SETTINGS_KEY = 'lkrm-settings';

// Get current settings from localStorage
export function getSettings(): AppSettings {
  try {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all settings exist
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

// Save settings to localStorage
export function saveSettings(settings: AppSettings): void {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    
    // Trigger a custom event for components to listen to
    window.dispatchEvent(new CustomEvent('settingsChanged', { 
      detail: settings 
    }));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Update a specific setting
export function updateSetting<K extends keyof AppSettings>(
  key: K, 
  value: AppSettings[K]
): void {
  const currentSettings = getSettings();
  const newSettings = { ...currentSettings, [key]: value };
  saveSettings(newSettings);
}

// Reset to default settings
export function resetSettings(): void {
  saveSettings(DEFAULT_SETTINGS);
}

// Check if a notification type should be shown based on settings
export function shouldShowNotification(type: 'mention' | 'assignment' | 'deadline' | 'priority' | 'completion'): boolean {
  const settings = getSettings();
  
  switch (type) {
    case 'mention':
      return settings.mentionNotifications;
    case 'assignment':
      return settings.taskAssignmentNotifications;
    case 'deadline':
      return settings.deadlineReminders;
    case 'priority':
      return settings.taskAssignmentNotifications; // Use task assignment setting for priority changes
    case 'completion':
      return settings.taskAssignmentNotifications; // Use task assignment setting for completions
    default:
      return true;
  }
}

// Apply theme settings to the document
export function applyThemeSettings(): void {
  const settings = getSettings();
  
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  
  // Apply compact mode
  if (settings.compactMode) {
    root.classList.add('compact-mode');
  } else {
    root.classList.remove('compact-mode');
  }
  
  // Apply animations setting
  if (!settings.animationsEnabled) {
    root.classList.add('no-animations');
  } else {
    root.classList.remove('no-animations');
  }
}

// Hook for React components to use settings
export function useSettings() {
  const [settings, setSettingsState] = React.useState<AppSettings>(getSettings);
  
  React.useEffect(() => {
    const handleSettingsChange = (event: CustomEvent<AppSettings>) => {
      setSettingsState(event.detail);
    };
    
    window.addEventListener('settingsChanged', handleSettingsChange as EventListener);
    
    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChange as EventListener);
    };
  }, []);
  
  const updateSettingValue = React.useCallback(<K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ) => {
    updateSetting(key, value);
  }, []);
  
  return {
    settings,
    updateSetting: updateSettingValue,
    resetSettings,
    saveSettings: () => saveSettings(settings)
  };
}

// Import React for the hook
import React from 'react'; 