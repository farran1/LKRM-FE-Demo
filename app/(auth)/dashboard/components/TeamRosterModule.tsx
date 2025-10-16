'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

type PlayerApi = {
  id: string | number;
  first_name?: string;
  last_name?: string;
  name?: string;
  jersey_number?: string | number;
  jersey?: string | number;
  position?: { abbreviation?: string; name?: string };
};

function isPlayerArray(value: unknown): value is PlayerApi[] {
  return Array.isArray(value);
}

function extractPlayersFromResponse(value: unknown): PlayerApi[] {
  if (isPlayerArray(value)) {
    return value;
  }
  if (value && typeof value === 'object' && 'data' in (value as Record<string, unknown>)) {
    const possibleArray = (value as { data?: unknown }).data;
    if (Array.isArray(possibleArray)) {
      return possibleArray as PlayerApi[];
    }
  }
  return [];
}

export default function TeamRosterModule() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const playersPerPage = 8; // Back to 8 for 2x4 grid

  // Filter options - match actual database position abbreviations
  const filterOptions = [
    'All',
    'C',   // Center
    'G',   // Guard
    'F'    // Forward
  ];

  useEffect(() => {
    fetchTeamRoster();
  }, []);

  const fetchTeamRoster = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch players from API
      const playersRes = await api.get('/api/players');
      
      if (playersRes.status !== 200) {
        throw new Error('Failed to fetch team roster');
      }

      const playersData: unknown = playersRes.data;
      console.log('Players API response:', playersData);
      // Support both direct array and `{ data: [] }` shapes
      const players = extractPlayersFromResponse(playersData);
      console.log('Processed players array:', players);
      
      // Transform player data to match our interface
      const transformedPlayers = players.map((player: any) => ({
        id: player.id,
        name: player.name || `${player.first_name || ''} ${player.last_name || ''}`.trim(),
        jersey: player.jersey_number || player.jersey || '',
        position: player.position?.abbreviation || player.position?.name || 'Unknown', // Use abbreviation for filtering
        positionName: player.position?.name || 'Unknown', // Keep full name for display
        avatar: '/imgs/avatar-placeholder.jpg'
      }));

      console.log('Transformed players:', transformedPlayers);
      setAllPlayers(transformedPlayers);
    } catch (err) {
      console.error('Error fetching team roster:', err);
      setError(err instanceof Error ? err.message : 'Failed to load team roster');
      setAllPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter players based on selected filter
  const filteredPlayers = selectedFilter === 'All' 
    ? allPlayers 
    : allPlayers.filter(player => player.position === selectedFilter);

  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
  const startIndex = currentPage * playersPerPage;
  const currentPlayers = filteredPlayers.slice(startIndex, startIndex + playersPerPage);

  // Reset to page 0 when filter changes
  React.useEffect(() => {
    setCurrentPage(0);
  }, [selectedFilter]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setIsDropdownOpen(false);
    };

    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const goToPrevPage = () => {
    setCurrentPage(prev => prev > 0 ? prev - 1 : totalPages - 1);
  };

  const goToNextPage = () => {
    setCurrentPage(prev => prev < totalPages - 1 ? prev + 1 : 0);
  };

  const handlePlayerClick = (player: any) => {
    // Navigate to individual player page using player ID
    // The existing route structure uses /players/[id] format
    router.push(`/players/${player.id}`);
  };

  if (loading) {
    return (
      <div
        style={{
          background: '#17375c', // Match sidebar/header blue
          borderRadius: '16px',
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          height: '100%',
          minHeight: '320px',
          maxHeight: '400px',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#fff' }}>
          Loading team roster...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: '#17375c', // Match sidebar/header blue
          borderRadius: '16px',
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          height: '100%',
          minHeight: '320px',
          maxHeight: '400px',
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
        background: '#17375c', // Match sidebar/header blue
        borderRadius: '16px',
        padding: '20px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        height: '100%',
        minHeight: '320px',
        maxHeight: '400px',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '20px',
          width: '100%',
          flexShrink: 0
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '18px',
              color: '#ffffff',
              textAlign: 'left'
            }}
          >
            Team Roster
          </div>

          {/* Filter Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '20px', // Pill shape
                padding: '4px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: '#ffffff',
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                minWidth: '60px',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <span>{selectedFilter}</span>
              <svg 
                width="8" 
                height="8" 
                viewBox="0 0 8 8" 
                fill="none"
                style={{
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              >
                <path d="M2 3L4 5L6 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  marginTop: '4px',
                  background: '#17375c',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  zIndex: 1000,
                  minWidth: '80px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
              >
                {filterOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSelectedFilter(option);
                      setIsDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: selectedFilter === option ? 'rgba(29, 117, 208, 0.2)' : 'transparent',
                      border: 'none',
                      color: selectedFilter === option ? '#1D75D0' : '#ffffff',
                      fontSize: '12px',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: selectedFilter === option ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedFilter !== option) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedFilter !== option) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {option === 'All' ? 'All Players' :
                     option === 'C' ? 'Center' :
                     option === 'G' ? 'Guard' :
                     option === 'F' ? 'Forward' : option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pagination Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {/* Page Indicator */}
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginRight: '4px'
            }}
          >
            {currentPage + 1} / {totalPages}
          </div>

          {/* Previous Button */}
          <button
            onClick={goToPrevPage}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: '#ffffff'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 3L4.5 6L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Next Button */}
          <button
            onClick={goToNextPage}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: '#ffffff'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Players Grid Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)', // 2 columns
          gridTemplateRows: 'repeat(4, 1fr)', // 4 rows for exactly 8 players
          gap: '6px',
          width: '100%',
          height: '100%',
          overflow: 'hidden', // No scrolling needed
          boxSizing: 'border-box'
        }}
      >
        {currentPlayers.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            color: '#fff',
            textAlign: 'center',
            opacity: 0.7,
            padding: '32px 0'
          }}>
            No players found.
          </div>
        ) : (
          currentPlayers.map((player) => (
            <div
              key={player.id}
              onClick={() => handlePlayerClick(player)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '28px', // Pill shape - large border radius
                padding: '6px 8px 6px 6px', // Reduced padding to fit better
                display: 'flex',
                alignItems: 'center',
                gap: '6px', // Reduced gap
                border: '1px solid rgba(255, 255, 255, 0.12)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: '44px', // Slightly reduced height
                width: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden' // Prevent content overflow
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1D75D0 0%, #4ecdc4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ffffff',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                {player.name.split(' ').map((n: string) => n[0]).join('')}
              </div>

              {/* Player Info */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  flex: 1,
                  minWidth: 0 // Allow text to truncate
                }}
              >
                {/* Name */}
                <div
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: '12px',
                    lineHeight: '14px',
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {player.name}
                </div>
                
                {/* Position */}
                <div
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '10px',
                    lineHeight: '12px',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}
                >
                  {player.positionName}
                </div>
              </div>

              {/* Jersey Number */}
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '12px',
                  lineHeight: '14px',
                  color: '#B58842',
                  flexShrink: 0,
                  minWidth: '20px',
                  textAlign: 'right'
                }}
              >
                {player.jersey}
              </div>
            </div>
          ))
        )}
      </div>


    </div>
  );
} 