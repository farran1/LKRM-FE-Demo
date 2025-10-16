'use client'

import { Button, DatePicker, Drawer, Flex, Form, Input, Select, App } from 'antd'
import { memo, useEffect, useState } from 'react'
import CloseIcon from '@/components/icon/close.svg'
import style from './style.module.scss'
import api from '@/services/api'
import TagSelector from '@/components/tag-selector'
import dayjs from 'dayjs'
import { safeMapData, extractArrayFromApiResponse } from '@/utils/api-helpers'
import { supabase } from '@/lib/supabase'

const STATUS = [
  { label: 'To do', value: 'TODO' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Done', value: 'DONE' },
  { label: 'Archive', value: 'ARCHIVE' }
]

function EditTask({ task, isOpen, showOpen, onRefresh } : any) {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  
  // Debug: Log task data when component receives it
  useEffect(() => {
    if (task) {
      console.log('EditTask received task data:', JSON.stringify(task, null, 2))
    }
  }, [task])
  const [coaches, setCoaches] = useState<Array<{label: string, value: string}>>([])
  const [priorities, setPriorities] = useState<Array<{label: string, value: number}>>([])
  const [events, setEvents] = useState<Array<{label: string, value: number}>>([])
  
  // Create form instance with proper initialization
  const [form] = Form.useForm()

  useEffect(() => {
    if (isOpen) {
      getCoaches()
      getPriorities()
      getEvents()
      // Reset form when opening
      if (form) {
        form.resetFields()
      }
    }
  }, [isOpen, form])

  // Reset form when component unmounts or drawer closes
  useEffect(() => {
    return () => {
      if (form) {
        form.resetFields()
      }
    }
  }, [form])



  async function getPriorities() {
    setLoading(true)
    try {
      console.log('Fetching priorities...')
      const res = await api.get('/api/priorities')
      console.log('Priorities response:', JSON.stringify(res, null, 2))
      
      // Use utility function for safe data mapping
      const priorityOptions = safeMapData(
        res, 
        (item: any) => ({label: item.name, value: item.id}), 
        []
      )
      
      console.log('Mapped priority options:', JSON.stringify(priorityOptions, null, 2))
      
      // Log each priority individually to see the structure
      priorityOptions.forEach((priority, index) => {
        console.log(`Priority ${index}:`, JSON.stringify(priority, null, 2))
      })
      
      // Ensure default priorities exist even if backend fails
      const defaults = [
        { name: 'High', weight: 1, color: '#ff4d4f' },
        { name: 'Medium', weight: 2, color: '#faad14' },
        { name: 'Low', weight: 3, color: '#52c41a' },
      ]
      
      if (priorityOptions.length === 0) {
        // Use synthetic priorities if backend is empty
        setPriorities(defaults.map((d, idx) => ({ label: d.name, value: -(idx + 1) })))
        console.log('Using synthetic priorities:', defaults.map((d, idx) => ({ label: d.name, value: -(idx + 1) })))
      } else {
        setPriorities(priorityOptions)
        console.log('Using backend priorities:', priorityOptions)
      }
    } catch (error) {
      console.error('Error fetching priorities:', error)
      // No fallback priorities - let user know priorities are unavailable
      setPriorities([])
      console.log('No priorities available')
    }
    setLoading(false)
  }

  async function getEvents() {
    setLoading(true)
    try {
      const res = await api.get('/api/events')
      const eventOptions = safeMapData(
        res,
        (item: any) => ({
          label: `${item.name}${item.startTime ? ` - ${dayjs(item.startTime).format('MMM D, YYYY')}` : ''}`,
          value: item.id
        }),
        []
      )
      setEvents(eventOptions)
    } catch (error) {
      console.error('Error fetching events:', error)
      setEvents([])
    }
    setLoading(false)
  }

  async function getCoaches() {
    setLoading(true)
    try {
      console.log('🔄 Fetching all users from /api/users...')
      
      // Fetch all users from the API endpoint
      const response = await api.get('/api/users')
      const raw: unknown = (response as any)?.data ?? response
      const users = extractArrayFromApiResponse(raw)
      
      console.log('🔄 Fetched users:', users)

      if (!Array.isArray(users) || users.length === 0) {
        console.log('🔄 No users found or invalid response format')
        setCoaches([])
        return
      }

      // Process the users data
      const processedUsers = users.map((user: any) => {
        // Extract name from user_metadata
        const firstName = user.user_metadata?.first_name || ''
        const lastName = user.user_metadata?.last_name || ''
        const fullName = user.user_metadata?.full_name || ''
        
        // Create display name
        let displayName = ''
        if (fullName) {
          displayName = fullName
        } else if (firstName && lastName) {
          displayName = `${firstName} ${lastName}`
        } else if (firstName) {
          displayName = firstName
        } else {
          displayName = user.email?.split('@')[0] || 'Unknown User'
        }
        
        return {
          label: displayName,
          value: user.email || user.id // Use email as value for consistency
        }
      })

      // Sort users alphabetically by display name
      processedUsers.sort((a: any, b: any) => a.label.localeCompare(b.label))

      console.log('🔄 Final processed users:', processedUsers)
      setCoaches(processedUsers)
    } catch (error) {
      console.error('🔄 Error in getCoaches:', error)
      setCoaches([])
    }
    setLoading(false)
  }

  const onClose = () => {
    reset()
    showOpen(false)
  }

  const onSubmit = async (payload: any) => {
    if (payload.dueDate) {
      payload.dueDate = payload.dueDate.format('YYYY-MM-DD')
    }

    // Convert assignee display name back to email for backend
    if (payload.assigneeId) {
      // The assigneeId is now already an email from the coaches API
      // No conversion needed
    }

    // Validate required fields
    if (!payload.name || !payload.priorityId) {
      message.error('Task name and priority are required')
      return
    }
    
    // Handle synthetic priority IDs (negative values)
    if (typeof payload.priorityId === 'number' && payload.priorityId < 0) {
      const selected = priorities.find(p => p.value === payload.priorityId)
      if (selected) {
        // Try to create the priority on the backend
        try {
          const priorityData = {
            name: selected.label,
            weight: Math.abs(payload.priorityId),
            color: selected.label === 'High' ? '#ff4d4f' : 
                   selected.label === 'Medium' ? '#faad14' : '#52c41a'
          }
          console.log('Creating priority:', JSON.stringify(priorityData, null, 2))
          const createRes = await api.post('/api/priorities', priorityData)
          console.log('Priority creation response:', JSON.stringify(createRes, null, 2))
          const newId = (createRes?.data as any)?.id
          if (newId) {
            payload.priorityId = newId
            console.log('Priority created with ID:', newId)
          } else {
            console.error('Priority creation failed - no ID returned')
          }
        } catch (error) {
          console.error('Failed to create priority:', error)
          // Continue with synthetic ID, backend will handle it
        }
      }
    }
    
    setLoading(true)
    try {
      console.log('Updating task with payload:', JSON.stringify(payload, null, 2))
      
      // Use PATCH method to update the task
      // Use the correct task ID - prefer 'id' if available, fallback to 'userId'
      const taskId = task.id || task.userId
      const response = await api.patch(`/api/tasks/${taskId}`, payload)

      if (response.status !== 200) {
        const errorText = (response as any).data?.error || 'Unknown error'
        console.error('API error response:', errorText)
        throw new Error(`Failed to update task: ${response.status} ${errorText}`)
      }

      const result = response.data
      console.log('Task updated successfully:', JSON.stringify(result, null, 2))
      
      // Show success message
      message.success('Task updated successfully!')
      
      // Always close drawer and refresh, regardless of success/failure
      onClose()
      
      // Call refresh function to update the tasks list
      if (onRefresh && typeof onRefresh === 'function') {
        console.log('Calling onRefresh to update tasks list')
        onRefresh()
      }
    } catch (error) {
      console.error('Error updating task:', error)
      message.error('Failed to update task. Please try again.')
    }
    setLoading(false)
  }

  function reset() {
    if (form) {
      form.resetFields()
    }
  }

  useEffect(() => {
    if (!task || !form || !isOpen) return 

    console.log('Setting form values for task:', task)

    // Handle due date with proper null checks
    let dueDate = null
    if (task.dueDate) {
      try {
        dueDate = dayjs(task.dueDate)
        // Check if the date is valid
        if (!dueDate.isValid()) {
          console.warn('Invalid due date format:', task.dueDate)
          dueDate = null
        } else {
          console.log('Valid due date set:', dueDate.format('YYYY-MM-DD'))
        }
      } catch (error) {
        console.warn('Error parsing due date:', task.dueDate, error)
        dueDate = null
      }
    } else {
      console.log('No due date in task')
    }

    const formValues = {
      name: task.name || '',
      description: task.description || '',
      dueDate,
      priorityId: task.priorityId || null,
      status: task.status || 'TODO',
      eventId: task.eventId || null,
      assigneeId: task.users?.email || task.assigneeId || null // Use email for form compatibility
    }
    
    console.log('Setting form values:', formValues)
    
    // Use setTimeout to ensure form is ready
    setTimeout(() => {
      form.setFieldsValue(formValues)
    }, 100)
  }, [task, form, isOpen])

  return (
    <Drawer
      destroyOnHidden
      // loading={loading}
      className={style.drawer}
      width={460}
      onClose={onClose}
      open={isOpen}
      styles={{
        body: {
          paddingBottom: 80,
        },
      }}
    >
      <Flex className={style.header} justify="space-between" align='flex-end' style={{ marginBottom: 24 }}>
        <div className={style.title} >Edit Task</div>
        <CloseIcon onClick={onClose} />
      </Flex>
      <Form layout="vertical" onFinish={onSubmit} form={form}>
        <Form.Item name="name" rules={[{ required: true, max: 255, message: 'Please enter a task name' }]} label="Task Name">
          <Input placeholder="Enter Task Name" />
        </Form.Item>
        <Form.Item label="Assignee" name="assigneeId">
          <Select 
            allowClear 
            showSearch 
            options={coaches} 
            optionFilterProp="label"
            placeholder="Select coach to assign task to"
            loading={loading}
          />
        </Form.Item>
        <Form.Item label="Event" name="eventId">
          <Select placeholder="Select Event to link task with" allowClear showSearch options={events} optionFilterProp="label" loading={loading}/>
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea placeholder="Add Description Here" rows={5}/>
        </Form.Item>
        <Form.Item label="Due Date" name="dueDate">
          <DatePicker placeholder="Select Due Date" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="priorityId" label="Priority" rules={[{ required: true, message: 'Please select priority' }]}>
          <TagSelector options={priorities} />
        </Form.Item>
        <Form.Item label="Status" name="status" rules={[{ required: true, message: 'Please select status' }]}>
          <Select options={STATUS} />
        </Form.Item>

        <Button type="primary" htmlType="submit" block style={{ marginTop: 24 }} loading={loading}>
          Update Task
        </Button>
      </Form>
    </Drawer>
  )
}

export default memo(EditTask)