'use client';

import React, { useState, useEffect } from 'react';
import Next7DaysTasksModule from '../dashboard3/components/Next7DaysTasksModule';
import GamedayChecklistModule from '../dashboard3/components/GamedayChecklistModule';
import TeamRosterModule from '../dashboard3/components/TeamRosterModule';
import StickyNotesModule from '../dashboard3/components/StickyNotesModule';
import RecentActivityModule from '../dashboard3/components/RecentActivityModule';
import CalendarEventsModule from '../dashboard3/components/CalendarEventsModule';
import TeamStatsModule from '../dashboard3/components/TeamStatsModule';

export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Check initial sidebar state
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebar-collapsed');
      setSidebarCollapsed(stored === 'true');
    }

    // Listen for sidebar state changes
    const handleStorageChange = () => {
      const stored = localStorage.getItem('sidebar-collapsed');
      setSidebarCollapsed(stored === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events if the layout emits them
    const handleSidebarToggle = () => {
      const stored = localStorage.getItem('sidebar-collapsed');
      setSidebarCollapsed(stored === 'true');
    };

    window.addEventListener('sidebar-toggle', handleSidebarToggle);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  // Use tighter spacing when sidebar is collapsed
  const columnGap = sidebarCollapsed ? '8px' : '12px';

  return (
    <main style={{ 
      padding: '0 24px 24px 0', 
      minHeight: '100vh', 
      background: '#202c3e'
    }}>
      {/* Dashboard Grid Layout */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 375px',
        gap: '12px',
        minHeight: '800px'
      }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: columnGap }}>
          {/* Gameday Checklist */}
          <div style={{ width: '100%' }}>
            <GamedayChecklistModule sidebarCollapsed={sidebarCollapsed} />
          </div>
          
          {/* Next 7 Days Tasks */}
          <div style={{ width: '100%' }}>
            <Next7DaysTasksModule sidebarCollapsed={sidebarCollapsed} />
          </div>
          
          {/* Team Stats */}
          <div style={{ width: '100%' }}>
            <TeamStatsModule />
          </div>
        </div>

        {/* Middle Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: columnGap }}>
          {/* Sticky Notes */}
          <div style={{ width: '100%' }}>
            <StickyNotesModule sidebarCollapsed={sidebarCollapsed} />
          </div>
          
          {/* Recent Activity */}
          <div style={{ width: '100%' }}>
            <RecentActivityModule />
          </div>
        </div>

        {/* Right Column - Calendar Events + Team Roster */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: columnGap }}>
          {/* Calendar Events */}
          <div style={{ width: '100%' }}>
            <CalendarEventsModule />
          </div>
          
          {/* Team Roster */}
          <div style={{ width: '100%' }}>
            <TeamRosterModule />
          </div>
        </div>
      </div>
    </main>
  );
} 