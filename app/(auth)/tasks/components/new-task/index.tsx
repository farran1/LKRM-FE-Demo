'use client'

import { Button, DatePicker, Drawer, Flex, Form, Input, Select, App } from 'antd'
import { memo, useEffect, useMemo, useState } from 'react'
import CloseIcon from '@/components/icon/close.svg'
import style from './style.module.scss'
import api from '@/services/api'
import TagSelector from '@/components/tag-selector'
import { safeMapData } from '@/utils/api-helpers'
import dayjs from 'dayjs'
import { supabase } from '@/lib/supabase'

const locations = [{label: 'Home', value: 'HOME'}, {label: 'Away', value: 'AWAY'}]

function NewTask({ isOpen, showOpen, onRefresh, defaultValues } : any) {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [coaches, setCoaches] = useState<Array<{label: string, value: string}>>([])
  const [priorities, setPriorities] = useState<Array<{label: string, value: number}>>([])
  const [events, setEvents] = useState<Array<{label: string, value: number}>>([])
  
  // Create form instance - proper way to avoid the warning
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

  // Reset form when drawer closes
  useEffect(() => {
    if (!isOpen && form) {
      form.resetFields()
    }
  }, [isOpen, form])

  async function getCoaches() {
    setLoading(true)
    try {
      console.log('🔄 Fetching all users from /api/users...')
      
      // Fetch all users from the API endpoint
      const response = await api.get('/api/users')
      const raw: unknown = (response as any)?.data ?? response
      // Handle both { data: [...] } and direct array responses
      const users = Array.isArray(raw) ? raw : (raw as any)?.data || []
      
      console.log('🔄 Fetched users:', users)

      if (!Array.isArray(users) || users.length === 0) {
        console.log('🔄 No users found or invalid response format')
        setCoaches([])
        return
      }

      // Process the users data
      // The /api/users endpoint returns users with first_name, last_name, full_name, email directly
      const processedUsers = users.map((user: any) => {
        // Extract name from direct fields (from users table) or user_metadata (legacy)
        const firstName = user.first_name || user.user_metadata?.first_name || ''
        const lastName = user.last_name || user.user_metadata?.last_name || ''
        const fullName = user.full_name || user.user_metadata?.full_name || ''
        
        // Create display name
        let displayName = ''
        if (fullName) {
          displayName = fullName
        } else if (firstName && lastName) {
          displayName = `${firstName} ${lastName}`.trim()
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

      console.log('🔄 Final processed users:', processedUsers)
      setCoaches(processedUsers)
    } catch (error) {
      console.error('🔄 Error in getCoaches:', error)
      setCoaches([])
    }
    setLoading(false)
  }

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

  const onClose = () => {
    reset()
    showOpen(false)
  }

  const onSubmit = async (payload: any) => {
    if (payload.dueDate) {
      payload.dueDate = payload.dueDate.format('YYYY-MM-DD')
    }

    payload.status = defaultValues?.status || 'TODO'
    
    // Include eventId from defaultValues if provided
    if (defaultValues?.eventId) {
      payload.eventId = defaultValues.eventId
    }
    
    // Convert assignee ID to email for backend
    if (payload.assigneeId) {
      // The assigneeId is now already an email from the coaches API
      // No conversion needed
    }
    
    // Map assigneeId to createdBy for now (since we're not handling separate assignee yet)
    if (payload.assigneeId) {
      payload.createdBy = payload.assigneeId
      payload.updatedBy = payload.assigneeId
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
      console.log('Submitting task payload:', JSON.stringify(payload, null, 2))
      const res = await api.post('/api/tasks', payload)
      console.log('Task creation response:', JSON.stringify(res, null, 2))
      
      // Check if the response indicates success
      console.log('Response status:', res?.status)
      console.log('Response data:', res?.data)
      console.log('Response error:', (res as any)?.error)
      
      if (res?.status >= 400 || (res?.data as any)?.success === false || (res as any)?.error) {
        const errorMessage = (res as any)?.error || (res?.data as any)?.message || 'Failed to create task'
        console.error('API returned error:', errorMessage)
        message.error(errorMessage)
      } else {
        // Show success message
        message.success('Task created successfully!')
      }
      
      // Always close drawer and refresh, regardless of success/failure
      onClose()
      
      // Call refresh function to update the tasks list
      if (onRefresh && typeof onRefresh === 'function') {
        console.log('Calling onRefresh to update tasks list')
        onRefresh()
      }
    } catch (error) {
      console.error('Error creating task:', error)
      message.error('Failed to create task. Please try again.')
    }
    setLoading(false)
  }

  function reset() {
    form.resetFields()
  }

  const initValues = useMemo(() => {
    if (!defaultValues) return {}
    return {
      ...defaultValues,
    }
  }, [defaultValues])

  return (
    <Drawer
      destroyOnHidden
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
        <div className={style.title} >New Task</div>
        <CloseIcon onClick={onClose} />
      </Flex>
      {isOpen && (
        <Form 
          layout="vertical" 
          onFinish={onSubmit} 
          form={form} 
          initialValues={initValues}
        >
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

        <Button type="primary" htmlType="submit" block style={{ marginTop: 24 }} loading={loading}>
          Create New Task
        </Button>
      </Form>
      )}
    </Drawer>
  )
}

export default memo(NewTask)
