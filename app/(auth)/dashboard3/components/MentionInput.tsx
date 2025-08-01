'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Coach, getMentionSuggestions, parseMentions, Mention } from '../../../../utils/mentions';

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: Mention[]) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  maxLength?: number;
  onEnter?: () => void;
}

export default function MentionInput({
  value,
  onChange,
  placeholder = 'Type your message... Use @ to mention coaches',
  style,
  disabled = false,
  maxLength,
  onEnter
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Coach[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    setCursorPosition(cursorPos);
    
    // Parse mentions and update parent
    const parsed = parseMentions(newValue);
    onChange(newValue, parsed.mentions);
    
    // Check for @ symbol to show suggestions
    checkForMention(newValue, cursorPos);
  };

  // Check if user is typing a mention
  const checkForMention = (text: string, cursorPos: number) => {
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Only show suggestions if there's no space after @ (still typing the mention)
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        setMentionStart(lastAtIndex);
        const filteredSuggestions = getMentionSuggestions(textAfterAt);
        setSuggestions(filteredSuggestions);
        setShowSuggestions(filteredSuggestions.length > 0);
        setSelectedIndex(0);
        return;
      }
    }
    
    setShowSuggestions(false);
    setMentionStart(null);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          selectSuggestion(suggestions[selectedIndex]);
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
      }
    } else if (e.key === 'Enter' && !e.shiftKey && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  // Select a suggestion and insert into text
  const selectSuggestion = (coach: Coach) => {
    if (mentionStart === null) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const beforeMention = value.substring(0, mentionStart);
    const afterCursor = value.substring(cursorPosition);
    const newValue = beforeMention + `@${coach.name} ` + afterCursor;
    
    // Update the value
    const parsed = parseMentions(newValue);
    onChange(newValue, parsed.mentions);
    
    // Close suggestions
    setShowSuggestions(false);
    setMentionStart(null);
    
    // Focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = mentionStart + coach.name.length + 2; // +2 for "@ "
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Get position for suggestions dropdown
  const getSuggestionsPosition = () => {
    const textarea = textareaRef.current;
    if (!textarea || mentionStart === null) return { top: 0, left: 0 };
    
    // Create a temporary div to measure text
    const div = document.createElement('div');
    const style = window.getComputedStyle(textarea);
    
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.font = style.font;
    div.style.padding = style.padding;
    div.style.border = style.border;
    div.style.width = style.width;
    
    div.textContent = value.substring(0, mentionStart);
    document.body.appendChild(div);
    
    const rect = textarea.getBoundingClientRect();
    const divRect = div.getBoundingClientRect();
    
    document.body.removeChild(div);
    
    return {
      top: rect.top + divRect.height + 30,
      left: rect.left + 10
    };
  };

  const suggestionsPosition = getSuggestionsPosition();

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        style={{
          width: '100%',
          minHeight: '80px',
          padding: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          color: '#ffffff',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          resize: 'vertical',
          outline: 'none',
          ...style
        }}
        onFocus={() => {
          // Re-check for mentions when focused
          checkForMention(value, cursorPosition);
        }}
        onBlur={() => {
          // Delay hiding suggestions to allow clicking
          setTimeout(() => setShowSuggestions(false), 150);
        }}
      />
      
      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          style={{
            position: 'fixed',
            top: suggestionsPosition.top,
            left: suggestionsPosition.left,
            background: '#17375c',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            maxHeight: '200px',
            overflow: 'auto',
            minWidth: '250px'
          }}
        >
          {suggestions.map((coach, index) => (
            <div
              key={coach.id}
              onClick={() => selectSuggestion(coach)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                backgroundColor: index === selectedIndex ? 'rgba(181, 136, 66, 0.2)' : 'transparent',
                borderBottom: index < suggestions.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {/* Coach Avatar */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1D75D0 0%, #4ecdc4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ffffff',
                  flexShrink: 0
                }}
              >
                {coach.initials}
              </div>
              
              {/* Coach Info */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#ffffff',
                    marginBottom: '2px'
                  }}
                >
                  {coach.name}
                </div>
                <div
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}
                >
                  {coach.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
 