'use client'

import { App, Button, Drawer, Flex, Form, Input, Select } from 'antd'
import { memo, useEffect, useState } from 'react'
import style from './style.module.scss'
import CloseIcon from '@/components/icon/close.svg'
import api from '@/services/api'
import { PlusOutlined } from '@ant-design/icons'

function NewVolunteer({ eventId, isOpen, showOpen, onRefresh } : any) {
  const [loading, setLoading] = useState(false)
  const [positions, setPositions] = useState([])
  const { message } = App.useApp()

  useEffect(() => {
    getPositions()
  }, [])

  async function getPositions() {
    const res = await api.get('/api/positions')
    if (res?.data?.data.length > 0) {
      const types = res?.data?.data.map((item: any) => ({label: item.name, value: item.id}))
      setPositions(types)
    }
  }

  const onClose = () => {
    showOpen(false)
  }

  const onSubmit = async (payload: any) => {
    setLoading(true)
    try {
      const res = await api.post('/api/volunteers', {
        ...payload,
        eventId
      })
      showOpen(false)
      onRefresh()
      message.success('Volunteer added successfully')
    } catch (error) {
      message.error('Failed to add volunteer')
    }
    setLoading(false)
  }

  return (
    <Drawer
        destroyOnHidden
        className={style.drawer}
        width={548}
        onClose={onClose}
        open={isOpen}
        styles={{
          body: {
            paddingBottom: 80,
          },
        }}
      >
        <Flex className={style.header} justify="space-between" align='flex-end' style={{ marginBottom: 24 }}>
          <div className={style.title} >New Volunteer</div>
          <CloseIcon onClick={onClose} />
        </Flex>
        <Form layout="vertical" onFinish={onSubmit}>
          <Form.Item name="name" rules={[{ required: true, max: 255 }]} label="Name">
            <Input placeholder="Enter Name" />
          </Form.Item>
          <Form.Item name="positionId" rules={[{ required: true }]} label="Position">
            <Select>
              {positions.map((item: any) => <Select.Option key={item.value} value={item.value}>{item.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="phoneNumber" rules={[{ required: true }]} label="Phone Number">
            <Input placeholder="Enter Phone Number" />
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true, type: 'email' }]} label="Email">
            <Input placeholder="Enter Email" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block style={{ marginTop: 24 }} loading={loading}>
            Save
          </Button>
        </Form>
    </Drawer>
  )
}

export default memo(NewVolunteer)
