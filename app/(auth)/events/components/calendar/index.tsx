'use client'

import { useCallback, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { Modal, List, Typography, Tag, Button } from 'antd'
import style from './style.module.scss'
import RefreshCircleIcon from '@/components/icon/refresh-circle.svg'

const { Text } = Typography

const CalendarView = ({dataSource, currentDate, showEventDetail, addEvent}: any) => {
  const entries: Array<any> = Array.isArray(dataSource) ? dataSource : []
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)

  const getDaysInMonth = (date: Dayjs) => {
    const startOfMonth = date.startOf('month')
    const endOfMonth = date.endOf('month')
    const startOfWeek = startOfMonth.startOf('week')
    const endOfWeek = endOfMonth.endOf('week')
    
    const days = []
    let current = startOfWeek
    
    // Only show 5 weeks instead of 6
    const maxWeeks = 5
    let weekCount = 0
    
    while (current.isBefore(endOfWeek) || current.isSame(endOfWeek, 'day')) {
      if (weekCount >= maxWeeks) break
      
      days.push(current)
      current = current.add(1, 'day')
      
      // Check if we've completed a week (7 days)
      if (days.length % 7 === 0) {
        weekCount++
      }
    }
    
    return days
  }

  const getEventsForDate = useCallback((date: Dayjs) => {
    if (!Array.isArray(entries)) return []
    const dateStr = date.format('YYYY-MM-DD')
    
    const eventsForDate: any[] = []
    
    entries.forEach((entry: any) => {
      if (!entry.startTime) return
      
      const eventDate = dayjs(entry.startTime).format('YYYY-MM-DD')
      
      // Check if this is a repeating event
      if (entry.isRepeat && entry.occurence > 0) {
        // Generate recurring instances
        const startDate = dayjs(entry.startTime)
        const occurrences = entry.occurence || 1
        
        // Use the stored repeatType from the database, fallback to smart detection
        let repeatType = entry.repeatType || 'weekly' // Use stored repeatType, default to weekly
        
        // Fallback to smart detection if repeatType is not available
        if (!entry.repeatType) {
          // Special case: If event name contains "daily" or "practice", assume daily
          if (entry.name.toLowerCase().includes('daily') || 
              entry.name.toLowerCase().includes('practice') ||
              entry.name.toLowerCase().includes('training')) {
            repeatType = 'daily'
          }
          // If occurrence is very high (like 30+), it's likely daily
          else if (occurrences >= 30) {
            repeatType = 'daily'
          }
          // If occurrence is moderate (like 12-24), it's likely monthly  
          else if (occurrences >= 12 && occurrences <= 24) {
            repeatType = 'monthly'
          }
          // If occurrence is very low (like 1-2), it's likely yearly
          else if (occurrences <= 2) {
            repeatType = 'yearly'
          }
          // For events with 3-6 occurrences, be more aggressive about daily detection
          else if (occurrences >= 3 && occurrences <= 6) {
            const startDate = dayjs(entry.startTime)
            const daysSinceStart = dayjs().diff(startDate, 'day')
            
            // If it's a recent event (within 2 weeks) with multiple occurrences, assume daily
            if (daysSinceStart <= 14) {
              repeatType = 'daily'
            } 
            // If it's an older event but has many occurrences relative to time span, assume daily
            else if (occurrences >= 5) {
              repeatType = 'daily'
            } 
            // Otherwise assume weekly
            else {
              repeatType = 'weekly'
            }
          }
          // Default to weekly for other cases
          else {
            repeatType = 'weekly'
          }
        }
        
        // Handle different repeat types
        if (repeatType === 'weekly' && entry.daysOfWeek && Array.isArray(entry.daysOfWeek) && entry.daysOfWeek.length > 0) {
          // Weekly with specific days of the week
          const daysOfWeek = entry.daysOfWeek.map((d: any) => parseInt(d))
          const startOfWeek = startDate.startOf('week')
          
          // Generate instances for each selected day of the week, respecting occurrence limits
          let occurrenceCount = 0
          let weekOffset = 0
          
          while (occurrenceCount < occurrences) {
            for (const dayOfWeek of daysOfWeek) {
              if (occurrenceCount >= occurrences) break
              
              const recurringDate = startOfWeek.add(weekOffset, 'week').add(dayOfWeek, 'day')
              
              // Check if this occurrence is within the end date (if specified)
              if (entry.endDate && recurringDate.isAfter(dayjs(entry.endDate), 'day')) {
                break
              }
              
              if (recurringDate.format('YYYY-MM-DD') === dateStr) {
                eventsForDate.push({
                  ...entry,
                  id: `${entry.id}-${weekOffset}-${dayOfWeek}`, // Unique ID for each occurrence
                  startTime: recurringDate.toISOString(),
                  isRecurringInstance: true,
                  originalEventId: entry.id,
                  occurrenceNumber: occurrenceCount + 1
                })
              }
              
              occurrenceCount++
            }
            weekOffset++
          }
        } else {
          // Regular repeating (daily, monthly, yearly, or weekly without specific days)
          for (let i = 0; i < occurrences; i++) {
            let recurringDate: Dayjs
            
            switch (repeatType) {
              case 'daily':
                recurringDate = startDate.add(i, 'day')
                break
              case 'weekly':
                recurringDate = startDate.add(i, 'week')
                break
              case 'monthly':
                recurringDate = startDate.add(i, 'month')
                break
              case 'yearly':
                recurringDate = startDate.add(i, 'year')
                break
              default:
                recurringDate = startDate.add(i, 'week') // Default to weekly
            }
            
            // Check if this occurrence is within the end date (if specified)
            if (entry.endDate && recurringDate.isAfter(dayjs(entry.endDate), 'day')) {
              break
            }
            
            if (recurringDate.format('YYYY-MM-DD') === dateStr) {
              eventsForDate.push({
                ...entry,
                id: `${entry.id}-${i}`, // Unique ID for each occurrence
                startTime: recurringDate.toISOString(),
                isRecurringInstance: true,
                originalEventId: entry.id,
                occurrenceNumber: i + 1
              })
            }
          }
        }
      } else {
        // Non-repeating event - check exact date match
        if (eventDate === dateStr) {
          eventsForDate.push(entry)
        }
      }
    })
    
    return eventsForDate
  }, [entries])

  const isToday = (date: Dayjs) => {
    return date.isSame(dayjs(), 'day')
  }

  const isCurrentMonth = (date: Dayjs) => {
    return date.isSame(currentDate, 'month')
  }

  const handleDayClick = (date: Dayjs) => {
    setSelectedDate(date)
    setIsModalVisible(true)
  }

  const handleEventClick = (event: any) => {
    // Close day modal first
    setIsModalVisible(false)
    setSelectedDate(null)
    // Then open event detail
    showEventDetail(event)
  }

  const handleAddEvent = () => {
    if (addEvent && selectedDate) {
      addEvent({
        startDate: selectedDate,
        startTime: selectedDate.hour(9).minute(0) // Default to 9:00 AM
      })
      setIsModalVisible(false)
      setSelectedDate(null)
    }
  }

  const handleModalClose = () => {
    setIsModalVisible(false)
    setSelectedDate(null)
  }

  const getSelectedDateEvents = () => {
    if (!selectedDate) return []
    return getEventsForDate(selectedDate)
  }

  const days = getDaysInMonth(currentDate)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={style.container}>
      <div className={style.calendar}>
        {/* Header */}
        <div className={style.header}>
          {weekDays.map((day) => (
            <div key={day} className={style.dayHeader}>
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className={style.grid}>
          {days.map((date, index) => {
            const events = getEventsForDate(date)
            const isCurrentDay = isToday(date)
            const isCurrentMonthDay = isCurrentMonth(date)
            
            return (
              <div 
                key={index} 
                className={`${style.dayCell} ${isCurrentDay ? style.today : ''} ${!isCurrentMonthDay ? style.otherMonth : ''}`}
                onClick={() => handleDayClick(date)}
              >
                <div className={style.dayNumber}>
                  {date.date()}
                </div>
                {events.length > 0 && (
                  <div className={style.events}>
                    {events.slice(0, 4).map((event: any, eventIndex: number) => (
                      <div 
                        key={event.id || eventIndex} 
                        className={style.event}
                        onClick={(e) => {
                          e.stopPropagation() // Prevent day click
                          handleEventClick(event)
                        }}
                        style={{ 
                          color: event.event_types?.color || '#fff' 
                        }}
                      >
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {event.name}
                        </span>
                        {event.isRecurringInstance && (
                          <RefreshCircleIcon style={{ width: '6px', height: '6px', marginLeft: '2px', opacity: 0.7, flexShrink: 0 }} />
                        )}
                      </div>
                    ))}
                    {events.length > 4 && (
                      <div className={style.moreEvents}>
                        +{events.length - 4} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Day Events Modal */}
      <Modal
        title={`Events for ${selectedDate?.format('MMMM D, YYYY')}`}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={700}
        styles={{
          body: { 
            backgroundColor: '#032A3F', 
            color: 'white',
            padding: '24px',
            maxHeight: '70vh',
            overflowY: 'auto'
          },
          header: { 
            backgroundColor: '#1d75d0', 
            color: 'white',
            borderBottom: '1px solid #969696',
            padding: '16px 24px'
          },
          mask: { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
        }}
        className={style.modal}
      >
        <List
          dataSource={getSelectedDateEvents()}
          renderItem={(event: any) => (
            <List.Item
              className={style.eventItem}
              onClick={() => {
                showEventDetail(event)
                handleModalClose()
              }}
            >
              <div className={style.eventContent}>
                <Text strong style={{ color: 'white' }}>
                  {event.name}
                </Text>
                <div className={style.eventMeta}>
                  <Tag 
                    color={event.event_types?.color || '#1890ff'}
                    style={{ marginRight: 8 }}
                  >
                    {event.event_types?.name || 'Event'}
                  </Tag>
                  {event.isRecurringInstance && (
                    <Tag color="blue" style={{ marginRight: 8 }}>
                      Recurring #{event.occurrenceNumber}
                    </Tag>
                  )}
                  {event.startTime && (
                    <Text type="secondary" style={{ color: '#ccc' }}>
                      {dayjs(event.startTime).format('h:mm A')}
                      {event.endTime && ` - ${dayjs(event.endTime).format('h:mm A')}`}
                    </Text>
                  )}
                </div>
                {event.description && (
                  <Text type="secondary" style={{ color: '#ccc', display: 'block', marginTop: 4 }}>
                    {event.description}
                  </Text>
                )}
              </div>
            </List.Item>
          )}
          locale={{ emptyText: 'No events for this day' }}
        />
        {addEvent && (
          <div className={style.addButtonContainer}>
            <Button 
              type="primary" 
              onClick={handleAddEvent}
              className={style.addButton}
            >
              Add Event
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default CalendarView