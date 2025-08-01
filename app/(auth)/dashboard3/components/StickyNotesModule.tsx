'use client';

import React, { useState, useEffect } from 'react';
import MentionInput from './MentionInput';
import { 
  parseMentions, 
  createMentionNotifications, 
  createMentionActivity, 
  saveNotification,
  Mention 
} from '../../../../utils/mentions';

interface Note {
  id: string;
  content: string;
  timestamp: string;
  color: string;
  mentions?: Mention[];
}

interface StickyNotesModuleProps {
  sidebarCollapsed?: boolean;
}

export default function StickyNotesModule({ sidebarCollapsed = false }: StickyNotesModuleProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('dashboard-sticky-notes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (error) {
        console.error('Error loading notes:', error);
      }
    }
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    if (notes.length > 0 || notes.length === 0) {
      localStorage.setItem('dashboard-sticky-notes', JSON.stringify(notes));
    }
  }, [notes]);

  const stickyColors = [
    '#FFE66D', // Yellow
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#95E1D3', // Mint
    '#A8E6CF', // Light Green
    '#FFB347', // Orange
  ];

  const addNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      content: '',
      timestamp: new Date().toLocaleString(),
      color: stickyColors[Math.floor(Math.random() * stickyColors.length)]
    };
    setNotes(prev => [newNote, ...prev]);
    setEditingId(newNote.id);
  };

  const updateNote = (id: string, content: string, mentions: Mention[] = []) => {
    setNotes(prev => prev.map(note => {
      if (note.id === id) {
        // Handle mentions when note is saved
        if (mentions.length > 0) {
          const currentUser = { id: 'current-user', name: 'Coach Smith' };
          
          // Create notifications for mentioned users
          const notifications = createMentionNotifications(
            content,
            mentions,
            currentUser,
            'in a sticky note',
            id
          );
          
          notifications.forEach(saveNotification);
          
          // Create activity entry
          const activity = createMentionActivity(
            { name: 'Coach Smith', role: 'Head Coach', initials: 'CS' },
            mentions,
            'in a sticky note'
          );
          
          if (activity) {
            // Add to recent activity (you'd normally call an API here)
            console.log('New mention activity:', activity);
          }
        }
        
        return { 
          ...note, 
          content, 
          mentions,
          timestamp: new Date().toLocaleString() 
        };
      }
      return note;
    }));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const handleNoteClick = (id: string) => {
    setEditingId(id);
  };

  const handleNoteBlur = () => {
    setEditingId(null);
  };

  return (
    <div
      style={{
        background: '#17375c',
        borderRadius: '16px',
        padding: '20px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
                  width: sidebarCollapsed ? '100%' : '370px',
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
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '16px',
            lineHeight: '18px',
            color: '#ffffff',
            textAlign: 'left'
          }}
        >
          Quick Notes
        </div>

        {/* Add Note Button */}
        <button
          onClick={addNote}
          style={{
            background: 'rgba(181, 136, 66, 0.9)', // LKRM Orange with transparency
            border: 'none',
            borderRadius: '20px', // Pill shape
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            color: '#ffffff',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500
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

      {/* Notes Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          width: '100%',
          height: '100%',
          overflow: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#1e425c #17375c'
        }}
      >
        {notes.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'rgba(255, 255, 255, 0.5)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              textAlign: 'center'
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '8px' }}>
              <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 8H17M7 12H17M7 16H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div>No notes yet</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Click "Add Note" to get started</div>
          </div>
        )}

        {notes.map((note) => (
          <div
            key={note.id}
            style={{
              background: note.color,
              borderRadius: '8px',
              padding: '12px',
              position: 'relative',
              minHeight: '80px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              cursor: editingId === note.id ? 'text' : 'pointer',
              transition: 'transform 0.2s ease',
              transform: editingId === note.id ? 'rotate(-0.5deg)' : 'rotate(0deg)'
            }}
            onClick={() => handleNoteClick(note.id)}
            onMouseEnter={(e) => {
              if (editingId !== note.id) {
                e.currentTarget.style.transform = 'rotate(1deg) translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (editingId !== note.id) {
                e.currentTarget.style.transform = 'rotate(0deg) translateY(0px)';
              }
            }}
          >
            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNote(note.id);
              }}
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                background: 'rgba(0, 0, 0, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: 0.7,
                transition: 'opacity 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7';
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 2L8 8M8 2L2 8" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Note content */}
            {editingId === note.id ? (
              <MentionInput
                value={note.content}
                onChange={(content, mentions) => updateNote(note.id, content, mentions)}
                placeholder="Type your note here... Use @ to mention coaches"
                style={{
                  width: '100%',
                  height: '60px',
                  border: 'none',
                  background: 'transparent',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  color: '#333',
                  lineHeight: '1.4',
                  padding: '0',
                  marginBottom: '8px',
                  minHeight: '60px'
                }}
                onEnter={handleNoteBlur}
              />
            ) : (
              <div
                onClick={() => handleNoteClick(note.id)}
                style={{
                  width: '100%',
                  minHeight: '60px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  color: '#333',
                  lineHeight: '1.4',
                  padding: '0',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  whiteSpace: 'pre-wrap'
                }}
                dangerouslySetInnerHTML={{
                  __html: note.content ? parseMentions(note.content).html : 'Click to edit...'
                }}
              />
            )}

            {/* Timestamp */}
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(0, 0, 0, 0.5)',
                fontFamily: 'Inter, sans-serif',
                textAlign: 'right'
              }}
            >
              {note.timestamp}
            </div>
          </div>
        ))}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        div::-webkit-scrollbar {
          width: 4px;
        }
        div::-webkit-scrollbar-track {
          background: #17375c;
        }
        div::-webkit-scrollbar-thumb {
          background: #1e425c;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #2a4a6b;
        }
      `}</style>
    </div>
  );
} 
 