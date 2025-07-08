'use client'

import { Button, Col, DatePicker, Drawer, Flex, Form, Input, Row, Select, Switch, TimePicker, Typography } from 'antd'
import { memo, useEffect, useState } from 'react'
import CloseIcon from '@/components/icon/close.svg'
import style from './style.module.scss'
import api from '@/services/api'
import { locations } from '@/utils/constants'
import { stringify } from 'querystring'
import { useRouter, useSearchParams } from 'next/navigation'
import convertSearchParams, { formatPayload } from '@/utils/app'
import dayjs from 'dayjs'

function Filter({ isOpen, showOpen, onFilter } : any) {
  const [loading, setLoading] = useState(false)
  const [eventTypes, setEventTypes] = useState([])
  const [form] = Form.useForm()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    getEventTypes()
  }, [])

  async function getEventTypes() {
    setLoading(true)
    const res = await api.get('/api/eventTypes')
    if (res?.data?.data.length > 0) {
      const types = res?.data?.data.map((item: any) => ({label: item.name, value: item.id}))
      setEventTypes(types)
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
        <Form.Item label="Start Date" name="startDate" style={{ marginBottom: 12 }}>
          <DatePicker placeholder="Select Start Date" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="End Date" name="endDate">
          <DatePicker placeholder="Select End Date" style={{ width: '100%' }} />
        </Form.Item>

        <div className={style.subtitle}>Budget</div>
        <Form.Item label="Range" name="range" style={{ marginBottom: 12 }}>
          <Select placeholder="Select Budget Range">
            <Select.Option value="lt">Less than</Select.Option>
            <Select.Option value="gt">Greater than</Select.Option>
            <Select.Option value="eq">Equal to</Select.Option>
            <Select.Option value="rg">Range</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Value" name="value">
          <Input type="number" placeholder="Add Budget Value" />
        </Form.Item>

        <div className={style.subtitle}>Event Type</div>
        <Form.Item label="Type" name="eventTypeIds">
          <Select placeholder="Select Event Type" mode="multiple" allowClear>
            {eventTypes.map((item: any) => (<Select.Option value={item.value}>{item.label}</Select.Option>))}
          </Select>
        </Form.Item>

        <div className={style.subtitle}>Location</div>
        <Form.Item label="Address" name="location" style={{ marginBottom: 12 }}>
          <Select placeholder="Select Event Address">
            {locations.map((item: any) => (<Select.Option value={item.value}>{item.label}</Select.Option>))}
          </Select>
        </Form.Item>
         <Form.Item shouldUpdate={(prev, curr) => prev.location !== curr.location}>
            {({ getFieldValue }) => {
              const location = getFieldValue('location')
              return location ? (
                <Form.Item label="Away Address" name="venue">
                  <Input />
                </Form.Item>
              ) : null
            }}
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