'use client'

import { App, Avatar, Button, Drawer, Flex, Form, Input, Select } from 'antd'
import { memo, useEffect, useRef, useState } from 'react'
import style from './style.module.scss'
import CloseIcon from '@/components/icon/close.svg'
import api from '@/services/api'
import { PlusOutlined } from '@ant-design/icons'

function NewPlayer({ eventId, isOpen, showOpen, onRefresh } : any) {
  const [loading, setLoading] = useState(false)
  const [positions, setPositions] = useState([])
  const { message } = App.useApp()

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)


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
    const formData = new FormData()
    formData.append('eventId', eventId)
    if (file) {
      formData.append('avatar', file)
    }
    for (let key in payload) {
      formData.append(key, payload[key])
    }
    setLoading(true)
    try {
      const res = await api.post('/api/players', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      showOpen(false)
      onRefresh()
    } catch (error) {
    }
    setLoading(false)
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected && selected.type.startsWith('image/')) {
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    } else {
      message.error('Please select an image file')
    }
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
          <div className={style.title} >New Player</div>
          <CloseIcon onClick={onClose} />
        </Flex>
        <Form layout="vertical" onFinish={onSubmit} initialValues={{ isRepeat: false }}>
          <div style={{ marginBottom: 24 }}>
            <div className={style.avatar} onClick={handleAvatarClick}>
              {previewUrl ? (
                <img src={previewUrl} alt="avatar" />
              ) : (
                <PlusOutlined style={{ fontSize: 32, color: '#0F172A' }} />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <Form.Item name="name" rules={[{ required: true, max: 255 }]} label="Name">
            <Input placeholder="Enter Name" />
          </Form.Item>
          <Form.Item name="positionId" rules={[{ required: true }]} label="Position">
            <Select>
              {positions.map((item: any) => <Select.Option value={item.value}>{item.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="jersey" rules={[{ required: true, max: 50, message: 'Please enter Jersey Number' }]} label="Jersey #">
            <Input placeholder="Enter Jersey #" />
          </Form.Item>
          <Form.Item name="phoneNumber" rules={[{ required: true }]} label="Phone Number">
            <Input placeholder="Enter Phone Number" />
          </Form.Item>
          <Form.Item name="weight" rules={[{ required: true, max: 200 }]} label="Weight">
            <Input type="number" placeholder="Enter Weight" />
          </Form.Item>
          <Form.Item name="height" rules={[{ required: true, max: 200 }]} label="Height">
            <Input type="number" placeholder="Enter Height" />
          </Form.Item>
          <Button type="primary" htmlType="submit"  block style={{ marginTop: 24 }} loading={loading}>
            Save
          </Button>
        </Form>
    </Drawer>
  )
}

export default memo(NewPlayer)