import { memo, useState, useEffect, ReactNode, useCallback } from 'react'
import style from './style.module.scss'
import { Flex } from 'antd'
import PlusIcon from '@/components/icon/plus2.svg'
import PointIcon from '@/components/icon/point.svg'
import CircleIcon from '@/components/icon/circle.svg'
import TickIcon from '@/components/icon/circle-tick.svg'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import api from '@/services/api'

type ColumnType = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVE'

const Kanban = ({ dataSource, addTask, showEventDetail }: any) => {
  const [columns, setColumns] = useState<Record<ColumnType, Array<any>>>({
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
    ARCHIVE: []
  })
  const [draggingId, setDraggingId] = useState<string | number | null>(null)
  const [overColumn, setOverColumn] = useState<ColumnType | null>(null)

  // Default function for showEventDetail if not provided
  const handleTaskClick = (task: any) => {
    if (showEventDetail && typeof showEventDetail === 'function') {
      showEventDetail(task)
    } else {
      console.log('Task clicked:', task)
      // You could add default behavior here, like opening a modal
    }
  }

  // Helper function to get task identifier
  const getTaskIdentifier = (task: any): string | number | null => {
    if (!task) return null
    
    // Try different possible identifier fields
    const identifier = task.userId || task.id || task.taskId || task._id
    console.log('Task identifier lookup:', { task, identifier, keys: Object.keys(task || {}) })
    return identifier
  }

  useEffect(() => {
    if (!dataSource) return

    console.log('Kanban dataSource:', dataSource)
    
    // Log the first task to see its structure
    if (dataSource.todos && dataSource.todos.length > 0) {
      console.log('Sample task structure:', dataSource.todos[0])
      console.log('Sample task keys:', Object.keys(dataSource.todos[0] || {}))
      console.log('Sample task userId:', dataSource.todos[0]?.userId)
      console.log('Sample task id:', dataSource.todos[0]?.id)
      console.log('Sample task taskId:', dataSource.todos[0]?.taskId)
    }

    setColumns({
      TODO: dataSource.todos || [],
      IN_PROGRESS: dataSource.inprogresses || [],
      DONE: dataSource.dones || [],
      ARCHIVE: dataSource.archives || []
    })
  }, [dataSource])

  useEffect(() => {
    const cleanups: (() => void)[] = []

    Object.entries(columns).forEach(([columnKey, tasks]) => {
      const colElement = document.getElementById(`col-${columnKey}`)
      if (!colElement) return

      // Drop target: whole column
      cleanups.push(
        dropTargetForElements({
          element: colElement,
          getData: () => ({ columnId: columnKey as ColumnType }),
          onDragEnter: () => setOverColumn(columnKey as ColumnType),
          onDragLeave: () => setOverColumn(null),
          onDrop: ({ source }) => {
            const task = source?.data?.task
            const taskId = getTaskIdentifier(task)
            if (!task || !taskId) {
              console.error('Invalid task data:', task)
              return
            }
            moveTaskToColumn(task, columnKey as ColumnType)
            setOverColumn(null)
          }
        })
      )

      // Draggables: tasks
      tasks.forEach((task) => {
        const taskId = getTaskIdentifier(task)
        if (!task || !taskId) {
          console.error('Task missing identifier:', task)
          return
        }
        
        const taskEl = document.getElementById(`task-${taskId}`)
        if (!taskEl) {
          console.error(`Task element not found for identifier: ${taskId}`)
          return
        }

        cleanups.push(
          draggable({
            element: taskEl,
            getInitialData: () => ({ task, fromColumn: columnKey }),
            onDragStart: () => setDraggingId(taskId),
            onDrop: () => setDraggingId(null)
          })
        )
      })
    })

    return () => {
      cleanups.forEach((fn) => fn())
    }
  }, [columns])


  const moveTaskToColumn = async (task: any, targetColumn: ColumnType) => {
    const taskId = getTaskIdentifier(task)
    if (!task || !taskId) {
      console.error('Invalid task object or missing identifier:', task)
      return
    }
    
    console.log(`Moving task ${taskId} to column ${targetColumn}`)
    
    setColumns(prev => {
      const sourceColumnKey = Object.keys(prev).find(col => prev[col as ColumnType].some(t => getTaskIdentifier(t) === taskId)
      ) as ColumnType

      if (!sourceColumnKey) return prev
      if (sourceColumnKey === targetColumn) return prev

      const sourceTasks = [...prev[sourceColumnKey]]
      const targetTasks = [...prev[targetColumn]]
      const idx = sourceTasks.findIndex(t => getTaskIdentifier(t) === taskId)
      if (idx === -1) return prev

      const [moved] = sourceTasks.splice(idx, 1)
      // Update the task status locally
      moved.status = targetColumn
      targetTasks.push(moved)

      return {
        ...prev,
        [sourceColumnKey]: sourceTasks,
        [targetColumn]: targetTasks
      }
    })

    // Make API call to update the task status
    try {
      const payload = {
        status: targetColumn
      }

      console.log(`Sending PATCH request to /api/tasks/${taskId} with payload:`, payload)

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API error response: ${errorText}`)
        throw new Error(`Failed to update task status: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log(`Task ${taskId} moved to ${targetColumn} successfully:`, result)
    } catch (err) {
      console.error('Update status failed:', err)
      // Revert the local state change if API call fails
      // You could add a toast notification here to show the error
    }
  }

  // --- Render column ---
  const renderColumn = (title: string, icon: ReactNode, key: ColumnType) => {
    const isOver = overColumn === key
    return (
      <div
        id={`col-${key}`}
        className={classNames(style.list, { [style.over]: isOver })}
      >
        <Flex justify="space-between" align='center' className={style.heading}>
          <Flex align='center'>
            {icon}
            <div style={{ fontSize: 20, fontWeight: 600 }}>
              {title} <span style={{ fontSize: 16, fontWeight: 'normal' }}>({columns[key].length})</span>
            </div>
          </Flex>
          <PlusIcon className={style.btnAdd} onClick={() => addTask({ status: key })} />
        </Flex>

        {columns[key].map((task) => {
          const taskId = getTaskIdentifier(task)
          if (!taskId) {
            console.error('Task missing identifier:', task)
            return null
          }
          
          return (
            <div
              id={`task-${taskId}`}
              key={taskId}
              className={classNames(style.card, {
                [style.dragging]: draggingId === taskId
              })}
              onClick={() => handleTaskClick(task)}
            >
              <div className={style.header}>
                <div>{task.name || 'Untitled Task'}</div>
                <span className={classNames(style.priority, style[task.task_priorities?.name?.toLowerCase() || 'medium'])}>
                  {task.task_priorities?.name || 'No Priority'}
                </span>
              </div>
              <div className={style.content}>{task.description || 'No description'}</div>
              <div className={style.footer}>
                <div>{task.users?.username ? `👤 ${task.users.username}` : 'Unassigned'}</div>
                <div className={style.duedate}>
                  {task.dueDate ? dayjs(task.dueDate).format('MM/DD/YY') : 'No due date'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Flex gap={12} className={style.container}>
      {renderColumn('To Do', <PointIcon style={{ marginRight: 12 }} />, 'TODO')}
      {renderColumn('In Progress', <CircleIcon style={{ marginRight: 12 }} />, 'IN_PROGRESS')}
      {renderColumn('Complete', <TickIcon style={{ marginRight: 12 }} />, 'DONE')}
      {renderColumn('Archive', <TickIcon style={{ marginRight: 12 }} />, 'ARCHIVE')}
    </Flex>
  )
}

export default memo(Kanban)