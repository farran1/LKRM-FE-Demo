import React, { useState, useEffect } from 'react'
import { Input, Button, Space, Typography, Card } from 'antd'

const { Text } = Typography

export default function MentionTest() {
  const [content, setContent] = useState('')
  const [coaches] = useState([
    { id: '618e4250-9f37-41aa-bae3-2dc1086ef2e3', name: 'Andrew Farrell', username: 'andrew', email: 'andrew@lkrmsports.com', initials: 'AF' },
    { id: '5e4fc558-dac5-4dcc-bdde-91763c4aee8b', name: 'Test Test', username: 'andrew', email: 'andrew@nettaworks.com', initials: 'TT' }
  ])
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredCoaches, setFilteredCoaches] = useState<any[]>([])
  const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 })

  const handleContentChange = (value: string) => {
    setContent(value)
    
    // Check for @mentions
    const lastAtIndex = value.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const afterAt = value.substring(lastAtIndex + 1)
      const hasSpace = afterAt.includes(' ')
      
      if (!hasSpace && afterAt.length > 0) {
        const query = afterAt.toLowerCase()
        console.log('Mention detected:', { query, coaches: coaches.length })
        
        setMentionPosition({ start: lastAtIndex, end: lastAtIndex + 1 + afterAt.length })
        setShowDropdown(true)
        
        // Filter coaches based on query
        const filtered = coaches.filter(coach => 
          coach.name.toLowerCase().includes(query) || 
          coach.username.toLowerCase().includes(query)
        )
        console.log('Filtered coaches:', filtered)
        setFilteredCoaches(filtered)
      } else {
        setShowDropdown(false)
      }
    } else {
      setShowDropdown(false)
    }
  }

  const insertMention = (coach: any) => {
    const beforeMention = content.substring(0, mentionPosition.start)
    const afterMention = content.substring(mentionPosition.end)
    const newContent = `${beforeMention}@${coach.username} ${afterMention}`
    
    setContent(newContent)
    setShowDropdown(false)
  }

  return (
    <Card title="Mention Test" style={{ margin: '20px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text>Type @ followed by a username to test mentions:</Text>
        <div style={{ position: 'relative' }}>
          <Input.TextArea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Try typing @andrew to test mentions"
            style={{ minHeight: '100px' }}
          />
          
          {/* Mention Dropdown */}
          {showDropdown && filteredCoaches.length > 0 && (
            <div style={{ 
              position: 'absolute',
              top: '100%',
              left: '0',
              right: '0',
              background: 'white', 
              borderRadius: '6px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              maxHeight: '150px',
              overflow: 'auto',
              zIndex: 1000,
              border: '1px solid #d9d9d9'
            }}>
              {filteredCoaches.map((coach) => (
                <div
                  key={coach.id}
                  onClick={() => insertMention(coach)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f5f5f5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white'
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#1890ff',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {coach.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>
                      {coach.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#666' }}>
                      @{coach.username}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <Text strong>Current content:</Text>
          <div style={{ 
            background: '#f5f5f5', 
            padding: '8px', 
            borderRadius: '4px',
            marginTop: '4px',
            fontFamily: 'monospace'
          }}>
            {content}
          </div>
        </div>
        
        <div>
          <Text strong>Available coaches:</Text>
          <div style={{ marginTop: '4px' }}>
            {coaches.map(coach => (
              <Button 
                key={coach.id} 
                size="small" 
                style={{ margin: '2px' }}
                onClick={() => setContent(content + ` @${coach.username}`)}
              >
                @{coach.username}
              </Button>
            ))}
          </div>
        </div>
      </Space>
    </Card>
  )
}
