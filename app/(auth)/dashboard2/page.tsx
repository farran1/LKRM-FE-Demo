"use client";
import React, { useState, useRef, useEffect, forwardRef } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const GRID_COLS = 12;
const GRID_ROW_HEIGHT = 90;
const GRID_MARGIN = 16;

const mockEvents = [
  { title: "Practice", date: "2024-07-12", time: "5:00pm", location: "Main Gym" },
  { title: "Game vs Eagles", date: "2024-07-14", time: "7:00pm", opponent: "Eagles" },
  { title: "Team Meeting", date: "2024-07-15", time: "6:00pm", location: "Conference Room" },
  { title: "Film Review", date: "2024-07-16", time: "4:00pm", location: "Media Center" },
  { title: "Strategy Session", date: "2024-07-17", time: "7:30pm", location: "Locker Room" },
  { title: "Scrimmage", date: "2024-07-18", time: "5:30pm", location: "Main Gym" },
  { title: "Community Event", date: "2024-07-19", time: "3:00pm", location: "Auditorium" },
  { title: "Team Dinner", date: "2024-07-20", time: "8:00pm", location: "Coach's House" },
  { title: "Open Gym", date: "2024-07-21", time: "2:00pm", location: "Main Gym" },
  { title: "Game vs Falcons", date: "2024-07-22", time: "7:00pm", opponent: "Falcons" },
];

const mockGamedayChecklist = [
  { 
    id: 1, 
    task: "Set Up Locker Room", 
    description: "Ensure Jerseys, Gear, And Hydration Available",
    completed: true,
    category: "pre-game"
  },
  { 
    id: 2, 
    task: "Sync With Coaching Staff", 
    description: "Review Final Game Plan And Key Matchups",
    completed: true,
    category: "pre-game"
  },
  { 
    id: 3, 
    task: "Player Health Check", 
    description: "Confirm All Players Cleared For Game",
    completed: true,
    category: "pre-game"
  },
  { 
    id: 4, 
    task: "Equipment Inspection", 
    description: "Verify All Gear And Safety Equipment",
    completed: false,
    category: "pre-game"
  },
  { 
    id: 5, 
    task: "Team Warm-up", 
    description: "Lead Pre-Game Stretching And Drills",
    completed: false,
    category: "pre-game"
  },
  { 
    id: 6, 
    task: "Final Team Meeting", 
    description: "Last Minute Strategy And Motivation",
    completed: false,
    category: "pre-game"
  },
  { 
    id: 7, 
    task: "Monitor Game Flow", 
    description: "Track Timeouts, Fouls, And Momentum",
    completed: false,
    category: "during-game"
  },
  { 
    id: 8, 
    task: "Player Substitutions", 
    description: "Manage Rotations And Rest Periods",
    completed: false,
    category: "during-game"
  },
  { 
    id: 9, 
    task: "Post-Game Debrief", 
    description: "Team Meeting And Performance Review",
    completed: false,
    category: "post-game"
  },
  { 
    id: 10, 
    task: "Update Statistics", 
    description: "Record Player Stats And Game Notes",
    completed: false,
    category: "post-game"
  }
];

const mockTeamTasks = [
  { 
    id: 1, 
    task: "Review player performance", 
    description: "Analyze recent game statistics",
    completed: true,
    category: "coaching"
  },
  { 
    id: 2, 
    task: "Update team roster", 
    description: "Confirm active players and positions",
    completed: true,
    category: "administration"
  },
  { 
    id: 3, 
    task: "Schedule team meeting", 
    description: "Plan weekly strategy session",
    completed: false,
    category: "planning"
  },
  { 
    id: 4, 
    task: "Equipment inventory", 
    description: "Check gear and uniform status",
    completed: false,
    category: "logistics"
  },
  { 
    id: 5, 
    task: "Film review session", 
    description: "Analyze opponent game footage",
    completed: false,
    category: "coaching"
  },
  { 
    id: 6, 
    task: "Player health check", 
    description: "Monitor injury status and recovery",
    completed: false,
    category: "health"
  },
  { 
    id: 7, 
    task: "Budget review", 
    description: "Review team expenses and allocations",
    completed: false,
    category: "administration"
  },
  { 
    id: 8, 
    task: "Practice planning", 
    description: "Design next week's training schedule",
    completed: false,
    category: "coaching"
  },
  { 
    id: 9, 
    task: "Community outreach", 
    description: "Plan team community service event",
    completed: false,
    category: "outreach"
  },
  { 
    id: 10, 
    task: "Recruitment planning", 
    description: "Identify potential new players",
    completed: false,
    category: "recruitment"
  }
];

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

const UpcomingEventsCardTop = forwardRef(function UpcomingEventsCardTop({ overflowMode, width, height }, ref) {
  // Responsive scaling: allow scale > 1 for growth
  const minFont = 11;
  const maxFont = 32;
  const minPad = 6;
  const maxPad = 48;
  const minMargin = 4;
  const maxMargin = 36;
  const scale = width / 320;
  const fontSize = clamp(Math.round(16 * scale), minFont, maxFont);
  const titleFont = clamp(Math.round(22 * scale), minFont + 2, maxFont + 10);
  const padding = clamp(Math.round(24 * scale), minPad, maxPad);
  const eventMargin = clamp(Math.round(16 * scale), minMargin, maxMargin);
  const lineHeight = clamp(fontSize * 1.18, fontSize + 2, fontSize * 1.5);
  return (
    <div
      ref={ref}
      style={{
        background: "#17375c",
        borderRadius: 16,
        boxShadow: "0 2px 12px 0 rgba(0,0,0,0.08)",
        padding,
        minHeight: 80,
        minWidth: 120,
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        color: "#fff",
        overflow: overflowMode === "scroll" ? "auto" : "hidden",
        transition: "padding 0.2s, font-size 0.2s, line-height 0.2s, margin 0.2s",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: titleFont, marginBottom: padding * 0.7, letterSpacing: 0.01, lineHeight: `${titleFont * 1.1}px`, position: 'relative' }}>
        Upcoming Events (Top)
        <span style={{ position: 'absolute', top: 0, right: -8, zIndex: 10, cursor: 'grab', padding: `${Math.round(padding * 0.15)}px ${Math.round(padding * 0.25)}px`, opacity: 0.7 }} title="Drag">
          <svg width={titleFont} height={titleFont} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect y="3" width="18" height="2" rx="1" fill="#b0c4d4"/>
            <rect y="8" width="18" height="2" rx="1" fill="#b0c4d4"/>
            <rect y="13" width="18" height="2" rx="1" fill="#b0c4d4"/>
          </svg>
        </span>
      </div>
      {mockEvents.map((event, idx) => (
        <div key={event.title} style={{ marginBottom: idx < mockEvents.length - 1 ? eventMargin : 0, width: '100%' }}>
          <div style={{ fontWeight: 600, fontSize, lineHeight: `${lineHeight}px`, width: '100%', wordBreak: 'break-word' }}>{event.title}</div>
          <div style={{ fontSize: fontSize - 2, color: "#b0c4d4", lineHeight: `${lineHeight - 2}px`, width: '100%', wordBreak: 'break-word' }}>{event.date} @ {event.time}</div>
          <div style={{ fontSize: fontSize - 2, color: "#b0c4d4", lineHeight: `${lineHeight - 2}px`, width: '100%', wordBreak: 'break-word' }}>{event.location || event.opponent}</div>
        </div>
      ))}
    </div>
  );
});

const UpcomingEventsCardFill = forwardRef(function UpcomingEventsCardFill({ overflowMode, width, height }, ref) {
  // Responsive scaling: allow scale > 1 for growth
  const minFont = 11;
  const maxFont = 32;
  const minPad = 6;
  const maxPad = 48;
  const minMargin = 4;
  const maxMargin = 36;
  const scale = width / 320;
  const fontSize = clamp(Math.round(16 * scale), minFont, maxFont);
  const titleFont = clamp(Math.round(22 * scale), minFont + 2, maxFont + 10);
  const padding = clamp(Math.round(24 * scale), minPad, maxPad);
  const eventMargin = clamp(Math.round(16 * scale), minMargin, maxMargin);
  const lineHeight = clamp(fontSize * 1.18, fontSize + 2, fontSize * 1.5);
  return (
    <div
      ref={ref}
      style={{
        background: "#17375c",
        borderRadius: 16,
        boxShadow: "0 2px 12px 0 rgba(0,0,0,0.08)",
        padding,
        minHeight: 80,
        minWidth: 120,
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        color: "#fff",
        overflow: overflowMode === "scroll" ? "auto" : "hidden",
        transition: "padding 0.2s, font-size 0.2s, line-height 0.2s, margin 0.2s",
        scrollbarWidth: 'thin',
        scrollbarColor: '#1e425c #17375c',
      }}
    >
      <style>{`
        .dashboard2-grid div[style*='overflow: auto']::-webkit-scrollbar {
          width: 8px;
          background: #17375c;
        }
        .dashboard2-grid div[style*='overflow: auto']::-webkit-scrollbar-thumb {
          background: #1e425c;
          border-radius: 8px;
        }
      `}</style>
      <div style={{ fontWeight: 700, fontSize: titleFont, marginBottom: padding * 0.7, letterSpacing: 0.01, lineHeight: `${titleFont * 1.1}px`, position: 'relative' }}>
        Upcoming Events (Fill)
        <span style={{ position: 'absolute', top: 0, right: -8, zIndex: 10, cursor: 'grab', padding: `${Math.round(padding * 0.15)}px ${Math.round(padding * 0.25)}px`, opacity: 0.7 }} title="Drag">
          <svg width={titleFont} height={titleFont} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect y="3" width="18" height="2" rx="1" fill="#b0c4d4"/>
            <rect y="8" width="18" height="2" rx="1" fill="#b0c4d4"/>
            <rect y="13" width="18" height="2" rx="1" fill="#b0c4d4"/>
          </svg>
        </span>
      </div>
      <div>
        {mockEvents.map((event, idx) => (
          <div key={event.title} style={{ marginBottom: idx < mockEvents.length - 1 ? eventMargin : 0, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize, lineHeight: `${lineHeight}px`, width: '100%', wordBreak: 'break-word' }}>{event.title}</div>
            <div style={{ fontSize: fontSize - 2, color: "#b0c4d4", lineHeight: `${lineHeight - 2}px`, width: '100%', wordBreak: 'break-word' }}>{event.date} @ {event.time}</div>
            <div style={{ fontSize: fontSize - 2, color: "#b0c4d4", lineHeight: `${lineHeight - 2}px`, width: '100%', wordBreak: 'break-word' }}>{event.location || event.opponent}</div>
          </div>
        ))}
      </div>
    </div>
  );
});

const GamedayChecklistCard = forwardRef(function GamedayChecklistCard({ overflowMode, width, height }, ref) {
  // Responsive scaling: allow scale > 1 for growth
  const minFont = 11;
  const maxFont = 32;
  const minPad = 6;
  const maxPad = 48;
  const minMargin = 4;
  const maxMargin = 36;
  const scale = width / 320;
  const fontSize = clamp(Math.round(16 * scale), minFont, maxFont);
  const titleFont = clamp(Math.round(22 * scale), minFont + 2, maxFont + 10);
  const padding = clamp(Math.round(24 * scale), minPad, maxPad);
  const taskMargin = clamp(Math.round(16 * scale), minMargin, maxMargin);
  const lineHeight = clamp(fontSize * 1.18, fontSize + 2, fontSize * 1.5);
  
  const completedTasks = mockGamedayChecklist.filter(task => task.completed).length;
  const totalTasks = mockGamedayChecklist.length;
  const pendingTasks = 2; // Mock pending tasks
  const notStartedTasks = totalTasks - completedTasks - pendingTasks;
  const progressPercentage = (completedTasks / totalTasks) * 100;
  
  const summaryItems = [
    {
      id: 'not-started',
      title: 'Not Started',
      count: notStartedTasks,
      color: '#ff6b6b',
      icon: (
        <svg width={fontSize} height={fontSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'pending',
      title: 'Pending',
      count: pendingTasks,
      color: '#ffd93d',
      icon: (
        <svg width={fontSize} height={fontSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'completed',
      title: 'Completed',
      count: completedTasks,
      color: '#4ecdc4',
      icon: (
        <svg width={fontSize} height={fontSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
        </svg>
      )
    }
  ];
  
  return (
    <div
      ref={ref}
      style={{
        background: "linear-gradient(135deg, #17375c 0%, #1e425c 100%)",
        borderRadius: 16,
        boxShadow: "0 4px 20px 0 rgba(0,0,0,0.15)",
        padding,
        minHeight: 80,
        minWidth: 120,
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        color: "#fff",
        overflow: overflowMode === "scroll" ? "auto" : "hidden",
        transition: "padding 0.2s, font-size 0.2s, line-height 0.2s, margin 0.2s",
        scrollbarWidth: 'thin',
        scrollbarColor: '#1e425c #17375c',
        position: 'relative',
      }}
    >
      {/* Left border accent */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        background: 'linear-gradient(180deg, #4ecdc4 0%, #45b7d1 100%)',
        borderRadius: '16px 0 0 16px'
      }} />
      
      <style>{`
        .dashboard2-grid div[style*='overflow: auto']::-webkit-scrollbar {
          width: 8px;
          background: #17375c;
        }
        .dashboard2-grid div[style*='overflow: auto']::-webkit-scrollbar-thumb {
          background: #1e425c;
          border-radius: 8px;
        }
      `}</style>
      
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: padding * 0.8,
        paddingLeft: 12, // Account for left border
        paddingRight: 12 // Add right padding to prevent overlap with drag handle
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: 700, 
            fontSize: titleFont, 
            color: '#ffd93d',
            letterSpacing: 0.01, 
            lineHeight: `${titleFont * 1.1}px`,
            marginBottom: Math.round(padding * 0.2)
          }}>
            Upcoming Game Checklist
          </div>
          <div style={{ 
            fontSize: fontSize - 2, 
            color: "#b0c4d4",
            lineHeight: `${lineHeight - 2}px`
          }}>
            Game vs. Eagles • 3/10/2025 • 12:00 PM - 02:00 PM
          </div>
        </div>
        
        {/* Progress Circle */}
        <div style={{
          width: titleFont * 2,
          height: titleFont * 2,
          borderRadius: '50%',
          background: 'conic-gradient(#ffd93d 0deg, #ffd93d ' + (progressPercentage * 3.6) + 'deg, #2a4a6b ' + (progressPercentage * 3.6) + 'deg, #2a4a6b 360deg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginLeft: Math.round(padding * 0.5),
          marginRight: 16 // Add margin to prevent overlap with drag handle
        }}>
          <div style={{
            width: titleFont * 1.6,
            height: titleFont * 1.6,
            borderRadius: '50%',
            background: '#17375c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: fontSize - 4,
            fontWeight: 600,
            color: '#fff'
          }}>
            {completedTasks}/{totalTasks}
          </div>
        </div>
      </div>
      
      {/* Drag Handle */}
      <span style={{ 
        position: 'absolute', 
        top: padding * 0.3, 
        right: 12, 
        zIndex: 10, 
        cursor: 'grab', 
        padding: `${Math.round(padding * 0.15)}px ${Math.round(padding * 0.25)}px`, 
        opacity: 0.7 
      }} title="Drag">
        <svg width={titleFont} height={titleFont} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect y="3" width="18" height="2" rx="1" fill="#b0c4d4"/>
          <rect y="8" width="18" height="2" rx="1" fill="#b0c4d4"/>
          <rect y="13" width="18" height="2" rx="1" fill="#b0c4d4"/>
        </svg>
      </span>
      
      {/* Summary Items */}
      <div style={{ paddingLeft: 12 }}>
        {summaryItems.map((item, idx) => (
          <div key={item.id} style={{ 
            marginBottom: idx < summaryItems.length - 1 ? taskMargin : 0, 
            width: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 12,
            padding: Math.round(padding * 0.4),
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            display: 'flex',
            alignItems: 'center',
            gap: Math.round(padding * 0.3),
            transition: 'all 0.2s ease'
          }}>
            {/* Status Icon */}
            <div style={{
              width: fontSize + 8,
              height: fontSize + 8,
              borderRadius: 8,
              background: `${item.color}20`,
              border: `2px solid ${item.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: item.color
            }}>
              {item.icon}
            </div>
            
            {/* Item Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontWeight: 600, 
                fontSize, 
                lineHeight: `${lineHeight}px`, 
                width: '100%', 
                wordBreak: 'break-word',
                color: '#fff'
              }}>
                {item.title}
              </div>
              <div style={{ 
                fontSize: fontSize - 3, 
                color: 'rgba(176, 196, 212, 0.8)',
                lineHeight: `${lineHeight - 3}px`,
                width: '100%',
                wordBreak: 'break-word',
                marginTop: Math.round(padding * 0.1)
              }}>
                {item.count} tasks
              </div>
            </div>
            
            {/* Count Badge */}
            <div style={{
              minWidth: fontSize + 8,
              height: fontSize + 8,
              borderRadius: '50%',
              background: item.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: fontSize - 2,
              fontWeight: 600,
              color: '#fff',
              flexShrink: 0
            }}>
              {item.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const FixedGamedayChecklistCard = forwardRef(function FixedGamedayChecklistCard({ overflowMode, width, height }, ref) {
  // Fixed sizing - no responsive scaling
  const fontSize = 16;
  const titleFont = 22;
  const padding = 24;
  const taskMargin = 16;
  const lineHeight = 20;
  
  const completedTasks = mockGamedayChecklist.filter(task => task.completed).length;
  const totalTasks = mockGamedayChecklist.length;
  const pendingTasks = 2; // Mock pending tasks
  const notStartedTasks = totalTasks - completedTasks - pendingTasks;
  const progressPercentage = (completedTasks / totalTasks) * 100;
  
  const summaryItems = [
    {
      id: 'not-started',
      title: 'Not Started',
      count: notStartedTasks,
      color: '#ff6b6b',
      icon: (
        <svg width={fontSize} height={fontSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'pending',
      title: 'Pending',
      count: pendingTasks,
      color: '#ffd93d',
      icon: (
        <svg width={fontSize} height={fontSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'completed',
      title: 'Completed',
      count: completedTasks,
      color: '#4ecdc4',
      icon: (
        <svg width={fontSize} height={fontSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
        </svg>
      )
    }
  ];
  
  return (
    <div
      ref={ref}
      style={{
        background: "linear-gradient(135deg, #17375c 0%, #1e425c 100%)",
        borderRadius: 16,
        boxShadow: "0 4px 20px 0 rgba(0,0,0,0.15)",
        padding,
        minHeight: 80,
        minWidth: 120,
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        color: "#fff",
        overflow: overflowMode === "scroll" ? "auto" : "hidden",
        transition: "padding 0.2s, font-size 0.2s, line-height 0.2s, margin 0.2s",
        scrollbarWidth: 'thin',
        scrollbarColor: '#1e425c #17375c',
        position: 'relative',
      }}
    >
      {/* Left border accent */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        background: 'linear-gradient(180deg, #4ecdc4 0%, #45b7d1 100%)',
        borderRadius: '16px 0 0 16px'
      }} />
      
      <style>{`
        .dashboard2-grid div[style*='overflow: auto']::-webkit-scrollbar {
          width: 8px;
          background: #17375c;
        }
        .dashboard2-grid div[style*='overflow: auto']::-webkit-scrollbar-thumb {
          background: #1e425c;
          border-radius: 8px;
        }
      `}</style>
      
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: padding * 0.8,
        paddingLeft: 12 // Account for left border
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: 700, 
            fontSize: titleFont, 
            color: '#ffd93d',
            letterSpacing: 0.01, 
            lineHeight: `${titleFont * 1.1}px`,
            marginBottom: Math.round(padding * 0.2)
          }}>
            Fixed Game Checklist
          </div>
          <div style={{ 
            fontSize: fontSize - 2, 
            color: "#b0c4d4",
            lineHeight: `${lineHeight - 2}px`
          }}>
            Game vs. Eagles • 3/10/2025 • 12:00 PM - 02:00 PM
          </div>
        </div>
        
        {/* Progress Circle */}
        <div style={{
          width: titleFont * 2,
          height: titleFont * 2,
          borderRadius: '50%',
          background: 'conic-gradient(#ffd93d 0deg, #ffd93d ' + (progressPercentage * 3.6) + 'deg, #2a4a6b ' + (progressPercentage * 3.6) + 'deg, #2a4a6b 360deg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginLeft: Math.round(padding * 0.5)
        }}>
          <div style={{
            width: titleFont * 1.6,
            height: titleFont * 1.6,
            borderRadius: '50%',
            background: '#17375c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: fontSize - 4,
            fontWeight: 600,
            color: '#fff'
          }}>
            {completedTasks}/{totalTasks}
          </div>
        </div>
      </div>
      
      {/* Drag Handle */}
      <span style={{ 
        position: 'absolute', 
        top: padding * 0.3, 
        right: 8, 
        zIndex: 10, 
        cursor: 'grab', 
        padding: `${Math.round(padding * 0.15)}px ${Math.round(padding * 0.25)}px`, 
        opacity: 0.7 
      }} title="Drag">
        <svg width={titleFont} height={titleFont} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect y="3" width="18" height="2" rx="1" fill="#b0c4d4"/>
          <rect y="8" width="18" height="2" rx="1" fill="#b0c4d4"/>
          <rect y="13" width="18" height="2" rx="1" fill="#b0c4d4"/>
        </svg>
      </span>
      
      {/* Summary Items */}
      <div style={{ paddingLeft: 12 }}>
        {summaryItems.map((item, idx) => (
          <div key={item.id} style={{ 
            marginBottom: idx < summaryItems.length - 1 ? taskMargin : 0, 
            width: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 12,
            padding: Math.round(padding * 0.4),
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            display: 'flex',
            alignItems: 'center',
            gap: Math.round(padding * 0.3),
            transition: 'all 0.2s ease'
          }}>
            {/* Status Icon */}
            <div style={{
              width: fontSize + 8,
              height: fontSize + 8,
              borderRadius: 8,
              background: `${item.color}20`,
              border: `2px solid ${item.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: item.color
            }}>
              {item.icon}
            </div>
            
            {/* Item Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontWeight: 600, 
                fontSize, 
                lineHeight: `${lineHeight}px`, 
                width: '100%', 
                wordBreak: 'break-word',
                color: '#fff'
              }}>
                {item.title}
              </div>
              <div style={{ 
                fontSize: fontSize - 3, 
                color: 'rgba(176, 196, 212, 0.8)',
                lineHeight: `${lineHeight - 3}px`,
                width: '100%',
                wordBreak: 'break-word',
                marginTop: Math.round(padding * 0.1)
              }}>
                {item.count} tasks
              </div>
            </div>
            
            {/* Count Badge */}
            <div style={{
              minWidth: fontSize + 8,
              height: fontSize + 8,
              borderRadius: '50%',
              background: item.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: fontSize - 2,
              fontWeight: 600,
              color: '#fff',
              flexShrink: 0
            }}>
              {item.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const TeamTasksCard = forwardRef(function TeamTasksCard({ overflowMode, width, height }, ref) {
  // Fixed sizing - no responsive scaling
  const fontSize = 16;
  const titleFont = 22;
  const padding = 24;
  const taskMargin = 16;
  const lineHeight = 20;
  
  const completedTasks = mockTeamTasks.filter(task => task.completed).length;
  const totalTasks = mockTeamTasks.length;
  const pendingTasks = 3; // Mock pending tasks
  const notStartedTasks = totalTasks - completedTasks - pendingTasks;
  const progressPercentage = (completedTasks / totalTasks) * 100;
  
  const summaryItems = [
    {
      id: 'not-started',
      title: 'Not Started',
      count: notStartedTasks,
      color: '#ff6b6b',
      icon: (
        <svg width={fontSize} height={fontSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'pending',
      title: 'In Progress',
      count: pendingTasks,
      color: '#ffd93d',
      icon: (
        <svg width={fontSize} height={fontSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'completed',
      title: 'Completed',
      count: completedTasks,
      color: '#4ecdc4',
      icon: (
        <svg width={fontSize} height={fontSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
        </svg>
      )
    }
  ];
  
  return (
    <div
      ref={ref}
      style={{
        background: "linear-gradient(135deg, #17375c 0%, #1e425c 100%)",
        borderRadius: 16,
        boxShadow: "0 4px 20px 0 rgba(0,0,0,0.15)",
        padding,
        minHeight: 80,
        minWidth: 120,
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        color: "#fff",
        overflow: overflowMode === "scroll" ? "auto" : "hidden",
        transition: "padding 0.2s, font-size 0.2s, line-height 0.2s, margin 0.2s",
        scrollbarWidth: 'thin',
        scrollbarColor: '#1e425c #17375c',
        position: 'relative',
      }}
    >
      {/* Left border accent */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        background: 'linear-gradient(180deg, #4ecdc4 0%, #45b7d1 100%)',
        borderRadius: '16px 0 0 16px'
      }} />
      
      <style>{`
        .dashboard2-grid div[style*='overflow: auto']::-webkit-scrollbar {
          width: 8px;
          background: #17375c;
        }
        .dashboard2-grid div[style*='overflow: auto']::-webkit-scrollbar-thumb {
          background: #1e425c;
          border-radius: 8px;
        }
      `}</style>
      
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: padding * 0.8,
        paddingLeft: 12, // Account for left border
        paddingRight: 40 // Add right padding to prevent overlap with drag handle
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: 700, 
            fontSize: titleFont, 
            color: '#ffd93d',
            letterSpacing: 0.01, 
            lineHeight: `${titleFont * 1.1}px`,
            marginBottom: Math.round(padding * 0.2)
          }}>
            Team Tasks Overview
          </div>
          <div style={{ 
            fontSize: fontSize - 2, 
            color: "#b0c4d4",
            lineHeight: `${lineHeight - 2}px`
          }}>
            Weekly Management • 8 Categories • 10 Total Tasks
          </div>
        </div>
        
        {/* Progress Circle */}
        <div style={{
          width: titleFont * 2,
          height: titleFont * 2,
          borderRadius: '50%',
          background: 'conic-gradient(#ffd93d 0deg, #ffd93d ' + (progressPercentage * 3.6) + 'deg, #2a4a6b ' + (progressPercentage * 3.6) + 'deg, #2a4a6b 360deg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginLeft: Math.round(padding * 0.5),
          marginRight: 16 // Add margin to prevent overlap with drag handle
        }}>
          <div style={{
            width: titleFont * 1.6,
            height: titleFont * 1.6,
            borderRadius: '50%',
            background: '#17375c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: fontSize - 4,
            fontWeight: 600,
            color: '#fff'
          }}>
            {completedTasks}/{totalTasks}
          </div>
        </div>
      </div>
      
      {/* Drag Handle */}
      <span style={{ 
        position: 'absolute', 
        top: padding * 0.3, 
        right: 12, 
        zIndex: 10, 
        cursor: 'grab', 
        padding: `${Math.round(padding * 0.15)}px ${Math.round(padding * 0.25)}px`, 
        opacity: 0.7 
      }} title="Drag">
        <svg width={titleFont} height={titleFont} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect y="3" width="18" height="2" rx="1" fill="#b0c4d4"/>
          <rect y="8" width="18" height="2" rx="1" fill="#b0c4d4"/>
          <rect y="13" width="18" height="2" rx="1" fill="#b0c4d4"/>
        </svg>
      </span>
      
      {/* Summary Items */}
      <div style={{ paddingLeft: 12 }}>
        {summaryItems.map((item, idx) => (
          <div key={item.id} style={{ 
            marginBottom: idx < summaryItems.length - 1 ? taskMargin : 0, 
            width: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 12,
            padding: Math.round(padding * 0.4),
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            display: 'flex',
            alignItems: 'center',
            gap: Math.round(padding * 0.3),
            transition: 'all 0.2s ease'
          }}>
            {/* Status Icon */}
            <div style={{
              width: fontSize + 8,
              height: fontSize + 8,
              borderRadius: 8,
              background: `${item.color}20`,
              border: `2px solid ${item.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: item.color
            }}>
              {item.icon}
            </div>
            
            {/* Item Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontWeight: 600, 
                fontSize, 
                lineHeight: `${lineHeight}px`, 
                width: '100%', 
                wordBreak: 'break-word',
                color: '#fff'
              }}>
                {item.title}
              </div>
              <div style={{ 
                fontSize: fontSize - 3, 
                color: 'rgba(176, 196, 212, 0.8)',
                lineHeight: `${lineHeight - 3}px`,
                width: '100%',
                wordBreak: 'break-word',
                marginTop: Math.round(padding * 0.1)
              }}>
                {item.count} tasks
              </div>
            </div>
            
            {/* Count Badge */}
            <div style={{
              minWidth: fontSize + 8,
              height: fontSize + 8,
              borderRadius: '50%',
              background: item.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: fontSize - 2,
              fontWeight: 600,
              color: '#fff',
              flexShrink: 0
            }}>
              {item.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const CompactGamedayChecklistCard = forwardRef(function CompactGamedayChecklistCard({ overflowMode, width, height }, ref) {
  // Fixed sizing for compact design
  const fontSize = 14;
  const titleFont = 18;
  const padding = 20;
  const cardMargin = 12;
  const lineHeight = 18;
  
  const completedTasks = mockGamedayChecklist.filter(task => task.completed).length;
  const totalTasks = mockGamedayChecklist.length;
  const highPriorityTasks = 3;
  const mediumPriorityTasks = 4;
  const lowPriorityTasks = totalTasks - highPriorityTasks - mediumPriorityTasks;
  
  const priorityCards = [
    {
      id: 'high',
      title: 'High Priority',
      count: highPriorityTasks,
      color: '#ff6b6b'
    },
    {
      id: 'medium',
      title: 'Med Priority',
      count: mediumPriorityTasks,
      color: '#ffd93d'
    },
    {
      id: 'low',
      title: 'Low Priority',
      count: lowPriorityTasks,
      color: '#45b7d1'
    }
  ];
  
  return (
    <div
      ref={ref}
      style={{
        background: "linear-gradient(135deg, #17375c 0%, #1e425c 100%)",
        borderRadius: 16,
        boxShadow: "0 4px 20px 0 rgba(0,0,0,0.15)",
        padding,
        minHeight: 80,
        minWidth: 120,
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        color: "#fff",
        overflow: overflowMode === "scroll" ? "auto" : "hidden",
        transition: "padding 0.2s, font-size 0.2s, line-height 0.2s, margin 0.2s",
        scrollbarWidth: 'thin',
        scrollbarColor: '#1e425c #17375c',
        position: 'relative',
      }}
    >
      {/* Left border accent */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        background: 'linear-gradient(180deg, #4ecdc4 0%, #45b7d1 100%)',
        borderRadius: '16px 0 0 16px'
      }} />
      
      <style>{`
        .dashboard2-grid div[style*='overflow: auto']::-webkit-scrollbar {
          width: 8px;
          background: #17375c;
        }
        .dashboard2-grid div[style*='overflow: auto']::-webkit-scrollbar-thumb {
          background: #1e425c;
          border-radius: 8px;
        }
      `}</style>
      
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: padding * 0.6,
        paddingLeft: 12, // Account for left border
        paddingRight: 40 // Add right padding to prevent overlap with drag handle
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: 700, 
            fontSize: titleFont, 
            color: '#fff',
            letterSpacing: 0.01, 
            lineHeight: `${titleFont * 1.1}px`,
            marginBottom: Math.round(padding * 0.1)
          }}>
            Next 7 Days Tasks
          </div>
          <div style={{ 
            fontSize: fontSize - 2, 
            color: "#b0c4d4",
            lineHeight: `${lineHeight - 2}px`
          }}>
            Gameday
          </div>
        </div>
        
        {/* Add Task Button */}
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginLeft: Math.round(padding * 0.3),
          marginRight: 10 // Add margin to prevent overlap with drag handle
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#fff"/>
          </svg>
        </div>
      </div>
      
      {/* Drag Handle */}
      <span style={{ 
        position: 'absolute', 
        top: padding * 0.3, 
        right: 12, 
        zIndex: 10, 
        cursor: 'grab', 
        padding: `${Math.round(padding * 0.15)}px ${Math.round(padding * 0.25)}px`, 
        opacity: 0.7 
      }} title="Drag">
        <svg width={titleFont} height={titleFont} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect y="3" width="18" height="2" rx="1" fill="#b0c4d4"/>
          <rect y="8" width="18" height="2" rx="1" fill="#b0c4d4"/>
          <rect y="13" width="18" height="2" rx="1" fill="#b0c4d4"/>
        </svg>
      </span>
      
      {/* Priority Cards */}
      <div style={{ 
        display: 'flex', 
        gap: cardMargin, 
        paddingLeft: 12,
        flex: 1
      }}>
        {priorityCards.map((card) => (
          <div key={card.id} style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 12,
            padding: Math.round(padding * 0.4),
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 80
          }}>
            <div style={{
              fontSize: fontSize - 2,
              color: '#b0c4d4',
              fontWeight: 500,
              marginBottom: Math.round(padding * 0.2),
              textAlign: 'center'
            }}>
              {card.title}
            </div>
            <div style={{
              fontSize: titleFont + 4,
              fontWeight: 700,
              color: card.color,
              textAlign: 'center'
            }}>
              {card.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const CompactTeamTasksCard = forwardRef(function CompactTeamTasksCard({ overflowMode, width, height }, ref) {
  // Fixed sizing - no responsive scaling
  const fontSize = 14;
  const titleFont = 18;
  const padding = 20;
  const lineHeight = 18;
  
  const highPriorityTasks = 3;
  const medPriorityTasks = 5;
  const lowPriorityTasks = 15;
  
  return (
    <div
      ref={ref}
      style={{
        background: "#032a3f", // Updated to match Figma design
        borderRadius: 16,
        boxShadow: "0 4px 20px 0 rgba(0,0,0,0.15)",
        padding,
        minHeight: 80,
        minWidth: 120,
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        color: "#fff",
        overflow: overflowMode === "scroll" ? "auto" : "hidden",
        transition: "padding 0.2s, font-size 0.2s, line-height 0.2s, margin 0.2s",
        scrollbarWidth: 'thin',
        scrollbarColor: '#1e425c #17375c',
        position: 'relative',
      }}
    >
      <style>{`
        .dashboard2-grid div[style*='overflow: auto']::-webkit-scrollbar {
          width: 8px;
          background: #032a3f;
        }
        .dashboard2-grid div[style*='overflow: auto']::-webkit-scrollbar-thumb {
          background: #1e425c;
          border-radius: 8px;
        }
      `}</style>
      
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: padding * 0.6,
        paddingRight: 12 // Add right padding to prevent overlap with drag handle
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: 600, 
            fontSize: titleFont, 
            color: '#ffffff',
            letterSpacing: 0, 
            lineHeight: '20px',
            marginBottom: Math.round(padding * 0.1)
          }}>
            Tasks
          </div>
          <div style={{ 
            fontSize: fontSize, 
            color: "#ffffff",
            lineHeight: '20px'
          }}>
            Next 7 Days
          </div>
        </div>
        
        {/* Add Task Button */}
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginLeft: Math.round(padding * 0.3),
          marginRight: 16 // Add margin to prevent overlap with drag handle
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#fff"/>
          </svg>
        </div>
      </div>
      
      {/* Drag Handle */}
      <span style={{ 
        position: 'absolute', 
        top: padding * 0.3, 
        right: 12, 
        zIndex: 10, 
        cursor: 'grab', 
        padding: `${Math.round(padding * 0.15)}px ${Math.round(padding * 0.25)}px`, 
        opacity: 0.7 
      }} title="Drag">
        <svg width={titleFont} height={titleFont} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect y="3" width="18" height="2" rx="1" fill="#b0c4d4"/>
          <rect y="8" width="18" height="2" rx="1" fill="#b0c4d4"/>
          <rect y="13" width="18" height="2" rx="1" fill="#b0c4d4"/>
        </svg>
      </span>
      
      {/* Priority Cards */}
      <div style={{ 
        display: 'flex', 
        gap: Math.round(padding * 0.3),
        marginBottom: Math.round(padding * 0.4)
      }}>
        {/* High Priority */}
        <div style={{
          flex: 1,
          background: 'transparent',
          border: '1px solid #fdfdff',
          borderRadius: 12,
          padding: Math.round(padding * 0.3),
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: fontSize, 
            color: '#ffffff',
            fontWeight: 500,
            marginBottom: Math.round(padding * 0.1),
            lineHeight: '20px'
          }}>
            High Priority
          </div>
          <div style={{ 
            fontSize: 24, 
            fontWeight: 700,
            color: '#ff464d',
            lineHeight: '32px'
          }}>
            {highPriorityTasks}
          </div>
        </div>
        
        {/* Medium Priority */}
        <div style={{
          flex: 1,
          background: 'transparent',
          border: '1px solid #fdfdff',
          borderRadius: 12,
          padding: Math.round(padding * 0.3),
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: fontSize, 
            color: '#ffffff',
            fontWeight: 500,
            marginBottom: Math.round(padding * 0.1),
            lineHeight: '20px'
          }}>
            Med Priority
          </div>
          <div style={{ 
            fontSize: 24, 
            fontWeight: 700,
            color: '#d0d681',
            lineHeight: '32px'
          }}>
            {medPriorityTasks}
          </div>
        </div>
        
        {/* Low Priority */}
        <div style={{
          flex: 1,
          background: 'transparent',
          border: '1px solid #fdfdff',
          borderRadius: 12,
          padding: Math.round(padding * 0.3),
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: fontSize, 
            color: '#ffffff',
            fontWeight: 500,
            marginBottom: Math.round(padding * 0.1),
            lineHeight: '20px'
          }}>
            Low Priority
          </div>
          <div style={{ 
            fontSize: 24, 
            fontWeight: 700,
            color: '#4db8ff',
            lineHeight: '32px'
          }}>
            {lowPriorityTasks}
          </div>
        </div>
      </div>
    </div>
  );
});

  // Fixed Compact Gameday Checklist Card (no resizing logic)
  const FixedCompactGamedayChecklistCard = forwardRef(function FixedCompactGamedayChecklistCard({ overflowMode, width, height }, ref) {
    // Fixed sizing - no responsive scaling
    const fontSize = 14;
    const titleFont = 18;
    const padding = 20;
    const lineHeight = 18;
    
    const highPriorityTasks = 3;
    const medPriorityTasks = 2;
    const lowPriorityTasks = 1;
    
    return (
      <div
        ref={ref}
        style={{
          background: "linear-gradient(135deg, #17375c 0%, #1e425c 100%)",
          borderRadius: 16,
          boxShadow: "0 4px 20px 0 rgba(0,0,0,0.15)",
          padding,
          minHeight: 80,
          minWidth: 120,
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          color: "#fff",
          overflow: overflowMode === "scroll" ? "auto" : "hidden",
          transition: "padding 0.2s, font-size 0.2s, line-height 0.2s, margin 0.2s",
          scrollbarWidth: 'thin',
          scrollbarColor: '#1e425c #17375c',
          position: 'relative',
        }}
      >
        {/* Left border accent */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: 'linear-gradient(180deg, #ffd93d 0%, #ffb347 100%)',
          borderRadius: '16px 0 0 16px'
        }} />
        
        <style>{`
          .dashboard2-grid div[style*='overflow: auto']::-webkit-scrollbar {
            width: 8px;
            background: #17375c;
          }
          .dashboard2-grid div[style*='overflow: auto']::-webkit-scrollbar-thumb {
            background: #1e425c;
            border-radius: 8px;
          }
        `}</style>
        
        {/* Header Section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: padding * 0.6,
          paddingLeft: 12, // Account for left border
          paddingRight: 12 // Add right padding to prevent overlap with drag handle
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: 700, 
              fontSize: titleFont, 
              color: '#fff',
              letterSpacing: 0.01, 
              lineHeight: `${titleFont * 1.1}px`,
              marginBottom: Math.round(padding * 0.1)
            }}>
              Tasks
            </div>
            <div style={{ 
              fontSize: fontSize - 2, 
              color: "#b0c4d4",
              lineHeight: `${lineHeight - 2}px`
            }}>
              Next 7 Days
            </div>
          </div>
          
          {/* Add Task Button */}
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginLeft: Math.round(padding * 0.3),
            marginRight: 10 // Add margin to prevent overlap with drag handle
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#fff"/>
            </svg>
          </div>
        </div>
        
        {/* Drag Handle */}
        <span style={{ 
          position: 'absolute', 
          top: padding * 0.3, 
          right: 12, 
          zIndex: 10, 
          cursor: 'grab', 
          padding: `${Math.round(padding * 0.15)}px ${Math.round(padding * 0.25)}px`, 
          opacity: 0.7 
        }} title="Drag">
          <svg width={titleFont} height={titleFont} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect y="3" width="18" height="2" rx="1" fill="#b0c4d4"/>
            <rect y="8" width="18" height="2" rx="1" fill="#b0c4d4"/>
            <rect y="13" width="18" height="2" rx="1" fill="#b0c4d4"/>
          </svg>
        </span>
        
        {/* Priority Cards */}
        <div style={{ paddingLeft: 12 }}>
          <div style={{ 
            display: 'flex', 
            gap: Math.round(padding * 0.3),
            marginBottom: Math.round(padding * 0.4)
          }}>
            {/* High Priority */}
            <div style={{
              flex: 1,
              background: 'rgba(255, 107, 107, 0.15)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: 8,
              padding: Math.round(padding * 0.3),
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: fontSize - 3, 
                color: '#ff6b6b',
                fontWeight: 600,
                marginBottom: Math.round(padding * 0.1)
              }}>
                High
              </div>
              <div style={{ 
                fontSize: titleFont, 
                fontWeight: 700,
                color: '#fff'
              }}>
                {highPriorityTasks}
              </div>
            </div>
            
            {/* Medium Priority */}
            <div style={{
              flex: 1,
              background: 'rgba(255, 217, 61, 0.15)',
              border: '1px solid rgba(255, 217, 61, 0.3)',
              borderRadius: 8,
              padding: Math.round(padding * 0.3),
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: fontSize - 3, 
                color: '#ffd93d',
                fontWeight: 600,
                marginBottom: Math.round(padding * 0.1)
              }}>
                Med
              </div>
              <div style={{ 
                fontSize: titleFont, 
                fontWeight: 700,
                color: '#fff'
              }}>
                {medPriorityTasks}
              </div>
            </div>
            
            {/* Low Priority */}
            <div style={{
              flex: 1,
              background: 'rgba(78, 205, 196, 0.15)',
              border: '1px solid rgba(78, 205, 196, 0.3)',
              borderRadius: 8,
              padding: Math.round(padding * 0.3),
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: fontSize - 3, 
                color: '#4ecdc4',
                fontWeight: 600,
                marginBottom: Math.round(padding * 0.1)
              }}>
                Low
              </div>
              <div style={{ 
                fontSize: titleFont, 
                fontWeight: 700,
                color: '#fff'
              }}>
                {lowPriorityTasks}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });

export default function Dashboard2TestPage() {
  const [layout, setLayout] = useState([
    {
      i: "upcoming-events-top",
      x: 0,
      y: 0,
      w: 4,
      h: 4,
      minW: 2,
      minH: 2,
      maxH: 8,
    },
    {
      i: "upcoming-events-fill",
      x: 5,
      y: 0,
      w: 4,
      h: 4,
      minW: 2,
      minH: 2,
      maxH: 8,
    },
    {
      i: "gameday-checklist",
      x: 0,
      y: 5,
      w: 4,
      h: 4,
      minW: 3,
      minH: 3,
      maxH: 8,
    },
    {
      i: "fixed-gameday-checklist",
      x: 5,
      y: 5,
      w: 4,
      h: 4,
      minW: 3,
      minH: 3,
      maxH: 8,
    },
    {
      i: "team-tasks",
      x: 0,
      y: 10,
      w: 4,
      h: 4,
      minW: 3,
      minH: 3,
      maxH: 8,
    },
    {
      i: "compact-gameday",
      x: 5,
      y: 10,
      w: 4,
      h: 3,
      minW: 3,
      minH: 2,
      maxH: 6,
    },
    {
      i: "compact-team-tasks",
      x: 0,
      y: 15,
      w: 4,
      h: 3,
      minW: 3,
      minH: 2,
      maxH: 6,
    },
    {
      i: "fixed-compact-gameday",
      x: 5,
      y: 15,
      w: 4,
      h: 3,
      minW: 3,
      minH: 2,
      maxH: 6,
    },
  ]);
  const [overflowMode, setOverflowMode] = useState("scroll");
  const cardRefTop = useRef(null);
  const cardRefFill = useRef(null);
  const cardRefChecklist = useRef(null);
  const cardRefFixedChecklist = useRef(null);
  const cardRefTeamTasks = useRef(null);
  const cardRefCompactGameday = useRef(null);
  const cardRefCompactTeamTasks = useRef(null);
  const cardRefFixedCompactGameday = useRef(null);
  const [cardDimsTop, setCardDimsTop] = useState({ width: 320, height: 360 });
  const [cardDimsFill, setCardDimsFill] = useState({ width: 320, height: 360 });
  const [cardDimsChecklist, setCardDimsChecklist] = useState({ width: 320, height: 360 });
  const [cardDimsFixedChecklist, setCardDimsFixedChecklist] = useState({ width: 320, height: 360 });
  const [cardDimsTeamTasks, setCardDimsTeamTasks] = useState({ width: 320, height: 360 });
  const [cardDimsCompactGameday, setCardDimsCompactGameday] = useState({ width: 320, height: 270 });
  const [cardDimsCompactTeamTasks, setCardDimsCompactTeamTasks] = useState({ width: 320, height: 270 });
  const [cardDimsFixedCompactGameday, setCardDimsFixedCompactGameday] = useState({ width: 320, height: 270 });

  // Debounced resize handler
  const debouncedSetDimensions = (setter, width, height) => {
    setter(prev => {
      // Only update if the change is significant (more than 5px)
      if (Math.abs(prev.width - width) > 5 || Math.abs(prev.height - height) > 5) {
        return { width, height };
      }
      return prev;
    });
  };

  // Use ResizeObserver to track card size for both cards
  useEffect(() => {
    if (!cardRefTop.current) return;
    const observer = new window.ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        debouncedSetDimensions(setCardDimsTop, width, height);
      }
    });
    observer.observe(cardRefTop.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!cardRefFill.current) return;
    const observer = new window.ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        debouncedSetDimensions(setCardDimsFill, width, height);
      }
    });
    observer.observe(cardRefFill.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!cardRefChecklist.current) return;
    const observer = new window.ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        debouncedSetDimensions(setCardDimsChecklist, width, height);
      }
    });
    observer.observe(cardRefChecklist.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!cardRefFixedChecklist.current) return;
    const observer = new window.ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        debouncedSetDimensions(setCardDimsFixedChecklist, width, height);
      }
    });
    observer.observe(cardRefFixedChecklist.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!cardRefTeamTasks.current) return;
    const observer = new window.ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        debouncedSetDimensions(setCardDimsTeamTasks, width, height);
      }
    });
    observer.observe(cardRefTeamTasks.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!cardRefCompactGameday.current) return;
    const observer = new window.ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        debouncedSetDimensions(setCardDimsCompactGameday, width, height);
      }
    });
    observer.observe(cardRefCompactGameday.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!cardRefCompactTeamTasks.current) return;
    const observer = new window.ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        debouncedSetDimensions(setCardDimsCompactTeamTasks, width, height);
      }
    });
    observer.observe(cardRefCompactTeamTasks.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!cardRefFixedCompactGameday.current) return;
    const observer = new window.ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        debouncedSetDimensions(setCardDimsFixedCompactGameday, width, height);
      }
    });
    observer.observe(cardRefFixedCompactGameday.current);
    return () => observer.disconnect();
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#202c3e", padding: 32 }}>
      <h1 style={{ color: "#fff", fontWeight: 700, fontSize: 32, marginBottom: 24 }}>
        Dashboard 2 Test Page
      </h1>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color: '#fff', fontWeight: 500 }}>Card Content Overflow:</span>
        <select
          value={overflowMode}
          onChange={e => setOverflowMode(e.target.value)}
          style={{ padding: '4px 12px', borderRadius: 6 }}
        >
          <option value="scroll">Scrollable</option>
          <option value="clipped">Clipped</option>
        </select>
      </div>
      <ResponsiveGridLayout
        className="dashboard2-grid"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 8, xs: 4, xxs: 2 }}
        rowHeight={GRID_ROW_HEIGHT}
        isResizable
        isDraggable
        onLayoutChange={l => setLayout(l)}
        margin={[GRID_MARGIN, GRID_MARGIN]}
        compactType="vertical"
        preventCollision={false}
      >
        <div key="upcoming-events-top" data-grid={layout[0]}>
          <UpcomingEventsCardTop ref={cardRefTop} overflowMode={overflowMode} width={cardDimsTop.width} height={cardDimsTop.height} />
        </div>
        <div key="upcoming-events-fill" data-grid={layout[1]}>
          <UpcomingEventsCardFill ref={cardRefFill} overflowMode={overflowMode} width={cardDimsFill.width} height={cardDimsFill.height} />
        </div>
        <div key="gameday-checklist" data-grid={layout[2]}>
          <GamedayChecklistCard ref={cardRefChecklist} overflowMode={overflowMode} width={cardDimsChecklist.width} height={cardDimsChecklist.height} />
        </div>
        <div key="fixed-gameday-checklist" data-grid={layout[3]}>
          <FixedGamedayChecklistCard ref={cardRefFixedChecklist} overflowMode={overflowMode} width={cardDimsFixedChecklist.width} height={cardDimsFixedChecklist.height} />
        </div>
        <div key="team-tasks" data-grid={layout[4]}>
          <TeamTasksCard ref={cardRefTeamTasks} overflowMode={overflowMode} width={cardDimsTeamTasks.width} height={cardDimsTeamTasks.height} />
        </div>
        <div key="compact-gameday" data-grid={layout[5]}>
          <CompactGamedayChecklistCard ref={cardRefCompactGameday} overflowMode={overflowMode} width={cardDimsCompactGameday.width} height={cardDimsCompactGameday.height} />
        </div>
        <div key="compact-team-tasks" data-grid={layout[6]}>
          <CompactTeamTasksCard ref={cardRefCompactTeamTasks} overflowMode={overflowMode} width={cardDimsCompactTeamTasks.width} height={cardDimsCompactTeamTasks.height} />
        </div>
        <div key="fixed-compact-gameday" data-grid={layout[7]}>
          <FixedCompactGamedayChecklistCard ref={cardRefFixedCompactGameday} overflowMode={overflowMode} width={cardDimsFixedCompactGameday.width} height={cardDimsFixedCompactGameday.height} />
        </div>
      </ResponsiveGridLayout>
    </main>
  );
} 