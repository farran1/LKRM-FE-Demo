'use client'

import { Button, Col, DatePicker, Drawer, Flex, Form, Input, Row, Select, Switch, TimePicker, Typography } from 'antd'
import { memo, useEffect, useState } from 'react'
import CloseIcon from '@/components/icon/close.svg'
import style from './style.module.scss'
import api from '@/services/api'
import { useRouter, useSearchParams } from 'next/navigation'
import TagSelector from '@/components/tag-selector'
import convertSearchParams, { formatPayload } from '@/utils/app'
import { stringify } from 'querystring'
import dayjs from 'dayjs'
import { safeMapData } from '@/utils/api-helpers'

const { RangePicker } = DatePicker

const locations = [{label: 'Home', value: 'HOME'}, {label: 'Away', value: 'AWAY'}]

function Filter({ isOpen, showOpen } : any) {
  const [loading, setLoading] = useState(false)
  const [coaches, setCoaches] = useState<Array<{ label: string; value: string }>>([])
  const [priorities, setPriorities] = useState<Array<{ label: string; value: number }>>([])
  const [events, setEvents] = useState<Array<{ label: string; value: number }>>([])
  const [form] = Form.useForm()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    getCoaches()
    getPriorities()
    getEvents()
  }, [])

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

      if (!users || users.length === 0) {
        console.log('🔄 No users found')
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
      console.log('🔄 Fetching priorities...')
      const res = await api.get('/api/priorities')
      console.log('📡 Priorities API response:', res)
      const priorityOptions = safeMapData(
        res, 
        (item: any) => ({label: item.name, value: item.id}), 
        []
      )
      console.log('✅ Processed priority options:', priorityOptions)
      setPriorities(priorityOptions)
    } catch (error) {
      console.error('❌ Error fetching priorities:', error)
      setPriorities([])
    }
    setLoading(false)
  }

  async function getEvents() {
    setLoading(true)
    try {
      console.log('🔄 Fetching events...')
      const res = await api.get('/api/events')
      console.log('📡 Events API response:', res)
      const eventOptions = safeMapData(
        res, 
        (item: any) => ({
          label: `${item.name} - ${dayjs(item.date).format('MMM D, YYYY')}`, 
          value: item.id
        }), 
        []
      )
      console.log('✅ Processed event options:', eventOptions)
      setEvents(eventOptions)
    } catch (error) {
      console.error('❌ Error fetching events:', error)
      setEvents([])
    }
    setLoading(false)
  }

  const onClose = () => {
    showOpen(false)
  }

  const onSubmit = async (payload: any) => {
    console.log('🔍 Filter payload:', payload)
    
    // Handle date range
    if (payload.dueDateRange && payload.dueDateRange.length === 2) {
      payload.startDate = payload.dueDateRange[0].format('YYYY-MM-DD')
      payload.endDate = payload.dueDateRange[1].format('YYYY-MM-DD')
      delete payload.dueDateRange
    }
    
    // Handle single due date (for backward compatibility)
    if (payload.dueDate) {
      payload.startDate = payload.dueDate.format('YYYY-MM-DD')
      payload.endDate = payload.dueDate.format('YYYY-MM-DD')
      delete payload.dueDate
    }
    
    // Fix field names to match API expectations
    if (payload.coachIds && Array.isArray(payload.coachIds)) {
      // Convert coachIds to assigneeIds for API
      payload.assigneeIds = payload.coachIds
      delete payload.coachIds
    }
    
    const queryParams = convertSearchParams(searchParams)
    payload.viewMode = queryParams.viewMode || 'list'
    payload.sortBy = queryParams.sortBy
    payload.sortDirection = queryParams.sortDirection
    payload.name = queryParams.name

    console.log('📤 Final filter payload:', payload)
    const newQuery = stringify(formatPayload(payload))
    router.push(`?${newQuery}`)
    showOpen(false)
  }

  function reset() {
    form.resetFields()
  }

  const handleAfterOpenChange = (visible: boolean) => {
    if (visible) {
      const queryParams = convertSearchParams(searchParams)
      console.log('🔄 Initializing form with query params:', queryParams)
      
      // Handle date range initialization
      let dueDateRange = null
      if (queryParams.startDate && queryParams.endDate) {
        dueDateRange = [
          dayjs(queryParams.startDate),
          dayjs(queryParams.endDate)
        ]
      } else if (queryParams.dueDate) {
        // Backward compatibility for single date
        dueDateRange = [dayjs(queryParams.dueDate), dayjs(queryParams.dueDate)]
      }
      
      // Convert assigneeIds back to coachIds for form
      let coachIds = null
      if (queryParams.assigneeIds) {
        coachIds = Array.isArray(queryParams.assigneeIds) ? queryParams.assigneeIds : [queryParams.assigneeIds]
      }
      
      const formValues = {
        ...queryParams,
        dueDateRange,
        coachIds,
        // Remove fields that don't belong in the form
        startDate: undefined,
        endDate: undefined,
        dueDate: undefined,
        assigneeIds: undefined,
        viewMode: undefined,
        sortBy: undefined,
        sortDirection: undefined,
        name: undefined
      }
      
      console.log('📝 Setting form values:', formValues)
      form.setFieldsValue(formValues)
    }
  }

  return (
    <Drawer
      destroyOnHidden
      loading={loading}
      className={style.drawer}
      width={460}
      onClose={onClose}
      open={isOpen}
      afterOpenChange={handleAfterOpenChange}
      styles={{
        body: {
          paddingBottom: 80,
        },
      }}
    >
      <Flex className={style.header} justify="space-between" align='flex-end' style={{ marginBottom: 24 }}>
        <div className={style.title} >Filters</div>
        <CloseIcon onClick={onClose} />
      </Flex>
      <Form layout="vertical" onFinish={onSubmit} form={form}>
        <Form.Item label="Assignee" name="coachIds">
          <Select 
            mode="multiple" 
            allowClear 
            showSearch 
            options={coaches} 
            optionFilterProp="label" 
            loading={loading}
            placeholder="Select coaches"
          />
        </Form.Item>
        
        <Form.Item label="Due Date Range" name="dueDateRange">
          <RangePicker 
            placeholder={['Start Date', 'End Date']} 
            style={{ width: '100%', minWidth: '200px' }}
            format="YYYY-MM-DD"
          />
        </Form.Item>
        
        <Form.Item label="Event" name="eventId">
          <Select 
            placeholder="Select Event" 
            allowClear 
            showSearch 
            options={events} 
            optionFilterProp="label" 
            loading={loading}
          />
        </Form.Item>
        
        <Form.Item name="status" label="Progress">
          <Select 
            placeholder="Select Progress" 
            allowClear 
            options={[
              { label: 'To do', value: 'TODO' },
              { label: 'In Progress', value: 'IN_PROGRESS' },
              { label: 'Done', value: 'DONE' },
              { label: 'Archive', value: 'ARCHIVE' }
            ]} 
            loading={loading}
          />
        </Form.Item>
        
        <Form.Item name="priorityId" label="Priority">
          <TagSelector options={priorities} />
        </Form.Item>

        <Flex style={{ marginTop: 24, gap: 8 }}>
          <Button onClick={reset} style={{ flex: 1 }}>
            Clear all
          </Button>
          <Button type="primary" htmlType="submit" loading={loading} style={{ flex: 1 }}>
            Apply
          </Button>
        </Flex>
      </Form>
    </Drawer>
  )
}

export default memo(Filter)