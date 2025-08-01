'use client'

import { Button, DatePicker, Drawer, Flex, Form, Input, Select } from 'antd'
import { memo, useEffect, useMemo, useState } from 'react'
import CloseIcon from '@/components/icon/close.svg'
import style from './style.module.scss'
import api from '@/services/api'
import TagSelector from '@/components/tag-selector'

const locations = [{label: 'Home', value: 'HOME'}, {label: 'Away', value: 'AWAY'}]

function NewTask({ isOpen, showOpen, onRefresh, defaultValues } : any) {
  const [loading, setLoading] = useState(false)
  const [players, setPlayers] = useState([])
  const [priorities, setPriorities] = useState([])
  const [form] = Form.useForm()

  useEffect(() => {
    getPlayers()
    getPriorities()
  }, [])

  async function getPlayers() {
    setLoading(true)
    const res = await api.get('/api/players')
    if (res?.data?.data.length > 0) {
      const types = res?.data?.data.map((item: any) => ({label: item.name, value: item.id}))
      setPlayers(types)
    }
    setLoading(false)
  }

  async function getPriorities() {
    setLoading(true)
    const res = await api.get('/api/priorities')
    if (res?.data?.data.length > 0) {
      const types = res?.data?.data.map((item: any) => ({label: item.name, value: item.id}))
      setPriorities(types)
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
    
    setLoading(true)
    try {
      const res = await api.post('/api/tasks', payload)
      onClose()
      onRefresh()
    } catch (error) {
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
        <div className={style.title} >New Task</div>
        <CloseIcon onClick={onClose} />
      </Flex>
      <Form layout="vertical" onFinish={onSubmit} form={form} initialValues={initValues}>
        <Form.Item name="name" rules={[{ required: true, max: 255 }]} label="Task Name">
          <Input placeholder="Enter Task Name" />
          </Form.Item>
        <Form.Item label="Assignee" name="playerIds">
          <Select mode="multiple" allowClear showSearch options={players} optionFilterProp="label"/>
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

        <Button type="primary" htmlType="submit"  block style={{ marginTop: 24 }} loading={loading}>
          Create New Task
        </Button>
      </Form>
    </Drawer>
  )
}

export default memo(NewTask)
