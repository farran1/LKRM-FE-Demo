import { Button, ColorPicker, Flex, Form, Input, Modal, Select } from 'antd'
import { memo, useMemo, useState } from 'react'
import style from './style.module.scss'
import CloseIcon from '@/components/icon/close.svg'
import api from '@/services/api'

const colors = [
  { name: 'Red', code: '#BB4325' },
  { name: 'Green', code: '#267E53' },
  { name: 'Blue', code: '#0065B8' },
  { name: 'Orange', code: '#7A5315' },
  { name: 'Teal', code: '#0E7D81' },
  { name: 'Purple', code: '#6D4F92' },
  { name: 'Pink', code: '#AA227F' },
  { name: 'Brown', code: '#60552F' },
]

function NewEventType({isShowModal, showModal, refreshEventType}: any) {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const colorOptions = useMemo(() => {
    return colors.map((color) => ({
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className={style.color}
            style={{ backgroundColor: color.code}}
          />
          {color.name}
        </div>
      ),
      value: color.code,
    }))
  }, [])

  const onSubmit = async (payload: any) => {
    setLoading(true)
    try {
      const res = await api.post('/api/eventTypes', payload)
      onClose()
      refreshEventType()
    } catch (error) {
    }
    setLoading(false)
  }

  const onClose = () => {
    form.resetFields()
    showModal(false)
  }

  return (
    <Modal
      // closable={{ 'aria-label': 'Custom Close Button' }}
      closeIcon={null}
      open={isShowModal}
      footer={null}
      className={style.container}
      destroyOnHidden
      maskClosable={true}
      onCancel={onClose}
    >
      <Flex className={style.header} justify="space-between" align='flex-end' style={{ marginBottom: 32 }}>
        <div className={style.title} >New Event Type</div>
        <CloseIcon onClick={onClose} />
      </Flex>
      <Form onFinish={onSubmit} form={form}>
        <Form.Item name="name" rules={[{ required: true, max: 255 }]} label="Name">
          <Input placeholder="Enter Event Type Name" />
        </Form.Item>
        {/* <Form.Item name="color" rules={[{ required: true }]} label="Color" getValueFromEvent={(color) => "#" + color.toHex()}>
          <ColorPicker showText />
        </Form.Item> */}
        <Form.Item name="color" rules={[{ required: true }]} label="Color">
          <Select placeholder="Select Color" options={colorOptions} />
        </Form.Item>
        <Button type="primary" htmlType="submit" block disabled={loading}>
          Save
        </Button>
      </Form>
    </Modal>
  )
}

export default memo(NewEventType)