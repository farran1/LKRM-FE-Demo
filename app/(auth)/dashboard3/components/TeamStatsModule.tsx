'use client';

import React, { useState } from 'react';

const statCategories = [
  'All',
  'Offense',
  'Defense',
  'Shooting'
];

const allStats = [
  { id: 1, label: 'Games Played', value: 24, category: 'Offense' },
  { id: 2, label: 'Wins', value: 18, category: 'Offense' },
  { id: 3, label: 'Losses', value: 6, category: 'Offense' },
  { id: 4, label: 'Points Per Game', value: 108.5, category: 'Offense' },
  { id: 5, label: 'Points Allowed', value: 98.2, category: 'Defense' },
  { id: 6, label: 'Assists Per Game', value: 24.3, category: 'Offense' },
  { id: 7, label: 'Rebounds Per Game', value: 42.1, category: 'Defense' },
  { id: 8, label: 'Steals Per Game', value: 8.7, category: 'Defense' },
  { id: 9, label: 'Field Goal %', value: 47.2, category: 'Shooting' },
  { id: 10, label: '3-Point %', value: 36.8, category: 'Shooting' },
  { id: 11, label: 'Free Throw %', value: 78.5, category: 'Shooting' },
  { id: 12, label: 'Blocks Per Game', value: 4.2, category: 'Defense' },
];

const statsPerPage = 8; // 2 columns x 4 rows

export default function TeamStatsModule() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '20px',
        width: '100%',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '16px',
            color: '#fff'
          }}>
            Team Stats
          </div>
          {/* Filter Dropdown */}
          <div style={{ position: 'relative' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.6)',
            marginRight: '4px'
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
          gap: '8px',
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
                padding: '12px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.12)',
                minHeight: '48px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '18px',
                color: '#B58842',
                marginBottom: '2px'
              }}>
                {stat.value}
              </div>
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '12px',
                color: '#fff',
                textAlign: 'center'
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