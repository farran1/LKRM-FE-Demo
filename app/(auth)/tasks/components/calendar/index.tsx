'use client'

import { useCallback, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { Modal, List, Typography, Tag, Button } from 'antd'
import style from './style.module.scss'
import RefreshCircleIcon from '@/components/icon/refresh-circle.svg'

const { Text } = Typography

const COLOR = {
  High: '#DA2F36',
  Medium: '#FF9800',
  Low: '#1D75D0',
}

const CalendarView = ({dataSource, currentDate, showEventDetail, addTask}: any) => {
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

  const getTasksForDate = useCallback((date: Dayjs) => {
    if (!Array.isArray(entries)) return []
    const dateStr = date.format('YYYY-MM-DD')
    
    const tasksForDate: any[] = []
    
    entries.forEach((entry: any) => {
      if (!entry.dueDate) return
      
      const entryDate = dayjs(entry.dueDate).format('YYYY-MM-DD')
      
      // Check if this is a repeating task (if tasks support repeating)
      if (entry.isRepeat && entry.occurence > 0) {
        // Generate recurring instances for tasks
        const startDate = dayjs(entry.dueDate)
        const occurrences = entry.occurence || 1
        
        // Use the stored repeatType from the database, fallback to smart detection
        let repeatType = entry.repeatType || 'weekly' // Use stored repeatType, default to weekly
        
        // Fallback to smart detection if repeatType is not available
        if (!entry.repeatType) {
          // Special case: If task name contains "daily" or "practice", assume daily
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
          // For tasks with 3-6 occurrences, be more aggressive about daily detection
          else if (occurrences >= 3 && occurrences <= 6) {
            const startDate = dayjs(entry.dueDate)
            const daysSinceStart = dayjs().diff(startDate, 'day')
            
            // If it's a recent task (within 2 weeks) with multiple occurrences, assume daily
            if (daysSinceStart <= 14) {
              repeatType = 'daily'
            } 
            // If it's an older task but has many occurrences relative to time span, assume daily
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
          
          if (recurringDate.format('YYYY-MM-DD') === dateStr) {
            tasksForDate.push({
              ...entry,
              id: `${entry.id}-${i}`, // Unique ID for each occurrence
              dueDate: recurringDate.toISOString(),
              isRecurringInstance: true,
              originalTaskId: entry.id,
              occurrenceNumber: i + 1
            })
          }
        }
      } else {
        // Non-repeating task - check exact date match
        if (entryDate === dateStr) {
          tasksForDate.push(entry)
        }
      }
    })
    
    return tasksForDate
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

  const handleTaskClick = (task: any) => {
    // Close day modal first
    setIsModalVisible(false)
    setSelectedDate(null)
    // Then open task detail
    showEventDetail(task)
  }

  const handleAddTask = () => {
    if (addTask && selectedDate) {
      addTask({
        dueDate: selectedDate
      })
      setIsModalVisible(false)
      setSelectedDate(null)
    }
  }

  const handleModalClose = () => {
    setIsModalVisible(false)
    setSelectedDate(null)
  }

  const getSelectedDateTasks = () => {
    if (!selectedDate) return []
    return getTasksForDate(selectedDate)
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
            const tasks = getTasksForDate(date)
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
                {tasks.length > 0 && (
                  <div className={style.tasks}>
                    {tasks.slice(0, 4).map((task: any, taskIndex: number) => (
                      <div 
                        key={task.id || taskIndex} 
                        className={style.task}
                        onClick={(e) => {
                          e.stopPropagation() // Prevent day click
                          handleTaskClick(task)
                        }}
                        style={{ 
                          color: COLOR[task.task_priorities?.name as keyof typeof COLOR] || '#fff' 
                        }}
                      >
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.name}
                        </span>
                        {task.isRecurringInstance && (
                          <RefreshCircleIcon style={{ width: '6px', height: '6px', marginLeft: '2px', opacity: 0.7, flexShrink: 0 }} />
                        )}
                      </div>
                    ))}
                    {tasks.length > 4 && (
                      <div className={style.moreTasks}>
                        +{tasks.length - 4} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Day Tasks Modal */}
      <Modal
        title={`Tasks for ${selectedDate?.format('MMMM D, YYYY')}`}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={600}
        styles={{
          body: { 
            backgroundColor: '#032A3F', 
            color: 'white',
            padding: '0px',
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
          dataSource={getSelectedDateTasks()}
          renderItem={(task: any) => (
            <List.Item
              className={style.taskItem}
              onClick={() => {
                showEventDetail(task)
                handleModalClose()
              }}
            >
              <div className={style.taskContent}>
                <Text strong style={{ color: 'white' }}>
                  {task.name}
                </Text>
                <div className={style.taskMeta}>
                  <Tag 
                    color={COLOR[task.task_priorities?.name as keyof typeof COLOR] || COLOR.Medium}
                    style={{ marginRight: 8 }}
                  >
                    {task.task_priorities?.name || 'Medium'}
                  </Tag>
                  {task.isRecurringInstance && (
                    <Tag color="blue" style={{ marginRight: 8 }}>
                      Recurring #{task.occurrenceNumber}
                    </Tag>
                  )}
                  {task.description && (
                    <Text type="secondary" style={{ color: '#ccc' }}>
                      {task.description}
                    </Text>
                  )}
                </div>
              </div>
            </List.Item>
          )}
          locale={{ emptyText: 'No tasks for this day' }}
        />
        {addTask && (
          <div className={style.addButtonContainer}>
            <Button 
              type="primary" 
              onClick={handleAddTask}
              className={style.addButton}
            >
              Add Task
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default CalendarView