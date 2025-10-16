import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Modal, App, Tooltip, Tag, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, PushpinOutlined, MinusOutlined, DeleteFilled, BookOutlined } from '@ant-design/icons'
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

interface StickyNotesModuleProps {
  sidebarCollapsed?: boolean
}

interface ApiResponse<T> {
  data?: T
  error?: string
}

interface CoachesResponse {
  coaches: Coach[]
}

interface NotesResponse {
  notes: QuickNote[]
}

export default function EnhancedStickyNotesModule({ sidebarCollapsed = false }: StickyNotesModuleProps) {
  const { message } = App.useApp()
  const router = useRouter()
  const [notes, setNotes] = useState<QuickNote[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showMentionModal, setShowMentionModal] = useState(false)
  const [currentMentions, setCurrentMentions] = useState<Mention[]>([])
  const [editingContent, setEditingContent] = useState('')
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 })
  const [filteredCoaches, setFilteredCoaches] = useState<Coach[]>([])
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null)
  const [hoveredNoteId, setHoveredNoteId] = useState<number | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [hasMoreNotes, setHasMoreNotes] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const stickyColors = [
    '#FFE66D', // Yellow
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#95E1D3', // Mint
    '#A8E6CF', // Light Green
    '#FFB347', // Orange
    '#DDA0DD', // Plum
    '#98D8C8', // Seafoam
  ]

  // Load data on mount
  useEffect(() => {
    loadNotes()
    loadCoaches()
  }, [])

  // Close expanded note when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.sticky-note')) {
        setExpandedNoteId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const loadCoaches = async () => {
    try {
      console.log('🔄 Loading coaches...')
      // Load coaches from auth.users table instead of the old users table
      const response = await api.get('/api/coaches/search')
      console.log('📡 Coaches API response:', response.data)
      
      if (response.data && typeof response.data === 'object' && 'coaches' in response.data && Array.isArray(response.data.coaches)) {
        setCoaches(response.data.coaches)
        console.log('✅ Loaded coaches successfully:', response.data.coaches.map(c => c.name))
      } else {
        // No coaches available - set empty array
        setCoaches([])
        console.log('⚠️ No coaches available - empty response')
      }
    } catch (error) {
      console.error('❌ Error loading coaches:', error as Error)
      // No coaches available due to error - set empty array
      setCoaches([])
      console.log('⚠️ No coaches available due to error')
    }
  }

  const loadNotes = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/quick-notes?limit=10&offset=0')
      console.log('Load notes response:', response)
      console.log('Response data:', response.data)
      
      // Handle both old and new response formats
      let notes = []
      let total = 0
      let hasMore = false
      
      if (response.data && typeof response.data === 'object') {
        if ('notes' in response.data && Array.isArray(response.data.notes)) {
          // New format with pagination
          const responseData = response.data as any
          notes = responseData.notes
          total = responseData.total || 0
          hasMore = responseData.hasMore || false
        } else if (Array.isArray(response.data)) {
          // Old format - array of notes
          notes = response.data.slice(0, 10) // Take only first 10
          total = response.data.length
          hasMore = response.data.length > 10
        }
      }
      
      console.log('Processed notes:', notes)
      console.log('Total:', total)
      console.log('Has more:', hasMore)
      
      setNotes(notes)
      setHasMoreNotes(hasMore)
    } catch (error) {
      console.error('Error loading notes:', error as Error)
      message.error('Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  const loadMoreNotes = async () => {
    // Navigate to notebook in the same tab for consistent UX
    router.push('/notebook')
  }

  // Removed searchCoaches function - now using local filtering

  const addNote = async () => {
    const newNote: Partial<QuickNote> = {
      content: '',
      color: stickyColors[Math.floor(Math.random() * stickyColors.length)],
      position_x: 0,
      position_y: 0,
      is_pinned: false
    }

    try {
      const response = await api.post('/api/quick-notes', newNote)
      console.log('Add note response:', response)
      console.log('Add note response status:', response.status)
      console.log('Add note response data:', response.data)
      
      if (response.status !== 200 && response.status !== 201) {
        const errorData = response.data as any
        throw new Error(`API returned status ${response.status}: ${errorData?.error || 'Unknown error'}`)
      }
      
      const responseData = response.data as any
      const createdNote = responseData?.note || responseData
      if (!createdNote || !createdNote.id) {
        console.error('Invalid note structure:', createdNote)
        throw new Error('Invalid response from server - missing note data')
      }
      setNotes(prev => [createdNote, ...prev])
      setEditingId(createdNote.id)
      // Clear any existing content and mention state
      setEditingContent('')
      clearMentionState()
    } catch (error) {
      console.error('Error creating note:', error as Error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      message.error(`Failed to create note: ${errorMessage}`)
    }
  }

  const updateNote = async (id: number, updates: Partial<QuickNote>) => {
    try {
      console.log('🔄 Updating note:', { id, updates })
      const response = await api.put(`/api/quick-notes/${id}`, updates)
      console.log('✅ Update note response:', response)
      const responseData = response.data as any
      const updatedNote = responseData?.note || responseData
      if (!updatedNote || !updatedNote.id) {
        throw new Error('Invalid response from server')
      }
      
      setNotes(prev => prev.map(note => 
        note.id === id ? updatedNote : note
      ))
    } catch (error) {
      console.error('❌ Error updating note:', error as Error)
      message.error('Failed to update note')
    }
  }

  const deleteNote = async (id: number) => {
    console.log('deleteNote function called for note ID:', id)
    try {
      const response = await api.delete(`/api/quick-notes/${id}`)
      console.log('Delete note response:', response)
      
      // Check if the response indicates success
      if (response.status === 200 || response.status === 204) {
        setNotes(prev => prev.filter(note => note.id !== id))
        message.success('Note deleted')
        console.log('Note successfully deleted from state')
      } else {
        throw new Error(`API returned status ${response.status}`)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      message.error('Failed to delete note')
    }
  }

  const handleContentChange = (id: number, content: string) => {
    setEditingContent(content)
    
    // Simple @mention detection - look for @ followed by text without spaces
    const textBeforeCursor = content
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      
      // Show dropdown if there's no space after @ and we have some text
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        const query = textAfterAt.toLowerCase()
        console.log('🔍 Mention detected:', { 
          query, 
          coachesCount: coaches.length, 
          coaches: coaches.map(c => c.name),
          content: content.substring(Math.max(0, lastAtIndex - 10), lastAtIndex + 20)
        })
        
        setSearchQuery(query)
        setMentionPosition({ start: lastAtIndex, end: lastAtIndex + 1 + textAfterAt.length })
        setShowMentionDropdown(true)
        
        // Filter coaches based on query
        const filtered = coaches.filter(coach => 
          coach.name.toLowerCase().includes(query) || 
          coach.firstName.toLowerCase().includes(query) ||
          coach.lastName.toLowerCase().includes(query) ||
          coach.username.toLowerCase().includes(query)
        )
        setFilteredCoaches(filtered)
        console.log('✅ Filtered coaches:', filtered.map(c => c.name))
      } else {
        console.log('❌ Hiding dropdown - space found or empty')
        setShowMentionDropdown(false)
        setFilteredCoaches([])
      }
    } else {
      console.log('❌ Hiding dropdown - no @ found')
      setShowMentionDropdown(false)
      setFilteredCoaches([])
    }
  }

  const handleSave = async (id: number) => {
    // Don't save if content is empty or only whitespace
    if (!editingContent.trim()) {
      message.warning('Note cannot be empty')
      return
    }
    
    // Parse mentions from content
    const mentions = parseMentions(editingContent)
    console.log('💬 Parsed mentions:', mentions)
    
    await updateNote(id, {
      content: editingContent.trim(),
      mentions: mentions
    } as Partial<QuickNote>)
    
    // Clear all editing and mention state
    setEditingId(null)
    setEditingContent('')
    clearMentionState()
  }

  const parseMentions = (content: string): Mention[] => {
    const mentionRegex = /@([^@\s]+)/g
    const mentions: Mention[] = []
    let match

    console.log('🔍 Parsing mentions from content:', content)

    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionText = match[1]
      console.log('🔍 Found mention text:', mentionText)
      
      // Find the coach by name or username to get the actual user ID
      const coach = coaches.find(c => 
        c.name.toLowerCase().includes(mentionText.toLowerCase()) || 
        c.username.toLowerCase() === mentionText.toLowerCase() ||
        c.firstName.toLowerCase() === mentionText.toLowerCase()
      )
      
      if (coach) {
        console.log('✅ Found matching coach:', coach.name, 'ID:', coach.id)
        mentions.push({
          userId: coach.id, // Use the actual user ID from auth.users
          text: match[0], // @mentionText
          startPosition: match.index,
          endPosition: match.index + match[0].length
        })
      } else {
        console.log('❌ No matching coach found for:', mentionText)
      }
      // Note: We only add mentions for valid users, invalid mentions are ignored
    }

    console.log('📝 Final parsed mentions:', mentions)
    return mentions
  }

  // Removed handleMentionSearch function - now using local filtering in handleContentChange

  const clearMentionState = () => {
    setShowMentionDropdown(false)
    setFilteredCoaches([])
    setSearchQuery('')
    setMentionPosition({ start: 0, end: 0 })
    setExpandedNoteId(null)
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

  const insertMention = (coach: Coach) => {
    const beforeMention = editingContent.substring(0, mentionPosition.start)
    const afterMention = editingContent.substring(mentionPosition.end)
    // Use first name for mentions to keep them short
    const mentionName = coach.firstName || coach.name.split(' ')[0]
    const newContent = `${beforeMention}@${mentionName} ${afterMention}`
    
    setEditingContent(newContent)
    setShowMentionDropdown(false)
    setSearchQuery('')
    setFilteredCoaches([])
  }

  const renderMentions = (content: string) => {
    if (!content) return null
    
    const mentionRegex = /@([^@\s]+)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before mention
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
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex))
    }
    
    return parts.length > 0 ? parts : content
  }

  const togglePin = async (id: number) => {
    const note = notes.find(n => n.id === id)
    if (!note) return

    await updateNote(id, { is_pinned: !note.is_pinned })
  }



  // No spinner – use text-based loading message within the module like other cards

  return (
    <App>
      <style jsx global>{`
        .sticky-note-textarea::placeholder {
          color: #1e3a8a !important;
          opacity: 1 !important;
          font-weight: 500 !important;
        }
        .sticky-note-textarea::-webkit-input-placeholder {
          color: #1e3a8a !important;
          opacity: 1 !important;
          font-weight: 500 !important;
        }
        .sticky-note-textarea::-moz-placeholder {
          color: #1e3a8a !important;
          opacity: 1 !important;
          font-weight: 500 !important;
        }
        .sticky-note-textarea:-ms-input-placeholder {
          color: #1e3a8a !important;
          opacity: 1 !important;
          font-weight: 500 !important;
        }
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
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    <div 
      style={{ 
          background: '#17375c', // Match sidebar/header color like other modules
          borderRadius: '16px',
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        width: '100%',
          height: '400px', // Fixed height like the original
          overflow: 'hidden',
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ 
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif'
          }}>Quick Notes</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tooltip title="View All Notes">
              <button
                onClick={() => router.push('/notebook')}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <BookOutlined />
              </button>
            </Tooltip>

            <button onClick={addNote} style={{
              background: 'rgba(181, 136, 66, 0.9)',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: '#ffffff',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              flexShrink: 0
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(181, 136, 66, 1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(181, 136, 66, 0.9)';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Add Note
            </button>
          </div>
        </div>

        {/* Notes Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '100%',
            height: 'calc(100% - 60px)', // Calculate height minus header
            overflow: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: '#1e425c #17375c',
            position: 'relative',
            zIndex: 0
          }}
        >
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif',
              textAlign: 'center'
            }}>
              Loading notes...
            </div>
          ) : (
            <>
        {[...notes]
          .sort((a, b) => {
            // Pinned first
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            // Then by updated_at/created_at desc
            const aTime = new Date((a as any).updated_at || a.updated_at || a.created_at || a.created_at).getTime();
            const bTime = new Date((b as any).updated_at || b.updated_at || b.created_at || b.created_at).getTime();
            return bTime - aTime;
          })
          .map((note) => (
          <div
            key={note.id}
              className="sticky-note"
            style={{
              position: 'relative',
              background: note.color,
                borderRadius: '8px',
                padding: '12px',
                minHeight: expandedNoteId === note.id ? '140px' : '80px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                cursor: editingId === note.id ? 'text' : 'pointer',
                transition: 'all 0.3s ease',
                transform: editingId === note.id ? 'rotate(-0.5deg)' : 'rotate(0deg)',
                border: note.is_pinned ? '2px solid #4ecdc4' : 'none',
                fontFamily: 'Inter, sans-serif',
                zIndex: editingId === note.id ? 100 : 1
              }}
              onMouseEnter={(e) => {
                if (editingId !== note.id) {
                  e.currentTarget.style.transform = 'rotate(1deg) translateY(-2px)';
                  setHoveredNoteId(note.id);
                }
              }}
              onMouseLeave={(e) => {
                if (editingId !== note.id) {
                  e.currentTarget.style.transform = 'rotate(0deg) translateY(0px)';
                  setHoveredNoteId(null);
                }
              }}
            >
              {/* Pin Button - only show on hover or when pinned */}
              {(hoveredNoteId === note.id || note.is_pinned) && (
            <Tooltip title={note.is_pinned ? 'Unpin' : 'Pin'}>
                  <button
                onClick={() => togglePin(note.id)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                      background: getContrastingColors(note.color).backgroundColor,
                      border: `1px solid ${getContrastingColors(note.color).borderColor}`,
                      color: note.is_pinned ? getContrastingColors(note.color).pinColor : getContrastingColors(note.color).iconColor,
                      fontSize: '14px',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease'
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
            {editingId === note.id ? (
                <div style={{ position: 'relative', zIndex: 10 }}>
                  <textarea
                  value={editingContent}
                  onChange={(e) => handleContentChange(note.id, e.target.value)}
                  onInput={(e) => handleContentChange(note.id, e.currentTarget.value)}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                        // If we're in a mention context and have filtered coaches, auto-complete
                        if (showMentionDropdown && filteredCoaches.length > 0) {
                      insertMention(filteredCoaches[0])
                          return
                        }
                        // If we're in a mention context but no coaches, close dropdown and continue
                        if (showMentionDropdown) {
                          setShowMentionDropdown(false)
                          return
                        }
                        // Otherwise save the note
                        handleSave(note.id)
                    } else if (e.key === 'Escape') {
                        clearMentionState()
                        setEditingId(null)
                    }
                  }}
                    placeholder="Type your note... Use @name to mention coaches"
                  autoFocus
                    className="sticky-note-textarea"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    resize: 'none',
                    minHeight: '80px',
                    fontSize: '14px',
                      lineHeight: '1.4',
                      color: '#1e3a8a', // LKRM darker blue
                      fontFamily: 'Inter, sans-serif',
                      width: '100%',
                      outline: 'none',
                      padding: 0,
                      margin: 0
                  }}
                />
                
                {/* Mention Dropdown */}
                {showMentionDropdown && (
                  <div style={{ 
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    right: '0',
                      background: '#ffffff', 
                      borderRadius: '12px', 
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      maxHeight: '200px',
                    overflow: 'auto',
                      zIndex: 10,
                      border: '2px solid #ff6b6b',
                      marginTop: '4px'
                  }}>
                    {filteredCoaches.length > 0 ? (
                      filteredCoaches.map((coach) => (
                        <div
                          key={coach.id}
                          onClick={() => insertMention(coach)}
                          style={{
                              padding: '12px 16px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                              gap: '12px',
                              fontFamily: 'Inter, sans-serif',
                              transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #ff8e8e)'
                              e.currentTarget.style.color = '#ffffff'
                          }}
                          onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.color = 'inherit'
                          }}
                        >
                          <div style={{
                              width: '32px',
                              height: '32px',
                            borderRadius: '50%',
                              background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
                              color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 4px rgba(255, 107, 107, 0.3)'
                          }}>
                            {coach.initials}
                          </div>
                          <div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>
                              {coach.name}
                            </div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {coach.email}
                              </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{
                        padding: '12px 16px',
                        color: '#666',
                        fontStyle: 'italic',
                        textAlign: 'center'
                      }}>
                        No users found for "@{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: expandedNoteId === note.id ? '120px' : '60px' }}>
                <div 
                  onClick={() => {
                      // Single click - expand/collapse
                      if (expandedNoteId === note.id) {
                        setExpandedNoteId(null)
                      } else {
                        setExpandedNoteId(note.id)
                      }
                    }}
                    onDoubleClick={() => {
                      // Double click - start editing
                    setEditingId(note.id)
                    setEditingContent(note.content)
                      clearMentionState()
                  }}
                  style={{ 
                    fontSize: '14px', 
                    lineHeight: '1.4',
                    wordBreak: 'break-word',
                      cursor: 'pointer',
                      color: '#1e3a8a', // LKRM darker blue
                      fontFamily: 'Inter, sans-serif',
                      minHeight: expandedNoteId === note.id ? '60px' : '40px',
                      flex: 1,
                      padding: '8px 0'
                    }}
                  >
                    {renderMentions(note.content) || 'Click to expand...'}
                </div>
                
                  {/* Bottom row with timestamp and trash can - only show when expanded */}
                  {expandedNoteId === note.id && (
                <div style={{ 
                  display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '12px',
                      padding: '2px 2px 2px 2px',
                      background: 'rgba(0, 0, 0, 0.05)',
                      borderRadius: '6px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      animation: 'fadeIn 0.3s ease-in'
                    }}>
                      {/* Timestamp in bottom left - more prominent */}
                      <div style={{
                          fontSize: '12px',
                        color: '#4ecdc4',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: '500',
                        background: 'rgba(78, 205, 196, 0.1)',
                        padding: '2px 2px',
                        borderRadius: '4px',
                        border: '1px solid rgba(78, 205, 196, 0.2)'
                      }}>
                         {formatTimestamp(note.created_at)}
                      </div>
                      
                      {/* Trash can in bottom right - just icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          console.log('Delete button clicked for note:', note.id)
                          setDeleteConfirmId(note.id)
                        }}
                        style={{
                          background: getContrastingColors(note.color).deleteBackgroundColor,
                          border: `1px solid ${getContrastingColors(note.color).deleteBorderColor}`,
                          cursor: 'pointer',
                          padding: '8px',
                          borderRadius: '8px',
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
                        <DeleteFilled style={{ color: getContrastingColors(note.color).deleteIconColor, fontSize: '16px' }} />
                      </button>
                    </div>
                  )}
              </div>
            )}
          </div>
        ))}

          {/* Load More / All Notes Button */}
          {notes.length > 0 && hasMoreNotes && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '16px 0',
              marginTop: '8px'
            }}>
              <button
                onClick={loadMoreNotes}
                disabled={loadingMore}
                style={{
                  background: 'rgba(181, 136, 66, 1)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
                  transition: 'all 0.3s ease',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: loadingMore ? 0.7 : 1,
                  transform: loadingMore ? 'scale(0.98)' : 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (!loadingMore) {
                    e.currentTarget.style.transform = 'scale(1.05)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 107, 53, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loadingMore) {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 53, 0.3)'
                  }
                }}
              >
                {loadingMore ? (
                  <>Loading...</>
                ) : (
                  <>
                    <BookOutlined />
                    All Notes
                  </>
                )}
              </button>
      </div>
          )}

          {/* Empty State - positioned within the notes container */}
          {!loading && notes.length === 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              color: 'rgba(255, 255, 255, 0.5)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '8px' }}>
                <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 8H17M7 12H17M7 16H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <div>No notes yet</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Click "Add Note" to get started</div>
          </div>
          )}
            </>
          )}
        </div>
        
        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <Modal
            title="Delete Note"
            open={!!deleteConfirmId}
            onOk={() => {
              console.log('Confirming delete for note:', deleteConfirmId)
              deleteNote(deleteConfirmId)
              setDeleteConfirmId(null)
            }}
            onCancel={() => {
              console.log('Canceling delete for note:', deleteConfirmId)
              setDeleteConfirmId(null)
            }}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{
              style: {
                background: '#ff4d4f',
                borderColor: '#ff4d4f'
              }
            }}
          >
            <p>Are you sure you want to delete this note? This action cannot be undone.</p>
          </Modal>
        )}
    </div>
    </App>
  )
}