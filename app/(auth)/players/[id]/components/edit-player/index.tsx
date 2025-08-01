import { App, Button, Drawer, Flex, Form, Input, Select } from 'antd'
import { memo, useEffect, useRef, useState } from 'react'
import style from './style.module.scss'
import CloseIcon from '@/components/icon/close.svg'
import api from '@/services/api'
import DefaultAvatar from '@/components/icon/avatar.svg'

function EditPlayer({ player, isOpen, showOpen, onRefresh } : any) {
  const [loading, setLoading] = useState(false)
  const [positions, setPositions] = useState([])
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)


  useEffect(() => {
    getPositions()
  }, [])

  useEffect(() => {
    if (!player || !form) return

    form.setFieldsValue({
      ...player,
    })
  }, [player, form])

  async function getPositions() {
    const res = await api.get('/api/positions')
    if (res?.data?.data.length > 0) {
      const types = res?.data?.data.map((item: any) => ({label: item.name, value: item.id}))
      setPositions(types)
    }
  }

  const onClose = () => {
    showOpen(false)
    reset()
    setLoading(false)
  }

  const onSubmit = async (payload: any) => {
    const formData = new FormData()
    if (file) {
      formData.append('avatar', file)
    }
    for (let key in payload) {
      formData.append(key, payload[key])
    }
    setLoading(true)
    try {
      const res = await api.put('/api/players/' + player.id, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      onClose()
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

  const reset = () => {
    form.setFieldsValue({
      ...player
    })
  }

  const renderAvatar = () => {
    if (previewUrl) return <img src={previewUrl} alt="avatar" />
    if (player?.avatar) return <img src={player.avatar} alt="avatar" />
    return <DefaultAvatar />
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
        <Flex className={style.header} justify="space-between" align='flex-end' style={{ marginBottom: 16 }}>
          <div className={style.title} >Edit Profile</div>
          <CloseIcon onClick={onClose} />
        </Flex>
        <Form layout="vertical" form={form} onFinish={onSubmit}>
          <Flex style={{ marginBottom: 24, flexDirection: 'column' }} align='center' >
            <div className={style.avatar}>
              {renderAvatar()}
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <Button onClick={handleAvatarClick} style={{ marginTop: 16 }}>Update Profile Photo</Button>
          </Flex>

          <div style={{ marginBottom: 16 }}>Basic Information</div>
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
          <Form.Item name="height" label="Height"
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (value === undefined) {
                    return Promise.resolve();
                  }
                  if (value > 200) {
                    return Promise.reject(new Error('Height must be at most 200"'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}>
            <Input type="number" placeholder="Enter Height" />
          </Form.Item>
          <Flex style={{ marginTop: 60 }} gap={8}>
            <Button block onClick={reset}>
              Reset all
            </Button>
            <Button type="primary" htmlType="submit"  block loading={loading}>
              Update
            </Button>
          </Flex>
        </Form>
    </Drawer>
  )
}

export default memo(EditPlayer)