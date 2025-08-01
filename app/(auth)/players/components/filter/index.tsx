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
  const [positions, setPositions] = useState([])
  const [form] = Form.useForm()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    getPositions()
  }, [])

  async function getPositions() {
    setLoading(true)
    const res = await api.get('/api/positions')
    if (res?.data?.data.length > 0) {
      const types = res?.data?.data.map((item: any) => ({label: item.name, value: item.id}))
      setPositions(types)
    }
    setLoading(false)
  }

  const onClose = () => {
    showOpen(false)
  }

  const onSubmit = async (payload: any) => {
    const queryParams = convertSearchParams(searchParams)
    payload.sortBy = queryParams.sortBy
    payload.sortDirection = queryParams.sortDirection

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
        <Form.Item label="Position" name="positionIds">
          <Select placeholder="Select Event Type" mode="multiple" allowClear>
            {positions.map((item: any) => (<Select.Option value={item.value}>{item.label}</Select.Option>))}
          </Select>
        </Form.Item>
        <Form.Item label="Jersey #" name="jersey">
          <Input placeholder="Enter Jersey #" />
        </Form.Item>
        <div className={style.subtitle}>Height</div>
        <Flex align='center'>
          <Form.Item name="fromHeight" style={{ marginBottom: 0 }}>
            <Input type="number" placeholder="Min Height" />
          </Form.Item>
          <span style={{ fontSize: 18, marginInline: 8 }}>-</span>
          <Form.Item name="toHeight" style={{ marginBottom: 0 }}>
            <Input type="number" placeholder="Max Height" />
          </Form.Item>
          <span style={{ fontSize: 18, marginLeft: 8 }}>inch</span>
        </Flex>

        <Flex style={{ marginTop: 52, gap: 8 }}>
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