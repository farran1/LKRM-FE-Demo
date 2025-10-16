'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';

const statCategories = [
  'All',
  'Offense',
  'Defense',
  'Shooting'
];

export default function TeamStatsModule() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allStats, setAllStats] = useState<any[]>([]);

  const statsPerPage = 8; // 2 columns x 4 rows

  useEffect(() => {
    fetchTeamStats();
  }, []);

  const fetchTeamStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const season = '2024-25'; // TODO: Make this configurable
      
      // Fetch team stats from API
      const [teamStatsRes, gamesRes, playerStatsRes] = await Promise.all([
        api.get(`/api/stats/team?season=${season}`),
        api.get(`/api/stats/games?season=${season}`),
        api.get(`/api/stats/players?season=${season}`)
      ]);

      if (teamStatsRes.status !== 200 || gamesRes.status !== 200 || playerStatsRes.status !== 200) {
        throw new Error('Failed to fetch team statistics');
      }

      const [teamStatsData, gamesData, playerStatsData] = [
        teamStatsRes.data,
        gamesRes.data,
        playerStatsRes.data
      ];

      // Extract data from API responses
      const teamStats = teamStatsData; // Team stats API returns data directly
      const games = Array.isArray(gamesData) ? gamesData : ((gamesData as any)?.data || []);
      const playerStats = Array.isArray(playerStatsData) ? playerStatsData : ((playerStatsData as any)?.data || []);

      console.log('Team Stats API Response:', teamStats);
      console.log('Games API Response:', games);
      console.log('Player Stats API Response:', playerStats);

      // Calculate team statistics from real data
      const calculatedStats = calculateTeamStats(teamStats, games, playerStats);
      console.log('Calculated Stats:', calculatedStats);
      setAllStats(calculatedStats);
    } catch (err) {
      console.error('Error fetching team stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load team statistics');
      // Set empty stats to prevent errors
      setAllStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTeamStats = (teamStats: any, games: any[], playerStats: any[]) => {
    if (!teamStats) return [];

    const stats = [];

    // Basic team stats from API
    if (teamStats.wins !== undefined) {
      stats.push({ id: 2, label: 'Wins', value: teamStats.wins, category: 'Offense' });
    }
    if (teamStats.losses !== undefined) {
      stats.push({ id: 3, label: 'Losses', value: teamStats.losses, category: 'Offense' });
    }
    if (teamStats.ppg !== undefined) {
      stats.push({ id: 4, label: 'Points Per Game', value: teamStats.ppg.toFixed(1), category: 'Offense' });
    }
    if (teamStats.oppg !== undefined) {
      stats.push({ id: 5, label: 'Points Allowed', value: teamStats.oppg.toFixed(1), category: 'Defense' });
    }
    
    // Per game averages from team stats API
    if (teamStats.assists !== undefined) {
      stats.push({ id: 6, label: 'Assists Per Game', value: teamStats.assists.toFixed(1), category: 'Offense' });
    }
    if (teamStats.rebounds !== undefined) {
      stats.push({ id: 7, label: 'Rebounds Per Game', value: teamStats.rebounds.toFixed(1), category: 'Defense' });
    }
    if (teamStats.steals !== undefined) {
      stats.push({ id: 8, label: 'Steals Per Game', value: teamStats.steals.toFixed(1), category: 'Defense' });
    }
    if (teamStats.blocks !== undefined) {
      stats.push({ id: 12, label: 'Blocks Per Game', value: teamStats.blocks.toFixed(1), category: 'Defense' });
    }

    // Shooting percentages from team stats API
    if (teamStats.fgPct !== undefined) {
      stats.push({ id: 9, label: 'Field Goal %', value: teamStats.fgPct.toFixed(1), category: 'Shooting' });
    }
    if (teamStats.threePct !== undefined) {
      stats.push({ id: 10, label: '3-Point %', value: teamStats.threePct.toFixed(1), category: 'Shooting' });
    }
    if (teamStats.ftPct !== undefined) {
      stats.push({ id: 11, label: 'Free Throw %', value: teamStats.ftPct.toFixed(1), category: 'Shooting' });
    }

    return stats;
  };

  const filteredStats = selectedCategory === 'All'
    ? allStats
    : allStats.filter(stat => stat.category === selectedCategory);

  const totalPages = Math.ceil(filteredStats.length / statsPerPage);
  const startIndex = currentPage * statsPerPage;
  const currentStats = filteredStats.slice(startIndex, startIndex + statsPerPage);

  React.useEffect(() => {
    setCurrentPage(0);
  }, [selectedCategory]);

  React.useEffect(() => {
    const handleClickOutside = () => setIsDropdownOpen(false);
    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const goToPrevPage = () => setCurrentPage(prev => prev > 0 ? prev - 1 : totalPages - 1);
  const goToNextPage = () => setCurrentPage(prev => prev < totalPages - 1 ? prev + 1 : 0);

  if (loading) {
    return (
      <div
        style={{
          background: '#17375c',
          borderRadius: '16px',
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          minHeight: '280px',
          maxHeight: '320px',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#fff' }}>
          Loading team statistics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: '#17375c',
          borderRadius: '16px',
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          minHeight: '280px',
          maxHeight: '320px',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#f5222d' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#17375c',
        borderRadius: '16px',
        padding: '20px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        minHeight: '320px', // Increased from 280px to 320px
        maxHeight: '360px', // Increased from 320px to 360px
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '24px', // Increased from 20px
        width: '100%',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', minWidth: 0 }}>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '16px',
            color: '#fff',
            whiteSpace: 'nowrap', // Prevent text wrapping
            flexShrink: 0 // Prevent title from shrinking
          }}>
            Team Stats
          </div>
          {/* Filter Dropdown */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={e => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '20px',
                padding: '4px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 500,
                minWidth: '60px',
                justifyContent: 'space-between'
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
            >
              <span>{selectedCategory}</span>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none"
                style={{
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}>
                <path d="M2 3L4 5L6 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {isDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                background: '#17375c',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                overflow: 'hidden',
                zIndex: 1000,
                minWidth: '80px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}>
                {statCategories.map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      setSelectedCategory(option);
                      setIsDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: selectedCategory === option ? 'rgba(29,117,208,0.2)' : 'transparent',
                      border: 'none',
                      color: selectedCategory === option ? '#1D75D0' : '#fff',
                      fontSize: '12px',
                      fontWeight: selectedCategory === option ? 600 : 400,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => {
                      if (selectedCategory !== option) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    }}
                    onMouseLeave={e => {
                      if (selectedCategory !== option) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Pagination Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.6)',
            whiteSpace: 'nowrap', // Prevent wrapping
            minWidth: 'fit-content' // Ensure it doesn't shrink
          }}>
            {totalPages === 0 ? 0 : currentPage + 1} / {totalPages || 1}
          </div>
          <button
            onClick={goToPrevPage}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff'
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 3L4.5 6L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={goToNextPage}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff'
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(4, 1fr)',
          gap: '12px', // Increased from 8px to 12px
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {currentStats.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            color: '#fff',
            textAlign: 'center',
            opacity: 0.7,
            padding: '32px 0'
          }}>
            No stats available.
          </div>
        ) : (
          currentStats.map(stat => (
            <div
              key={stat.id}
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '16px 12px', // Increased padding from 12px 10px to 16px 12px
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.12)',
                minHeight: '56px', // Increased from 48px to 56px
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '18px',
                color: '#B58842',
                marginBottom: '6px' // Increased from 2px to 6px
              }}>
                {stat.value}
              </div>
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '12px',
                color: '#fff',
                textAlign: 'center',
                lineHeight: '1.2' // Added line height for better text spacing
              }}>
                {stat.label}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 