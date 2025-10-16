'use client'

import React, { useState, useEffect } from 'react'
import { BookOutlined, SearchOutlined, DeleteFilled, PushpinOutlined, CalendarOutlined } from '@ant-design/icons'
import { Input, Button, App, Popconfirm, Tooltip, Pagination, Spin } from 'antd'
import api from '@/services/api'

// Utility function to calculate appropriate colors based on background color
const getContrastingColors = (backgroundColor: string) => {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // Return appropriate colors based on background brightness
  if (luminance > 0.5) {
    // Light background - use dark colors
    return {
      iconColor: '#333333',
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      hoverBackgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderColor: 'rgba(0, 0, 0, 0.2)',
      deleteIconColor: '#ff4d4f',
      deleteBackgroundColor: 'rgba(255, 77, 79, 0.1)',
      deleteHoverBackgroundColor: 'rgba(255, 77, 79, 0.2)',
      deleteBorderColor: 'rgba(255, 77, 79, 0.3)',
      pinColor: '#4ecdc4',
      pinHoverBackgroundColor: 'rgba(78, 205, 196, 0.2)'
    }
  } else {
    // Dark background - use light colors
    return {
      iconColor: '#ffffff',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      hoverBackgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      deleteIconColor: '#ff6b6b',
      deleteBackgroundColor: 'rgba(255, 107, 107, 0.2)',
      deleteHoverBackgroundColor: 'rgba(255, 107, 107, 0.3)',
      deleteBorderColor: 'rgba(255, 107, 107, 0.4)',
      pinColor: '#4ecdc4',
      pinHoverBackgroundColor: 'rgba(78, 205, 196, 0.3)'
    }
  }
}

interface Coach {
  id: string
  name: string
  email: string
  initials: string
  username: string
  firstName: string
  lastName: string
}

interface Mention {
  userId: string
  text: string
  startPosition: number
  endPosition: number
}

interface QuickNote {
  id: number
  content: string
  color: string
  position_x: number
  position_y: number
  is_pinned: boolean
  created_at: string
  updated_at: string
  coach_mentions?: Mention[]
  mentions?: Mention[]
}

export default function NotebookPage() {
  const { message } = App.useApp()
  const [notes, setNotes] = useState<QuickNote[]>([])
  const [loading, setLoading] = useState(false)
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalNotes, setTotalNotes] = useState(0)
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null)
  const [hoveredNoteId, setHoveredNoteId] = useState<number | null>(null)
  const notesPerPage = 20

  const stickyColors = [
    '#FFE66D', // Yellow
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Light Yellow
    '#DDA0DD', // Plum
    '#98D8C8', // Seafoam
    '#A8E6CF', // Light Green
    '#FFB347', // Orange
    '#DDA0DD', // Plum
    '#98D8C8', // Seafoam
  ]

  useEffect(() => {
    loadNotes()
    loadCoaches()
  }, [currentPage, searchQuery])

  const loadCoaches = async () => {
    try {
      const response = await api.get('/api/coaches/search')
      console.log('Coaches response:', response.data)
      if (response.data && typeof response.data === 'object' && 'coaches' in response.data && Array.isArray(response.data.coaches)) {
        setCoaches(response.data.coaches)
        console.log('Loaded coaches:', response.data.coaches)
      } else {
        // No coaches available - set empty array
        setCoaches([])
        console.log('No coaches available')
      }
    } catch (error) {
      console.error('Error loading coaches:', error as Error)
      // No coaches available due to error - set empty array
      setCoaches([])
      console.log('No coaches available due to error')
    }
  }

  const loadNotes = async () => {
    setLoading(true)
    try {
      const offset = (currentPage - 1) * notesPerPage
      const response = await api.get(`/api/quick-notes?offset=${offset}&limit=${notesPerPage}&search=${encodeURIComponent(searchQuery)}`)
      
      const resData: any = (response as any)?.data
      const allNotes = (resData && typeof resData === 'object' && 'notes' in resData && Array.isArray(resData.notes)) 
        ? resData.notes 
        : (Array.isArray(resData) ? resData : [])
      
      setNotes(allNotes)
      setTotalNotes(resData?.total || allNotes.length)
    } catch (error) {
      console.error('Error loading notes:', error as Error)
      message.error('Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  const deleteNote = async (id: number) => {
    try {
      const response = await api.delete(`/api/quick-notes/${id}`)
      console.log('Delete note response:', response)
      
      // Check if the response indicates success
      if (response.status === 200 || response.status === 204) {
        setNotes(prev => prev.filter(note => note.id !== id))
        message.success('Note deleted successfully')
      } else {
        throw new Error(`API returned status ${response.status}`)
      }
    } catch (error) {
      console.error('Error deleting note:', error as Error)
      message.error('Failed to delete note')
    }
  }

  const togglePin = async (id: number) => {
    const note = notes.find(n => n.id === id)
    if (!note) return

    try {
      await api.put(`/api/quick-notes/${id}`, { is_pinned: !note.is_pinned })
      setNotes(prev => prev.map(note => 
        note.id === id ? { ...note, is_pinned: !note.is_pinned } : note
      ))
    } catch (error) {
      console.error('Error toggling pin:', error as Error)
      message.error('Failed to update note')
    }
  }

  const renderMentions = (content: string) => {
    if (!content) return null
    
    const mentionRegex = /@([^@\s]+)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index))
      }
      
      const mentionText = match[1]
      // Check if this mention corresponds to a real user
      const isValidUser = coaches.some(coach => 
        coach.name.toLowerCase().includes(mentionText.toLowerCase()) || 
        coach.username.toLowerCase() === mentionText.toLowerCase() ||
        coach.firstName.toLowerCase() === mentionText.toLowerCase()
      )
      
      if (isValidUser) {
        // Add styled mention for valid users
        parts.push(
          <span 
            key={match.index} 
            style={{
              background: '#1e3a8a',
              color: '#ffffff',
              padding: '4px 4px',
              borderRadius: '16px',
              fontSize: '13px',
              fontWeight: '600',
              margin: '0 2px',
              display: 'inline-block',
              boxShadow: '0 2px 0px rgba(255, 107, 107, 0.4)',
              border: '2px solid #ffffff',
              letterSpacing: '0.3px'
            }}
          >
            @{mentionText}
          </span>
        )
      } else {
        // Add unstyled text for invalid mentions
        parts.push(`@${mentionText}`)
      }
      
      lastIndex = match.index + match[0].length
    }
    
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex))
    }
    
    return parts.length > 0 ? parts : content
  }

  const formatTimestamp = (timestamp: string) => {
    const noteTime = new Date(timestamp)
    return noteTime.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const filteredNotes = notes.filter(note => 
    !searchQuery || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.created_at.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <App>
      <div style={{
      minHeight: '100vh',
      background: '#0f2741',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        background: '#17375c',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BookOutlined style={{ fontSize: '24px', color: '#4ecdc4' }} />
            <h1 style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: '600',
              color: '#ffffff',
              fontFamily: 'Inter, sans-serif'
            }}>
              Notebook
            </h1>
            <span style={{
              background: '#4ecdc4',
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {totalNotes} notes
            </span>
          </div>
          
          {/* Search */}
          <Input
            placeholder="Search notes..."
            prefix={<SearchOutlined style={{ color: '#999' }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '300px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff'
            }}
          />
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#ffffff' }}>
            Loading notes...
          </div>
        ) : filteredNotes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'rgba(255,255,255,0.7)'
          }}>
            <BookOutlined style={{ 
              fontSize: '64px', 
              color: 'rgba(255,255,255,0.25)', 
              marginBottom: '16px' 
            }} />
            <h3 style={{
              fontSize: '20px',
              fontWeight: '500',
              color: '#ffffff',
              margin: '0 0 8px 0',
              fontFamily: 'Inter, sans-serif'
            }}>
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </h3>
            <p style={{
              fontSize: '16px',
              color: 'rgba(255,255,255,0.7)',
              margin: 0,
              fontFamily: 'Inter, sans-serif'
            }}>
              {searchQuery ? 'Try a different search term' : 'Create your first note in Quick Notes'}
            </p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '24px'
            }}>
              {[...filteredNotes]
                .sort((a, b) => {
                  if (a.is_pinned && !b.is_pinned) return -1;
                  if (!a.is_pinned && b.is_pinned) return 1;
                  const aTime = new Date((a as any).updated_at || a.updated_at || a.created_at).getTime();
                  const bTime = new Date((b as any).updated_at || b.updated_at || b.created_at).getTime();
                  return bTime - aTime;
                })
                .map((note) => (
                <div
                  key={note.id}
                  className="notebook-note"
                  style={{
                    position: 'relative',
                    background: note.color,
                    borderRadius: '12px',
                    padding: '16px',
                    minHeight: expandedNoteId === note.id ? '160px' : '120px',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: expandedNoteId === note.id ? 'scale(1.02)' : 'scale(1)',
                    border: note.is_pinned ? '2px solid #4ecdc4' : '2px solid transparent',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    if (expandedNoteId !== note.id) {
                      e.currentTarget.style.transform = 'scale(1.05) translateY(-4px)'
                      setHoveredNoteId(note.id)
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (expandedNoteId !== note.id) {
                      e.currentTarget.style.transform = 'scale(1) translateY(0px)'
                      setHoveredNoteId(null)
                    }
                  }}
                >
                  {/* Pin Icon */}
                  {(hoveredNoteId === note.id || note.is_pinned) && (
                    <Tooltip title={note.is_pinned ? 'Unpin' : 'Pin'}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          togglePin(note.id)
                        }}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: getContrastingColors(note.color).backgroundColor,
                          border: `1px solid ${getContrastingColors(note.color).borderColor}`,
                          color: note.is_pinned ? getContrastingColors(note.color).pinColor : getContrastingColors(note.color).iconColor,
                          fontSize: '14px',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '6px',
                          transition: 'all 0.2s ease',
                          zIndex: 10
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = note.is_pinned 
                            ? getContrastingColors(note.color).pinHoverBackgroundColor
                            : getContrastingColors(note.color).hoverBackgroundColor
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = getContrastingColors(note.color).backgroundColor
                        }}
                      >
                        <PushpinOutlined />
                      </button>
                    </Tooltip>
                  )}

                  {/* Content */}
                  <div 
                    onClick={() => {
                      if (expandedNoteId === note.id) {
                        setExpandedNoteId(null)
                      } else {
                        setExpandedNoteId(note.id)
                      }
                    }}
                    style={{ 
                      fontSize: '14px', 
                      lineHeight: '1.5',
                      wordBreak: 'break-word',
                      color: '#1e3a8a',
                      fontFamily: 'Inter, sans-serif',
                      minHeight: expandedNoteId === note.id ? '80px' : '60px',
                      marginBottom: expandedNoteId === note.id ? '12px' : '0'
                    }}
                  >
                    {renderMentions(note.content) || 'Empty note'}
                  </div>

                  {/* Expanded Info */}
                  {expandedNoteId === note.id && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0 0 0',
                      borderTop: '1px solid rgba(0, 0, 0, 0.2)',
                      animation: 'fadeIn 0.3s ease-in'
                    }}>
                      {/* Timestamp */}
                      <div style={{
                        fontSize: '12px',
                        color: '#4ecdc4',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: '500',
                        background: 'rgba(78, 205, 196, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <CalendarOutlined />
                        {formatTimestamp(note.created_at)}
                      </div>
                      
                      {/* Delete Button */}
                      <Popconfirm
                        title={
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            color: '#ffffff',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '16px',
                            fontWeight: '600'
                          }}>
                            <span style={{
                              background: '#ff4d4f',
                              color: '#ffffff',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              !
                            </span>
                            Delete Note
                          </div>
                        }
                        description={
                          <span style={{ 
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px'
                          }}>
                            Are you sure you want to delete this note?
                          </span>
                        }
                        onConfirm={() => deleteNote(note.id)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{
                          style: {
                            background: '#ff4d4f',
                            borderColor: '#ff4d4f',
                            fontWeight: '600',
                            borderRadius: '6px',
                            fontFamily: 'Inter, sans-serif'
                          }
                        }}
                        cancelButtonProps={{
                          style: {
                            background: '#ffffff',
                            borderColor: '#d9d9d9',
                            color: '#333333',
                            fontWeight: '500',
                            borderRadius: '6px',
                            fontFamily: 'Inter, sans-serif'
                          }
                        }}
                        overlayStyle={{
                          background: 'rgba(0, 0, 0, 0.6)'
                        }}
                        styles={{
                          body: {
                            background: '#1f2937',
                            borderRadius: '12px',
                            border: '1px solid #374151',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                          }
                        }}
                      >
                        <button
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            background: getContrastingColors(note.color).deleteBackgroundColor,
                            border: `1px solid ${getContrastingColors(note.color).deleteBorderColor}`,
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = getContrastingColors(note.color).deleteHoverBackgroundColor
                            e.currentTarget.style.transform = 'scale(1.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = getContrastingColors(note.color).deleteBackgroundColor
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          <DeleteFilled style={{ color: getContrastingColors(note.color).deleteIconColor, fontSize: '14px' }} />
                        </button>
                      </Popconfirm>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalNotes > notesPerPage && (
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Pagination
                  current={currentPage}
                  total={totalNotes}
                  pageSize={notesPerPage}
                  onChange={setCurrentPage}
                  showSizeChanger={false}
                  showQuickJumper
                  showTotal={(total, range) => 
                    `${range[0]}-${range[1]} of ${total} notes`
                  }
                />
              </div>
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
    </App>
  )
}
