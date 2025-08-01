'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TeamRosterModule() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const playersPerPage = 8; // Back to 8 for 2x4 grid

  // Filter options
  const filterOptions = [
    'All',
    'PG', // Point Guard
    'SG', // Shooting Guard
    'SF', // Small Forward
    'PF', // Power Forward
    'C'   // Center
  ];

  // Mock player data - extended to show pagination
  const allPlayers = [
    { id: 1, name: 'Marcus Johnson', jersey: '23', position: 'PG', avatar: '/imgs/avatar-placeholder.jpg' },
    { id: 2, name: 'Tyler Williams', jersey: '10', position: 'SG', avatar: '/imgs/avatar-placeholder.jpg' },
    { id: 3, name: 'Jordan Davis', jersey: '15', position: 'SF', avatar: '/imgs/avatar-placeholder.jpg' },
    { id: 4, name: 'Alex Thompson', jersey: '4', position: 'PF', avatar: '/imgs/avatar-placeholder.jpg' },
    { id: 5, name: 'DeShawn Wilson', jersey: '32', position: 'C', avatar: '/imgs/avatar-placeholder.jpg' },
    { id: 6, name: 'Carlos Rodriguez', jersey: '7', position: 'SG', avatar: '/imgs/avatar-placeholder.jpg' },
    { id: 7, name: 'Jamal Mitchell', jersey: '21', position: 'SF', avatar: '/imgs/avatar-placeholder.jpg' },
    { id: 8, name: 'Kevin Brown', jersey: '11', position: 'PG', avatar: '/imgs/avatar-placeholder.jpg' },
    { id: 9, name: 'Isaiah Robinson', jersey: '33', position: 'C', avatar: '/imgs/avatar-placeholder.jpg' },
    { id: 10, name: 'Anthony White', jersey: '24', position: 'SF', avatar: '/imgs/avatar-placeholder.jpg' },
    { id: 11, name: 'Darius Green', jersey: '8', position: 'SG', avatar: '/imgs/avatar-placeholder.jpg' },
    { id: 12, name: 'Xavier Carter', jersey: '14', position: 'PF', avatar: '/imgs/avatar-placeholder.jpg' },
    { id: 13, name: 'Malik Thompson', jersey: '5', position: 'PG', avatar: '/imgs/avatar-placeholder.jpg' },
    { id: 14, name: 'Terrell Adams', jersey: '22', position: 'SF', avatar: '/imgs/avatar-placeholder.jpg' },
    { id: 15, name: 'Brandon Lee', jersey: '31', position: 'C', avatar: '/imgs/avatar-placeholder.jpg' },
    { id: 16, name: 'Jaylen Parker', jersey: '3', position: 'SG', avatar: '/imgs/avatar-placeholder.jpg' },
    { id: 17, name: 'Cameron Ford', jersey: '25', position: 'PF', avatar: '/imgs/avatar-placeholder.jpg' },
    { id: 18, name: 'Donovan Hayes', jersey: '18', position: 'SF', avatar: '/imgs/avatar-placeholder.jpg' }
  ];

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
                    {option === 'All' ? 'All Players' : option}
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
        {currentPlayers.map((player) => (
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
              {player.name.split(' ').map(n => n[0]).join('')}
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
                {player.position}
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
        ))}
      </div>


    </div>
  );
} 