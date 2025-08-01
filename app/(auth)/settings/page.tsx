'use client';

import React, { useState, useEffect } from 'react';
import { Switch } from 'antd';

interface SettingsState {
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

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
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
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('lkrm-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSettingChange = (key: keyof SettingsState, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    localStorage.setItem('lkrm-settings', JSON.stringify(settings));
    setHasChanges(false);
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 1000;
      font-family: Inter, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    successMsg.textContent = 'Settings saved successfully!';
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
      document.body.removeChild(successMsg);
    }, 3000);
  };

  const resetSettings = () => {
    setSettings({
      emailNotifications: true,
      pushNotifications: true,
      mentionNotifications: true,
      taskAssignmentNotifications: true,
      deadlineReminders: true,
      autoRefreshDashboard: true,
      showWelcomeMessage: true,
      defaultDashboardView: 'dashboard3',
      compactMode: false,
      animationsEnabled: true,
      autoSaveInterval: 30
    });
    setHasChanges(true);
  };

  const SettingItem = ({ 
    title, 
    description, 
    children 
  }: { 
    title: string; 
    description: string; 
    children: React.ReactNode; 
  }) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{ flex: 1, marginRight: '16px' }}>
        <h4 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#ffffff',
          margin: '0 0 6px 0',
          fontFamily: 'Inter, sans-serif'
        }}>
          {title}
        </h4>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          lineHeight: '1.4'
        }}>
          {description}
        </p>
      </div>
      <div>
        {children}
      </div>
    </div>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <h3 style={{
      fontSize: '22px',
      fontWeight: 700,
      color: '#ffffff',
      margin: '40px 0 20px 0',
      fontFamily: 'Inter, sans-serif',
      borderBottom: '2px solid #B58842',
      paddingBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      {title === 'Notifications' && (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#B58842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.73 21A2 2 0 0 1 10.27 21" stroke="#B58842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {title === 'Dashboard' && (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" stroke="#B58842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="14" y="3" width="7" height="7" stroke="#B58842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="14" y="14" width="7" height="7" stroke="#B58842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="3" y="14" width="7" height="7" stroke="#B58842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {title === 'Appearance' && (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="5" stroke="#B58842" strokeWidth="2"/>
          <line x1="12" y1="1" x2="12" y2="3" stroke="#B58842" strokeWidth="2" strokeLinecap="round"/>
          <line x1="12" y1="21" x2="12" y2="23" stroke="#B58842" strokeWidth="2" strokeLinecap="round"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="#B58842" strokeWidth="2" strokeLinecap="round"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="#B58842" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
      {title === 'Performance' && (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" stroke="#B58842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {title}
    </h3>
  );

  return (
    <main style={{ 
      padding: '24px', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #17375c 0%, #0f2a44 100%)',
      paddingTop: '80px' // Account for fixed header
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
          paddingBottom: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#B58842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2583 9.77251 19.9887C9.5799 19.7191 9.31074 19.5129 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.74174 9.96512 4.01131 9.77251C4.28087 9.5799 4.48707 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="#B58842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Settings
            </h1>
            <p style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.7)',
              margin: '8px 0 0 0',
              fontFamily: 'Inter, sans-serif'
            }}>
              Customize your LKRM coaching experience
            </p>
          </div>
          
          {hasChanges && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={resetSettings}
                style={{
                  padding: '12px 24px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontWeight: 500
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Reset to Defaults
              </button>
              <button
                onClick={saveSettings}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #B58842 0%, #9a7136 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(181, 136, 66, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(181, 136, 66, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(181, 136, 66, 0.3)';
                }}
              >
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Notification Settings */}
        <SectionHeader title="Notifications" />
        
        <SettingItem
          title="Email Notifications"
          description="Receive important updates and alerts via email"
        >
          <Switch
            checked={settings.emailNotifications}
            onChange={(checked) => handleSettingChange('emailNotifications', checked)}
            style={{
              backgroundColor: settings.emailNotifications ? '#B58842' : 'rgba(255, 255, 255, 0.2)'
            }}
          />
        </SettingItem>

        <SettingItem
          title="Push Notifications"
          description="Get real-time notifications in your browser"
        >
          <Switch
            checked={settings.pushNotifications}
            onChange={(checked) => handleSettingChange('pushNotifications', checked)}
            style={{
              backgroundColor: settings.pushNotifications ? '#B58842' : 'rgba(255, 255, 255, 0.2)'
            }}
          />
        </SettingItem>

        <SettingItem
          title="Mention Notifications"
          description="Be notified when someone mentions you with @"
        >
          <Switch
            checked={settings.mentionNotifications}
            onChange={(checked) => handleSettingChange('mentionNotifications', checked)}
            style={{
              backgroundColor: settings.mentionNotifications ? '#B58842' : 'rgba(255, 255, 255, 0.2)'
            }}
          />
        </SettingItem>

        <SettingItem
          title="Task Assignment Notifications"
          description="Get notified when tasks are assigned to you"
        >
          <Switch
            checked={settings.taskAssignmentNotifications}
            onChange={(checked) => handleSettingChange('taskAssignmentNotifications', checked)}
            style={{
              backgroundColor: settings.taskAssignmentNotifications ? '#B58842' : 'rgba(255, 255, 255, 0.2)'
            }}
          />
        </SettingItem>

        <SettingItem
          title="Deadline Reminders"
          description="Receive reminders for upcoming task deadlines"
        >
          <Switch
            checked={settings.deadlineReminders}
            onChange={(checked) => handleSettingChange('deadlineReminders', checked)}
            style={{
              backgroundColor: settings.deadlineReminders ? '#B58842' : 'rgba(255, 255, 255, 0.2)'
            }}
          />
        </SettingItem>

        {/* Dashboard Settings */}
        <SectionHeader title="Dashboard" />

        <SettingItem
          title="Auto-refresh Dashboard"
          description="Automatically refresh dashboard data every 5 minutes"
        >
          <Switch
            checked={settings.autoRefreshDashboard}
            onChange={(checked) => handleSettingChange('autoRefreshDashboard', checked)}
            style={{
              backgroundColor: settings.autoRefreshDashboard ? '#B58842' : 'rgba(255, 255, 255, 0.2)'
            }}
          />
        </SettingItem>

        <SettingItem
          title="Show Welcome Message"
          description="Display welcome message on dashboard header"
        >
          <Switch
            checked={settings.showWelcomeMessage}
            onChange={(checked) => handleSettingChange('showWelcomeMessage', checked)}
            style={{
              backgroundColor: settings.showWelcomeMessage ? '#B58842' : 'rgba(255, 255, 255, 0.2)'
            }}
          />
        </SettingItem>

        <SettingItem
          title="Default Dashboard View"
          description="Choose which dashboard loads by default"
        >
          <select
            value={settings.defaultDashboardView}
            onChange={(e) => handleSettingChange('defaultDashboardView', e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              minWidth: '180px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              backdropFilter: 'blur(5px)'
            }}
          >
            <option value="dashboard3" style={{ background: '#17375c', color: '#ffffff' }}>Modern Dashboard</option>
            <option value="stats-overview" style={{ background: '#17375c', color: '#ffffff' }}>Stats Overview</option>
            <option value="tasks" style={{ background: '#17375c', color: '#ffffff' }}>Task Management</option>
          </select>
        </SettingItem>

        {/* Appearance Settings */}
        <SectionHeader title="Appearance" />

        <SettingItem
          title="Compact Mode"
          description="Reduce spacing and padding for more content density"
        >
          <Switch
            checked={settings.compactMode}
            onChange={(checked) => handleSettingChange('compactMode', checked)}
            style={{
              backgroundColor: settings.compactMode ? '#B58842' : 'rgba(255, 255, 255, 0.2)'
            }}
          />
        </SettingItem>

        {/* Performance Settings */}
        <SectionHeader title="Performance" />

        <SettingItem
          title="Enable Animations"
          description="Show smooth transitions and animations"
        >
          <Switch
            checked={settings.animationsEnabled}
            onChange={(checked) => handleSettingChange('animationsEnabled', checked)}
            style={{
              backgroundColor: settings.animationsEnabled ? '#B58842' : 'rgba(255, 255, 255, 0.2)'
            }}
          />
        </SettingItem>

        <SettingItem
          title="Auto-save Interval"
          description="How often to automatically save your work"
        >
          <select
            value={settings.autoSaveInterval}
            onChange={(e) => handleSettingChange('autoSaveInterval', parseInt(e.target.value))}
            style={{
              padding: '10px 16px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              minWidth: '140px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              backdropFilter: 'blur(5px)'
            }}
          >
            <option value={15} style={{ background: '#17375c', color: '#ffffff' }}>15 seconds</option>
            <option value={30} style={{ background: '#17375c', color: '#ffffff' }}>30 seconds</option>
            <option value={60} style={{ background: '#17375c', color: '#ffffff' }}>1 minute</option>
            <option value={120} style={{ background: '#17375c', color: '#ffffff' }}>2 minutes</option>
            <option value={300} style={{ background: '#17375c', color: '#ffffff' }}>5 minutes</option>
          </select>
        </SettingItem>

      </div>
    </main>
  );
} 