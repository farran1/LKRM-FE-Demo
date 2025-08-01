'use client';

import React, { useState, useEffect, useRef } from 'react';
import MentionInput from './MentionInput';
import { 
  parseMentions, 
  createMentionNotifications, 
  createAssignmentNotification,
  saveNotification,
  Mention,
  COACHES
} from '../../../../utils/mentions';

interface TaskMentionInputProps {
  onTaskCreate: (task: {
    title: string;
    description: string;
    mentions: Mention[];
    assignedTo?: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: string;
    event?: string;
  }) => void;
  onCancel: () => void;
}

export default function TaskMentionInput({ onTaskCreate, onCancel }: TaskMentionInputProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionMentions, setDescriptionMentions] = useState<Mention[]>([]);
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const eventDropdownRef = useRef<HTMLDivElement>(null);

  // Mock events data - replace with actual events from your system
  const events = [
    { id: '1', name: 'Basketball Practice', date: '2024-01-15' },
    { id: '2', name: 'Team Meeting', date: '2024-01-16' },
    { id: '3', name: 'Game vs Eagles', date: '2024-01-18' },
    { id: '4', name: 'Training Session', date: '2024-01-20' },
    { id: '5', name: 'Strategy Review', date: '2024-01-22' },
  ];

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(eventSearch.toLowerCase())
  );

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (eventDropdownRef.current && !eventDropdownRef.current.contains(event.target as Node)) {
        setShowEventDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEventSelect = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event.name);
      setEventSearch(event.name);
    }
    setShowEventDropdown(false);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    const currentUser = { id: 'current-user', name: 'Coach Smith' };
    const taskId = Date.now().toString();

    // Create the task
    const newTask = {
      title: title.trim(),
      description: description.trim(),
      mentions: descriptionMentions,
      assignedTo: assignedTo || undefined,
      priority,
      dueDate: dueDate || undefined,
      event: selectedEvent || undefined
    };

    // Create notifications for mentions in description
    if (descriptionMentions.length > 0) {
      const mentionNotifications = createMentionNotifications(
        description,
        descriptionMentions,
        currentUser,
        'in a task description',
        taskId
      );
      mentionNotifications.forEach(saveNotification);
    }

    // Create assignment notification if someone is assigned
    if (assignedTo) {
      const assignedCoach = COACHES.find(coach => coach.id === assignedTo);
      if (assignedCoach) {
        const assignmentNotification = createAssignmentNotification(
          title,
          taskId,
          currentUser,
          assignedCoach.id,
          assignedCoach.name,
          priority,
          dueDate
        );
        saveNotification(assignmentNotification);
      }
    }

    onTaskCreate(newTask);

    // Reset form
    setTitle('');
    setDescription('');
    setDescriptionMentions([]);
    setAssignedTo('');
    setPriority('medium');
    setDueDate('');
    setEventSearch('');
    setSelectedEvent('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          background: '#17375c',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '95vh',
          overflow: 'visible'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}
        >
          <h2
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              fontWeight: 600,
              color: '#ffffff',
              margin: 0
            }}
          >
            Create New Task
          </h2>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              fontSize: '24px'
            }}
          >
            ×
          </button>
        </div>

        {/* Task Title */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#ffffff',
              marginBottom: '6px'
            }}
          >
            Task Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title..."
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Task Description with Mentions */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#ffffff',
              marginBottom: '6px'
            }}
          >
            Description (use @ to mention coaches)
          </label>
          <MentionInput
            value={description}
            onChange={(content, mentions) => {
              setDescription(content);
              setDescriptionMentions(mentions);
            }}
            placeholder="Describe the task... Use @ to mention coaches"
            style={{
              minHeight: '100px',
              background: 'rgba(255, 255, 255, 0.05)'
            }}
          />
        </div>

        {/* Assign To and Event Row */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          {/* Assign To */}
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: '#ffffff',
                marginBottom: '6px'
              }}
            >
              Assign To
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Select a coach...</option>
              {COACHES.map((coach) => (
                <option key={coach.id} value={coach.id} style={{ background: '#17375c', color: '#ffffff' }}>
                  {coach.name} - {coach.role}
                </option>
              ))}
            </select>
          </div>

          {/* Event */}
          <div style={{ flex: 1, position: 'relative' }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: '#ffffff',
                marginBottom: '6px'
              }}
            >
              Event
            </label>
            <input
              type="text"
              value={eventSearch}
              onChange={(e) => {
                setEventSearch(e.target.value);
                setShowEventDropdown(true);
              }}
              onFocus={() => setShowEventDropdown(true)}
              placeholder="Search events..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {showEventDropdown && filteredEvents.length > 0 && (
              <div
                ref={eventDropdownRef}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#17375c',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  marginTop: '4px',
                  maxHeight: '200px',
                  overflow: 'auto',
                  zIndex: 1001
                }}
              >
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleEventSelect(event.id)}
                    style={{
                      padding: '12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'Inter, sans-serif',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{event.name}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Priority and Due Date Row */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          {/* Priority */}
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: '#ffffff',
                marginBottom: '6px'
              }}
            >
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="low" style={{ background: '#17375c', color: '#ffffff' }}>Low Priority</option>
              <option value="medium" style={{ background: '#17375c', color: '#ffffff' }}>Medium Priority</option>
              <option value="high" style={{ background: '#17375c', color: '#ffffff' }}>High Priority</option>
            </select>
          </div>

          {/* Due Date */}
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: '#ffffff',
                marginBottom: '6px'
              }}
            >
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              background: 'transparent',
              color: '#ffffff',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              background: title.trim() ? 'rgba(181, 136, 66, 0.9)' : 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              cursor: title.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (title.trim()) {
                e.currentTarget.style.backgroundColor = 'rgba(181, 136, 66, 1)';
              }
            }}
            onMouseLeave={(e) => {
              if (title.trim()) {
                e.currentTarget.style.backgroundColor = 'rgba(181, 136, 66, 0.9)';
              }
            }}
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
} 