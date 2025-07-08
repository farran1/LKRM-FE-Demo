import { App, Avatar, Button, Drawer, Flex, Form, Input, Select } from 'antd'
import { memo, useEffect, useRef, useState } from 'react'
import style from './style.module.scss'
import CloseIcon from '@/components/icon/close.svg'
import api from '@/services/api'
import { PlusOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons'

function NewVolunteer({ eventId, isOpen, showOpen, onRefresh } : any) {
  const [loading, setLoading] = useState(false)
  const { message } = App.useApp()

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      const res = await api.post('/api/volunteers', formData, {
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
          <div className={style.title} >New Volunteer</div>
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
          <Form.Item name="phoneNumber" rules={[{ required: true }]} label="Phone Number">
            <Input placeholder="Enter Phone Number" />
          </Form.Item>
          <Button type="primary" htmlType="submit"  block style={{ marginTop: 24 }} loading={loading}>
            Save
          </Button>
        </Form>
    </Drawer>
  )
}

export default memo(NewVolunteer)