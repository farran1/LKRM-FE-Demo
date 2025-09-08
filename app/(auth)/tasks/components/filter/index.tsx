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

const locations = [{label: 'Home', value: 'HOME'}, {label: 'Away', value: 'AWAY'}]

function Filter({ isOpen, showOpen } : any) {
  const [loading, setLoading] = useState(false)
  const [players, setPlayers] = useState<Array<{ label: string; value: number }>>([])
  const [priorities, setPriorities] = useState<Array<{ label: string; value: number }>>([])
  const [events, setEvents] = useState<Array<{ label: string; value: number }>>([])
  const [form] = Form.useForm()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    getPlayers()
    getPriorities()
    getEvents()
  }, [])

  async function getPlayers() {
    setLoading(true)
    try {
      const res = await api.get('/api/players')
      const playerOptions = safeMapData(
        res, 
        (item: any) => ({label: item.name, value: item.id}), 
        []
      )
      setPlayers(playerOptions)
    } catch (error) {
      console.error('Error fetching players:', error)
      setPlayers([])
    }
    setLoading(false)
  }

  async function getPriorities() {
    setLoading(true)
    try {
      const res = await api.get('/api/priorities')
      const priorityOptions = safeMapData(
        res, 
        (item: any) => ({label: item.name, value: item.id}), 
        []
      )
      setPriorities(priorityOptions)
    } catch (error) {
      console.error('Error fetching priorities:', error)
      setPriorities([])
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
          label: `${item.name} - ${dayjs(item.date).format('MMM D, YYYY')}`, 
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
    showOpen(false)
  }

  const onSubmit = async (payload: any) => {
    if (payload.dueDate) {
      payload.dueDate = payload.dueDate.format('YYYY-MM-DD')
    }
    
    const queryParams = convertSearchParams(searchParams)
    payload.viewMode = queryParams.viewMode || 'list'
    payload.sortBy = queryParams.sortBy
    payload.sortDirection = queryParams.sortDirection
    payload.name = queryParams.name

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
        const dueDate = queryParams.dueDate ? dayjs(queryParams.dueDate) : null
        delete queryParams.dueDate
        form.setFieldsValue({
          ...queryParams,
          dueDate
        })
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
        <Form.Item label="Assignee" name="playerIds">
          <Select mode="multiple" allowClear showSearch options={players} optionFilterProp="label" loading={loading}/>
        </Form.Item>
        <Form.Item label="Event" name="eventId">
          <Select placeholder="Select Event" allowClear showSearch options={events} optionFilterProp="label" loading={loading}/>
        </Form.Item>
        <Form.Item label="Due Date" name="dueDate">
          <DatePicker placeholder="Select Due Date" style={{ width: '100%' }} />
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