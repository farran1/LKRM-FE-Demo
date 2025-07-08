'use client'

import { Button, DatePicker, Drawer, Flex, Form, Input, Select } from 'antd'
import { memo, useEffect, useMemo, useState } from 'react'
import CloseIcon from '@/components/icon/close.svg'
import style from './style.module.scss'
import api from '@/services/api'
import TagSelector from '@/components/tag-selector'
import dayjs from 'dayjs'

const STATUS = [
  { label: 'To do', value: 'TODO' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Done', value: 'DONE' }
]

function EditTask({ task, isOpen, showOpen, onRefresh } : any) {
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
    
    setLoading(true)
    try {
      const res = await api.put('/api/tasks/' + task.id, payload)
      onClose()
      onRefresh()
    } catch (error) {
    }
    setLoading(false)
  }

  function reset() {
    form.resetFields()
  }

  useEffect(() => {
    if (!task || !form) return 

    const dueDate = dayjs(task.dueDate)
    const playerIds = task.playerTasks && task.playerTasks.length > 0 ? task.playerTasks.map((item: any) => item.playerId) : []
    form.setFieldsValue({
      ...task,
      dueDate,
      playerIds
    })
  }, [task, form])

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
        <div className={style.title} >Edit Task 1</div>
        <CloseIcon onClick={onClose} />
      </Flex>
      <Form layout="vertical" onFinish={onSubmit} form={form}>
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
        <Form.Item label="Status" name="status" rules={[{ required: true, message: 'Please select status' }]}>
          <Select options={STATUS} />
        </Form.Item>

        <Button type="primary" htmlType="submit"  block style={{ marginTop: 24 }} loading={loading}>
          Save
        </Button>
      </Form>
    </Drawer>
  )
}

export default memo(EditTask)