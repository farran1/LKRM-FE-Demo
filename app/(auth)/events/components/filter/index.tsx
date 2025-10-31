'use client'

import { Button, Col, DatePicker, Drawer, Flex, Form, Input, Row, Select, Switch, TimePicker, Typography } from 'antd'
import { memo, useEffect, useState } from 'react'
import CloseIcon from '@/components/icon/close.svg'
import style from './style.module.scss'
import api from '@/services/api'
import { stringify } from 'querystring'
import { useRouter, useSearchParams } from 'next/navigation'
import convertSearchParams, { formatPayload } from '@/utils/app'
import dayjs from 'dayjs'
import { safeMapData } from '@/utils/api-helpers'

function Filter({ isOpen, showOpen, onFilter } : any) {
  const [loading, setLoading] = useState(false)
  const [eventTypes, setEventTypes] = useState<Array<{ label: string; value: number }>>([])
  const [form] = Form.useForm()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    getEventTypes()
  }, [])

  async function getEventTypes() {
    setLoading(true)
    try {
      const res = await api.get('/api/eventTypes')
      const eventTypeOptions = safeMapData(
        res, 
        (item: any) => ({label: item.name, value: item.id}), 
        []
      )
      // Sort so "Other" appears at the end
      eventTypeOptions.sort((a, b) => {
        if (a.label.toLowerCase() === 'other') return 1
        if (b.label.toLowerCase() === 'other') return -1
        return a.label.localeCompare(b.label)
      })
      setEventTypes(eventTypeOptions)
    } catch (error) {
      console.error('Error fetching event types:', error)
      setEventTypes([])
    }
    setLoading(false)
  }

  const onClose = () => {
    showOpen(false)
  }

  const onSubmit = async (payload: any) => {
    if (payload.startDate) {
      payload.startDate = payload.startDate.format('YYYY-MM-DD')
    }
    if (payload.endDate) {
      payload.endDate = payload.endDate.format('YYYY-MM-DD')
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
      const startDate = queryParams.startDate ? dayjs(queryParams.startDate) : null
      const endDate = queryParams.endDate ? dayjs(queryParams.endDate) : null
      delete queryParams.startDate
      delete queryParams.endDate
      form.setFieldsValue({
        ...queryParams,
        startDate,
        endDate
      })
    }
  }

  return (
    <Drawer
      destroyOnHidden
      // loading={loading}
      className={style.drawer}
      width={548}
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
        <div className={style.subtitle}>Date Range</div>
        <Form.Item name="startDate" style={{ marginBottom: 12 }}>
          <DatePicker placeholder="Select Start Date" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="endDate">
          <DatePicker placeholder="Select End Date" style={{ width: '100%' }} />
        </Form.Item>



        <div className={style.subtitle}>Event Type</div>
        <Form.Item name="eventTypeIds">
          <Select placeholder="Select Event Type" mode="multiple" allowClear loading={loading}>
            {eventTypes.map((item: any) => (<Select.Option key={item.value} value={item.value}>{item.label}</Select.Option>))}
          </Select>
        </Form.Item>

        <Flex style={{ marginTop: 24, gap: 8 }}>
          <Button onClick={reset} style={{ flex: 1 }}>
            Clear all
          </Button>
          <Button type="primary" htmlType="submit" disabled={loading} style={{ flex: 1 }}>
            Apply
          </Button>
        </Flex>
      </Form>
    </Drawer>
  )
}

export default memo(Filter)